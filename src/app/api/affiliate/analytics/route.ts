import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { authenticateAdmin } from '@/lib/middleware/auth';

// GET /api/affiliate/analytics - Get affiliate analytics
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    let analytics;

    if (partnerId) {
      // Get analytics for specific partner
      analytics = await AffiliateTrackingService.getPartnerAnalytics(
        partnerId,
        parsedStartDate,
        parsedEndDate
      );
    } else {
      // Get overall analytics
      analytics = await AffiliateTrackingService.getOverallAnalytics(
        parsedStartDate,
        parsedEndDate
      );
    }

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('Error fetching affiliate analytics:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}