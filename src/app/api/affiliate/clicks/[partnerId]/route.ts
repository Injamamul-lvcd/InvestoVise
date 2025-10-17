import { NextRequest, NextResponse } from 'next/server';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { authenticateAdmin } from '@/lib/middleware/auth';

// GET /api/affiliate/clicks/[partnerId] - Get clicks for specific partner
export async function GET(
  request: NextRequest,
  { params }: { params: { partnerId: string } }
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

    const { partnerId } = params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const converted = searchParams.get('converted');

    // Parse parameters
    const options = {
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      converted: converted !== null ? converted === 'true' : undefined
    };

    // Get partner clicks
    const result = await AffiliateTrackingService.getPartnerClicks(partnerId, options);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error fetching partner clicks:', error);
    
    if (error.message.includes('Invalid partner ID')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch partner clicks' },
      { status: 500 }
    );
  }
}