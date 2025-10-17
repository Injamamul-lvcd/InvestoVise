import { connectToDatabase } from '@/lib/database';
import AffiliateClick from '@/models/AffiliateClick';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PerformanceMetrics {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalCommission: number;
  averageCommission: number;
  clickThroughRate: number;
  revenue: number;
}

export interface PartnerPerformance {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  metrics: PerformanceMetrics;
  trends: {
    clicksGrowth: number;
    conversionsGrowth: number;
    revenueGrowth: number;
  };
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  productType: string;
  partnerId: string;
  partnerName: string;
  metrics: PerformanceMetrics;
}

export interface DailyMetrics {
  date: string;
  clicks: number;
  conversions: number;
  commission: number;
  conversionRate: number;
}

export interface TopPerformers {
  partners: PartnerPerformance[];
  products: ProductPerformance[];
}

/**
 * Get overall affiliate performance metrics
 */
export async function getOverallMetrics(dateRange: DateRange): Promise<PerformanceMetrics> {
  try {
    await connectToDatabase();

    const pipeline = [
      {
        $match: {
          clickedAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          totalConversions: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] },
          },
          totalCommission: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, '$commissionAmount', 0] },
          },
          conversions: {
            $push: {
              $cond: [{ $eq: ['$converted', true] }, '$commissionAmount', null],
            },
          },
        },
      },
      {
        $project: {
          totalClicks: 1,
          totalConversions: 1,
          totalCommission: { $ifNull: ['$totalCommission', 0] },
          conversionRate: {
            $cond: [
              { $gt: ['$totalClicks', 0] },
              { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] },
              0,
            ],
          },
          averageCommission: {
            $cond: [
              { $gt: ['$totalConversions', 0] },
              { $divide: ['$totalCommission', '$totalConversions'] },
              0,
            ],
          },
        },
      },
    ];

    const [result] = await AffiliateClick.aggregate(pipeline);

    return {
      totalClicks: result?.totalClicks || 0,
      totalConversions: result?.totalConversions || 0,
      conversionRate: result?.conversionRate || 0,
      totalCommission: result?.totalCommission || 0,
      averageCommission: result?.averageCommission || 0,
      clickThroughRate: result?.conversionRate || 0, // Same as conversion rate in this context
      revenue: result?.totalCommission || 0,
    };
  } catch (error) {
    console.error('Error getting overall metrics:', error);
    throw new Error('Failed to retrieve overall metrics');
  }
}

/**
 * Get partner performance metrics
 */
