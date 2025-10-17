import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Article } from '@/models';

// GET /api/articles/categories - Get article categories with counts
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true';

    // Get categories with article counts
    const categoriesPipeline = [
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      { $sort: { count: -1 } }
    ];

    const categoriesResult = await Article.aggregate(categoriesPipeline);

    // Format the response
    const categories = categoriesResult.map(item => ({
      name: item._id,
      count: item.count,
      subcategories: includeSubcategories ? item.subcategories.sort() : undefined
    }));

    // Get subcategories with counts if requested
    let subcategoriesData = null;
    if (includeSubcategories) {
      const subcategoriesPipeline = [
        { $match: { isPublished: true } },
        {
          $group: {
            _id: {
              category: '$category',
              subcategory: '$subcategory'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.category',
            subcategories: {
              $push: {
                name: '$_id.subcategory',
                count: '$count'
              }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ];

      const subcategoriesResult = await Article.aggregate(subcategoriesPipeline);
      subcategoriesData = subcategoriesResult.reduce((acc, item) => {
        acc[item._id] = item.subcategories.sort((a: any, b: any) => b.count - a.count);
        return acc;
      }, {} as Record<string, any[]>);
    }

    return NextResponse.json({
      success: true,
      data: {
        categories,
        subcategories: subcategoriesData
      }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}