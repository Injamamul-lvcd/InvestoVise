import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { validatePassword } from '@/lib/auth';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

async function changePasswordHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body: ChangePasswordRequest = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password and new password are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'WEAK_PASSWORD',
            message: 'New password does not meet security requirements',
            details: passwordValidation.errors,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error: {
            code: 'SAME_PASSWORD',
            message: 'New password must be different from current password',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user with password field
    const user = await User.findById(request.user?.userId).select('+hashedPassword');
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

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Update password
    user.hashedPassword = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    // Log password change activity
    await user.addActivity('login', {
      type: 'password_change',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      {
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Password change failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const POST = requireAuth(changePasswordHandler);