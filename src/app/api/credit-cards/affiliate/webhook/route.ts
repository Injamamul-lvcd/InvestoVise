import { NextRequest, NextResponse } from 'next/server';
import creditCardAffiliateService from '@/lib/services/creditCardAffiliateService';
import { connectDB } from '@/lib/database';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');
    const partnerId = request.headers.get('x-partner-id');

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // Verify webhook signature (optional but recommended)
    if (signature && process.env.WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== `sha256=${expectedSignature}`) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    const { trackingId, conversionType, conversionValue, metadata } = body;

    if (!trackingId || !conversionType) {
      return NextResponse.json(
        { error: 'Tracking ID and conversion type are required' },
        { status: 400 }
      );
    }

    await creditCardAffiliateService.handleConversionWebhook(partnerId, {
      trackingId,
      conversionType,
      conversionValue,
      metadata
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}