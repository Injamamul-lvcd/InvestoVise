import { NextRequest, NextResponse } from 'next/server';
import newsService from '../../../../../lib/services/newsService';
import { NewsCategory } from '../../../../../types/news';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = params.category as NewsCategory;

    const news = await newsService.getNewsByCategory(category, limit);
    
    return NextResponse.json(news);
  } catch (error) {
    console.error('Category news API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch category news' 
      },
      { status: 500 }
    );
  }
}