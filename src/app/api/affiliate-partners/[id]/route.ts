import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AffiliatePartner } from '@/models';
import { validateRequest } from '@/lib/middleware/validation';
import { authenticateAdmin } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

// GET /api/affiliate-partners/[id] - Get specific affiliate partner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    const partner = await AffiliatePartner.findById(id).populate('products');
    
    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Affiliate partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: partner
    });

  } catch (error) {
    console.error('Error fetching affiliate partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch affiliate partner' },
      { status: 500 }
    );
  }
}

// PUT /api/affiliate-partners/[id] - Update affiliate partner
export async function PUT(
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

    const body = await request.json();
    
    // Validate fields (all optional for update)
    const validation = validateRequest(body, {
      name: { type: 'string', maxLength: 100 },
      type: { type: 'string', enum: ['loan', 'credit_card', 'broker'] },
      logoUrl: { type: 'string', pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i },
      description: { type: 'string', maxLength: 1000 },
      website: { type: 'string', pattern: /^https?:\/\/.+/ },
      contactEmail: { type: 'string', pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/ },
      commissionStructure: { type: 'object' },
      trackingConfig: { type: 'object' },
      isActive: { type: 'boolean' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const partner = await AffiliatePartner.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('products');

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Affiliate partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'Affiliate partner updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating affiliate partner:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update affiliate partner' },
      { status: 500 }
    );
  }
}

// DELETE /api/affiliate-partners/[id] - Delete affiliate partner
export async function DELETE(
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

    const partner = await AffiliatePartner.findByIdAndDelete(id);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Affiliate partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate partner deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting affiliate partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete affiliate partner' },
      { status: 500 }
    );
  }
}