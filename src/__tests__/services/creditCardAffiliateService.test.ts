import creditCardAffiliateService from '@/lib/services/creditCardAffiliateService';
import AffiliatePartner from '@/models/AffiliatePartner';
import AffiliateClick from '@/models/AffiliateClick';
import Product from '@/models/Product';

// Mock the models
jest.mock('@/models/AffiliatePartner');
jest.mock('@/models/AffiliateClick');
jest.mock('@/models/Product');

const mockAffiliatePartner = AffiliatePartner as jest.Mocked<typeof AffiliatePartner>;
const mockAffiliateClick = AffiliateClick as jest.Mocked<typeof AffiliateClick>;
const mockProduct = Product as jest.Mocked<typeof Product>;

// Mock fetch
global.fetch = jest.fn();

describe('CreditCardAffiliateService', () => {
  const mockPartner = {
    _id: 'partner123',
    name: 'Test Bank',
    type: 'credit_card',
    isActive: true,
    apiEndpoint: 'https://api.testbank.com',
    commissionStructure: {
      type: 'fixed',
      amount: 500,
      currency: 'INR'
    },
    trackingConfig: {
      conversionGoals: ['application_submitted'],
      attributionWindow: 30
    }
  };

  const mockProduct = {
    _id: 'product123',
    partnerId: 'partner123',
    name: 'Test Credit Card',
    applicationUrl: 'https://testbank.com/apply',
    type: 'credit_card'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTrackingLink', () => {
    it('should generate tracking link successfully', async () => {
      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockProduct,
          partnerId: mockPartner
        })
      } as any);

      mockAffiliateClick.create.mockResolvedValue({} as any);

      const result = await creditCardAffiliateService.generateTrackingLink(
        'product123',
        'user123',
        { utm_source: 'google', utm_medium: 'cpc' }
      );

      expect(result).toHaveProperty('trackingUrl');
      expect(result).toHaveProperty('trackingId');
      expect(result.trackingUrl).toContain('https://testbank.com/apply');
      expect(result.trackingUrl).toContain('ref=');
      expect(result.trackingUrl).toContain('utm_source=google');
      expect(mockAffiliateClick.create).toHaveBeenCalled();
    });

    it('should throw error when product not found', async () => {
      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        creditCardAffiliateService.generateTrackingLink('invalid_product')
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when partner is inactive', async () => {
      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockProduct,
          partnerId: { ...mockPartner, isActive: false }
        })
      } as any);

      await expect(
        creditCardAffiliateService.generateTrackingLink('product123')
      ).rejects.toThrow('Partner not found or inactive');
    });
  });

  describe('trackApplication', () => {
    it('should track application successfully', async () => {
      const mockClick = {
        _id: 'click123',
        trackingId: 'track123',
        partnerId: 'partner123',
        productId: 'product123',
        userId: 'user123',
        metadata: {}
      };

      mockAffiliateClick.findOne.mockResolvedValue(mockClick as any);
      mockAffiliateClick.findByIdAndUpdate.mockResolvedValue({} as any);
      mockAffiliatePartner.findById.mockResolvedValue(mockPartner as any);

      // Mock fetch for API call
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await creditCardAffiliateService.trackApplication('track123', {
        requestedLimit: 100000,
        status: 'initiated'
      });

      expect(mockAffiliateClick.findByIdAndUpdate).toHaveBeenCalledWith(
        'click123',
        expect.objectContaining({
          converted: true,
          conversionDate: expect.any(Date)
        })
      );
    });

    it('should throw error when tracking record not found', async () => {
      mockAffiliateClick.findOne.mockResolvedValue(null);

      await expect(
        creditCardAffiliateService.trackApplication('invalid_track', {})
      ).rejects.toThrow('Tracking record not found');
    });
  });

  describe('calculateCommission', () => {
    it('should calculate fixed commission correctly', async () => {
      mockAffiliatePartner.findById.mockResolvedValue(mockPartner as any);

      const result = await creditCardAffiliateService.calculateCommission(
        'partner123',
        'product123',
        100000
      );

      expect(result).toEqual({
        baseAmount: 100000,
        commissionAmount: 500,
        commissionType: 'fixed',
        partnerId: 'partner123',
        productId: 'product123'
      });
    });

    it('should calculate percentage commission correctly', async () => {
      const percentagePartner = {
        ...mockPartner,
        commissionStructure: {
          type: 'percentage',
          amount: 2.5,
          currency: 'INR'
        }
      };

      mockAffiliatePartner.findById.mockResolvedValue(percentagePartner as any);

      const result = await creditCardAffiliateService.calculateCommission(
        'partner123',
        'product123',
        100000
      );

      expect(result).toEqual({
        baseAmount: 100000,
        commissionAmount: 2500,
        commissionRate: 2.5,
        commissionType: 'percentage',
        partnerId: 'partner123',
        productId: 'product123'
      });
    });

    it('should return null when partner not found', async () => {
      mockAffiliatePartner.findById.mockResolvedValue(null);

      const result = await creditCardAffiliateService.calculateCommission(
        'invalid_partner',
        'product123',
        100000
      );

      expect(result).toBeNull();
    });
  });

  describe('handleConversionWebhook', () => {
    it('should handle conversion webhook successfully', async () => {
      const mockClick = {
        _id: 'click123',
        trackingId: 'track123',
        partnerId: 'partner123',
        productId: 'product123',
        metadata: {}
      };

      mockAffiliateClick.findOne.mockResolvedValue(mockClick as any);
      mockAffiliatePartner.findById.mockResolvedValue(mockPartner as any);
      mockAffiliateClick.findByIdAndUpdate.mockResolvedValue({} as any);

      await creditCardAffiliateService.handleConversionWebhook('partner123', {
        trackingId: 'track123',
        conversionType: 'card_approved',
        conversionValue: 100000,
        metadata: { approvalDate: '2024-01-01' }
      });

      expect(mockAffiliateClick.findByIdAndUpdate).toHaveBeenCalledWith(
        'click123',
        expect.objectContaining({
          converted: true,
          conversionDate: expect.any(Date),
          commissionAmount: 500 // Fixed commission
        })
      );
    });

    it('should throw error when tracking record not found', async () => {
      mockAffiliateClick.findOne.mockResolvedValue(null);

      await expect(
        creditCardAffiliateService.handleConversionWebhook('partner123', {
          trackingId: 'invalid_track',
          conversionType: 'card_approved'
        })
      ).rejects.toThrow('Tracking record not found');
    });
  });

  describe('getAffiliateMetrics', () => {
    it('should return affiliate metrics successfully', async () => {
      const mockMetrics = [{
        totalClicks: 100,
        totalConversions: 10,
        totalCommissions: 5000,
        avgCommission: 500
      }];

      const mockTopProducts = [
        {
          productId: 'product123',
          productName: 'Test Credit Card',
          conversions: 5
        }
      ];

      mockAffiliateClick.aggregate
        .mockResolvedValueOnce(mockMetrics)
        .mockResolvedValueOnce(mockTopProducts);

      const result = await creditCardAffiliateService.getAffiliateMetrics('partner123');

      expect(result).toEqual({
        totalClicks: 100,
        totalConversions: 10,
        conversionRate: 10,
        totalCommissions: 5000,
        averageCommission: 500,
        topProducts: mockTopProducts
      });
    });

    it('should handle empty metrics gracefully', async () => {
      mockAffiliateClick.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await creditCardAffiliateService.getAffiliateMetrics();

      expect(result).toEqual({
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalCommissions: 0,
        averageCommission: 0,
        topProducts: []
      });
    });
  });

  describe('syncPartnerProducts', () => {
    it('should sync partner products successfully', async () => {
      mockAffiliatePartner.findById.mockResolvedValue(mockPartner as any);

      // Mock API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          products: [
            {
              id: 'partner_product_1',
              name: 'Updated Credit Card',
              description: 'Updated description',
              features: [],
              fees: [],
              applicationUrl: 'https://testbank.com/apply/updated',
              isActive: true
            }
          ]
        })
      });

      mockProduct.findOne.mockResolvedValue(null);
      mockProduct.create.mockResolvedValue({} as any);

      await creditCardAffiliateService.syncPartnerProducts('partner123');

      expect(mockProduct.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Credit Card',
          partnerId: 'partner123',
          type: 'credit_card'
        })
      );
    });

    it('should throw error when partner API not available', async () => {
      mockAffiliatePartner.findById.mockResolvedValue({
        ...mockPartner,
        apiEndpoint: null
      } as any);

      await expect(
        creditCardAffiliateService.syncPartnerProducts('partner123')
      ).rejects.toThrow('Partner API not available');
    });
  });

  describe('getAttributionReport', () => {
    it('should generate attribution report successfully', async () => {
      const mockReport = [
        {
          _id: '2024-01-01',
          clicks: 50,
          conversions: 5,
          commissions: 2500,
          sources: [
            { source: 'google', clicks: 30 },
            { source: 'facebook', clicks: 20 }
          ]
        }
      ];

      mockAffiliateClick.aggregate.mockResolvedValue(mockReport);

      const result = await creditCardAffiliateService.getAttributionReport({
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result).toEqual([
        {
          date: '2024-01-01',
          clicks: 50,
          conversions: 5,
          commissions: 2500,
          topSources: [
            { source: 'google', clicks: 30 },
            { source: 'facebook', clicks: 20 }
          ]
        }
      ]);
    });
  });
});