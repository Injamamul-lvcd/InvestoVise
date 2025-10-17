import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { logoutAdmin } from '@/lib/services/adminAuth';

async function adminLogoutHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = (request as any).admin;
    const sessionId = request.headers.get('x-session-id') || admin.sessionId;
    
    // Get session info
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Logout admin
    const result = await logoutAdmin(
      admin.userId,
      sessionId,
      { ipAddress, userAgent }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'ADMIN_LOGOUT_FAILED',
            message: result.error || 'Logout failed',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    // Clear refresh token cookie
    const response = NextResponse.json(
      {
        message: 'Admin logout successful',
      },
      { status: 200 }
    );

    response.cookies.set('adminRefreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/api/admin',
    });

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Admin logout failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const POST = requireAdmin(adminLogoutHandler);