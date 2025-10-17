import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { hashResetToken, validatePassword, generateTokens } from '@/lib/auth';
import { rateLimit } from '@/lib/middleware/auth';

interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

async function resetPasswordHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ResetPasswordRequest = await request.json();
    const { token, email, newPassword } = body;

    // Validate required fields
    if (!token || !email || !newPassword) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token, email, and new password are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password does not meet security requirements',
            details: passwordValidation.errors,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Hash the provided token to match stored hash
    const hashedToken = hashResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // Token not expired
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired password reset token',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    user.hashedPassword = newPassword; // Will be hashed by pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log password reset activity
    await user.addActivity('login', {
      type: 'password_reset_success',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    // Generate new tokens for the user
    const tokens = generateTokens(user);

    // Prepare user response
    const userResponse = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      isVerified: user.isVerified,
      role: user.role,
    };

    return NextResponse.json(
      {
        message: 'Password reset successful',
        user: userResponse,
        tokens,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Password reset failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (5 password reset attempts per 15 minutes per IP)
export const POST = rateLimit(5, 15 * 60 * 1000)(resetPasswordHandler);