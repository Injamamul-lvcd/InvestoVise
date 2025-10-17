import { NextRequest, NextResponse } from 'next/server';
import creditCardAffiliateService from '@/lib/services/creditCardAffiliateService';
import { connectDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { productId, userId, utmParams } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await creditCardAffiliateService.generateTrackingLink(
      productId,
      userId,
      utmParams
    );

    // Update the click record with actual IP and user agent
    // This would typically be done in middleware, but we'll do it here for simplicity
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error generating tracking link:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate tracking link',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { trackingId, applicationData } = body;

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    await creditCardAffiliateService.trackApplication(trackingId, applicationData);

    return NextResponse.json({
      success: true,
      message: 'Application tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking application:', error);
    return NextResponse.json(
      { 
        error: 'Failed to track application',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}