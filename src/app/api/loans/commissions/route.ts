import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AffiliateClick, AffiliatePartner } from '@/models';
import mongoose from 'mongoose';

// GET /api/loans/commissions - Get commission tracking for loan partners
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.conversionDate = {};
      if (startDate) dateFilter.conversionDate.$gte = startDate;
      if (endDate) dateFilter.conversionDate.$lte = endDate;
    }

    // Build partner filter for loan partners only
    const partnerFilter: any = { 
      type: 'loan',
      isActive: true 
    };
    
    if (partnerId) {
      if (!mongoose.Types.ObjectId.isValid(partnerId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid partner ID' },
          { status: 400 }
        );
      }
      partnerFilter._id = partnerId;
    }

    // Get loan partners
    const partners = await AffiliatePartner.find(partnerFilter);
    const partnerIds = partners.map(p => p._id);

    // Build commission query
    const commissionFilter = {
      partnerId: { $in: partnerIds },
      converted: true,
      ...dateFilter
    };

    // Get commission data with pagination
    const skip = (page - 1) * limit;
    
    const commissions = await AffiliateClick.find(commissionFilter)
      .populate('partnerId', 'name type logoUrl commissionStructure')
      .populate('productId', 'name type interestRate minAmount maxAmount')
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ conversionDate: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await AffiliateClick.countDocuments(commissionFilter);

    // Calculate summary statistics
    const summaryStats = await AffiliateClick.aggregate([
      { $match: commissionFilter },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$commissionAmount' },
          totalConversions: { $sum: 1 },
          avgCommission: { $avg: '$commissionAmount' },
          maxCommission: { $max: '$commissionAmount' },
          minCommission: { $min: '$commissionAmount' }
        }
      }
    ]);

    // Get commission breakdown by partner
    const partnerBreakdown = await AffiliateClick.aggregate([
      { $match: commissionFilter },
      {
        $group: {
          _id: '$partnerId',
          totalCommissions: { $sum: '$commissionAmount' },
          totalConversions: { $sum: 1 },
          avgCommission: { $avg: '$commissionAmount' }
        }
      },
      {
        $lookup: {
          from: 'affiliatepartners',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      { $unwind: '$partner' },
      {
        $project: {
          partnerId: '$_id',
          partnerName: '$partner.name',
          partnerType: '$partner.type',
          totalCommissions: 1,
          totalConversions: 1,
          avgCommission: 1
        }
      },
      { $sort: { totalCommissions: -1 } }
    ]);

    const summary = summaryStats[0] || {
      totalCommissions: 0,
      totalConversions: 0,
      avgCommission: 0,
      maxCommission: 0,
      minCommission: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        summary,
        partnerBreakdown,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          partnerId,
          startDate,
          endDate
        }
      },
      message: 'Loan commission data retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching loan commission data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan commission data' },
      { status: 500 }
    );
  }
}

// POST /api/loans/commissions - Calculate and update commission for a conversion
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { trackingId, loanAmount, conversionType } = body;

    if (!trackingId) {
      return NextResponse.json(
        { success: false, error: 'Tracking ID is required' },
        { status: 400 }
      );
    }

    // Find the affiliate click
    const affiliateClick = await AffiliateClick.findOne({ 
      trackingId,
      converted: false 
    }).populate('partnerId');

    if (!affiliateClick) {
      return NextResponse.json(
        { success: false, error: 'Tracking ID not found or already converted' },
        { status: 404 }
      );
    }

    const partner = affiliateClick.partnerId as any;
    
    // Ensure this is a loan partner
    if (partner.type !== 'loan') {
      return NextResponse.json(
        { success: false, error: 'Partner is not a loan partner' },
        { status: 400 }
      );
    }

    // Calculate commission based on loan amount and partner structure
    let commissionAmount = 0;
    const commissionStructure = partner.commissionStructure;

    if (commissionStructure.type === 'fixed') {
      commissionAmount = commissionStructure.amount;
    } else if (commissionStructure.type === 'percentage' && loanAmount) {
      commissionAmount = (loanAmount * commissionStructure.amount) / 100;
    }

    // Apply conversion type multipliers if needed
    const conversionMultipliers: Record<string, number> = {
      'application_submitted': 0.1,
      'application_approved': 0.5,
      'loan_disbursed': 1.0,
      'first_emi_paid': 1.2
    };

    const multiplier = conversionMultipliers[conversionType] || 1.0;
    commissionAmount *= multiplier;

    // Update the affiliate click with commission
    await affiliateClick.markAsConverted(commissionAmount);

    return NextResponse.json({
      success: true,
      data: {
        trackingId,
        commissionAmount,
        conversionType,
        partner: {
          id: partner._id,
          name: partner.name,
          commissionStructure
        },
        calculatedAt: new Date().toISOString()
      },
      message: 'Commission calculated and recorded successfully'
    });

  } catch (error) {
    console.error('Error calculating loan commission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate loan commission' },
      { status: 500 }
    );
  }
}