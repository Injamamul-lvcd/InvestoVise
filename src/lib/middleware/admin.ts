import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload, generateSessionId } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import AdminSession from '@/models/AdminSession';
import AdminAuditLog from '@/models/AdminAuditLog';
import mongoose from 'mongoose';

export interface AdminRequest extends NextRequest {
  admin?: JWTPayload & {
    userData?: any;
    sessionId?: string;
  };
}

/**
 * Enhanced admin authentication with session tracking
 */
export async function authenticateAdmin(request: NextRequest): Promise<{
  success: boolean;
  admin?: JWTPayload & { userData?: any; sessionId?: string };
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return {
        success: false,
        error: 'Access token required',
      };
    }

    // Verify the token
    const payload = verifyToken(token);

    // Connect to database
    await connectToDatabase();

    // Fetch user data
    const userData = await User.findById(payload.userId).select('-hashedPassword');

    if (!userData) {
      return {
        success: false,
        error: 'Admin not found',
      };
    }

    if (!userData.isVerified) {
      return {
        success: false,
        error: 'Admin email not verified',
      };
    }

    if (userData.role !== 'admin') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    // Get or create session
    const sessionId = request.headers.get('x-session-id') || generateSessionId();
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find active session
    let session = await AdminSession.findOne({
      userId: userData._id,
      sessionId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (session) {
      // Update session activity
      await session.updateActivity();
    }

    return {
      success: true,
      admin: {
        ...payload,
        userData,
        sessionId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Admin authentication failed',
    };
  }
}

/**
 * Middleware to require admin authentication
 */
export function requireAdmin(handler: (req: AdminRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateAdmin(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'ADMIN_UNAUTHORIZED',
            message: authResult.error || 'Admin authentication required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Add admin to request object
    const adminRequest = request as AdminRequest;
    adminRequest.admin = authResult.admin;

    return handler(adminRequest);
  };
}

/**
 * Middleware to log admin actions
 */
export function logAdminAction(
  action: string,
  resource: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  return (handler: (req: AdminRequest) => Promise<NextResponse>) => {
    return async (request: AdminRequest): Promise<NextResponse> => {
      const startTime = Date.now();
      let status: 'success' | 'failure' | 'partial' = 'success';
      let errorMessage: string | undefined;
      let resourceId: string | undefined;
      let changes: { before?: any; after?: any } | undefined;

      try {
        // Execute the handler
        const response = await handler(request);
        
        // Determine status from response
        if (response.status >= 400) {
          status = 'failure';
          const responseBody = await response.clone().json().catch(() => ({}));
          errorMessage = responseBody.error?.message || 'Unknown error';
        }

        return response;
      } catch (error) {
        status = 'failure';
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        // Log the action
        if (request.admin) {
          const duration = Date.now() - startTime;
          const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';

          // Extract resource ID from URL or request body
          const url = new URL(request.url);
          const pathSegments = url.pathname.split('/');
          const lastSegment = pathSegments[pathSegments.length - 1];
          if (lastSegment && lastSegment.match(/^[0-9a-fA-F]{24}$/)) {
            resourceId = lastSegment;
          }

          await AdminAuditLog.logAction({
            adminId: request.admin.userData._id,
            action,
            resource,
            resourceId: resourceId ? new mongoose.Types.ObjectId(resourceId) : undefined,
            details: {
              method: request.method,
              url: request.url,
              query: Object.fromEntries(url.searchParams),
            },
            changes,
            ipAddress,
            userAgent,
            sessionId: request.admin.sessionId || 'unknown',
            severity,
            status,
            errorMessage,
            duration,
          }).catch(console.error); // Don't fail the request if logging fails
        }
      }
    };
  };
}

/**
 * Middleware for role-based access control
 */
export function requirePermission(permissions: string[]) {
  return (handler: (req: AdminRequest) => Promise<NextResponse>) => {
    return async (request: AdminRequest): Promise<NextResponse> => {
      if (!request.admin) {
        return NextResponse.json(
          {
            error: {
              code: 'ADMIN_UNAUTHORIZED',
              message: 'Admin authentication required',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 401 }
        );
      }

      // For now, all admins have all permissions
      // In the future, this can be extended with granular permissions
      const adminRole = request.admin.userData.role;
      if (adminRole !== 'admin') {
        return NextResponse.json(
          {
            error: {
              code: 'ADMIN_FORBIDDEN',
              message: 'Insufficient permissions',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
        );
      }

      return handler(request);
    };
  };
}

/**
 * Admin rate limiting (more lenient than regular users)
 */
export function adminRateLimit(maxRequests: number = 1000, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (handler: (req: AdminRequest) => Promise<NextResponse>) => {
    return async (request: AdminRequest): Promise<NextResponse> => {
      const adminId = request.admin?.userId || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [id, data] of requests.entries()) {
        if (data.resetTime < windowStart) {
          requests.delete(id);
        }
      }

      // Get or create request data for this admin
      const requestData = requests.get(adminId) || { count: 0, resetTime: now + windowMs };

      // Reset if window has passed
      if (requestData.resetTime < now) {
        requestData.count = 0;
        requestData.resetTime = now + windowMs;
      }

      // Check if limit exceeded
      if (requestData.count >= maxRequests) {
        return NextResponse.json(
          {
            error: {
              code: 'ADMIN_RATE_LIMIT_EXCEEDED',
              message: 'Too many admin requests, please try again later',
              timestamp: new Date().toISOString(),
              retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
            },
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((requestData.resetTime - now) / 1000).toString(),
            },
          }
        );
      }

      // Increment counter
      requestData.count++;
      requests.set(adminId, requestData);

      return handler(request);
    };
  };
}