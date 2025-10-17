import { NextRequest, NextResponse } from 'next/server';
import creditCardAffiliateService from '@/lib/services/creditCardAffiliateService';
import { connectDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    await creditCardAffiliateService.syncPartnerProducts(partnerId);

    return NextResponse.json({
      success: true,
      message: 'Partner products synced successfully'
    });

  } catch (error) {
    console.error('Error syncing partner products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync partner products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}