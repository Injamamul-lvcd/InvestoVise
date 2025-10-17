import { NextRequest } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { POST as loginHandler } from '@/app/api/admin/auth/login/route';
import { POST as logoutHandler } from '@/app/api/admin/auth/logout/route';
import User from '@/models/User';
import AdminSession from '@/models/AdminSession';
import AdminAuditLog from '@/models/AdminAuditLog';

describe('Admin Auth API', () => {
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
    // Clean up collections before each test
    await User.deleteMany({});
    await AdminSession.deleteMany({});
    await AdminAuditLog.deleteMany({});
  });

  describe('POST /api/admin/auth/login', () => {
    beforeEach(async () => {
      // Create test admin user
      const admin = new User({
        email: 'admin@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
        },
        role: 'admin',
        isVerified: true,
      });
      await admin.save();
    });

    it('should successfully login admin', async () => {
      const request = new NextRequest('http://localhost/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await loginHandler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.message).toBe('Admin login successful');
      expect(responseBody.admin).toBeDefined();
      expect(responseBody.admin.email).toBe('admin@test.com');
      expect(responseBody.tokens).toBeDefined();
      expect(responseBody.sessionId).toBeDefined();

      // Check if session was created
      const session = await AdminSession.findOne({ sessionId: responseBody.sessionId });
      expect(session).toBeTruthy();
      expect(session?.isActive).toBe(true);

      // Check if login was logged
      const auditLog = await AdminAuditLog.findOne({ action: 'login' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('success');
    });

    it('should fail login with invalid credentials', async () => {
      const request = new NextRequest('http://localhost/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'WrongPassword',
        }),
      });

      const response = await loginHandler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.error.code).toBe('ADMIN_LOGIN_FAILED');
      expect(responseBody.error.message).toBe('Invalid email or password');

      // Check if failed login was logged
      const auditLog = await AdminAuditLog.findOne({ action: 'login' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('failure');
    });

    it('should fail login for non-admin user', async () => {
      // Create regular user
      const user = new User({
        email: 'user@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Regular',
          lastName: 'User',
        },
        role: 'user',
        isVerified: true,
      });
      await user.save();

      const request = new NextRequest('http://localhost/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@test.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await loginHandler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.error.code).toBe('ADMIN_LOGIN_FAILED');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: 'TestPassword123!',
        }),
      });

      const response = await loginHandler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.error.code).toBe('ADMIN_LOGIN_FAILED');
      expect(responseBody.error.message).toBe('Email and password are required');
    });

    it('should set refresh token cookie when rememberMe is true', async () => {
      const request = new NextRequest('http://localhost/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'TestPassword123!',
          rememberMe: true,
        }),
      });

      const response = await loginHandler(request);

      expect(response.status).toBe(200);

      // Check if refresh token cookie was set
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('adminRefreshToken=');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('Path=/api/admin');
    });
  });

  describe('POST /api/admin/auth/logout', () => {
    let adminUser: any;
    let adminToken: string;
    let sessionId: string;

    beforeEach(async () => {
      // Create admin user and session
      adminUser = new User({
        email: 'admin@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
        },
        role: 'admin',
        isVerified: true,
      });
      await adminUser.save();

      // Create session
      const session = new AdminSession({
        userId: adminUser._id,
        sessionId: 'test-session-id',
        refreshToken: 'test-refresh-token',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        loginMethod: 'password',
      });
      await session.save();
      sessionId = session.sessionId;

      // Generate token (simplified for testing)
      adminToken = 'test-admin-token';
    });

    it('should successfully logout admin', async () => {
      // Mock the requireAdmin middleware by adding admin to request
      const originalHandler = logoutHandler;
      const mockLogoutHandler = async (request: NextRequest) => {
        // Add admin to request (simulating middleware)
        (request as any).admin = {
          userId: adminUser._id.toString(),
          email: adminUser.email,
          role: adminUser.role,
          sessionId: sessionId,
        };
        return originalHandler(request);
      };

      const request = new NextRequest('http://localhost/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${adminToken}`,
          'x-session-id': sessionId,
        },
      });

      const response = await mockLogoutHandler(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.message).toBe('Admin logout successful');

      // Check if session was invalidated
      const session = await AdminSession.findOne({ sessionId });
      expect(session?.isActive).toBe(false);

      // Check if logout was logged
      const auditLog = await AdminAuditLog.findOne({ action: 'logout' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('success');

      // Check if refresh token cookie was cleared
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('adminRefreshToken=;');
      expect(cookies).toContain('Max-Age=0');
    });
  });
});