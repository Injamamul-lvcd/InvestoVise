import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { getProductPerformance } from '@/lib/services/affiliateAnalytics';
import mongoose from 'mongoose';

async function getProductAnalyticsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') || '30';
    const partnerId = url.searchParams.get('partnerId');
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

    // Validate partnerId if provided
    if (partnerId && !mongoose.Types.ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARTNER_ID',
            message: 'Invalid partner ID format',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const productPerformance = await getProductPerformance(dateRange, partnerId, limit);

    // Calculate summary statistics
    const summary = productPerformance.reduce(
      (acc, product) => ({
        totalProducts: acc.totalProducts + 1,
        totalClicks: acc.totalClicks + product.metrics.totalClicks,
        totalConversions: acc.totalConversions + product.metrics.totalConversions,
        totalRevenue: acc.totalRevenue + product.metrics.revenue,
        averageConversionRate: acc.averageConversionRate + product.metrics.conversionRate,
      }),
      {
        totalProducts: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        averageConversionRate: 0,
      }
    );

    if (summary.totalProducts > 0) {
      summary.averageConversionRate = summary.averageConversionRate / summary.totalProducts;
    }

    // Group by product type for additional insights
    const productTypeBreakdown = productPerformance.reduce((acc, product) => {
      const type = product.productType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
        };
      }
      acc[type].count++;
      acc[type].totalClicks += product.metrics.totalClicks;
      acc[type].totalConversions += product.metrics.totalConversions;
      acc[type].totalRevenue += product.metrics.revenue;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(
      {
        message: 'Product analytics retrieved successfully',
        data: {
          dateRange: {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          },
          partnerId,
          summary,
          productTypeBreakdown,
          products: productPerformance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get product analytics error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve product analytics',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('analytics_products', 'product', 'low')(getProductAnalyticsHandler)
);