export async function getPartnerPerformance(
  dateRange: DateRange,
  limit: number = 20
): Promise<PartnerPerformance[]> {
  try {
    await connectToDatabase();

    const pipeline = [
      {
        $match: {
          clickedAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: '$partnerId',
          totalClicks: { $sum: 1 },
          totalConversions: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] },
          },
          totalCommission: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, '$commissionAmount', 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'affiliatepartners',
          localField: '_id',
          foreignField: '_id',
          as: 'partner',
        },
      },
      {
        $unwind: '$partner',
      },
      {
        $project: {
          partnerId: { $toString: '$_id' },
          partnerName: '$partner.name',
          partnerType: '$partner.type',
          totalClicks: 1,
          totalConversions: 1,
          totalCommission: { $ifNull: ['$totalCommission', 0] },
          conversionRate: {
            $cond: [
              { $gt: ['$totalClicks', 0] },
              { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] },
              0,
            ],
          },
          averageCommission: {
            $cond: [
              { $gt: ['$totalConversions', 0] },
              { $divide: ['$totalCommission', '$totalConversions'] },
              0,
            ],
          },
        },
      },
      {
        $sort: { totalCommission: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const results = await AffiliateClick.aggregate(pipeline);

    // Get previous period data for trends (simplified - using same period length before current period)
    const periodLength = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const previousPeriodStart = new Date(dateRange.startDate.getTime() - periodLength);
    const previousPeriodEnd = new Date(dateRange.endDate.getTime() - periodLength);

    const previousPipeline = [
      {
        $match: {
          clickedAt: {
            $gte: previousPeriodStart,
            $lte: previousPeriodEnd,
          },
        },
      },
      {
        $group: {
          _id: '$partnerId',
          prevClicks: { $sum: 1 },
          prevConversions: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] },
          },
          prevCommission: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, '$commissionAmount', 0] },
          },
        },
      },
    ];

    const previousResults = await AffiliateClick.aggregate(previousPipeline);
    const previousMap = new Map(
      previousResults.map(p => [p._id.toString(), p])
    );

    return results.map(result => {
      const previous = previousMap.get(result.partnerId) || {
        prevClicks: 0,
        prevConversions: 0,
        prevCommission: 0,
      };

      const clicksGrowth = previous.prevClicks > 0 
        ? ((result.totalClicks - previous.prevClicks) / previous.prevClicks) * 100 
        : result.totalClicks > 0 ? 100 : 0;

      const conversionsGrowth = previous.prevConversions > 0 
        ? ((result.totalConversions - previous.prevConversions) / previous.prevConversions) * 100 
        : result.totalConversions > 0 ? 100 : 0;

      const revenueGrowth = previous.prevCommission > 0 
        ? ((result.totalCommission - previous.prevCommission) / previous.prevCommission) * 100 
        : result.totalCommission > 0 ? 100 : 0;

      return {
        partnerId: result.partnerId,
        partnerName: result.partnerName,
        partnerType: result.partnerType,
        metrics: {
          totalClicks: result.totalClicks,
          totalConversions: result.totalConversions,
          conversionRate: result.conversionRate,
          totalCommission: result.totalCommission,
          averageCommission: result.averageCommission,
          clickThroughRate: result.conversionRate,
          revenue: result.totalCommission,
        },
        trends: {
          clicksGrowth: Math.round(clicksGrowth * 100) / 100,
          conversionsGrowth: Math.round(conversionsGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        },
      };
    });
  } catch (error) {
    console.error('Error getting partner performance:', error);
    throw new Error('Failed to retrieve partner performance');
  }
}

/**
 * Get product performance metrics
 */
export async function getProductPerformance(
  dateRange: DateRange,
  partnerId?: string,
  limit: number = 20
): Promise<ProductPerformance[]> {
  try {
    await connectToDatabase();

    const matchStage: any = {
      clickedAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
    };

    if (partnerId) {
      matchStage.partnerId = new mongoose.Types.ObjectId(partnerId);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            productId: '$productId',
            partnerId: '$partnerId',
          },
          totalClicks: { $sum: 1 },
          totalConversions: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] },
          },
          totalCommission: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, '$commissionAmount', 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'affiliatepartners',
          localField: '_id.partnerId',
          foreignField: '_id',
          as: 'partner',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $unwind: '$partner',
      },
      {
        $project: {
          productId: { $toString: '$_id.productId' },
          productName: '$product.name',
          productType: '$product.type',
          partnerId: { $toString: '$_id.partnerId' },
          partnerName: '$partner.name',
          totalClicks: 1,
          totalConversions: 1,
          totalCommission: { $ifNull: ['$totalCommission', 0] },
          conversionRate: {
            $cond: [
              { $gt: ['$totalClicks', 0] },
              { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] },
              0,
            ],
          },
          averageCommission: {
            $cond: [
              { $gt: ['$totalConversions', 0] },
              { $divide: ['$totalCommission', '$totalConversions'] },
              0,
            ],
          },
        },
      },
      {
        $sort: { totalCommission: -1 },
      },
      {
        $limit: limit,
      },
    ];

    const results = await AffiliateClick.aggregate(pipeline);

    return results.map(result => ({
      productId: result.productId,
      productName: result.productName,
      productType: result.productType,
      partnerId: result.partnerId,
      partnerName: result.partnerName,
      metrics: {
        totalClicks: result.totalClicks,
        totalConversions: result.totalConversions,
        conversionRate: result.conversionRate,
        totalCommission: result.totalCommission,
        averageCommission: result.averageCommission,
        clickThroughRate: result.conversionRate,
        revenue: result.totalCommission,
      },
    }));
  } catch (error) {
    console.error('Error getting product performance:', error);
    throw new Error('Failed to retrieve product performance');
  }
}

/**
 * Get daily metrics for charts
 */
