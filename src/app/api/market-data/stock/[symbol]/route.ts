import { NextRequest, NextResponse } from 'next/server';
import marketDataService from '../../../../../lib/services/marketDataService';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock symbol is required'
        },
        { status: 400 }
      );
    }

    const stockData = await marketDataService.getStockPrice(symbol);
    
    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock data API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stock data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}