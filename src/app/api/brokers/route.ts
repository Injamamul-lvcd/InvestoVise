import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/connection';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';
import { BrokerFilters } from '@/types/brokers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: BrokerFilters = {
      accountTypes: searchParams.get('accountTypes')?.split(',').filter(Boolean),
      maxBrokerageEquity: searchParams.get('maxBrokerageEquity') ? Number(searchParams.get('maxBrokerageEquity')) : undefined,
      maxAccountOpening: searchParams.get('maxAccountOpening') ? Number(searchParams.get('maxAccountOpening')) : undefined,
      maxAnnualCharges: searchParams.get('maxAnnualCharges') ? Number(searchParams.get('maxAnnualCharges')) : undefined,
      platforms: searchParams.get('platforms')?.split(',').filter(Boolean),
      hasResearchReports: searchParams.get('hasResearchReports') === 'true' ? true : undefined,
      hasMarginFunding: searchParams.get('hasMarginFunding') === 'true' ? true : undefined,
      hasIpoAccess: searchParams.get('hasIpoAccess') === 'true' ? true : undefined,
      hasMutualFunds: searchParams.get('hasMutualFunds') === 'true' ? true : undefined,
      hasBonds: searchParams.get('hasBonds') === 'true' ? true : undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      partnerId: searchParams.get('partnerId') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    // Build MongoDB query for products
    const productQuery: any = {
      type: 'broker_account',
      isActive: true,
    };

    // Build MongoDB query for partners
    const partnerQuery: any = {
      type: 'broker',
      isActive: true,
    };

    if (filters.partnerId) {
      partnerQuery._id = filters.partnerId;
    }

    // Get active broker partners
    const partners = await AffiliatePartner.find(partnerQuery);
    const partnerIds = partners.map(p => p._id);

    // Add partner filter to product query
    productQuery.partnerId = { $in: partnerIds };

    // Apply filters to product query
    if (filters.accountTypes && filters.accountTypes.length > 0) {
      productQuery.accountTypes = { $in: filters.accountTypes };
    }

    if (filters.maxAccountOpening !== undefined) {
      productQuery['accountCharges.opening'] = { $lte: filters.maxAccountOpening };
    }

    if (filters.maxAnnualCharges !== undefined) {
      productQuery.$expr = {
        $lte: [
          { $add: ['$accountCharges.maintenance', '$accountCharges.demat'] },
          filters.maxAnnualCharges
        ]
      };
    }

    if (filters.maxBrokerageEquity !== undefined) {
      productQuery['brokerage.equity.delivery'] = { $lte: filters.maxBrokerageEquity };
    }

    if (filters.hasResearchReports !== undefined) {
      productQuery.researchReports = filters.hasResearchReports;
    }

    if (filters.hasMarginFunding !== undefined) {
      productQuery.marginFunding = filters.hasMarginFunding;
    }

    if (filters.hasIpoAccess !== undefined) {
      productQuery.ipoAccess = filters.hasIpoAccess;
    }

    if (filters.hasMutualFunds !== undefined) {
      productQuery.mutualFunds = filters.hasMutualFunds;
    }

    if (filters.hasBonds !== undefined) {
      productQuery.bonds = filters.hasBonds;
    }

    if (filters.minRating !== undefined) {
      productQuery.rating = { $gte: filters.minRating };
    }

    // Apply platform filters
    if (filters.platforms && filters.platforms.length > 0) {
      const platformConditions = filters.platforms.map(platform => ({
        [`platforms.${platform}`]: true
      }));
      productQuery.$and = productQuery.$and || [];
      productQuery.$and.push({ $or: platformConditions });
    }

    // Build sort criteria
    let sortCriteria: any = {};
    
    switch (filters.sortBy) {
      case 'brokerage':
        sortCriteria = { 'brokerage.equity.delivery': filters.sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'charges':
        // Sort by total annual charges (maintenance + demat)
        sortCriteria = { 
          $expr: {
            [filters.sortOrder === 'desc' ? '$gt' : '$lt']: [
              { $add: ['$accountCharges.maintenance', '$accountCharges.demat'] },
              0
            ]
          }
        };
        break;
      case 'rating':
        sortCriteria = { rating: filters.sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'popularity':
        sortCriteria = { priority: filters.sortOrder === 'desc' ? -1 : 1 };
        break;
      default:
        sortCriteria = { priority: -1, rating: -1 }; // Default sort by priority then rating
    }

    // Execute query
    const products = await Product.find(productQuery)
      .sort(sortCriteria)
      .populate('partnerId')
      .lean();

    // Transform products to match BrokerProduct interface
    const brokerProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      partnerId: product.partnerId._id.toString(),
    }));

    // Transform partners
    const brokerPartners = partners.map(partner => ({
      ...partner.toObject(),
      _id: partner._id.toString(),
    }));

    return NextResponse.json({
      products: brokerProducts,
      partners: brokerPartners,
      total: brokerProducts.length,
    });

  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brokers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { action } = body;

    if (action === 'generate-affiliate-link') {
      const { productId, userId, source } = body;

      // Get the product and partner
      const product = await Product.findById(productId).populate('partnerId');
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Generate tracking ID
      const trackingId = `broker_${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create tracking URL (this would typically involve the partner's API)
      const baseUrl = product.applicationUrl;
      const trackingUrl = `${baseUrl}?ref=${trackingId}&source=${source}`;

      // Here you would typically:
      // 1. Store the tracking record in AffiliateClick model
      // 2. Call partner API to register the tracking
      // 3. Return the partner-specific tracking URL

      return NextResponse.json({
        trackingId,
        trackingUrl,
      });
    }

    if (action === 'track-application') {
      const { trackingId, ...applicationData } = body;

      // Here you would typically:
      // 1. Update the AffiliateClick record with application status
      // 2. Send tracking data to partner if required
      // 3. Update internal analytics

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in broker API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}