import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import AdminSession from '@/models/AdminSession';
import AdminAuditLog from '@/models/AdminAuditLog';
import { generateTokens, generateSessionId, validateEmail, validatePassword } from '@/lib/auth';
import mongoose from 'mongoose';
// Simple device detection helper
function parseUserAgent(userAgent: string) {
  const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                 userAgent.includes('Firefox') ? 'Firefox' : 
                 userAgent.includes('Safari') ? 'Safari' : 
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' : 
            userAgent.includes('Mac') ? 'macOS' : 
            userAgent.includes('Linux') ? 'Linux' : 
            userAgent.includes('Android') ? 'Android' : 
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  const device = userAgent.includes('Mobile') ? 'mobile' : 
                userAgent.includes('Tablet') ? 'tablet' : 'desktop';
  
  return { browser, os, device };
}

export interface AdminLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminLoginResponse {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    profile: any;
    role: string;
    lastLoginAt: Date;
    createdAt: Date;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  sessionId?: string;
  error?: string;
}

export interface SessionInfo {
  ipAddress: string;
  userAgent: string;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

/**
 * Admin login service
 */
export async function loginAdmin(
  credentials: AdminLoginRequest,
  sessionInfo: SessionInfo
): Promise<AdminLoginResponse> {
  try {
    const { email, password, rememberMe = false } = credentials;
    const { ipAddress, userAgent } = sessionInfo;

    // Validate required fields
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Connect to database
    await connectToDatabase();

    // Find admin user
    const admin = await User.findByEmail(email).select('+hashedPassword');
    if (!admin || admin.role !== 'admin') {
      // Log failed login attempt
      await AdminAuditLog.logAction({
        adminId: null,
        action: 'login',
        resource: 'admin',
        details: {
          email,
          reason: 'invalid_credentials',
          ipAddress,
          userAgent,
        },
        ipAddress,
        userAgent,
        sessionId: 'unknown',
        severity: 'medium',
        status: 'failure',
        errorMessage: 'Invalid credentials',
      }).catch(console.error);

      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AdminAuditLog.logAction({
        adminId: admin._id,
        action: 'login',
        resource: 'admin',
        details: {
          email,
          reason: 'invalid_password',
          ipAddress,
          userAgent,
        },
        ipAddress,
        userAgent,
        sessionId: 'unknown',
        severity: 'medium',
        status: 'failure',
        errorMessage: 'Invalid password',
      }).catch(console.error);

      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    if (!admin.isVerified) {
      return {
        success: false,
        error: 'Admin account not verified',
      };
    }

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(userAgent);

    // Generate session
    const sessionId = generateSessionId();
    const tokens = generateTokens(admin);
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    // Create admin session
    await AdminSession.create({
      userId: admin._id,
      sessionId,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
      isActive: true,
      lastActivity: new Date(),
      expiresAt,
      loginMethod: 'password',
      deviceInfo,
    });

    // Update admin last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Log successful login
    await AdminAuditLog.logAction({
      adminId: admin._id,
      action: 'login',
      resource: 'admin',
      details: {
        email,
        sessionId,
        deviceInfo,
        rememberMe,
        ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
      sessionId,
      severity: 'low',
      status: 'success',
    }).catch(console.error);

    // Prepare admin response
    const adminResponse = {
      id: admin._id.toString(),
      email: admin.email,
      profile: admin.profile,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    };

    return {
      success: true,
      admin: adminResponse,
      tokens,
      sessionId,
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      success: false,
      error: 'Login failed. Please try again.',
    };
  }
}

/**
 * Admin logout service
 */
export async function logoutAdmin(
  adminId: string,
  sessionId: string,
  sessionInfo: SessionInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();

    // Find and invalidate session
    const session = await AdminSession.findOne({
      userId: adminId,
      sessionId,
      isActive: true,
    });

    if (session) {
      await session.invalidate();
    }

    // Log logout
    await AdminAuditLog.logAction({
      adminId: new mongoose.Types.ObjectId(adminId),
      action: 'logout',
      resource: 'admin',
      details: {
        sessionId,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
      },
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      sessionId,
      severity: 'low',
      status: 'success',
    }).catch(console.error);

    return { success: true };
  } catch (error) {
    console.error('Admin logout error:', error);
    return {
      success: false,
      error: 'Logout failed. Please try again.',
    };
  }
}

/**
 * Get admin sessions
 */
export async function getAdminSessions(adminId: string) {
  try {
    await connectToDatabase();

    const sessions = await AdminSession.findActiveByUser(adminId);
    
    return {
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        ipAddress: session.ipAddress,
        deviceInfo: session.deviceInfo,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })),
    };
  } catch (error) {
    console.error('Get admin sessions error:', error);
    return {
      success: false,
      error: 'Failed to retrieve sessions',
    };
  }
}

/**
 * Invalidate admin session
 */
export async function invalidateAdminSession(
  adminId: string,
  sessionId: string,
  currentSessionId: string,
  sessionInfo: SessionInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();

    // Find and invalidate the specified session
    const session = await AdminSession.findOne({
      userId: adminId,
      sessionId,
      isActive: true,
    });

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    await session.invalidate();

    // Log session invalidation
    await AdminAuditLog.logAction({
      adminId: new mongoose.Types.ObjectId(adminId),
      action: 'logout',
      resource: 'admin',
      details: {
        targetSessionId: sessionId,
        currentSessionId,
        reason: 'manual_invalidation',
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
      },
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      sessionId: currentSessionId,
      severity: 'medium',
      status: 'success',
    }).catch(console.error);

    return { success: true };
  } catch (error) {
    console.error('Invalidate admin session error:', error);
    return {
      success: false,
      error: 'Failed to invalidate session',
    };
  }
}

/**
 * Create admin user
 */
export async function createAdminUser(
  adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  },
  createdBy: string,
  sessionInfo: SessionInfo
): Promise<{ success: boolean; admin?: any; error?: string }> {
  try {
    const { email, password, firstName, lastName } = adminData;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return {
        success: false,
        error: 'All fields are required',
      };
    }

    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors.join(', '),
      };
    }

    await connectToDatabase();

    // Check if admin already exists
    const existingAdmin = await User.findByEmail(email);
    if (existingAdmin) {
      return {
        success: false,
        error: 'Admin with this email already exists',
      };
    }

    // Create admin user
    const admin = new User({
      email,
      hashedPassword: password, // Will be hashed by pre-save middleware
      profile: {
        firstName,
        lastName,
      },
      role: 'admin',
      isVerified: true, // Admins are verified by default
    });

    await admin.save();

    // Log admin creation
    await AdminAuditLog.logAction({
      adminId: new mongoose.Types.ObjectId(createdBy),
      action: 'user_create',
      resource: 'admin',
      resourceId: admin._id,
      details: {
        email,
        firstName,
        lastName,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
      },
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      sessionId: 'unknown',
      severity: 'high',
      status: 'success',
    }).catch(console.error);

    return {
      success: true,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        profile: admin.profile,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    };
  } catch (error) {
    console.error('Create admin user error:', error);
    return {
      success: false,
      error: 'Failed to create admin user',
    };
  }
}