import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { getOverallMetrics, getTopPerformers, getDailyMetrics } from '@/lib/services/affiliateAnalytics';

async function getAnalyticsOverviewHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') || '30'; // Default to 30 days

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };
    } else {
      // Default to last N days
      const days = parseInt(period);
      const end = new Date();
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      dateRange = { startDate: start, endDate: end };
    }

    // Validate date range
    if (dateRange.startDate >= dateRange.endDate) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'Start date must be before end date',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Get analytics data
    const [overallMetrics, topPerformers, dailyMetrics] = await Promise.all([
      getOverallMetrics(dateRange),
      getTopPerformers(dateRange, 5),
      getDailyMetrics(dateRange),
    ]);

    return NextResponse.json(
      {
        message: 'Analytics overview retrieved successfully',
        data: {
          dateRange: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          },
          overallMetrics,
          topPerformers,
          dailyMetrics,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get analytics overview error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve analytics overview',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('analytics_overview', 'system', 'low')(getAnalyticsOverviewHandler)
);