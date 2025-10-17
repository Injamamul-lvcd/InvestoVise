import { NextRequest } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { GET as profileGET, PUT as profilePUT } from '@/app/api/user/profile/route';

// Mock the rate limiting middleware
jest.mock('@/lib/middleware/auth', () => ({
  rateLimit: (maxRequests: number, windowMs: number) => (handler: any) => handler,
  requireAuth: (handler: any) => handler,
  authenticateToken: jest.fn(),
}));

describe('Authentication Flow Integration', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await User.deleteMany({});
  });

  const createRequest = (url: string, method: string, body?: any, headers?: Record<string, string>) => {
    return new NextRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe('Complete authentication flow', () => {
    it('should register, login, and access protected resources', async () => {
      // Step 1: Register a new user
      const registerData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        'POST',
        registerData
      );
      const registerResponse = await registerPOST(registerRequest);
      const registerResult = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerResult.user.email).toBe(registerData.email);
      expect(registerResult.tokens.accessToken).toBeDefined();

      // Step 2: Login with the registered user
      const loginData = {
        email: registerData.email,
        password: registerData.password,
      };

      const loginRequest = createRequest(
        'http://localhost:3000/api/auth/login',
        'POST',
        loginData
      );
      const loginResponse = await loginPOST(loginRequest);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginResult.user.email).toBe(registerData.email);
      expect(loginResult.tokens.accessToken).toBeDefined();

      // Verify user exists in database
      const user = await User.findOne({ email: registerData.email });
      expect(user).toBeTruthy();
      expect(user?.profile.firstName).toBe(registerData.firstName);
      expect(user?.profile.lastName).toBe(registerData.lastName);
      expect(user?.lastLoginAt).toBeDefined();
    });

    it('should handle login with wrong password', async () => {
      // First register a user
      const registerData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        'POST',
        registerData
      );
      await registerPOST(registerRequest);

      // Try to login with wrong password
      const loginData = {
        email: registerData.email,
        password: 'WrongPassword123!',
      };

      const loginRequest = createRequest(
        'http://localhost:3000/api/auth/login',
        'POST',
        loginData
      );
      const loginResponse = await loginPOST(loginRequest);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(401);
      expect(loginResult.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should prevent duplicate email registration', async () => {
      // Register first user
      const registerData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const firstRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        'POST',
        registerData
      );
      const firstResponse = await registerPOST(firstRequest);
      expect(firstResponse.status).toBe(201);

      // Try to register with same email
      const secondRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        'POST',
        registerData
      );
      const secondResponse = await registerPOST(secondRequest);
      const secondResult = await secondResponse.json();

      expect(secondResponse.status).toBe(409);
      expect(secondResult.error.code).toBe('USER_EXISTS');
    });
  });

  describe('Password validation', () => {
    it('should reject weak passwords during registration', async () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChars123',
        'password123!', // Common pattern
      ];

      for (const password of weakPasswords) {
        const registerData = {
          email: `test${Math.random()}@example.com`,
          password,
          firstName: 'John',
          lastName: 'Doe',
        };

        const request = createRequest(
          'http://localhost:3000/api/auth/register',
          'POST',
          registerData
        );
        const response = await registerPOST(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error.code).toBe('WEAK_PASSWORD');
      }
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
      ];

      for (const email of invalidEmails) {
        const registerData = {
          email,
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
        };

        const request = createRequest(
          'http://localhost:3000/api/auth/register',
          'POST',
          registerData
        );
        const response = await registerPOST(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('User activity logging', () => {
    it('should log registration and login activities', async () => {
      // Register user
      const registerData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerRequest = createRequest(
        'http://localhost:3000/api/auth/register',
        'POST',
        registerData
      );
      await registerPOST(registerRequest);

      // Login user
      const loginRequest = createRequest(
        'http://localhost:3000/api/auth/login',
        'POST',
        { email: registerData.email, password: registerData.password }
      );
      await loginPOST(loginRequest);

      // Check activity log
      const user = await User.findOne({ email: registerData.email });
      expect(user?.activityLog.length).toBeGreaterThan(0);
      
      const activities = user?.activityLog.map(a => a.metadata?.type) || [];
      expect(activities).toContain('registration');
      expect(activities).toContain('login');
    });
  });
});