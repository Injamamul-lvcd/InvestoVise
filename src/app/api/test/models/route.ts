import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Article, User, AffiliatePartner, Product, AffiliateClick } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Test model counts
    const [
      articleCount,
      userCount,
      partnerCount,
      productCount,
      clickCount
    ] = await Promise.all([
      Article.countDocuments(),
      User.countDocuments(),
      AffiliatePartner.countDocuments(),
      Product.countDocuments(),
      AffiliateClick.countDocuments()
    ]);
    
    // Test a simple query
    const sampleArticle = await Article.findOne().select('title slug category');
    const samplePartner = await AffiliatePartner.findOne().select('name type');
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      models: {
        Article: {
          count: articleCount,
          sample: sampleArticle
        },
        User: {
          count: userCount
        },
        AffiliatePartner: {
          count: partnerCount,
          sample: samplePartner
        },
        Product: {
          count: productCount
        },
        AffiliateClick: {
          count: clickCount
        }
      }
    });
  } catch (error) {
    console.error('Model test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}