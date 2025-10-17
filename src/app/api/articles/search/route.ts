import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Article } from '@/models';

// GET /api/articles/search - Advanced article search with filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const tags = searchParams.get('tags');
    const author = searchParams.get('author');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build search filter
    const filter: any = { isPublished: true };

    // Add text search
    if (query.trim()) {
      filter.$text = { $search: query };
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add subcategory filter
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // Add tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    // Add author filter
    if (author) {
      filter['author.name'] = { $regex: author, $options: 'i' };
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      filter.publishedAt = {};
      if (dateFrom) {
        filter.publishedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.publishedAt.$lte = new Date(dateTo);
      }
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case 'date':
        sortCriteria = { publishedAt: -1 };
        break;
      case 'views':
        sortCriteria = { viewCount: -1 };
        break;
      case 'title':
        sortCriteria = { title: 1 };
        break;
      case 'relevance':
      default:
        if (query.trim()) {
          sortCriteria = { score: { $meta: 'textScore' } };
        } else {
          sortCriteria = { publishedAt: -1 };
        }
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build aggregation pipeline for better search results
    const pipeline: any[] = [
      { $match: filter }
    ];

    // Add text score for relevance sorting
    if (query.trim() && sortBy === 'relevance') {
      pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
    }

    // Add sorting
    pipeline.push({ $sort: sortCriteria });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Add population of related articles
    pipeline.push({
      $lookup: {
        from: 'articles',
        localField: 'relatedArticles',
        foreignField: '_id',
        as: 'relatedArticles',
        pipeline: [
          { $match: { isPublished: true } },
          { $project: { title: 1, slug: 1, excerpt: 1, featuredImage: 1, category: 1, subcategory: 1 } }
        ]
      }
    });

    // Execute search
    const articles = await Article.aggregate(pipeline);

    // Get total count for pagination
    const totalPipeline = [
      { $match: filter },
      { $count: 'total' }
    ];
    const totalResult = await Article.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get search suggestions if no results found
    let suggestions: string[] = [];
    if (articles.length === 0 && query.trim()) {
      // Get popular tags and categories for suggestions
      const suggestionsPipeline = [
        { $match: { isPublished: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { _id: 1 } }
      ];
      const tagSuggestions = await Article.aggregate(suggestionsPipeline);
      suggestions = tagSuggestions.map(item => item._id);
    }

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
        },
        searchInfo: {
          query,
          resultsCount: articles.length,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        }
      }
    });

  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search articles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}