import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Product, AffiliatePartner } from '@/models';
import { LoanFilters } from '@/types/loans';

// GET /api/loans - Get loan products with filtering
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: LoanFilters = {
      loanType: searchParams.get('loanType') as any || undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      minInterestRate: searchParams.get('minInterestRate') ? parseFloat(searchParams.get('minInterestRate')!) : undefined,
      maxInterestRate: searchParams.get('maxInterestRate') ? parseFloat(searchParams.get('maxInterestRate')!) : undefined,
      maxProcessingFee: searchParams.get('maxProcessingFee') ? parseFloat(searchParams.get('maxProcessingFee')!) : undefined,
      partnerId: searchParams.get('partnerId') || undefined,
      sortBy: searchParams.get('sortBy') as any || 'interestRate',
      sortOrder: searchParams.get('sortOrder') as any || 'asc'
    };

    // Build MongoDB filter
    const mongoFilter: any = { 
      isActive: true,
      type: { $in: ['personal_loan', 'home_loan', 'car_loan', 'business_loan'] }
    };

    // Apply loan type filter
    if (filters.loanType && filters.loanType !== 'all') {
      mongoFilter.type = filters.loanType;
    }

    // Apply interest rate filters
    if (filters.minInterestRate || filters.maxInterestRate) {
      mongoFilter.interestRate = {};
      if (filters.minInterestRate) mongoFilter.interestRate.$gte = filters.minInterestRate;
      if (filters.maxInterestRate) mongoFilter.interestRate.$lte = filters.maxInterestRate;
    }

    // Apply amount filters
    if (filters.minAmount) {
      mongoFilter.maxAmount = { $gte: filters.minAmount };
    }
    if (filters.maxAmount) {
      mongoFilter.minAmount = { $lte: filters.maxAmount };
    }

    // Apply partner filter
    if (filters.partnerId) {
      mongoFilter.partnerId = filters.partnerId;
    }

    // Apply processing fee filter
    if (filters.maxProcessingFee) {
      mongoFilter['fees.type'] = 'processing';
      mongoFilter['fees.amount'] = { $lte: filters.maxProcessingFee };
    }

    // Build sort object
    const sortObj: any = {};
    switch (filters.sortBy) {
      case 'interestRate':
        sortObj.interestRate = filters.sortOrder === 'desc' ? -1 : 1;
        break;
      case 'processingFee':
        // This is complex, we'll sort by priority for now
        sortObj.priority = -1;
        break;
      case 'maxAmount':
        sortObj.maxAmount = filters.sortOrder === 'desc' ? -1 : 1;
        break;
      case 'popularity':
        sortObj.priority = -1;
        break;
      default:
        sortObj.priority = -1;
    }
    
    // Secondary sort by name for consistency
    sortObj.name = 1;

    // Get loan products
    const products = await Product.find(mongoFilter)
      .populate('partnerId', 'name type logoUrl website description')
      .sort(sortObj)
      .limit(50); // Reasonable limit

    // Get unique partners for the filtered products
    const partnerIds = [...new Set(products.map(p => p.partnerId._id.toString()))];
    const partners = await AffiliatePartner.find({
      _id: { $in: partnerIds },
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        partners
      },
      message: 'Loan products retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching loan products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan products' },
      { status: 500 }
    );
  }
}