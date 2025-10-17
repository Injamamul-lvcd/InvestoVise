import { connectToDatabase } from '@/lib/database';
import AffiliateClick from '@/models/AffiliateClick';
import AffiliatePartner from '@/models/AffiliatePartner';
import mongoose from 'mongoose';

export interface CommissionSummary {
  partnerId: string;
  partnerName: string;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  conversions: number;
  averageCommission: number;
  lastPaymentDate?: Date;
}

export interface CommissionPayment {
  _id?: string;
  partnerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paymentMethod: string;
  paymentReference?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface CommissionDetails {
  clickId: string;
  partnerId: string;
  productId: string;
  userId?: string;
  commissionAmount: number;
  conversionDate: Date;
  paymentStatus: 'pending' | 'paid';
  paymentId?: string;
  trackingId: string;
}

/**
 * Get commission summary for all partners
 */
export async function getCommissionSummary(
  startDate?: Date,
  endDate?: Date
): Promise<CommissionSummary[]> {
  try {
    await connectToDatabase();

    const matchStage: any = {
      converted: true,
      commissionAmount: { $gt: 0 },
    };

    if (startDate && endDate) {
      matchStage.conversionDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$partnerId',
          totalCommission: { $sum: '$commissionAmount' },
          conversions: { $sum: 1 },
          averageCommission: { $avg: '$commissionAmount' },
          commissionDetails: {
            $push: {
              clickId: '$_id',
              commissionAmount: '$commissionAmount',
              conversionDate: '$conversionDate',
              paymentStatus: { $ifNull: ['$paymentStatus', 'pending'] },
            },
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
          totalCommission: { $round: ['$totalCommission', 2] },
          conversions: 1,
          averageCommission: { $round: ['$averageCommission', 2] },
          paidCommission: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: '$commissionDetails',
                    as: 'detail',
                    in: {
                      $cond: [
                        { $eq: ['$$detail.paymentStatus', 'paid'] },
                        '$$detail.commissionAmount',
                        0,
                      ],
                    },
                  },
                },
              },
              2,
            ],
          },
          pendingCommission: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: '$commissionDetails',
                    as: 'detail',
                    in: {
                      $cond: [
                        { $eq: ['$$detail.paymentStatus', 'pending'] },
                        '$$detail.commissionAmount',
                        0,
                      ],
                    },
                  },
                },
              },
              2,
            ],
          },
        },
      },
      {
        $sort: { totalCommission: -1 },
      },
    ];

    const results = await AffiliateClick.aggregate(pipeline);

    return results.map(result => ({
      partnerId: result.partnerId,
      partnerName: result.partnerName,
      totalCommission: result.totalCommission,
      paidCommission: result.paidCommission,
      pendingCommission: result.pendingCommission,
      conversions: result.conversions,
      averageCommission: result.averageCommission,
    }));
  } catch (error) {
    console.error('Error getting commission summary:', error);
    throw new Error('Failed to retrieve commission summary');
  }
}

/**
 * Get detailed commission records for a partner
 */
