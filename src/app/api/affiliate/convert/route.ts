import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { validateRequest } from '@/lib/middleware/validation';

// POST /api/affiliate/convert - Record affiliate conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body, {
      trackingId: { required: true, type: 'string' },
      conversionType: { required: true, type: 'string' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Record the conversion
    const success = await AffiliateTrackingService.recordConversion({
      trackingId: body.trackingId,
      conversionType: body.conversionType,
      conversionValue: body.conversionValue,
      metadata: body.metadata
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Conversion recorded successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to record conversion' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error recording conversion:', error);
    
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
      { success: false, error: 'Failed to record conversion' },
      { status: 500 }
    );
  }
}