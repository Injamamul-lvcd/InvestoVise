import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { validateRequest } from '@/lib/middleware/validation';

// POST /api/loans/conversions - Record loan conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, {
      trackingId: { required: true, type: 'string' },
      conversionType: { required: true, type: 'string' },
      conversionValue: { required: false, type: 'number', min: 0 },
      loanAmount: { required: false, type: 'number', min: 0 },
      interestRate: { required: false, type: 'number', min: 0 },
      tenure: { required: false, type: 'number', min: 1 },
      metadata: { required: false, type: 'object' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { trackingId, conversionType, conversionValue, loanAmount, interestRate, tenure, metadata } = body;

    // Validate conversion type for loans
    const validLoanConversions = [
      'application_submitted',
      'application_approved', 
      'loan_disbursed',
      'first_emi_paid'
    ];

    if (!validLoanConversions.includes(conversionType)) {
      return NextResponse.json(
        { success: false, error: `Invalid conversion type. Must be one of: ${validLoanConversions.join(', ')}` },
        { status: 400 }
      );
    }

    // Build metadata for loan conversions
    const loanMetadata = {
      ...metadata,
      loanAmount,
      interestRate,
      tenure,
      conversionType,
      timestamp: new Date().toISOString()
    };

    // Record the conversion
    const success = await AffiliateTrackingService.recordConversion({
      trackingId,
      conversionType,
      conversionValue: conversionValue || loanAmount || 0,
      metadata: loanMetadata
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to record conversion' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        trackingId,
        conversionType,
        conversionValue: conversionValue || loanAmount || 0,
        recordedAt: new Date().toISOString()
      },
      message: 'Loan conversion recorded successfully'
    });

  } catch (error: any) {
    console.error('Error recording loan conversion:', error);
    
    if (error.message.includes('not found') || error.message.includes('already converted')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('attribution window')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to record loan conversion' },
      { status: 500 }
    );
  }
}

// GET /api/loans/conversions - Get loan conversion analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    let analytics;

    if (partnerId) {
      // Get analytics for specific partner
      analytics = await AffiliateTrackingService.getPartnerAnalytics(partnerId, startDate, endDate);
    } else {
      // Get overall analytics
      analytics = await AffiliateTrackingService.getOverallAnalytics(startDate, endDate);
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Loan conversion analytics retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching loan conversion analytics:', error);
    
    if (error.message.includes('Invalid partner ID')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan conversion analytics' },
      { status: 500 }
    );
  }
}