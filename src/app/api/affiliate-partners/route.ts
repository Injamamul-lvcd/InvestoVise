import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AffiliatePartner } from '@/models';
import { validateRequest } from '@/lib/middleware/validation';
import { authenticateAdmin } from '@/lib/middleware/auth';

// GET /api/affiliate-partners - Get all affiliate partners with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter object
    const filter: any = {};
    if (type) filter.type = type;
    if (isActive !== null) filter.isActive = isActive === 'true';

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get partners with pagination
    const partners = await AffiliatePartner.find(filter)
      .populate('products')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await AffiliatePartner.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
        partners,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching affiliate partners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch affiliate partners' },
      { status: 500 }
    );
  }
}

// POST /api/affiliate-partners - Create new affiliate partner
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body, {
      name: { required: true, type: 'string', maxLength: 100 },
      type: { required: true, type: 'string', enum: ['loan', 'credit_card', 'broker'] },
      logoUrl: { required: true, type: 'string', pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i },
      description: { required: true, type: 'string', maxLength: 1000 },
      website: { required: true, type: 'string', pattern: /^https?:\/\/.+/ },
      contactEmail: { required: true, type: 'string', pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/ },
      commissionStructure: { required: true, type: 'object' },
      trackingConfig: { required: true, type: 'object' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Create new affiliate partner
    const partner = new AffiliatePartner(body);
    await partner.save();

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Affiliate partner created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating affiliate partner:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Affiliate partner with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create affiliate partner' },
      { status: 500 }
    );
  }
}