export async function getDailyMetrics(dateRange: DateRange): Promise<DailyMetrics[]> {
  try {
    await connectToDatabase();

    const pipeline = [
      {
        $match: {
          clickedAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$clickedAt',
            },
          },
          clicks: { $sum: 1 },
          conversions: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] },
          },
          commission: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, '$commissionAmount', 0] },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          clicks: 1,
          conversions: 1,
          commission: { $ifNull: ['$commission', 0] },
          conversionRate: {
            $cond: [
              { $gt: ['$clicks', 0] },
              { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $sort: { date: 1 },
      },
    ];

    const results = await AffiliateClick.aggregate(pipeline);

    // Fill in missing dates with zero values
    const filledResults: DailyMetrics[] = [];
    const currentDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const resultMap = new Map(results.map(r => [r.date, r]));

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existing = resultMap.get(dateStr);

      filledResults.push({
        date: dateStr,
        clicks: existing?.clicks || 0,
        conversions: existing?.conversions || 0,
        commission: existing?.commission || 0,
        conversionRate: existing?.conversionRate || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledResults;
  } catch (error) {
    console.error('Error getting daily metrics:', error);
    throw new Error('Failed to retrieve daily metrics');
  }
}

/**
 * Get top performers
 */
export async function getTopPerformers(
  dateRange: DateRange,
  limit: number = 5
): Promise<TopPerformers> {
  try {
    const [partners, products] = await Promise.all([
      getPartnerPerformance(dateRange, limit),
      getProductPerformance(dateRange, undefined, limit),
    ]);

    return {
      partners,
      products,
    };
  } catch (error) {
    console.error('Error getting top performers:', error);
    throw new Error('Failed to retrieve top performers');
  }
}

/**
 * Export performance data to CSV format
 */
export async function exportPerformanceData(
  dateRange: DateRange,
  type: 'partners' | 'products' | 'daily'
): Promise<string> {
  try {
    let csvData = '';
    let headers: string[] = [];
    let rows: any[] = [];

    switch (type) {
      case 'partners':
        const partners = await getPartnerPerformance(dateRange, 100);
        headers = [
          'Partner ID',
          'Partner Name',
          'Partner Type',
          'Total Clicks',
          'Total Conversions',
          'Conversion Rate (%)',
          'Total Commission (INR)',
          'Average Commission (INR)',
          'Clicks Growth (%)',
          'Conversions Growth (%)',
          'Revenue Growth (%)',
        ];
        rows = partners.map(p => [
          p.partnerId,
          p.partnerName,
          p.partnerType,
          p.metrics.totalClicks,
          p.metrics.totalConversions,
          p.metrics.conversionRate.toFixed(2),
          p.metrics.totalCommission.toFixed(2),
          p.metrics.averageCommission.toFixed(2),
          p.trends.clicksGrowth.toFixed(2),
          p.trends.conversionsGrowth.toFixed(2),
          p.trends.revenueGrowth.toFixed(2),
        ]);
        break;

      case 'products':
        const products = await getProductPerformance(dateRange, undefined, 100);
        headers = [
          'Product ID',
          'Product Name',
          'Product Type',
          'Partner ID',
          'Partner Name',
          'Total Clicks',
          'Total Conversions',
          'Conversion Rate (%)',
          'Total Commission (INR)',
          'Average Commission (INR)',
        ];
        rows = products.map(p => [
          p.productId,
          p.productName,
          p.productType,
          p.partnerId,
          p.partnerName,
          p.metrics.totalClicks,
          p.metrics.totalConversions,
          p.metrics.conversionRate.toFixed(2),
          p.metrics.totalCommission.toFixed(2),
          p.metrics.averageCommission.toFixed(2),
        ]);
        break;

      case 'daily':
        const daily = await getDailyMetrics(dateRange);
        headers = [
          'Date',
          'Total Clicks',
          'Total Conversions',
          'Conversion Rate (%)',
          'Total Commission (INR)',
        ];
        rows = daily.map(d => [
          d.date,
          d.clicks,
          d.conversions,
          d.conversionRate.toFixed(2),
          d.commission.toFixed(2),
        ]);
        break;
    }

    // Generate CSV
    csvData = headers.join(',') + '\n';
    csvData += rows.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');

    return csvData;
  } catch (error) {
    console.error('Error exporting performance data:', error);
    throw new Error('Failed to export performance data');
  }
}