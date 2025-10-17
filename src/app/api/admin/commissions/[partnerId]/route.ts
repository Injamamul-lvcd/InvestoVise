import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { getPartnerCommissionDetails } from '@/lib/services/commissionTracking';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    partnerId: string;
  };
}

async function getPartnerCommissionsHandler(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { partnerId } = params;

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
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

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));

    const result = await getPartnerCommissionDetails(partnerId, page, limit);

    return NextResponse.json(
      {
        message: 'Partner commission details retrieved successfully',
        data: {
          partnerId,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: page < result.totalPages,
            hasPrev: page > 1,
          },
          commissions: result.commissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get partner commissions error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'COMMISSION_ERROR',
          message: 'Failed to retrieve partner commission details',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdmin(
  logAdminAction('commission_partner_view', 'commission', 'low')(getPartnerCommissionsHandler)
);