import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { validateRequest } from '@/lib/middleware/validation';

// POST /api/affiliate/track - Track affiliate click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get client information
    const ipAddress = request.ip || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;

    // Validate required fields
    const validation = validateRequest(body, {
      partnerId: { required: true, type: 'string' },
      productId: { required: true, type: 'string' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare tracking data
    const trackingData = {
      partnerId: body.partnerId,
      productId: body.productId,
      userId: body.userId,
      ipAddress,
      userAgent,
      referrer,
      sessionId: body.sessionId,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign
    };

    // Validate tracking parameters
    const paramValidation = AffiliateTrackingService.validateTrackingParams(trackingData);
    if (!paramValidation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid tracking parameters', details: paramValidation.errors },
        { status: 400 }
      );
    }

    // Track the click
    const trackingId = await AffiliateTrackingService.trackClick(trackingData);

    return NextResponse.json({
      success: true,
      data: { trackingId },
      message: 'Click tracked successfully'
    });

  } catch (error: any) {
    console.error('Error tracking affiliate click:', error);
    
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to track click' },
      { status: 500 }
    );
  }
}