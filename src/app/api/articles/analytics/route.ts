import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Article } from '@/models';

// GET /api/articles/analytics - Get article analytics and statistics
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const category = searchParams.get('category');

    const periodDays = parseInt(period);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - periodDays);

    // Build base filter
    const baseFilter: any = { isPublished: true };
    if (category) {
      baseFilter.category = category;
    }

    // Get total articles count
    const totalArticles = await Article.countDocuments(baseFilter);

    // Get articles published in the period
    const recentArticles = await Article.countDocuments({
      ...baseFilter,
      publishedAt: { $gte: dateFrom }
    });

    // Get most viewed articles
    const mostViewedPipeline = [
      { $match: baseFilter },
      { $sort: { viewCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          title: 1,
          slug: 1,
          viewCount: 1,
          category: 1,
          subcategory: 1,
          publishedAt: 1
        }
      }
    ];
    const mostViewed = await Article.aggregate(mostViewedPipeline);

    // Get recently published articles
    const recentlyPublishedPipeline = [
      { $match: baseFilter },
      { $sort: { publishedAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          title: 1,
          slug: 1,
          viewCount: 1,
          category: 1,
          subcategory: 1,
          publishedAt: 1
        }
      }
    ];
    const recentlyPublished = await Article.aggregate(recentlyPublishedPipeline);

    // Get category distribution
    const categoryDistributionPipeline = [
      { $match: baseFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          avgViews: { $avg: '$viewCount' }
        }
      },
      { $sort: { count: -1 } }
    ];
    const categoryDistribution = await Article.aggregate(categoryDistributionPipeline);

    // Get popular tags
    const popularTagsPipeline = [
      { $match: baseFilter },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ];
    const popularTags = await Article.aggregate(popularTagsPipeline);

    // Get view statistics
    const viewStatsPipeline = [
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
          avgViews: { $avg: '$viewCount' },
          maxViews: { $max: '$viewCount' },
          minViews: { $min: '$viewCount' }
        }
      }
    ];
    const viewStatsResult = await Article.aggregate(viewStatsPipeline);
    const viewStats = viewStatsResult[0] || {
      totalViews: 0,
      avgViews: 0,
      maxViews: 0,
      minViews: 0
    };

    // Get publishing trend (articles per day for the period)
    const publishingTrendPipeline = [
      {
        $match: {
          ...baseFilter,
          publishedAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$publishedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ];
    const publishingTrend = await Article.aggregate(publishingTrendPipeline);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalArticles,
          recentArticles,
          period: periodDays,
          ...viewStats
        },
        mostViewed,
        recentlyPublished,
        categoryDistribution: categoryDistribution.map(item => ({
          category: item._id,
          count: item.count,
          totalViews: item.totalViews,
          avgViews: Math.round(item.avgViews * 100) / 100
        })),
        popularTags: popularTags.map(item => ({
          tag: item._id,
          count: item.count,
          totalViews: item.totalViews
        })),
        publishingTrend: publishingTrend.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}