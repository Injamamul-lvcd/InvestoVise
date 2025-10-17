import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { generateTokens, validateEmail } from '@/lib/auth';
import { rateLimit } from '@/lib/middleware/auth';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

async function loginHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, rememberMe = false } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
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
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user and include password for comparison
    const user = await User.findByEmail(email).select('+hashedPassword');
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Log login activity
    await user.addActivity('login', {
      type: 'login',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      rememberMe,
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Prepare user response (excluding sensitive data)
    const userResponse = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      isVerified: user.isVerified,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    // Set secure HTTP-only cookie for refresh token if remember me is enabled
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: userResponse,
        tokens,
        requiresVerification: !user.isVerified,
      },
      { status: 200 }
    );

    if (rememberMe) {
      response.cookies.set('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (10 login attempts per 15 minutes per IP)
export const POST = rateLimit(10, 15 * 60 * 1000)(loginHandler);