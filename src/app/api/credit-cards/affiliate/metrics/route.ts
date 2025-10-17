import { NextRequest, NextResponse } from 'next/server';
import creditCardAffiliateService from '@/lib/services/creditCardAffiliateService';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    const metrics = await creditCardAffiliateService.getAffiliateMetrics(
      partnerId || undefined,
      dateRange
    );

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error getting affiliate metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get affiliate metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}