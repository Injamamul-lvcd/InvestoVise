import { CreditCardApplication } from '@/types/creditCards';
import { IAffiliatePartner, IAffiliateClick } from '@/types/database';
import AffiliatePartner from '@/models/AffiliatePartner';
import AffiliateClick from '@/models/AffiliateClick';
import Product from '@/models/Product';

interface PartnerAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface ConversionData {
  trackingId: string;
  conversionType: 'application_submitted' | 'card_approved' | 'first_transaction';
  conversionValue?: number;
  metadata?: Record<string, any>;
}

interface CommissionCalculation {
  baseAmount: number;
  commissionAmount: number;
  commissionRate?: number;
  commissionType: 'fixed' | 'percentage';
  partnerId: string;
  productId: string;
}

class CreditCardAffiliateService {
  /**
   * Generate affiliate tracking link for credit card application
   */
  async generateTrackingLink(
    productId: string, 
    userId?: string,
    utmParams?: Record<string, string>
  ): Promise<{ trackingUrl: string; trackingId: string }> {
    try {
      const product = await Product.findById(productId).populate('partnerId');
      if (!product) {
        throw new Error('Product not found');
      }

      const partner = product.partnerId as IAffiliatePartner;
      if (!partner || !partner.isActive) {
        throw new Error('Partner not found or inactive');
      }

      const trackingId = this.generateTrackingId('cc');
      
      // Create affiliate click record
      const clickData = {
        trackingId,
        userId,
        partnerId: partner._id,
        productId,
        clickedAt: new Date(),
        ipAddress: '0.0.0.0', // Will be updated by middleware
        userAgent: 'Unknown', // Will be updated by middleware
        referrer: '',
        converted: false,
        sessionId: this.generateSessionId(),
        utmSource: utmParams?.utm_source,
        utmMedium: utmParams?.utm_medium,
        utmCampaign: utmParams?.utm_campaign
      };

      await AffiliateClick.create(clickData);

      // Generate tracking URL
      const trackingUrl = this.buildTrackingUrl(
        product.applicationUrl,
        trackingId,
        partner,
        utmParams
      );

      // Notify partner API if available
      if (partner.apiEndpoint) {
        await this.notifyPartnerAPI(partner, {
          event: 'click_generated',
          trackingId,
          productId,
          userId,
          timestamp: new Date().toISOString()
        });
      }

      return { trackingUrl, trackingId };
    } catch (error) {
      console.error('Error generating tracking link:', error);
      throw new Error('Failed to generate tracking link');
    }
  }

  /**
   * Track credit card application submission
   */
  async trackApplication(
    trackingId: string,
    applicationData: Partial<CreditCardApplication>
  ): Promise<void> {
    try {
      const click = await AffiliateClick.findOne({ trackingId });
      if (!click) {
        throw new Error('Tracking record not found');
      }

      // Update click record with application data
      await AffiliateClick.findByIdAndUpdate(click._id, {
        converted: true,
        conversionDate: new Date(),
        metadata: {
          ...click.metadata,
          applicationData: {
            requestedLimit: applicationData.requestedLimit,
            status: applicationData.status
          }
        }
      });

      // Notify partner API
      const partner = await AffiliatePartner.findById(click.partnerId);
      if (partner?.apiEndpoint) {
        await this.notifyPartnerAPI(partner, {
          event: 'application_submitted',
          trackingId,
          productId: click.productId.toString(),
          userId: click.userId?.toString(),
          applicationData,
          timestamp: new Date().toISOString()
        });
      }

      // Calculate potential commission
      const commission = await this.calculateCommission(
        click.partnerId.toString(),
        click.productId.toString(),
        applicationData.requestedLimit || 0
      );

      if (commission) {
        await AffiliateClick.findByIdAndUpdate(click._id, {
          commissionAmount: commission.commissionAmount
        });
      }

    } catch (error) {
      console.error('Error tracking application:', error);
      throw new Error('Failed to track application');
    }
  }

