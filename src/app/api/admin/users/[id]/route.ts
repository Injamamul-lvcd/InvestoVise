import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import AdminAuditLog from '@/models/AdminAuditLog';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

async function getUserHandler(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(id).select(
      '-hashedPassword -verificationToken -resetPasswordToken -resetPasswordExpires'
    );

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Get user's audit trail (last 50 actions)
    const auditTrail = await AdminAuditLog.getResourceAuditTrail('user', id, 50);

    return NextResponse.json(
      {
        message: 'User retrieved successfully',
        user,
        auditTrail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to retrieve user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function updateUserHandler(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;
    const admin = (request as any).admin;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { profile, preferences, role, isVerified } = body;

    // Store original values for audit log
    const originalUser = user.toObject();

    // Update user fields
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }

    if (typeof isVerified === 'boolean') {
      user.isVerified = isVerified;
    }

    await user.save();

    // Log the update
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId = request.headers.get('x-session-id') || admin.sessionId || 'unknown';

    await AdminAuditLog.logAction({
      adminId: new mongoose.Types.ObjectId(admin.userId),
      action: role && originalUser.role !== role ? 'user_role_change' : 'user_update',
      resource: 'user',
      resourceId: user._id,
      details: {
        updatedFields: Object.keys(body),
        ipAddress,
        userAgent,
      },
      changes: {
        before: originalUser,
        after: user.toObject(),
      },
      ipAddress,
      userAgent,
      sessionId,
      severity: role && originalUser.role !== role ? 'high' : 'medium',
      status: 'success',
    });

    return NextResponse.json(
      {
        message: 'User updated successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          profile: user.profile,
          preferences: user.preferences,
          role: user.role,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to update user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function deleteUserHandler(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = params;
    const admin = (request as any).admin;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_USER_ID',
            message: 'Invalid user ID format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (id === admin.userId) {
      return NextResponse.json(
        {
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'Cannot delete your own admin account',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Store user data for audit log
    const deletedUser = user.toObject();

    // Delete the user
    await User.findByIdAndDelete(id);

    // Log the deletion
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId = request.headers.get('x-session-id') || admin.sessionId || 'unknown';

    await AdminAuditLog.logAction({
      adminId: new mongoose.Types.ObjectId(admin.userId),
      action: 'user_delete',
      resource: 'user',
      resourceId: new mongoose.Types.ObjectId(id),
      details: {
        deletedUser: {
          email: deletedUser.email,
          role: deletedUser.role,
          createdAt: deletedUser.createdAt,
        },
        ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
      sessionId,
      severity: 'critical',
      status: 'success',
    });

    return NextResponse.json(
      {
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to delete user',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('user_view', 'user', 'low')(getUserHandler)
);

export const PUT = requireAdmin(
  logAdminAction('user_update', 'user', 'medium')(updateUserHandler)
);

export const DELETE = requireAdmin(
  logAdminAction('user_delete', 'user', 'critical')(deleteUserHandler)
);