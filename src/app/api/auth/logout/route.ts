import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';

async function logoutHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    await connectToDatabase();

    // Find user and log logout activity
    const user = await User.findById(request.user?.userId);
    if (user) {
      await user.addActivity('login', {
        type: 'logout',
        ipAddress: request.ip || request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      });
    }

    // Create response
    const response = NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );

    // Clear refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Logout failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const POST = requireAuth(logoutHandler);