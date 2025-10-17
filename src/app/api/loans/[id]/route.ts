import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Product, AffiliatePartner } from '@/models';
import mongoose from 'mongoose';

// GET /api/loans/[id] - Get specific loan product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
      type: { $in: ['personal_loan', 'home_loan', 'car_loan', 'business_loan'] }
    }).populate('partnerId');

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Loan product not found' },
        { status: 404 }
      );
    }

    const partner = await AffiliatePartner.findById(product.partnerId);

    return NextResponse.json({
      success: true,
      data: {
        product,
        partner
      },
      message: 'Loan product retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching loan product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan product' },
      { status: 500 }
    );
  }
}