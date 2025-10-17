import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { exportPerformanceData } from '@/lib/services/affiliateAnalytics';

async function exportAnalyticsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') || '30';
    const type = url.searchParams.get('type') as 'partners' | 'products' | 'daily';

    if (!type || !['partners', 'products', 'daily'].includes(type)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_EXPORT_TYPE',
            message: 'Export type must be one of: partners, products, daily',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };
    } else {
      const days = parseInt(period);
      const end = new Date();
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      dateRange = { startDate: start, endDate: end };
    }

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

    const csvData = await exportPerformanceData(dateRange, type);

    // Generate filename
    const startDateStr = dateRange.startDate.toISOString().split('T')[0];
    const endDateStr = dateRange.endDate.toISOString().split('T')[0];
    const filename = `affiliate_${type}_${startDateStr}_to_${endDateStr}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export analytics error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export analytics data',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('analytics_export', 'system', 'medium')(exportAnalyticsHandler)
);