export async function getPartnerCommissionDetails(
  partnerId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  commissions: CommissionDetails[];
  total: number;
  totalPages: number;
}> {
  try {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    const skip = (page - 1) * limit;
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    const [commissions, total] = await Promise.all([
      AffiliateClick.find({
        partnerId: partnerObjectId,
        converted: true,
        commissionAmount: { $gt: 0 },
      })
        .select('_id partnerId productId userId commissionAmount conversionDate paymentStatus paymentId trackingId')
        .sort({ conversionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AffiliateClick.countDocuments({
        partnerId: partnerObjectId,
        converted: true,
        commissionAmount: { $gt: 0 },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formattedCommissions: CommissionDetails[] = commissions.map(commission => ({
      clickId: commission._id.toString(),
      partnerId: commission.partnerId.toString(),
      productId: commission.productId.toString(),
      userId: commission.userId?.toString(),
      commissionAmount: commission.commissionAmount,
      conversionDate: commission.conversionDate,
      paymentStatus: commission.paymentStatus || 'pending',
      paymentId: commission.paymentId,
      trackingId: commission.trackingId,
    }));

    return {
      commissions: formattedCommissions,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Error getting partner commission details:', error);
    throw new Error('Failed to retrieve partner commission details');
  }
}

/**
 * Mark commissions as paid
 */
export async function markCommissionsAsPaid(
  commissionIds: string[],
  paymentReference: string,
  paymentMethod: string,
  notes?: string
): Promise<{
  success: boolean;
  updatedCount: number;
  totalAmount: number;
}> {
  try {
    await connectToDatabase();

    // Validate commission IDs
    const validIds = commissionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== commissionIds.length) {
      throw new Error('Some commission IDs are invalid');
    }

    const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));

    // Get commission details before updating
    const commissions = await AffiliateClick.find({
      _id: { $in: objectIds },
      converted: true,
      paymentStatus: { $ne: 'paid' },
    });

    if (commissions.length === 0) {
      throw new Error('No eligible commissions found');
    }

    const totalAmount = commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);

    // Update payment status
    const updateResult = await AffiliateClick.updateMany(
      {
        _id: { $in: objectIds },
        converted: true,
        paymentStatus: { $ne: 'paid' },
      },
      {
        $set: {
          paymentStatus: 'paid',
          paymentReference,
          paymentMethod,
          paymentDate: new Date(),
          paymentNotes: notes,
        },
      }
    );

    return {
      success: true,
      updatedCount: updateResult.modifiedCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  } catch (error) {
    console.error('Error marking commissions as paid:', error);
    throw new Error('Failed to mark commissions as paid');
  }
}

/**
 * Generate commission report for a date range
 */
export async function generateCommissionReport(
  startDate: Date,
  endDate: Date,
  partnerId?: string
): Promise<{
  summary: {
    totalCommissions: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    averageCommission: number;
  };
  partnerBreakdown: CommissionSummary[];
  dailyBreakdown: Array<{
    date: string;
    commissions: number;
    amount: number;
  }>;
}> {
  try {
    await connectToDatabase();

    const matchStage: any = {
      converted: true,
      commissionAmount: { $gt: 0 },
      conversionDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (partnerId && mongoose.Types.ObjectId.isValid(partnerId)) {
      matchStage.partnerId = new mongoose.Types.ObjectId(partnerId);
    }

    // Get overall summary
    const summaryPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: 1 },
          totalAmount: { $sum: '$commissionAmount' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $ne: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0],
            },
          },
          averageCommission: { $avg: '$commissionAmount' },
        },
      },
    ];

    // Get daily breakdown
    const dailyPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$conversionDate',
            },
          },
          commissions: { $sum: 1 },
          amount: { $sum: '$commissionAmount' },
        },
      },
      {
        $project: {
          date: '$_id',
          commissions: 1,
          amount: { $round: ['$amount', 2] },
        },
      },
      { $sort: { date: 1 } },
    ];

    const [summaryResult, dailyResult] = await Promise.all([
      AffiliateClick.aggregate(summaryPipeline),
      AffiliateClick.aggregate(dailyPipeline),
    ]);

    // Get partner breakdown (only if not filtering by specific partner)
    let partnerBreakdown: CommissionSummary[] = [];
    if (!partnerId) {
      partnerBreakdown = await getCommissionSummary(startDate, endDate);
    }

    const summary = summaryResult[0] || {
      totalCommissions: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      averageCommission: 0,
    };

    return {
      summary: {
        totalCommissions: summary.totalCommissions,
        totalAmount: Math.round(summary.totalAmount * 100) / 100,
        paidAmount: Math.round(summary.paidAmount * 100) / 100,
        pendingAmount: Math.round(summary.pendingAmount * 100) / 100,
        averageCommission: Math.round(summary.averageCommission * 100) / 100,
      },
      partnerBreakdown,
      dailyBreakdown: dailyResult,
    };
  } catch (error) {
    console.error('Error generating commission report:', error);
    throw new Error('Failed to generate commission report');
  }
}