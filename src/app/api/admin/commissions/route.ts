import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { getCommissionSummary, generateCommissionReport } from '@/lib/services/commissionTracking';

async function getCommissionsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const partnerId = url.searchParams.get('partnerId');
    const reportType = url.searchParams.get('reportType') || 'summary';

    let dateRange: { startDate?: Date; endDate?: Date } = {};
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      if (dateRange.startDate! >= dateRange.endDate!) {
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
    }

    if (reportType === 'detailed' && dateRange.startDate && dateRange.endDate) {
      // Generate detailed commission report
      const report = await generateCommissionReport(
        dateRange.startDate,
        dateRange.endDate,
        partnerId || undefined
      );

      return NextResponse.json(
        {
          message: 'Commission report generated successfully',
          data: {
            reportType: 'detailed',
            dateRange: {
              startDate: dateRange.startDate.toISOString(),
              endDate: dateRange.endDate.toISOString(),
            },
            partnerId,
            ...report,
          },
        },
        { status: 200 }
      );
    } else {
      // Get commission summary
      const commissionSummary = await getCommissionSummary(
        dateRange.startDate,
        dateRange.endDate
      );

      // Calculate totals
      const totals = commissionSummary.reduce(
        (acc, partner) => ({
          totalCommission: acc.totalCommission + partner.totalCommission,
          paidCommission: acc.paidCommission + partner.paidCommission,
          pendingCommission: acc.pendingCommission + partner.pendingCommission,
          totalConversions: acc.totalConversions + partner.conversions,
        }),
        {
          totalCommission: 0,
          paidCommission: 0,
          pendingCommission: 0,
          totalConversions: 0,
        }
      );

      return NextResponse.json(
        {
          message: 'Commission summary retrieved successfully',
          data: {
            reportType: 'summary',
            dateRange: dateRange.startDate && dateRange.endDate ? {
              startDate: dateRange.startDate.toISOString(),
              endDate: dateRange.endDate.toISOString(),
            } : null,
            totals,
            partners: commissionSummary,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Get commissions error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'COMMISSION_ERROR',
          message: 'Failed to retrieve commission data',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('commission_view', 'commission', 'low')(getCommissionsHandler)
);