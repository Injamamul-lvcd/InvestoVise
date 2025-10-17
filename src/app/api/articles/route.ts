import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Article } from '@/models';
import { IArticle } from '@/types/database';

// GET /api/articles - Get articles with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    const published = searchParams.get('published') !== 'false';

    // Build filter object
    const filter: any = {};
    
    if (published) {
      filter.isPublished = true;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (subcategory) {
      filter.subcategory = subcategory;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Build query
    let query = Article.find(filter);

    // Add text search if provided
    if (search) {
      query = Article.find({
        ...filter,
        $text: { $search: search }
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination and sorting
    const articles = await query
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedArticles', 'title slug excerpt featuredImage')
      .lean();

    // Get total count for pagination
    const total = await Article.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch articles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'slug', 'content', 'excerpt', 'category', 'subcategory', 'author', 'seoMetadata'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Check if slug already exists
    const existingArticle = await Article.findOne({ slug: body.slug });
    if (existingArticle) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article with this slug already exists' 
        },
        { status: 409 }
      );
    }

    // Create new article
    const article = new Article(body);
    await article.save();

    return NextResponse.json({
      success: true,
      data: article,
      message: 'Article created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating article:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}