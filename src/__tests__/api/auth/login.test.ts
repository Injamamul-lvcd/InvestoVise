import { NextRequest } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { POST } from '@/app/api/auth/login/route';

// Mock the rate limiting middleware
jest.mock('@/lib/middleware/auth', () => ({
  rateLimit: (maxRequests: number, windowMs: number) => (handler: any) => handler,
}));

describe('/api/auth/login', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: any;

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

    // Create a test user
    const hashedPassword = await bcrypt.hash('StrongPass123!', 12);
    testUser = new User({
      email: 'test@example.com',
      hashedPassword,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      isVerified: true,
    });
    await testUser.save();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      },
      body: JSON.stringify(body),
    });
  };

  describe('successful login', () => {
    it('should login with valid credentials', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(requestBody.email);
      expect(data.user.id).toBeDefined();
      expect(data.tokens).toBeDefined();
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();
      expect(data.requiresVerification).toBe(false);

      // Verify lastLoginAt was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
    });

    it('should set refresh token cookie when rememberMe is true', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        rememberMe: true,
      };

      const request = createRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      
      // Check if refresh token cookie is set
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('refreshToken=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Strict');
    });

    it('should handle case-insensitive email login', async () => {
      const requestBody = {
        email: 'TEST@EXAMPLE.COM',
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('validation errors', () => {
    it('should reject login with missing email', async () => {
      const requestBody = {
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Email and password are required');
    });

    it('should reject login with missing password', async () => {
      const requestBody = {
        email: 'test@example.com',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login with invalid email format', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('authentication errors', () => {
    it('should reject login with non-existent email', async () => {
      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
      expect(data.error.message).toBe('Invalid email or password');
    });

    it('should reject login with incorrect password', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('INVALID_CREDENTIALS');
      expect(data.error.message).toBe('Invalid email or password');
    });
  });

  describe('unverified user handling', () => {
    it('should allow login for unverified user but indicate verification required', async () => {
      // Create unverified user
      const hashedPassword = await bcrypt.hash('StrongPass123!', 12);
      const unverifiedUser = new User({
        email: 'unverified@example.com',
        hashedPassword,
        profile: {
          firstName: 'Jane',
          lastName: 'Doe',
        },
        isVerified: false,
      });
      await unverifiedUser.save();

      const requestBody = {
        email: 'unverified@example.com',
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.requiresVerification).toBe(true);
      expect(data.user.isVerified).toBe(false);
    });
  });

  describe('activity logging', () => {
    it('should log login activity', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        rememberMe: true,
      };

      const request = createRequest(requestBody);
      await POST(request);

      // Check if activity was logged
      const updatedUser = await User.findById(testUser._id);
      const loginActivity = updatedUser?.activityLog.find(
        activity => activity.type === 'login' && activity.metadata?.type === 'login'
      );

      expect(loginActivity).toBeDefined();
      expect(loginActivity?.metadata?.ipAddress).toBe('127.0.0.1');
      expect(loginActivity?.metadata?.userAgent).toBe('test-agent');
      expect(loginActivity?.metadata?.rememberMe).toBe(true);
    });
  });

  describe('response data security', () => {
    it('should not include sensitive data in response', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.hashedPassword).toBeUndefined();
      expect(data.user.verificationToken).toBeUndefined();
      expect(data.user.resetPasswordToken).toBeUndefined();
      expect(data.user.resetPasswordExpires).toBeUndefined();
    });
  });
});