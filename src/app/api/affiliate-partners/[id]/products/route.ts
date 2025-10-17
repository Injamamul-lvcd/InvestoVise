import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AffiliatePartner, Product } from '@/models';
import { validateRequest } from '@/lib/middleware/validation';
import { authenticateAdmin } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

// GET /api/affiliate-partners/[id]/products - Get products for specific partner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    // Build filter
    const filter: any = { partnerId: id };
    if (isActive !== null) filter.isActive = isActive === 'true';
    if (type) filter.type = type;

    const products = await Product.find(filter)
      .populate('partnerId', 'name type logoUrl')
      .sort({ priority: -1, name: 1 });

    return NextResponse.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching partner products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner products' },
      { status: 500 }
    );
  }
}

// POST /api/affiliate-partners/[id]/products - Add product to partner
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    // Check if partner exists
    const partner = await AffiliatePartner.findById(id);
    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Affiliate partner not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body, {
      name: { required: true, type: 'string', maxLength: 150 },
      type: { required: true, type: 'string', enum: ['personal_loan', 'home_loan', 'car_loan', 'business_loan', 'credit_card', 'broker_account'] },
      features: { required: true, type: 'array', minLength: 1 },
      eligibility: { required: true, type: 'array', minLength: 1 },
      applicationUrl: { required: true, type: 'string', pattern: /^https?:\/\/.+/ },
      description: { required: true, type: 'string', maxLength: 1000 },
      termsAndConditions: { required: true, type: 'string', maxLength: 5000 },
      processingTime: { required: true, type: 'string', maxLength: 100 }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Create new product
    const product = new Product({
      ...body,
      partnerId: id
    });
    
    await product.save();

    // Add product to partner's products array
    await partner.addProduct(product._id.toString());

    // Populate the product with partner info
    await product.populate('partnerId', 'name type logoUrl');

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product added successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding product:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add product' },
      { status: 500 }
    );
  }
}