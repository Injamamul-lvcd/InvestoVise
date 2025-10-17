import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/connection';
import AffiliateClick from '@/models/AffiliateClick';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('type') || 'summary';

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Build base query
    const baseQuery: any = {};
    if (Object.keys(dateFilter).length > 0) {
      baseQuery.clickedAt = dateFilter;
    }
    if (partnerId) {
      baseQuery.partnerId = partnerId;
    }

    // Add broker-specific filter
    const brokerPartners = await AffiliatePartner.find({ type: 'broker', isActive: true });
    const brokerPartnerIds = brokerPartners.map(p => p._id);
    baseQuery.partnerId = partnerId ? partnerId : { $in: brokerPartnerIds };

    switch (reportType) {
      case 'summary':
        return await getBrokerSummaryAnalytics(baseQuery);
      
      case 'performance':
        return await getBrokerPerformanceAnalytics(baseQuery);
      
      case 'conversions':
        return await getBrokerConversionAnalytics(baseQuery);
      
      case 'commissions':
        return await getBrokerCommissionAnalytics(baseQuery);
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error generating broker analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

async function getBrokerSummaryAnalytics(baseQuery: any) {
  const [
    totalClicks,
    totalConversions,
    totalCommissions,
    partnerStats
  ] = await Promise.all([
    // Total clicks
    AffiliateClick.countDocuments(baseQuery),
    
    // Total conversions
    AffiliateClick.countDocuments({ ...baseQuery, converted: true }),
    
    // Total commission amount
    AffiliateClick.aggregate([
      { $match: { ...baseQuery, converted: true } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
    ]),
    
    // Partner-wise statistics
    AffiliateClick.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$partnerId',
          clicks: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          commissions: { $sum: { $cond: ['$converted', '$commissionAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'affiliatepartners',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      { $unwind: '$partner' },
      {
        $project: {
          partnerId: '$_id',
          partnerName: '$partner.name',
          partnerLogo: '$partner.logoUrl',
          clicks: 1,
          conversions: 1,
          commissions: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$clicks', 0] },
              { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { clicks: -1 } }
    ])
  ]);

  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const totalCommissionAmount = totalCommissions[0]?.total || 0;

  return NextResponse.json({
    summary: {
      totalClicks,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalCommissions: totalCommissionAmount,
      averageCommissionPerConversion: totalConversions > 0 ? totalCommissionAmount / totalConversions : 0
    },
    partnerStats,
    reportType: 'summary',
    generatedAt: new Date().toISOString()
  });
}

async function getBrokerPerformanceAnalytics(baseQuery: any) {
  const [
    clicksByDay,
    conversionsByDay,
    topProducts,
    deviceStats
  ] = await Promise.all([
    // Daily clicks trend
    AffiliateClick.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$clickedAt' },
            month: { $month: '$clickedAt' },
            day: { $dayOfMonth: '$clickedAt' }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    
    // Daily conversions trend
    AffiliateClick.aggregate([
      { $match: { ...baseQuery, converted: true } },
      {
        $group: {
          _id: {
            year: { $year: '$conversionDate' },
            month: { $month: '$conversionDate' },
            day: { $dayOfMonth: '$conversionDate' }
          },
          conversions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    
    // Top performing products
    AffiliateClick.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$productId',
          clicks: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          commissions: { $sum: { $cond: ['$converted', '$commissionAmount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          clicks: 1,
          conversions: 1,
          commissions: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$clicks', 0] },
              { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]),
    
    // Device/platform statistics
    AffiliateClick.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            isMobile: {
              $cond: [
                { $regexMatch: { input: '$userAgent', regex: /Mobile|Android|iPhone/i } },
                'Mobile',
                'Desktop'
              ]
            }
          },
          clicks: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } }
        }
      }
    ])
  ]);

  return NextResponse.json({
    performance: {
      clicksTrend: clicksByDay,
      conversionsTrend: conversionsByDay,
      topProducts,
      deviceStats
    },
    reportType: 'performance',
    generatedAt: new Date().toISOString()
  });
}

async function getBrokerConversionAnalytics(baseQuery: any) {
  const conversionFunnel = await AffiliateClick.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        redirected: { $sum: { $cond: [{ $ne: ['$redirectedAt', null] }, 1, 0] } },
        applicationInitiated: { $sum: { $cond: ['$applicationInitiated', 1, 0] } },
        documentsSubmitted: { $sum: { $cond: ['$documentsSubmitted', 1, 0] } },
        underReview: { $sum: { $cond: ['$underReview', 1, 0] } },
        approved: { $sum: { $cond: ['$converted', 1, 0] } },
        rejected: { $sum: { $cond: ['$rejected', 1, 0] } },
        firstTransaction: { $sum: { $cond: ['$firstTransaction', 1, 0] } }
      }
    }
  ]);

  const conversionReasons = await AffiliateClick.aggregate([
    { $match: { ...baseQuery, converted: true } },
    {
      $group: {
        _id: '$conversionData.accountTypes',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return NextResponse.json({
    conversions: {
      funnel: conversionFunnel[0] || {},
      conversionReasons,
      conversionTimeAnalysis: await getConversionTimeAnalysis(baseQuery)
    },
    reportType: 'conversions',
    generatedAt: new Date().toISOString()
  });
}

async function getBrokerCommissionAnalytics(baseQuery: any) {
  const [
    commissionByPartner,
    commissionByMonth,
    commissionByProduct
  ] = await Promise.all([
    // Commission by partner
    AffiliateClick.aggregate([
      { $match: { ...baseQuery, converted: true } },
      {
        $group: {
          _id: '$partnerId',
          totalCommission: { $sum: '$commissionAmount' },
          conversions: { $sum: 1 },
          averageCommission: { $avg: '$commissionAmount' }
        }
      },
      {
        $lookup: {
          from: 'affiliatepartners',
          localField: '_id',
          foreignField: '_id',
          as: 'partner'
        }
      },
      { $unwind: '$partner' },
      {
        $project: {
          partnerId: '$_id',
          partnerName: '$partner.name',
          totalCommission: 1,
          conversions: 1,
          averageCommission: 1
        }
      },
      { $sort: { totalCommission: -1 } }
    ]),
    
    // Commission by month
    AffiliateClick.aggregate([
      { $match: { ...baseQuery, converted: true } },
      {
        $group: {
          _id: {
            year: { $year: '$conversionDate' },
            month: { $month: '$conversionDate' }
          },
          totalCommission: { $sum: '$commissionAmount' },
          conversions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    
    // Commission by product
    AffiliateClick.aggregate([
      { $match: { ...baseQuery, converted: true } },
      {
        $group: {
          _id: '$productId',
          totalCommission: { $sum: '$commissionAmount' },
          conversions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalCommission: 1,
          conversions: 1
        }
      },
      { $sort: { totalCommission: -1 } }
    ])
  ]);

  return NextResponse.json({
    commissions: {
      byPartner: commissionByPartner,
      byMonth: commissionByMonth,
      byProduct: commissionByProduct
    },
    reportType: 'commissions',
    generatedAt: new Date().toISOString()
  });
}

async function getConversionTimeAnalysis(baseQuery: any) {
  return await AffiliateClick.aggregate([
    { $match: { ...baseQuery, converted: true } },
    {
      $project: {
        timeToConversion: {
          $divide: [
            { $subtract: ['$conversionDate', '$clickedAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        averageTimeToConversion: { $avg: '$timeToConversion' },
        minTimeToConversion: { $min: '$timeToConversion' },
        maxTimeToConversion: { $max: '$timeToConversion' }
      }
    }
  ]);
}