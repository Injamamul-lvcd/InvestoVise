import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/connection';
import AffiliateClick from '@/models/AffiliateClick';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { 
      trackingId, 
      status, 
      accountTypes = [], 
      applicationData = {},
      conversionValue 
    } = body;

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    // Find the affiliate click record
    const affiliateClick = await AffiliateClick.findOne({ trackingId });
    if (!affiliateClick) {
      return NextResponse.json(
        { error: 'Tracking record not found' },
        { status: 404 }
      );
    }

    // Get partner and product for commission calculation
    const [partner, product] = await Promise.all([
      AffiliatePartner.findById(affiliateClick.partnerId),
      Product.findById(affiliateClick.productId),
    ]);

    if (!partner || !product) {
      return NextResponse.json(
        { error: 'Partner or product not found' },
        { status: 404 }
      );
    }

    // Update the affiliate click record
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle different status updates
    switch (status) {
      case 'initiated':
        // Application process started
        updateData.applicationInitiated = true;
        updateData.applicationInitiatedAt = new Date();
        break;

      case 'redirected':
        // User was redirected to partner site
        updateData.redirectedAt = new Date();
        break;

      case 'documents_submitted':
        // User submitted documents
        updateData.documentsSubmitted = true;
        updateData.documentsSubmittedAt = new Date();
        break;

      case 'under_review':
        // Application under review
        updateData.underReview = true;
        updateData.underReviewAt = new Date();
        break;

      case 'approved':
        // Account opened successfully - this is a conversion
        updateData.converted = true;
        updateData.conversionDate = new Date();
        updateData.conversionType = 'account_opened';
        
        // Calculate commission
        const commissionAmount = partner.calculateCommission(conversionValue || 1000); // Default value for account opening
        updateData.commissionAmount = commissionAmount;
        
        // Store additional conversion data
        updateData.conversionData = {
          accountTypes,
          ...applicationData,
        };
        break;

      case 'rejected':
        // Application rejected
        updateData.rejected = true;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = applicationData.reason || 'Not specified';
        break;

      case 'first_transaction':
        // First transaction made - additional conversion goal
        if (affiliateClick.converted) {
          updateData.firstTransaction = true;
          updateData.firstTransactionAt = new Date();
          updateData.firstTransactionAmount = conversionValue || 0;
          
          // Additional commission for first transaction if configured
          if (partner.trackingConfig.conversionGoals.includes('first_transaction')) {
            const additionalCommission = partner.calculateCommission(conversionValue || 0) * 0.1; // 10% bonus
            updateData.commissionAmount = (affiliateClick.commissionAmount || 0) + additionalCommission;
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
    }

    // Update the record
    await AffiliateClick.findByIdAndUpdate(affiliateClick._id, updateData);

    // If this is a conversion, notify the partner API
    if (status === 'approved' && partner.apiEndpoint) {
      try {
        await fetch(`${partner.apiEndpoint}/conversion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PARTNER_API_KEY}`,
          },
          body: JSON.stringify({
            trackingId,
            conversionType: 'account_opened',
            conversionDate: new Date().toISOString(),
            commissionAmount: updateData.commissionAmount,
            accountTypes,
            applicationData,
          }),
        });
      } catch (error) {
        console.error('Failed to notify partner of conversion:', error);
        // Don't fail the request if partner notification fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      trackingId,
      status,
      converted: updateData.converted || affiliateClick.converted,
      commissionAmount: updateData.commissionAmount || affiliateClick.commissionAmount,
    });

  } catch (error) {
    console.error('Error tracking broker application:', error);
    return NextResponse.json(
      { error: 'Failed to track application' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tracking status
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    const affiliateClick = await AffiliateClick.findOne({ trackingId })
      .populate('partnerId')
      .populate('productId');

    if (!affiliateClick) {
      return NextResponse.json(
        { error: 'Tracking record not found' },
        { status: 404 }
      );
    }

    // Return tracking status
    return NextResponse.json({
      trackingId: affiliateClick.trackingId,
      status: getApplicationStatus(affiliateClick),
      clickedAt: affiliateClick.clickedAt,
      converted: affiliateClick.converted,
      conversionDate: affiliateClick.conversionDate,
      commissionAmount: affiliateClick.commissionAmount,
      partner: {
        name: affiliateClick.partnerId.name,
        logo: affiliateClick.partnerId.logoUrl,
      },
      product: {
        name: affiliateClick.productId.name,
        type: affiliateClick.productId.type,
      },
    });

  } catch (error) {
    console.error('Error retrieving tracking status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tracking status' },
      { status: 500 }
    );
  }
}

// Helper function to determine application status
function getApplicationStatus(affiliateClick: any): string {
  if (affiliateClick.rejected) return 'rejected';
  if (affiliateClick.converted) return 'approved';
  if (affiliateClick.underReview) return 'under_review';
  if (affiliateClick.documentsSubmitted) return 'documents_submitted';
  if (affiliateClick.applicationInitiated) return 'initiated';
  if (affiliateClick.redirectedAt) return 'redirected';
  return 'clicked';
}