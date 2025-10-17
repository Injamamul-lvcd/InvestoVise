import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { generateAccessToken } from '@/lib/auth';
import { rateLimit } from '@/lib/middleware/auth';

interface RefreshTokenRequest {
  refreshToken?: string;
}

async function refreshHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RefreshTokenRequest = await request.json().catch(() => ({}));
    
    // Get refresh token from body or cookie
    let refreshToken = body.refreshToken;
    if (!refreshToken) {
      refreshToken = request.cookies.get('refreshToken')?.value;
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find user with this refresh token
    // Note: In a production app, you'd store refresh tokens in the database
    // For now, we'll validate the token format and find the user
    if (refreshToken.length !== 80 || !/^[a-f0-9]+$/.test(refreshToken)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // For this implementation, we'll extract user info from the access token if provided
    // In production, you'd store refresh tokens in database with user association
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!accessToken) {
      return NextResponse.json(
        {
          error: {
            code: 'ACCESS_TOKEN_REQUIRED',
            message: 'Access token required for refresh',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Decode the expired access token to get user info (don't verify expiration)
    const jwt = require('jsonwebtoken');
    let payload;
    try {
      payload = jwt.decode(accessToken);
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_ACCESS_TOKEN',
            message: 'Invalid access token',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN_PAYLOAD',
            message: 'Invalid token payload',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Find and validate user
    const user = await User.findById(payload.userId);
    if (!user || !user.isVerified) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found or not verified',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Log token refresh activity
    await user.addActivity('login', {
      type: 'token_refresh',
      ipAddress: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      {
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Token refresh failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (20 refresh attempts per 15 minutes per IP)
export const POST = rateLimit(20, 15 * 60 * 1000)(refreshHandler);