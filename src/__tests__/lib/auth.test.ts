import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  generateVerificationToken,
  generatePasswordResetToken,
  hashResetToken,
  validatePassword,
  validateEmail,
  generateSessionId,
} from '@/lib/auth';
import { IUser } from '@/types/database';
import jwt from 'jsonwebtoken';

// Mock user object
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'user',
} as IUser;

describe('Auth Utilities', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(mockUser);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload', () => {
      const token = generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(mockUser._id.toString());
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe('indian-investment-platform');
      expect(decoded.aud).toBe('indian-investment-platform-users');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a random hex string', () => {
      const token = generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(80); // 40 bytes = 80 hex chars
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockUser);
      const payload = verifyToken(token);
      
      expect(payload.userId).toBe(mockUser._id.toString());
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: mockUser._id, email: mockUser.email, role: mockUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h', issuer: 'indian-investment-platform', audience: 'indian-investment-platform-users' }
      );
      
      expect(() => verifyToken(expiredToken)).toThrow('Token expired');
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a random hex string', () => {
      const token = generateVerificationToken();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a random hex string', () => {
      const token = generatePasswordResetToken();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });
  });

  describe('hashResetToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token';
      const hash1 = hashResetToken(token);
      const hash2 = hashResetToken(token);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1).toHaveLength(64); // SHA256 = 64 hex chars
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashResetToken('token1');
      const hash2 = hashResetToken('token2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validatePassword', () => {
    it('should accept a strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'a'.repeat(129) + 'A1!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common password patterns', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains common patterns and is not secure');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
        'user@domain.',
        '',
        'a'.repeat(250) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('generateSessionId', () => {
    it('should generate a random hex string', () => {
      const sessionId = generateSessionId();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(sessionId)).toBe(true);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });
});