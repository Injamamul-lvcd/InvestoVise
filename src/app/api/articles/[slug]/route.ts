import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Article } from '@/models';

interface RouteParams {
  params: {
    slug: string;
  };
}

// GET /api/articles/[slug] - Get single article by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const incrementView = searchParams.get('incrementView') === 'true';

    const article = await Article.findOne({ slug, isPublished: true })
      .populate('relatedArticles', 'title slug excerpt featuredImage category subcategory publishedAt')
      .lean();

    if (!article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article not found' 
        },
        { status: 404 }
      );
    }

    // Increment view count if requested
    if (incrementView) {
      await Article.findByIdAndUpdate(article._id, { $inc: { viewCount: 1 } });
    }

    return NextResponse.json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[slug] - Update article by slug
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { slug } = params;
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    delete body._id;
    delete body.createdAt;
    delete body.viewCount;

    // If slug is being changed, check if new slug exists
    if (body.slug && body.slug !== slug) {
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
    }

    const article = await Article.findOneAndUpdate(
      { slug },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('relatedArticles', 'title slug excerpt featuredImage');

    if (!article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
      message: 'Article updated successfully'
    });

  } catch (error) {
    console.error('Error updating article:', error);
    
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
        error: 'Failed to update article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[slug] - Delete article by slug
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { slug } = params;

    const article = await Article.findOneAndDelete({ slug });

    if (!article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Article not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete article',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}