import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { getAdminSessions, invalidateAdminSession } from '@/lib/services/adminAuth';

async function getSessionsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = (request as any).admin;

    const result = await getAdminSessions(admin.userId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'ADMIN_SESSIONS_FAILED',
            message: result.error || 'Failed to retrieve sessions',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin sessions retrieved successfully',
        sessions: result.sessions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get admin sessions error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to retrieve admin sessions',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

async function invalidateSessionHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = (request as any).admin;
    const body = await request.json();
    const { sessionId: targetSessionId } = body;

    if (!targetSessionId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Session ID is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const currentSessionId = request.headers.get('x-session-id') || admin.sessionId;
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const result = await invalidateAdminSession(
      admin.userId,
      targetSessionId,
      currentSessionId,
      { ipAddress, userAgent }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'ADMIN_SESSION_INVALIDATION_FAILED',
            message: result.error || 'Failed to invalidate session',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin session invalidated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Invalidate admin session error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ADMIN_INTERNAL_ERROR',
          message: 'Failed to invalidate admin session',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('session_list', 'admin', 'low')(getSessionsHandler)
);

export const DELETE = requireAdmin(
  logAdminAction('session_invalidate', 'admin', 'medium')(invalidateSessionHandler)
);