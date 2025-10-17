import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { getPartnerPerformance } from '@/lib/services/affiliateAnalytics';

async function getPartnerAnalyticsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') || '30';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

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

    const partnerPerformance = await getPartnerPerformance(dateRange, limit);

    // Calculate summary statistics
    const summary = partnerPerformance.reduce(
      (acc, partner) => ({
        totalPartners: acc.totalPartners + 1,
        totalClicks: acc.totalClicks + partner.metrics.totalClicks,
        totalConversions: acc.totalConversions + partner.metrics.totalConversions,
        totalRevenue: acc.totalRevenue + partner.metrics.revenue,
        averageConversionRate: acc.averageConversionRate + partner.metrics.conversionRate,
      }),
      {
        totalPartners: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
      }
    );

    if (summary.totalPartners > 0) {
      summary.averageConversionRate = summary.averageConversionRate / summary.totalPartners;
    }

    return NextResponse.json(
      {
        message: 'Partner analytics retrieved successfully',
        data: {
          dateRange: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          },
          summary,
          partners: partnerPerformance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get partner analytics error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve partner analytics',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('analytics_partners', 'partner', 'low')(getPartnerAnalyticsHandler)
);