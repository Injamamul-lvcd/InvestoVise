import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin';
import { markCommissionsAsPaid } from '@/lib/services/commissionTracking';

async function processPaymentHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { commissionIds, paymentReference, paymentMethod, notes } = body;

    // Validate required fields
    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Commission IDs array is required and cannot be empty',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (!paymentReference || typeof paymentReference !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment reference is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment method is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate commission IDs format
    const invalidIds = commissionIds.filter(id => typeof id !== 'string' || id.length !== 24);
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some commission IDs have invalid format',
            details: { invalidIds },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Process payment
    const result = await markCommissionsAsPaid(
      commissionIds,
      paymentReference,
      paymentMethod,
      notes
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'PAYMENT_PROCESSING_ERROR',
            message: 'Failed to process commission payments',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Commission payments processed successfully',
        data: {
          processedCommissions: result.updatedCount,
          totalAmount: result.totalAmount,
          paymentReference,
          paymentMethod,
          processedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Process payment error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'PAYMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process commission payments',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export const POST = requireAdmin(
  logAdminAction('commission_payment', 'commission', 'high')(processPaymentHandler)
);