  /**
   * Handle conversion webhook from partner
   */
  async handleConversionWebhook(
    partnerId: string,
    conversionData: ConversionData
  ): Promise<void> {
    try {
      const click = await AffiliateClick.findOne({ 
        trackingId: conversionData.trackingId 
      });
      
      if (!click) {
        throw new Error('Tracking record not found');
      }

      // Verify partner
      const partner = await AffiliatePartner.findById(partnerId);
      if (!partner || !partner.isActive) {
        throw new Error('Invalid partner');
      }

      // Update conversion data
      const updateData: any = {
        converted: true,
        conversionDate: new Date(),
        metadata: {
          ...click.metadata,
          conversionType: conversionData.conversionType,
          conversionValue: conversionData.conversionValue,
          webhookData: conversionData.metadata
        }
      };

      // Calculate commission for approved applications
      if (conversionData.conversionType === 'card_approved') {
        const commission = await this.calculateCommission(
          partnerId,
          click.productId.toString(),
          conversionData.conversionValue || 0
        );
        
        if (commission) {
          updateData.commissionAmount = commission.commissionAmount;
        }
      }

      await AffiliateClick.findByIdAndUpdate(click._id, updateData);

    } catch (error) {
      console.error('Error handling conversion webhook:', error);
      throw new Error('Failed to handle conversion webhook');
    }
  }

  /**
   * Calculate commission for a conversion
   */
  async calculateCommission(
    partnerId: string,
    productId: string,
    baseAmount: number
  ): Promise<CommissionCalculation | null> {
    try {
      const partner = await AffiliatePartner.findById(partnerId);
      if (!partner) {
        return null;
      }

      const { type, amount } = partner.commissionStructure;
      let commissionAmount = 0;

      if (type === 'fixed') {
        commissionAmount = amount;
      } else if (type === 'percentage' && baseAmount > 0) {
        commissionAmount = (baseAmount * amount) / 100;
      }

      return {
        baseAmount,
        commissionAmount,
        commissionRate: type === 'percentage' ? amount : undefined,
        commissionType: type,
        partnerId,
        productId
      };
    } catch (error) {
      console.error('Error calculating commission:', error);
      return null;
    }
  }

