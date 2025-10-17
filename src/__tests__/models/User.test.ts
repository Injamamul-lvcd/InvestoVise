import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '@/models/User';

describe('User Model', () => {
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
    await User.deleteMany({});
  });

  describe('User creation and validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '9876543210',
        },
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.profile.firstName).toBe(userData.profile.firstName);
      expect(user.isVerified).toBe(false);
      expect(user.role).toBe('user');
    });

    it('should hash password on save', async () => {
      const plainPassword = 'StrongPass123!';
      const userData = {
        email: 'test@example.com',
        hashedPassword: plainPassword,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const user = new User(userData);
      await user.save();

      expect(user.hashedPassword).not.toBe(plainPassword);
      expect(user.hashedPassword.length).toBeGreaterThan(50);
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User methods', () => {
    let user: any;

    beforeEach(async () => {
      user = new User({
        email: 'test@example.com',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01'),
        },
      });
      await user.save();
    });

    it('should compare passwords correctly', async () => {
      const isValid = await user.comparePassword('StrongPass123!');
      expect(isValid).toBe(true);

      const isInvalid = await user.comparePassword('WrongPassword');
      expect(isInvalid).toBe(false);
    });

    it('should add activity to log', async () => {
      await user.addActivity('login', { ipAddress: '127.0.0.1' });
      
      expect(user.activityLog.length).toBe(1);
      expect(user.activityLog[0].type).toBe('login');
      expect(user.activityLog[0].metadata.ipAddress).toBe('127.0.0.1');
    });

    it('should calculate age correctly', () => {
      const age = user.age;
      const expectedAge = new Date().getFullYear() - 1990;
      expect(age).toBe(expectedAge);
    });

    it('should generate full name', () => {
      expect(user.fullName).toBe('John Doe');
    });
  });

  describe('Static methods', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        isVerified: true,
      });
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail('test@example.com');
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should find verified users', async () => {
      const users = await User.findVerified();
      expect(users.length).toBe(1);
      expect(users[0].isVerified).toBe(true);
    });
  });

  describe('Data sanitization', () => {
    it('should convert email to lowercase', async () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });
      await user.save();

      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from profile fields', async () => {
      const user = new User({
        email: 'test@example.com',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: '  John  ',
          lastName: '  Doe  ',
          phone: '  9876543210  ',
        },
      });
      await user.save();

      expect(user.profile.firstName).toBe('John');
      expect(user.profile.lastName).toBe('Doe');
      expect(user.profile.phone).toBe('9876543210');
    });
  });

  describe('Indian-specific validations', () => {
    it('should validate Indian phone numbers', async () => {
      const validPhones = ['9876543210', '8765432109', '7654321098'];
      const invalidPhones = ['1234567890', '0987654321', '12345'];

      for (const phone of validPhones) {
        const user = new User({
          email: `test${Math.random()}@example.com`,
          hashedPassword: 'StrongPass123!',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            phone,
          },
        });
        await expect(user.save()).resolves.toBeTruthy();
      }

      for (const phone of invalidPhones) {
        const user = new User({
          email: `test${Math.random()}@example.com`,
          hashedPassword: 'StrongPass123!',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            phone,
          },
        });
        await expect(user.save()).rejects.toThrow();
      }
    });

    it('should validate Indian states', async () => {
      const validStates = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu'];
      const invalidState = 'Invalid State';

      for (const state of validStates) {
        const user = new User({
          email: `test${Math.random()}@example.com`,
          hashedPassword: 'StrongPass123!',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            state,
          },
        });
        await expect(user.save()).resolves.toBeTruthy();
      }

      const user = new User({
        email: 'test@example.com',
        hashedPassword: 'StrongPass123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          state: invalidState,
        },
      });
      await expect(user.save()).rejects.toThrow();
    });
  });
});