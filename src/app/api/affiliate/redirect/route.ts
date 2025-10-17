import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';

// GET /api/affiliate/redirect - Handle affiliate redirects with tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('p');
    const productId = searchParams.get('pr');
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    if (!partnerId || !productId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = request.ip || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;

    // Get session ID from cookie if available
    const sessionId = request.cookies.get('session-id')?.value;

    // Process redirect and track click
    const { trackingId, redirectUrl } = await AffiliateTrackingService.processRedirect(
      partnerId,
      productId,
      {
        ip: ipAddress,
        userAgent,
        referrer,
        sessionId,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined
      }
    );

    // Set tracking cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('affiliate-tracking', trackingId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error: any) {
    console.error('Error processing affiliate redirect:', error);
    
    // Return a fallback redirect or error page
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Partner or product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process redirect' },
      { status: 500 }
    );
  }
}