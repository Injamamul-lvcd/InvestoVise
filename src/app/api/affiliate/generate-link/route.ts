import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { validateRequest } from '@/lib/middleware/validation';

// POST /api/affiliate/generate-link - Generate affiliate tracking link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body, {
      partnerId: { required: true, type: 'string' },
      productId: { required: true, type: 'string' },
      baseUrl: { required: true, type: 'string', pattern: /^https?:\/\/.+/ }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate affiliate link
    const affiliateLink = await AffiliateTrackingService.generateAffiliateLink(
      body.partnerId,
      body.productId,
      body.baseUrl,
      {
        source: body.utmSource,
        medium: body.utmMedium,
        campaign: body.utmCampaign
      }
    );

    return NextResponse.json({
      success: true,
      data: { affiliateLink },
      message: 'Affiliate link generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating affiliate link:', error);
    
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate affiliate link' },
      { status: 500 }
    );
  }
}