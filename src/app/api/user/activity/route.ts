import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

interface GetActivityQuery {
  limit?: string;
  offset?: string;
  type?: string;
}

async function getActivityHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    // Validate query parameters
    if (limit > 100) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit cannot exceed 100',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(request.user?.userId);
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Filter activities by type if specified
    let activities = user.activityLog;
    if (type) {
      activities = activities.filter(activity => activity.type === type);
    }

    // Sort by timestamp (newest first) and apply pagination
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);

    // Get total count for pagination
    const totalCount = activities.length;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json(
      {
        activities: sortedActivities,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get activity error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve activity. Please try again.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const GET = requireAuth(getActivityHandler);