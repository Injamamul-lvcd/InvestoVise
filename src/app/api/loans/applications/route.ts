import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { LoanApplication } from '@/types/loans';
import { validateRequest } from '@/lib/middleware/validation';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { Product } from '@/models';
import mongoose from 'mongoose';

// In-memory storage for loan applications (in production, use a proper database)
const loanApplications: LoanApplication[] = [];

// POST /api/loans/applications - Track loan application
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, {
      productId: { required: true, type: 'string' },
      amount: { required: true, type: 'number', min: 1000 },
      tenure: { required: true, type: 'number', min: 1, max: 360 },
      userId: { required: false, type: 'string' },
      purpose: { required: false, type: 'string' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { productId, amount, tenure, userId, purpose } = body;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
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

    // Validate loan amount against product limits
    if (product.minAmount && amount < product.minAmount) {
      return NextResponse.json(
        { success: false, error: `Minimum loan amount is ₹${product.minAmount.toLocaleString('en-IN')}` },
        { status: 400 }
      );
    }

    if (product.maxAmount && amount > product.maxAmount) {
      return NextResponse.json(
        { success: false, error: `Maximum loan amount is ₹${product.maxAmount.toLocaleString('en-IN')}` },
        { status: 400 }
      );
    }

    // Generate tracking ID
    const trackingId = AffiliateTrackingService.generateTrackingId();

    // Get client information for tracking
    const ipAddress = request.ip || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || undefined;

    // Track the application initiation
    await AffiliateTrackingService.trackClick({
      partnerId: (product.partnerId as any)._id.toString(),
      productId: productId,
      userId: userId,
      ipAddress: ipAddress,
      userAgent: userAgent,
      referrer: referrer,
      utmSource: 'loan_application',
      utmMedium: 'web',
      utmCampaign: `loan_${product.type}`
    });

    // Build redirect URL with tracking parameters
    const redirectUrl = new URL(product.applicationUrl);
    redirectUrl.searchParams.set('ref', trackingId);
    redirectUrl.searchParams.set('amount', amount.toString());
    redirectUrl.searchParams.set('tenure', tenure.toString());
    if (purpose) redirectUrl.searchParams.set('purpose', purpose);

    // Create loan application record
    const loanApplication: LoanApplication = {
      productId,
      userId,
      amount,
      tenure,
      purpose,
      status: 'initiated',
      trackingId,
      applicationDate: new Date(),
      redirectUrl: redirectUrl.toString()
    };

    // Store application (in production, save to database)
    loanApplications.push(loanApplication);

    return NextResponse.json({
      success: true,
      data: {
        application: loanApplication,
        product: {
          id: product._id,
          name: product.name,
          type: product.type,
          interestRate: product.interestRate
        },
        partner: {
          id: (product.partnerId as any)._id,
          name: (product.partnerId as any).name,
          logoUrl: (product.partnerId as any).logoUrl
        }
      },
      message: 'Loan application tracked successfully'
    });

  } catch (error: any) {
    console.error('Error tracking loan application:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to track loan application' },
      { status: 500 }
    );
  }
}

// GET /api/loans/applications - Get loan applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let applications = loanApplications;

    // Filter by user ID if provided
    if (userId) {
      applications = applications.filter(app => app.userId === userId);
    }

    // Sort by application date (newest first)
    applications.sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());

    return NextResponse.json({
      success: true,
      data: {
        applications,
        total: applications.length
      },
      message: 'Loan applications retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan applications' },
      { status: 500 }
    );
  }
}