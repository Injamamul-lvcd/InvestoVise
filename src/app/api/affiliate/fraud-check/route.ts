import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { authenticateAdmin } from '@/lib/middleware/auth';
import { validateRequest } from '@/lib/middleware/validation';

// POST /api/affiliate/fraud-check - Check for fraudulent activity
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body, {
      trackingId: { required: true, type: 'string' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Perform fraud detection
    const fraudCheck = await AffiliateTrackingService.detectFraud(body.trackingId);

    return NextResponse.json({
      success: true,
      data: fraudCheck
    });

  } catch (error: any) {
    console.error('Error checking for fraud:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to check for fraud' },
      { status: 500 }
    );
  }
}