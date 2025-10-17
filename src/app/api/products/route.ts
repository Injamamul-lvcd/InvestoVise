import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Product } from '@/models';

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const partnerId = searchParams.get('partnerId');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'priority';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Filtering parameters
    const minInterestRate = searchParams.get('minInterestRate');
    const maxInterestRate = searchParams.get('maxInterestRate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (partnerId) filter.partnerId = partnerId;
    if (isActive !== null) filter.isActive = isActive === 'true';
    
    // Interest rate filtering
    if (minInterestRate || maxInterestRate) {
      filter.interestRate = {};
      if (minInterestRate) filter.interestRate.$gte = parseFloat(minInterestRate);
      if (maxInterestRate) filter.interestRate.$lte = parseFloat(maxInterestRate);
    }
    
    // Amount filtering
    if (minAmount) filter.minAmount = { $lte: parseFloat(minAmount) };
    if (maxAmount) filter.maxAmount = { $gte: parseFloat(maxAmount) };

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Add secondary sort by name for consistency
    if (sortBy !== 'name') {
      sort.name = 1;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await Product.find(filter)
      .populate('partnerId', 'name type logoUrl website')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}