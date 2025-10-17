import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Product, AffiliatePartner } from '@/models';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { validateRequest } from '@/lib/middleware/validation';
import mongoose from 'mongoose';

// POST /api/loans/[id]/affiliate-link - Generate affiliate link for loan application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id: productId } = params;
    const body = await request.json();

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequest(body, {
      userId: { required: false, type: 'string' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Check if product exists and is a loan product
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      type: { $in: ['personal_loan', 'home_loan', 'car_loan', 'business_loan'] }
    }).populate('partnerId');

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Loan product not found or inactive' },
        { status: 404 }
      );
    }

    const partner = product.partnerId as any;
    if (!partner.isActive) {
      return NextResponse.json(
        { success: false, error: 'Partner is not active' },
        { status: 400 }
      );
    }

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Generate affiliate tracking link
    const trackingUrl = await AffiliateTrackingService.generateAffiliateLink(
      partner._id.toString(),
      productId,
      baseUrl,
      {
        source: 'loan_comparison',
        medium: 'web',
        campaign: `loan_${product.type}`
      }
    );

    // Generate a unique tracking ID for this specific request
    const trackingId = AffiliateTrackingService.generateTrackingId();

    return NextResponse.json({
      success: true,
      data: {
        trackingUrl,
        trackingId,
        product: {
          id: product._id,
          name: product.name,
          type: product.type,
          interestRate: product.interestRate,
          applicationUrl: product.applicationUrl
        },
        partner: {
          id: partner._id,
          name: partner.name,
          logoUrl: partner.logoUrl
        }
      },
      message: 'Affiliate link generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating loan affiliate link:', error);
    
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