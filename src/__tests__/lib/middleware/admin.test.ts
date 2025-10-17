import { NextRequest, NextResponse } from 'next/server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { authenticateAdmin, requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { generateAccessToken } from '@/lib/auth';
import User from '@/models/User';
import AdminSession from '@/models/AdminSession';
import AdminAuditLog from '@/models/AdminAuditLog';

describe('Admin Middleware', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: any;
  let adminToken: string;

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

    // Create test admin user
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

    // Generate admin token
    adminToken = generateAccessToken(adminUser);
  });

  describe('authenticateAdmin', () => {
    it('should successfully authenticate admin with valid token', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': `Bearer ${adminToken}`,
          'x-session-id': 'test-session-id',
        },
      });

      const result = await authenticateAdmin(request);

      expect(result.success).toBe(true);
      expect(result.admin).toBeDefined();
      expect(result.admin?.email).toBe('admin@test.com');
      expect(result.admin?.role).toBe('admin');
    });

    it('should fail authentication without token', async () => {
      const request = new NextRequest('http://localhost/api/admin/test');

      const result = await authenticateAdmin(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access token required');
    });

    it('should fail authentication with invalid token', async () => {
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': 'Bearer invalid-token',
        },
      });

      const result = await authenticateAdmin(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token verification failed');
    });

    it('should fail authentication for non-admin user', async () => {
      // Create regular user
      const regularUser = new User({
        email: 'user@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Regular',
          lastName: 'User',
        },
        role: 'user',
        isVerified: true,
      });
      await regularUser.save();

      const userToken = generateAccessToken(regularUser);
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': `Bearer ${userToken}`,
        },
      });

      const result = await authenticateAdmin(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin access required');
    });

    it('should fail authentication for unverified admin', async () => {
      // Create unverified admin
      const unverifiedAdmin = new User({
        email: 'unverified@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Unverified',
          lastName: 'Admin',
        },
        role: 'admin',
        isVerified: false,
      });
      await unverifiedAdmin.save();

      const unverifiedToken = generateAccessToken(unverifiedAdmin);
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': `Bearer ${unverifiedToken}`,
        },
      });

      const result = await authenticateAdmin(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin email not verified');
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for authenticated admin', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: 'Success' })
      );

      const middleware = requireAdmin(mockHandler);
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': `Bearer ${adminToken}`,
        },
      });

      const response = await middleware(request);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);

      // Check if admin was added to request
      const calledRequest = mockHandler.mock.calls[0][0];
      expect(calledRequest.admin).toBeDefined();
      expect(calledRequest.admin.email).toBe('admin@test.com');
    });

    it('should deny access without authentication', async () => {
      const mockHandler = jest.fn();
      const middleware = requireAdmin(mockHandler);
      const request = new NextRequest('http://localhost/api/admin/test');

      const response = await middleware(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.error.code).toBe('ADMIN_UNAUTHORIZED');
    });

    it('should deny access for non-admin user', async () => {
      // Create regular user
      const regularUser = new User({
        email: 'user@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Regular',
          lastName: 'User',
        },
        role: 'user',
        isVerified: true,
      });
      await regularUser.save();

      const userToken = generateAccessToken(regularUser);
      const mockHandler = jest.fn();
      const middleware = requireAdmin(mockHandler);
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': `Bearer ${userToken}`,
        },
      });

      const response = await middleware(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });
  });

  describe('logAdminAction', () => {
    it('should log successful admin action', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: 'Success' })
      );

      const middleware = requireAdmin(
        logAdminAction('test_action', 'test_resource', 'medium')(mockHandler)
      );

      const request = new NextRequest('http://localhost/api/admin/test', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${adminToken}`,
          'x-session-id': 'test-session-id',
        },
      });

      const response = await middleware(request);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);

      // Wait a bit for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if audit log was created
      const auditLog = await AdminAuditLog.findOne({
        action: 'test_action',
        resource: 'test_resource',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('success');
      expect(auditLog?.severity).toBe('medium');
      expect(auditLog?.adminId.toString()).toBe(adminUser._id.toString());
    });

    it('should log failed admin action', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ error: { message: 'Test error' } }, { status: 400 })
      );

      const middleware = requireAdmin(
        logAdminAction('test_action', 'test_resource', 'high')(mockHandler)
      );

      const request = new NextRequest('http://localhost/api/admin/test', {
        method: 'DELETE',
        headers: {
          'authorization': `Bearer ${adminToken}`,
          'x-session-id': 'test-session-id',
        },
      });

      const response = await middleware(request);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(400);

      // Wait a bit for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if audit log was created with failure status
      const auditLog = await AdminAuditLog.findOne({
        action: 'test_action',
        resource: 'test_resource',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('failure');
      expect(auditLog?.severity).toBe('high');
      expect(auditLog?.errorMessage).toBe('Test error');
    });

    it('should log action even when handler throws error', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));

      const middleware = requireAdmin(
        logAdminAction('test_action', 'test_resource', 'critical')(mockHandler)
      );

      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: {
          'authorization': `Bearer ${adminToken}`,
          'x-session-id': 'test-session-id',
        },
      });

      await expect(middleware(request)).rejects.toThrow('Handler error');

      // Wait a bit for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if audit log was created with failure status
      const auditLog = await AdminAuditLog.findOne({
        action: 'test_action',
        resource: 'test_resource',
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('failure');
      expect(auditLog?.severity).toBe('critical');
      expect(auditLog?.errorMessage).toBe('Handler error');
    });
  });
});