  /**
   * Get affiliate performance metrics
   */
  async getAffiliateMetrics(
    partnerId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalCommissions: number;
    averageCommission: number;
    topProducts: Array<{ productId: string; productName: string; conversions: number }>;
  }> {
    try {
      const matchQuery: any = {};
      
      if (partnerId) {
        matchQuery.partnerId = partnerId;
      }
      
      if (dateRange) {
        matchQuery.clickedAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const metrics = await AffiliateClick.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            totalConversions: { $sum: { $cond: ['$converted', 1, 0] } },
            totalCommissions: { $sum: { $ifNull: ['$commissionAmount', 0] } },
            avgCommission: { $avg: { $ifNull: ['$commissionAmount', 0] } }
          }
        }
      ]);

      const result = metrics[0] || {
        totalClicks: 0,
        totalConversions: 0,
        totalCommissions: 0,
        avgCommission: 0
      };

      // Get top performing products
      const topProducts = await AffiliateClick.aggregate([
        { $match: { ...matchQuery, converted: true } },
        {
          $group: {
            _id: '$productId',
            conversions: { $sum: 1 }
          }
        },
        { $sort: { conversions: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            productId: '$_id',
            productName: { $arrayElemAt: ['$product.name', 0] },
            conversions: 1
          }
        }
      ]);

      return {
        totalClicks: result.totalClicks,
        totalConversions: result.totalConversions,
        conversionRate: result.totalClicks > 0 
          ? (result.totalConversions / result.totalClicks) * 100 
          : 0,
        totalCommissions: result.totalCommissions,
        averageCommission: result.avgCommission || 0,
        topProducts
      };
    } catch (error) {
      console.error('Error getting affiliate metrics:', error);
      throw new Error('Failed to get affiliate metrics');
    }
  }

  /**
   * Sync with partner APIs to get updated product information
   */
  async syncPartnerProducts(partnerId: string): Promise<void> {
    try {
      const partner = await AffiliatePartner.findById(partnerId);
      if (!partner || !partner.apiEndpoint) {
        throw new Error('Partner API not available');
      }

      const response = await this.callPartnerAPI(partner, 'GET', '/products');
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch partner products');
      }

      // Update products based on partner API response
      for (const partnerProduct of response.data.products || []) {
        await this.updateProductFromPartnerData(partnerId, partnerProduct);
      }

    } catch (error) {
      console.error('Error syncing partner products:', error);
      throw new Error('Failed to sync partner products');
    }
  }

  /**
   * Get conversion attribution report
   */
  async getAttributionReport(
    dateRange: { start: Date; end: Date },
    partnerId?: string
  ): Promise<Array<{
    date: string;
    clicks: number;
    conversions: number;
    commissions: number;
    topSources: Array<{ source: string; clicks: number }>;
  }>> {
    try {
      const matchQuery: any = {
        clickedAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      };

      if (partnerId) {
        matchQuery.partnerId = partnerId;
      }

      const report = await AffiliateClick.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
              utmSource: '$utmSource'
            },
            clicks: { $sum: 1 },
            conversions: { $sum: { $cond: ['$converted', 1, 0] } },
            commissions: { $sum: { $ifNull: ['$commissionAmount', 0] } }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            clicks: { $sum: '$clicks' },
            conversions: { $sum: '$conversions' },
            commissions: { $sum: '$commissions' },
            sources: {
              $push: {
                source: { $ifNull: ['$_id.utmSource', 'direct'] },
                clicks: '$clicks'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return report.map(day => ({
        date: day._id,
        clicks: day.clicks,
        conversions: day.conversions,
        commissions: day.commissions,
        topSources: day.sources
          .sort((a: any, b: any) => b.clicks - a.clicks)
          .slice(0, 5)
      }));
    } catch (error) {
      console.error('Error generating attribution report:', error);
      throw new Error('Failed to generate attribution report');
    }
  }

  // Private helper methods
  private generateTrackingId(prefix: string = 'cc'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildTrackingUrl(
    baseUrl: string,
    trackingId: string,
    partner: IAffiliatePartner,
    utmParams?: Record<string, string>
  ): string {
    const url = new URL(baseUrl);
    
    // Add tracking parameters
    url.searchParams.set('ref', trackingId);
    url.searchParams.set('partner', partner._id.toString());
    
    // Add UTM parameters if provided
    if (utmParams) {
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });
    }

    return url.toString();
  }

  private async notifyPartnerAPI(
    partner: IAffiliatePartner,
    data: Record<string, any>
  ): Promise<void> {
    try {
      if (!partner.apiEndpoint) return;

      await this.callPartnerAPI(partner, 'POST', '/webhook/events', data);
    } catch (error) {
      console.error('Error notifying partner API:', error);
      // Don't throw error as this is not critical
    }
  }

  private async callPartnerAPI(
    partner: IAffiliatePartner,
    method: 'GET' | 'POST' | 'PUT',
    endpoint: string,
    data?: any
  ): Promise<PartnerAPIResponse> {
    try {
      const url = `${partner.apiEndpoint}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PARTNER_API_KEY}`,
          'User-Agent': 'InvestoVise-Affiliate/1.0'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        error: response.ok ? undefined : responseData.message || 'API call failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async updateProductFromPartnerData(
    partnerId: string,
    partnerProduct: any
  ): Promise<void> {
    try {
      const existingProduct = await Product.findOne({
        partnerId,
        'metadata.partnerProductId': partnerProduct.id
      });

      const productData = {
        name: partnerProduct.name,
        description: partnerProduct.description,
        features: partnerProduct.features || [],
        fees: partnerProduct.fees || [],
        applicationUrl: partnerProduct.applicationUrl,
        isActive: partnerProduct.isActive !== false,
        updatedAt: new Date(),
        metadata: {
          partnerProductId: partnerProduct.id,
          lastSyncAt: new Date()
        }
      };

      if (existingProduct) {
        await Product.findByIdAndUpdate(existingProduct._id, productData);
      } else {
        await Product.create({
          ...productData,
          partnerId,
          type: 'credit_card',
          priority: 50,
          termsAndConditions: partnerProduct.termsAndConditions || '',
          processingTime: partnerProduct.processingTime || '7-10 days',
          eligibility: partnerProduct.eligibility || []
        });
      }
    } catch (error) {
      console.error('Error updating product from partner data:', error);
    }
  }
}

const creditCardAffiliateService = new CreditCardAffiliateService();
export default creditCardAffiliateService;