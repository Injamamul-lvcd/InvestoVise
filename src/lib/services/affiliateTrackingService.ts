import { AffiliateClick, AffiliatePartner, Product } from '@/models';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';
import crypto from 'crypto';

export interface TrackingData {
  partnerId: string;
  productId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ConversionData {
  trackingId: string;
  conversionType: string;
  conversionValue?: number;
  metadata?: Record<string, any>;
}

export interface TrackingAnalytics {
  partnerId: string;
  partnerName: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalCommission: number;
  avgTimeToConversion?: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    clicks: number;
    conversions: number;
  }>;
}

export class AffiliateTrackingService {
  /**
   * Generate a unique tracking ID
   */
  static generateTrackingId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(6).toString('hex');
    return `${timestamp}-${randomBytes}`;
  }

  /**
   * Track affiliate click
   */
  static async trackClick(data: TrackingData): Promise<string> {
    await connectToDatabase();

    // Validate partner and product exist
    if (!mongoose.Types.ObjectId.isValid(data.partnerId)) {
      throw new Error('Invalid partner ID');
    }
    
    if (!mongoose.Types.ObjectId.isValid(data.productId)) {
      throw new Error('Invalid product ID');
    }

    const partner = await AffiliatePartner.findById(data.partnerId);
    if (!partner || !partner.isActive) {
      throw new Error('Partner not found or inactive');
    }

    const product = await Product.findById(data.productId);
    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    // Generate unique tracking ID
    const trackingId = this.generateTrackingId();

    // Create affiliate click record
    const affiliateClick = new AffiliateClick({
      trackingId,
      partnerId: data.partnerId,
      productId: data.productId,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      referrer: data.referrer,
      sessionId: data.sessionId,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      clickedAt: new Date()
    });

    await affiliateClick.save();

    return trackingId;
  }

  /**
   * Generate affiliate link with tracking
   */
  static async generateAffiliateLink(
    partnerId: string,
    productId: string,
    baseUrl: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
    }
  ): Promise<string> {
    await connectToDatabase();

    // Validate partner and product
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID');
    }

    const partner = await AffiliatePartner.findById(partnerId);
    if (!partner || !partner.isActive) {
      throw new Error('Partner not found or inactive');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new Error('Product not found or inactive');
    }

    // Build tracking URL
    const trackingUrl = new URL(`${baseUrl}/api/affiliate/redirect`);
    trackingUrl.searchParams.set('p', partnerId);
    trackingUrl.searchParams.set('pr', productId);
    
    if (utmParams?.source) trackingUrl.searchParams.set('utm_source', utmParams.source);
    if (utmParams?.medium) trackingUrl.searchParams.set('utm_medium', utmParams.medium);
    if (utmParams?.campaign) trackingUrl.searchParams.set('utm_campaign', utmParams.campaign);

    return trackingUrl.toString();
  }

  /**
   * Process affiliate redirect and track click
   */
  static async processRedirect(
    partnerId: string,
    productId: string,
    request: {
      ip?: string;
      userAgent?: string;
      referrer?: string;
      sessionId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    },
    userId?: string
  ): Promise<{ trackingId: string; redirectUrl: string }> {
    await connectToDatabase();

    // Track the click
    const trackingId = await this.trackClick({
      partnerId,
      productId,
      userId,
      ipAddress: request.ip || 'unknown',
      userAgent: request.userAgent || 'unknown',
      referrer: request.referrer,
      sessionId: request.sessionId,
      utmSource: request.utmSource,
      utmMedium: request.utmMedium,
      utmCampaign: request.utmCampaign
    });

    // Get product application URL
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Build redirect URL with tracking parameters
    const redirectUrl = new URL(product.applicationUrl);
    redirectUrl.searchParams.set('ref', trackingId);
    
    if (request.utmSource) redirectUrl.searchParams.set('utm_source', request.utmSource);
    if (request.utmMedium) redirectUrl.searchParams.set('utm_medium', request.utmMedium);
    if (request.utmCampaign) redirectUrl.searchParams.set('utm_campaign', request.utmCampaign);

    return {
      trackingId,
      redirectUrl: redirectUrl.toString()
    };
  }

  /**
   * Record conversion
   */
  static async recordConversion(data: ConversionData): Promise<boolean> {
    await connectToDatabase();

    const affiliateClick = await AffiliateClick.findOne({ 
      trackingId: data.trackingId,
      converted: false 
    }).populate('partnerId');

    if (!affiliateClick) {
      throw new Error('Tracking ID not found or already converted');
    }

    // Check if click is within attribution window
    const isWithinWindow = await affiliateClick.isWithinAttributionWindow();
    if (!isWithinWindow) {
      throw new Error('Click is outside attribution window');
    }

    // Calculate commission
    const partner = affiliateClick.partnerId as any;
    const commissionAmount = partner.calculateCommission(data.conversionValue || 0);

    // Mark as converted
    await affiliateClick.markAsConverted(commissionAmount);

    return true;
  }

  /**
   * Get tracking analytics for partner
   */
  static async getPartnerAnalytics(
    partnerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TrackingAnalytics> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    const partner = await AffiliatePartner.findById(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    // Build date filter
    const dateFilter: any = { partnerId };
    if (startDate || endDate) {
      dateFilter.clickedAt = {};
      if (startDate) dateFilter.clickedAt.$gte = startDate;
      if (endDate) dateFilter.clickedAt.$lte = endDate;
    }

    // Get basic analytics
    const [basicStats] = await AffiliateClick.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          totalConversions: { $sum: { $cond: ['$converted', 1, 0] } },
          totalCommission: { $sum: { $cond: ['$converted', '$commissionAmount', 0] } },
          avgTimeToConversion: {
            $avg: {
              $cond: [
                '$converted',
                { $subtract: ['$conversionDate', '$clickedAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Get top products
    const topProducts = await AffiliateClick.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$productId',
          clicks: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
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
          conversions: 1
        }
      }
    ]);

    const stats = basicStats || {
      totalClicks: 0,
      totalConversions: 0,
      totalCommission: 0,
      avgTimeToConversion: null
    };

    return {
      partnerId,
      partnerName: partner.name,
      totalClicks: stats.totalClicks,
      totalConversions: stats.totalConversions,
      conversionRate: stats.totalClicks > 0 ? (stats.totalConversions / stats.totalClicks) * 100 : 0,
      totalCommission: stats.totalCommission || 0,
      avgTimeToConversion: stats.avgTimeToConversion,
      topProducts: topProducts || []
    };
  }

  /**
   * Get conversion analytics across all partners
   */
  static async getOverallAnalytics(startDate?: Date, endDate?: Date) {
    await connectToDatabase();

    return await AffiliateClick.getConversionAnalytics(undefined, startDate, endDate);
  }

  /**
   * Detect and prevent fraud
   */
  static async detectFraud(trackingId: string): Promise<{
    isFraudulent: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    await connectToDatabase();

    const click = await AffiliateClick.findOne({ trackingId });
    if (!click) {
      throw new Error('Tracking ID not found');
    }

    const reasons: string[] = [];
    let riskScore = 0;

    // Check for multiple clicks from same IP in short time
    const recentClicksFromIP = await AffiliateClick.countDocuments({
      ipAddress: click.ipAddress,
      clickedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      _id: { $ne: click._id }
    });

    if (recentClicksFromIP > 10) {
      reasons.push('Multiple clicks from same IP address');
      riskScore += 30;
    }

    // Check for suspicious user agent patterns
    if (!click.userAgent || click.userAgent.length < 10) {
      reasons.push('Suspicious or missing user agent');
      riskScore += 20;
    }

    // Check for bot-like patterns
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];
    
    if (botPatterns.some(pattern => pattern.test(click.userAgent))) {
      reasons.push('Bot-like user agent detected');
      riskScore += 40;
    }

    // Check conversion time (too fast might be suspicious)
    if (click.converted && click.conversionDate) {
      const conversionTime = click.conversionDate.getTime() - click.clickedAt.getTime();
      if (conversionTime < 30 * 1000) { // Less than 30 seconds
        reasons.push('Suspiciously fast conversion');
        riskScore += 25;
      }
    }

    // Check for missing referrer (might indicate direct access)
    if (!click.referrer) {
      reasons.push('Missing referrer information');
      riskScore += 10;
    }

    return {
      isFraudulent: riskScore >= 50,
      reasons,
      riskScore
    };
  }

  /**
   * Get clicks by tracking ID
   */
  static async getClickByTrackingId(trackingId: string) {
    await connectToDatabase();

    const click = await AffiliateClick.findOne({ trackingId })
      .populate('partnerId', 'name type')
      .populate('productId', 'name type')
      .populate('userId', 'email profile.firstName profile.lastName');

    return click;
  }

  /**
   * Get clicks for a partner with pagination
   */
  static async getPartnerClicks(
    partnerId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      converted?: boolean;
    } = {}
  ) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      throw new Error('Invalid partner ID');
    }

    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      converted
    } = options;

    const filter: any = { partnerId };
    
    if (startDate || endDate) {
      filter.clickedAt = {};
      if (startDate) filter.clickedAt.$gte = startDate;
      if (endDate) filter.clickedAt.$lte = endDate;
    }
    
    if (converted !== undefined) {
      filter.converted = converted;
    }

    const skip = (page - 1) * limit;

    const clicks = await AffiliateClick.find(filter)
      .populate('productId', 'name type')
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ clickedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AffiliateClick.countDocuments(filter);

    return {
      clicks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Validate tracking parameters
   */
  static validateTrackingParams(params: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!params.partnerId || !mongoose.Types.ObjectId.isValid(params.partnerId)) {
      errors.push('Valid partner ID is required');
    }

    if (!params.productId || !mongoose.Types.ObjectId.isValid(params.productId)) {
      errors.push('Valid product ID is required');
    }

    if (!params.ipAddress) {
      errors.push('IP address is required');
    }

    if (!params.userAgent) {
      errors.push('User agent is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}