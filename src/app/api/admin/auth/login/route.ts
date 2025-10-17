import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/services/adminAuth';
import { rateLimit } from '@/lib/middleware/auth';

interface AdminLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

async function adminLoginHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AdminLoginRequest = await request.json();
    const { email, password, rememberMe = false } = body;

    // Get session info
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Attempt login
    const result = await loginAdmin(
      { email, password, rememberMe },
      { ipAddress, userAgent }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'ADMIN_LOGIN_FAILED',
            message: result.error || 'Login failed',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Set secure HTTP-only cookie for refresh token if remember me is enabled
    const response = NextResponse.json(
      {
        message: 'Admin login successful',
        admin: result.admin,
        tokens: result.tokens,
        sessionId: result.sessionId,
      },
      { status: 200 }
    );

    if (rememberMe && result.tokens) {
      response.cookies.set('adminRefreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/api/admin',
      });
    }

    // Set session ID header
    if (result.sessionId) {
      response.headers.set('X-Session-ID', result.sessionId);
    }

    return response;
  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Admin login failed. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (5 admin login attempts per 15 minutes per IP)
export const POST = rateLimit(5, 15 * 60 * 1000)(adminLoginHandler);