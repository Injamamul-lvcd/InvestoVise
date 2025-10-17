import { NextRequest, NextResponse } from 'next/server';
import newsService from '../../../../lib/services/newsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const breakingNews = await newsService.getBreakingNews(limit);
    
    return NextResponse.json(breakingNews);
  } catch (error) {
    console.error('Breaking news API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch breaking news' 
      },
      { status: 500 }
    );
  }
}