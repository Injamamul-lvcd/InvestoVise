import { NextRequest, NextResponse } from 'next/server';
import newsService from '../../../lib/services/newsService';
import { NewsSearchParams } from '../../../types/news';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: NewsSearchParams = {
      query: searchParams.get('query') || undefined,
      filters: {
        category: searchParams.get('category') as any || undefined,
        source: searchParams.get('source') || undefined,
        priority: searchParams.get('priority') as any || undefined,
        isBreaking: searchParams.get('isBreaking') === 'true' || undefined
      },
      sortBy: (searchParams.get('sortBy') as any) || 'publishedAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const response = await newsService.getNews(params);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch news' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const params: NewsSearchParams = await request.json();
    const response = await newsService.getNews(params);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch news' 
      },
      { status: 500 }
    );
  }
}