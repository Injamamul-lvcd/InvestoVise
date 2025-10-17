import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const indices = await marketDataService.getLiveIndices();
    
    return NextResponse.json({
      success: true,
      indices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market data API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clear cache and fetch fresh data
    await marketDataService.clearCache();
    const indices = await marketDataService.getLiveIndices();
    
    return NextResponse.json({
      success: true,
      indices,
      timestamp: new Date().toISOString(),
      message: 'Cache cleared and data refreshed'
    });
  } catch (error) {
    console.error('Market data refresh error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh market data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}