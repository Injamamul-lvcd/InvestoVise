import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { generatePasswordResetToken, hashResetToken, validateEmail } from '@/lib/auth';
import { rateLimit } from '@/lib/middleware/auth';

interface ForgotPasswordRequest {
  email: string;
}

async function forgotPasswordHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const hashedToken = hashResetToken(resetToken);

      // Set reset token and expiration (1 hour)
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Log password reset request
      await user.addActivity('login', {
        type: 'password_reset_request',
        ipAddress: request.ip || request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      });

      // TODO: Send password reset email
      // This would typically integrate with an email service like SendGrid, AWS SES, etc.
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset URL: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${email}`);
    }

    // Always return success message
    return NextResponse.json(
      {
        message: 'If an account with that email exists, we have sent a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Password reset request failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (3 password reset requests per 15 minutes per IP)
export const POST = rateLimit(3, 15 * 60 * 1000)(forgotPasswordHandler);