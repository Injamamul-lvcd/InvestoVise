import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../lib/services/marketDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required'
        },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters long'
        },
        { status: 400 }
      );
    }

    const results = await marketDataService.searchStocks(query);
    
    return NextResponse.json({
      success: true,
      results,
      query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search stocks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}