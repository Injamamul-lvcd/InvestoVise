import { NextRequest } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { POST } from '@/app/api/auth/register/route';

// Mock the rate limiting middleware
jest.mock('@/lib/middleware/auth', () => ({
  rateLimit: (maxRequests: number, windowMs: number) => (handler: any) => handler,
}));

describe('/api/auth/register', () => {
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

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('successful registration', () => {
    it('should register a new user with valid data', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '9876543210',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toContain('Registration successful');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(requestBody.email);
      expect(data.user.profile.firstName).toBe(requestBody.firstName);
      expect(data.user.profile.lastName).toBe(requestBody.lastName);
      expect(data.tokens).toBeDefined();
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();
      expect(data.verificationRequired).toBe(true);

      // Verify user was created in database
      const user = await User.findOne({ email: requestBody.email });
      expect(user).toBeTruthy();
      expect(user?.isVerified).toBe(false);
    });

    it('should register user without optional phone number', async () => {
      const requestBody = {
        email: 'test2@example.com',
        password: 'StrongPass123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('validation errors', () => {
    it('should reject registration with missing required fields', async () => {
      const requestBody = {
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('required');
    });

    it('should reject registration with invalid email', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_EMAIL');
    });

    it('should reject registration with weak password', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('WEAK_PASSWORD');
      expect(data.error.details).toBeDefined();
    });
  });

  describe('duplicate user handling', () => {
    it('should reject registration with existing email', async () => {
      // Create a user first
      const existingUser = new User({
        email: 'existing@example.com',
        hashedPassword: 'hashedpassword',
        profile: {
          firstName: 'Existing',
          lastName: 'User',
        },
      });
      await existingUser.save();

      // Try to register with same email
      const requestBody = {
        email: 'existing@example.com',
        password: 'StrongPass123!',
        firstName: 'New',
        lastName: 'User',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('USER_EXISTS');
    });

    it('should handle case-insensitive email duplicates', async () => {
      // Create a user with lowercase email
      const existingUser = new User({
        email: 'test@example.com',
        hashedPassword: 'hashedpassword',
        profile: {
          firstName: 'Existing',
          lastName: 'User',
        },
      });
      await existingUser.save();

      // Try to register with uppercase email
      const requestBody = {
        email: 'TEST@EXAMPLE.COM',
        password: 'StrongPass123!',
        firstName: 'New',
        lastName: 'User',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('USER_EXISTS');
    });
  });

  describe('data sanitization', () => {
    it('should trim whitespace from input fields', async () => {
      const requestBody = {
        email: '  test@example.com  ',
        password: 'StrongPass123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
        phone: '  9876543210  ',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.profile.firstName).toBe('John');
      expect(data.user.profile.lastName).toBe('Doe');
      expect(data.user.profile.phone).toBe('9876543210');
    });

    it('should convert email to lowercase', async () => {
      const requestBody = {
        email: 'TEST@EXAMPLE.COM',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = createRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.email).toBe('test@example.com');
    });
  });

  describe('password hashing', () => {
    it('should hash the password before storing', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const request = createRequest(requestBody);
      await POST(request);

      const user = await User.findOne({ email: requestBody.email }).select('+hashedPassword');
      expect(user?.hashedPassword).toBeDefined();
      expect(user?.hashedPassword).not.toBe(requestBody.password);
      expect(user?.hashedPassword.length).toBeGreaterThan(50); // Bcrypt hash length
    });
  });
});