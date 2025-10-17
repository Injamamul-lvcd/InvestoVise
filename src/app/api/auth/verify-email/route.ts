import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { generateTokens } from '@/lib/auth';

interface VerifyEmailRequest {
  token: string;
  email: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VerifyEmailRequest = await request.json();
    const { token, email } = body;

    // Validate required fields
    if (!token || !email) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token and email are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user with verification token
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: token,
    }).select('+verificationToken');

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'Email is already verified',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Log verification activity
    await user.addActivity('login', {
      type: 'email_verification',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    // Generate new tokens for the verified user
    const tokens = generateTokens(user);

    // Prepare user response
    const userResponse = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        user: userResponse,
        tokens,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Email verification failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token and email parameters are required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user with verification token
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: token,
    }).select('+verificationToken');

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        {
          message: 'Email is already verified',
          isVerified: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Token is valid',
        isVerified: false,
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token validation error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Token validation failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}