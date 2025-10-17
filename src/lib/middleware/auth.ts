import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload & {
    userData?: any;
  };
}

/**
 * JWT Authentication middleware for API routes
 */
export async function authenticateToken(request: NextRequest): Promise<{
  success: boolean;
  user?: JWTPayload & { userData?: any };
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

    // Connect to database and fetch user data
    await connectToDatabase();
    const userData = await User.findById(payload.userId).select('-hashedPassword');

    if (!userData) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if (!userData.isVerified) {
      return {
        success: false,
        error: 'Email not verified',
      };
    }

    return {
      success: true,
      user: {
        ...payload,
        userData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateToken(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;

    return handler(authenticatedRequest);
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateToken(request);

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      );
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;

    return handler(authenticatedRequest);
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(request: NextRequest): Promise<{
  user?: JWTPayload & { userData?: any };
}> {
  const authResult = await authenticateToken(request);
  return authResult.success ? { user: authResult.user } : {};
}

/**
 * Admin authentication function
 */
export async function authenticateAdmin(request: NextRequest): Promise<{
  success: boolean;
  user?: JWTPayload & { userData?: any };
  error?: string;
}> {
  const authResult = await authenticateToken(request);

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user?.role !== 'admin') {
    return {
      success: false,
      error: 'Admin access required'
    };
  }

  return authResult;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [ip, data] of requests.entries()) {
        if (data.resetTime < windowStart) {
          requests.delete(ip);
        }
      }

      // Get or create request data for this IP
      const requestData = requests.get(clientIp) || { count: 0, resetTime: now + windowMs };

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
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
              timestamp: new Date().toISOString(),
              retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
            },
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((requestData.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': Math.max(0, maxRequests - requestData.count - 1).toString(),
              'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString(),
            },
          }
        );
      }

      // Increment counter
      requestData.count++;
      requests.set(clientIp, requestData);

      // Add rate limit headers to response
      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count).toString());
      response.headers.set('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

      return response;
    };
  };
}