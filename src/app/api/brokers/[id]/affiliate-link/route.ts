import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/connection';
import Product from '@/models/Product';
import AffiliatePartner from '@/models/AffiliatePartner';
import AffiliateClick from '@/models/AffiliateClick';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id: productId } = params;
    const body = await request.json();
    const { userId, source = 'broker_directory' } = body;

    // Get the product and partner
    const product = await Product.findById(productId).populate('partnerId');
    if (!product || product.type !== 'broker_account') {
      return NextResponse.json(
        { error: 'Broker product not found' },
        { status: 404 }
      );
    }

    const partner = product.partnerId as any;
    if (!partner || partner.type !== 'broker' || !partner.isActive) {
      return NextResponse.json(
        { error: 'Broker partner not found or inactive' },
        { status: 404 }
      );
    }

    // Generate unique tracking ID
    const trackingId = `broker_${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';

    // Create affiliate click record
    const affiliateClick = new AffiliateClick({
      trackingId,
      userId: userId || undefined,
      partnerId: partner._id,
      productId: product._id,
      clickedAt: new Date(),
      ipAddress: clientIP,
      userAgent,
      referrer,
      converted: false,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      utmSource: source,
      utmMedium: 'affiliate',
      utmCampaign: 'broker_directory',
    });

    await affiliateClick.save();

    // Generate tracking URL
    let trackingUrl = product.applicationUrl;
    
    // Add tracking parameters to the URL
    const url = new URL(trackingUrl);
    url.searchParams.set('ref', trackingId);
    url.searchParams.set('source', source);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', 'broker_directory');
    
    if (userId) {
      url.searchParams.set('user_id', userId);
    }

    trackingUrl = url.toString();

    // If partner has API endpoint, call it to register the tracking
    if (partner.apiEndpoint) {
      try {
        const partnerResponse = await fetch(`${partner.apiEndpoint}/track-click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PARTNER_API_KEY}`, // You'd store this securely
          },
          body: JSON.stringify({
            trackingId,
            productId: product._id,
            userId,
            source,
            timestamp: new Date().toISOString(),
          }),
        });

        if (partnerResponse.ok) {
          const partnerData = await partnerResponse.json();
          // Use partner's tracking URL if provided
          if (partnerData.trackingUrl) {
            trackingUrl = partnerData.trackingUrl;
          }
        }
      } catch (error) {
        console.error('Failed to notify partner API:', error);
        // Continue with our own tracking URL
      }
    }

    return NextResponse.json({
      trackingId,
      trackingUrl,
      partnerId: partner._id,
      productId: product._id,
    });

  } catch (error) {
    console.error('Error generating broker affiliate link:', error);
    return NextResponse.json(
      { error: 'Failed to generate affiliate link' },
      { status: 500 }
    );
  }
}