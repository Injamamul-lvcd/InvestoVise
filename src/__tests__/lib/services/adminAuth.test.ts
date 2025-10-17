import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { loginAdmin, logoutAdmin, createAdminUser } from '@/lib/services/adminAuth';
import User from '@/models/User';
import AdminSession from '@/models/AdminSession';
import AdminAuditLog from '@/models/AdminAuditLog';

describe('Admin Authentication Service', () => {
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

  describe('loginAdmin', () => {
    beforeEach(async () => {
      // Create a test admin user
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

    it('should successfully login admin with valid credentials', async () => {
      const result = await loginAdmin(
        {
          email: 'admin@test.com',
          password: 'TestPassword123!',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(true);
      expect(result.admin).toBeDefined();
      expect(result.admin?.email).toBe('admin@test.com');
      expect(result.tokens).toBeDefined();
      expect(result.sessionId).toBeDefined();

      // Check if session was created
      const session = await AdminSession.findOne({ sessionId: result.sessionId });
      expect(session).toBeTruthy();
      expect(session?.isActive).toBe(true);

      // Check if audit log was created
      const auditLog = await AdminAuditLog.findOne({ action: 'login' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('success');
    });

    it('should fail login with invalid email', async () => {
      const result = await loginAdmin(
        {
          email: 'nonexistent@test.com',
          password: 'TestPassword123!',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');

      // Check if failed login was logged
      const auditLog = await AdminAuditLog.findOne({ action: 'login' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('failure');
    });

    it('should fail login with invalid password', async () => {
      const result = await loginAdmin(
        {
          email: 'admin@test.com',
          password: 'WrongPassword',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should fail login for non-admin user', async () => {
      // Create a regular user
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

      const result = await loginAdmin(
        {
          email: 'user@test.com',
          password: 'TestPassword123!',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should fail login for unverified admin', async () => {
      // Create unverified admin
      const admin = new User({
        email: 'unverified@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Unverified',
          lastName: 'Admin',
        },
        role: 'admin',
        isVerified: false,
      });
      await admin.save();

      const result = await loginAdmin(
        {
          email: 'unverified@test.com',
          password: 'TestPassword123!',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin account not verified');
    });

    it('should validate required fields', async () => {
      const result = await loginAdmin(
        {
          email: '',
          password: 'TestPassword123!',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
    });

    it('should validate email format', async () => {
      const result = await loginAdmin(
        {
          email: 'invalid-email',
          password: 'TestPassword123!',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('logoutAdmin', () => {
    let adminId: string;
    let sessionId: string;

    beforeEach(async () => {
      // Create admin and session
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
      adminId = admin._id.toString();

      const session = new AdminSession({
        userId: admin._id,
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
    });

    it('should successfully logout admin', async () => {
      const result = await logoutAdmin(
        adminId,
        sessionId,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(true);

      // Check if session was invalidated
      const session = await AdminSession.findOne({ sessionId });
      expect(session?.isActive).toBe(false);

      // Check if logout was logged
      const auditLog = await AdminAuditLog.findOne({ action: 'logout' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('success');
    });

    it('should handle logout with non-existent session', async () => {
      const result = await logoutAdmin(
        adminId,
        'non-existent-session',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(true); // Should still succeed even if session doesn't exist
    });
  });

  describe('createAdminUser', () => {
    let creatorAdminId: string;

    beforeEach(async () => {
      // Create creator admin
      const admin = new User({
        email: 'creator@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Creator',
          lastName: 'Admin',
        },
        role: 'admin',
        isVerified: true,
      });
      await admin.save();
      creatorAdminId = admin._id.toString();
    });

    it('should successfully create admin user', async () => {
      const result = await createAdminUser(
        {
          email: 'newadmin@test.com',
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'Admin',
        },
        creatorAdminId,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(true);
      expect(result.admin).toBeDefined();
      expect(result.admin?.email).toBe('newadmin@test.com');

      // Check if user was created in database
      const user = await User.findByEmail('newadmin@test.com');
      expect(user).toBeTruthy();
      expect(user?.role).toBe('admin');
      expect(user?.isVerified).toBe(true);

      // Check if creation was logged
      const auditLog = await AdminAuditLog.findOne({ action: 'user_create' });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.status).toBe('success');
    });

    it('should fail to create admin with existing email', async () => {
      // Create existing user
      const existingUser = new User({
        email: 'existing@test.com',
        hashedPassword: 'TestPassword123!',
        profile: {
          firstName: 'Existing',
          lastName: 'User',
        },
        role: 'user',
        isVerified: true,
      });
      await existingUser.save();

      const result = await createAdminUser(
        {
          email: 'existing@test.com',
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'Admin',
        },
        creatorAdminId,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin with this email already exists');
    });

    it('should validate required fields', async () => {
      const result = await createAdminUser(
        {
          email: '',
          password: 'TestPassword123!',
          firstName: 'New',
          lastName: 'Admin',
        },
        creatorAdminId,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('All fields are required');
    });

    it('should validate password strength', async () => {
      const result = await createAdminUser(
        {
          email: 'newadmin@test.com',
          password: 'weak',
          firstName: 'New',
          lastName: 'Admin',
        },
        creatorAdminId,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters long');
    });
  });
});