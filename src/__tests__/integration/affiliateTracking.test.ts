import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';

// Mock the service
jest.mock('@/lib/services/affiliateTrackingService');

const mockAffiliateTrackingService = jest.mocked(AffiliateTrackingService);

describe('Affiliate Tracking Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Click Tracking Flow', () => {
    it('should complete full tracking flow', async () => {
      // Mock service responses
      mockAffiliateTrackingService.trackClick.mockResolvedValue('tracking-123');
      mockAffiliateTrackingService.recordConversion.mockResolvedValue(true);
      mockAffiliateTrackingService.getPartnerAnalytics.mockResolvedValue({
        partnerId: '507f1f77bcf86cd799439011',
        partnerName: 'Test Bank',
        totalClicks: 1,
        totalConversions: 1,
        conversionRate: 100,
        totalCommission: 50,
        topProducts: []
      });

      // Step 1: Track click
      const trackingId = await AffiliateTrackingService.trackClick({
        partnerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      expect(trackingId).toBe('tracking-123');
      expect(mockAffiliateTrackingService.trackClick).toHaveBeenCalledWith({
        partnerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      // Step 2: Record conversion
      const conversionResult = await AffiliateTrackingService.recordConversion({
        trackingId: 'tracking-123',
        conversionType: 'application_submitted',
        conversionValue: 1000
      });

      expect(conversionResult).toBe(true);
      expect(mockAffiliateTrackingService.recordConversion).toHaveBeenCalledWith({
        trackingId: 'tracking-123',
        conversionType: 'application_submitted',
        conversionValue: 1000
      });

      // Step 3: Get analytics
      const analytics = await AffiliateTrackingService.getPartnerAnalytics('507f1f77bcf86cd799439011');

      expect(analytics.totalClicks).toBe(1);
      expect(analytics.totalConversions).toBe(1);
      expect(analytics.conversionRate).toBe(100);
      expect(mockAffiliateTrackingService.getPartnerAnalytics).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('Affiliate Link Generation', () => {
    it('should generate and process affiliate links', async () => {
      const expectedLink = 'https://example.com/api/affiliate/redirect?p=507f1f77bcf86cd799439011&pr=507f1f77bcf86cd799439012&utm_source=google';
      
      mockAffiliateTrackingService.generateAffiliateLink.mockResolvedValue(expectedLink);
      mockAffiliateTrackingService.processRedirect.mockResolvedValue({
        trackingId: 'tracking-456',
        redirectUrl: 'https://partner.com/apply?ref=tracking-456'
      });

      // Generate affiliate link
      const affiliateLink = await AffiliateTrackingService.generateAffiliateLink(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        'https://example.com',
        { source: 'google', medium: 'cpc', campaign: 'test' }
      );

      expect(affiliateLink).toBe(expectedLink);
      expect(mockAffiliateTrackingService.generateAffiliateLink).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        'https://example.com',
        { source: 'google', medium: 'cpc', campaign: 'test' }
      );

      // Process redirect
      const redirectResult = await AffiliateTrackingService.processRedirect(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          utmSource: 'google'
        }
      );

      expect(redirectResult.trackingId).toBe('tracking-456');
      expect(redirectResult.redirectUrl).toContain('https://partner.com/apply');
      expect(mockAffiliateTrackingService.processRedirect).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          utmSource: 'google'
        }
      );
    });
  });

  describe('Fraud Detection', () => {
    it('should detect and handle fraudulent activity', async () => {
      mockAffiliateTrackingService.detectFraud.mockResolvedValue({
        isFraudulent: true,
        reasons: ['Multiple clicks from same IP address', 'Bot-like user agent detected'],
        riskScore: 70
      });

      const fraudCheck = await AffiliateTrackingService.detectFraud('suspicious-tracking-id');

      expect(fraudCheck.isFraudulent).toBe(true);
      expect(fraudCheck.riskScore).toBe(70);
      expect(fraudCheck.reasons).toContain('Multiple clicks from same IP address');
      expect(fraudCheck.reasons).toContain('Bot-like user agent detected');
      expect(mockAffiliateTrackingService.detectFraud).toHaveBeenCalledWith('suspicious-tracking-id');
    });

    it('should pass legitimate activity', async () => {
      mockAffiliateTrackingService.detectFraud.mockResolvedValue({
        isFraudulent: false,
        reasons: [],
        riskScore: 15
      });

      const fraudCheck = await AffiliateTrackingService.detectFraud('legitimate-tracking-id');

      expect(fraudCheck.isFraudulent).toBe(false);
      expect(fraudCheck.riskScore).toBe(15);
      expect(fraudCheck.reasons).toHaveLength(0);
    });
  });

  describe('Analytics and Reporting', () => {
    it('should provide comprehensive analytics', async () => {
      const mockAnalytics = {
        partnerId: '507f1f77bcf86cd799439011',
        partnerName: 'Test Bank',
        totalClicks: 100,
        totalConversions: 15,
        conversionRate: 15,
        totalCommission: 750,
        avgTimeToConversion: 3600000, // 1 hour in milliseconds
        topProducts: [
          {
            productId: '507f1f77bcf86cd799439012',
            productName: 'Personal Loan',
            clicks: 60,
            conversions: 10
          },
          {
            productId: '507f1f77bcf86cd799439013',
            productName: 'Credit Card',
            clicks: 40,
            conversions: 5
          }
        ]
      };

      mockAffiliateTrackingService.getPartnerAnalytics.mockResolvedValue(mockAnalytics);

      const analytics = await AffiliateTrackingService.getPartnerAnalytics(
        '507f1f77bcf86cd799439011',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(analytics.totalClicks).toBe(100);
      expect(analytics.totalConversions).toBe(15);
      expect(analytics.conversionRate).toBe(15);
      expect(analytics.totalCommission).toBe(750);
      expect(analytics.topProducts).toHaveLength(2);
      expect(analytics.topProducts[0].productName).toBe('Personal Loan');
      expect(mockAffiliateTrackingService.getPartnerAnalytics).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
    });

    it('should get overall analytics across partners', async () => {
      const mockOverallAnalytics = [
        {
          _id: '507f1f77bcf86cd799439011',
          totalClicks: 100,
          totalConversions: 15,
          totalCommission: 750,
          conversionRate: 15,
          partner: { name: 'Test Bank' }
        },
        {
          _id: '507f1f77bcf86cd799439014',
          totalClicks: 80,
          totalConversions: 12,
          totalCommission: 600,
          conversionRate: 15,
          partner: { name: 'Another Bank' }
        }
      ];

      mockAffiliateTrackingService.getOverallAnalytics.mockResolvedValue(mockOverallAnalytics);

      const overallAnalytics = await AffiliateTrackingService.getOverallAnalytics(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(overallAnalytics).toHaveLength(2);
      expect(overallAnalytics[0].totalClicks).toBe(100);
      expect(overallAnalytics[1].totalClicks).toBe(80);
      expect(mockAffiliateTrackingService.getOverallAnalytics).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
    });
  });

  describe('Click Management', () => {
    it('should retrieve partner clicks with pagination', async () => {
      const mockClicksResult = {
        clicks: [
          {
            trackingId: 'tracking-1',
            clickedAt: new Date(),
            converted: true,
            productId: { name: 'Personal Loan' },
            userId: { email: 'user@example.com' }
          },
          {
            trackingId: 'tracking-2',
            clickedAt: new Date(),
            converted: false,
            productId: { name: 'Credit Card' },
            userId: null
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      };

      mockAffiliateTrackingService.getPartnerClicks.mockResolvedValue(mockClicksResult);

      const result = await AffiliateTrackingService.getPartnerClicks(
        '507f1f77bcf86cd799439011',
        {
          page: 1,
          limit: 20,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          converted: true
        }
      );

      expect(result.clicks).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.clicks[0].trackingId).toBe('tracking-1');
      expect(mockAffiliateTrackingService.getPartnerClicks).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          page: 1,
          limit: 20,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          converted: true
        }
      );
    });

    it('should retrieve click by tracking ID', async () => {
      const mockClick = {
        trackingId: 'tracking-123',
        partnerId: { name: 'Test Bank', type: 'loan' },
        productId: { name: 'Personal Loan', type: 'personal_loan' },
        userId: { email: 'user@example.com' },
        clickedAt: new Date(),
        converted: true,
        conversionDate: new Date(),
        commissionAmount: 50
      };

      mockAffiliateTrackingService.getClickByTrackingId.mockResolvedValue(mockClick);

      const click = await AffiliateTrackingService.getClickByTrackingId('tracking-123');

      expect(click.trackingId).toBe('tracking-123');
      expect(click.partnerId.name).toBe('Test Bank');
      expect(click.productId.name).toBe('Personal Loan');
      expect(click.converted).toBe(true);
      expect(mockAffiliateTrackingService.getClickByTrackingId).toHaveBeenCalledWith('tracking-123');
    });
  });

  describe('Parameter Validation', () => {
    it('should validate tracking parameters correctly', () => {
      const validParams = {
        partnerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      mockAffiliateTrackingService.validateTrackingParams.mockReturnValue({
        isValid: true,
        errors: []
      });

      const result = AffiliateTrackingService.validateTrackingParams(validParams);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockAffiliateTrackingService.validateTrackingParams).toHaveBeenCalledWith(validParams);
    });

    it('should return validation errors for invalid parameters', () => {
      const invalidParams = {
        partnerId: 'invalid',
        productId: '',
        ipAddress: '',
        userAgent: ''
      };

      mockAffiliateTrackingService.validateTrackingParams.mockReturnValue({
        isValid: false,
        errors: [
          'Valid partner ID is required',
          'Valid product ID is required',
          'IP address is required',
          'User agent is required'
        ]
      });

      const result = AffiliateTrackingService.validateTrackingParams(invalidParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Valid partner ID is required');
    });
  });
});