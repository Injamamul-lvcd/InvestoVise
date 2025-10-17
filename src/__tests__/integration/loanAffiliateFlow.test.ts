import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { connectToDatabase } from '@/lib/database';
import { AffiliatePartner, Product, AffiliateClick } from '@/models';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import mongoose from 'mongoose';

describe('Loan Affiliate Flow Integration Tests', () => {
  let testPartner: any;
  let testLoanProduct: any;
  let trackingId: string;

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await AffiliatePartner.deleteMany({ name: /Test Loan Partner/ });
    await Product.deleteMany({ name: /Test Loan Product/ });
    await AffiliateClick.deleteMany({});

    // Create test loan partner
    testPartner = await AffiliatePartner.create({
      name: 'Test Loan Partner',
      type: 'loan',
      logoUrl: 'https://example.com/logo.png',
      description: 'Test loan partner for integration testing',
      website: 'https://testloanpartner.com',
      contactEmail: 'test@loanpartner.com',
      commissionStructure: {
        type: 'percentage',
        amount: 2.5,
        currency: 'INR',
        conditions: ['Loan must be disbursed', 'First EMI must be paid']
      },
      trackingConfig: {
        conversionGoals: ['application_submitted', 'loan_approved', 'loan_disbursed'],
        attributionWindow: 30
      },
      isActive: true
    });

    // Create test loan product
    testLoanProduct = await Product.create({
      partnerId: testPartner._id,
      name: 'Test Personal Loan Product',
      type: 'personal_loan',
      features: [
        { name: 'Interest Rate', value: '10.5% - 24% p.a.', description: 'Competitive interest rates' },
        { name: 'Loan Amount', value: '₹50,000 - ₹40,00,000', description: 'Flexible loan amounts' }
      ],
      eligibility: [
        { type: 'age', description: 'Age between 21-65 years', minValue: 21, maxValue: 65 },
        { type: 'income', description: 'Minimum monthly income ₹25,000', minValue: 300000 }
      ],
      interestRate: 12.5,
      fees: [
        { type: 'processing', amount: 2, description: 'Processing fee', isPercentage: true }
      ],
      applicationUrl: 'https://testloanpartner.com/apply',
      isActive: true,
      priority: 80,
      description: 'Test personal loan with competitive rates',
      termsAndConditions: 'Standard terms and conditions apply',
      processingTime: '24-48 hours',
      minAmount: 50000,
      maxAmount: 4000000
    });
  });

  describe('Affiliate Link Generation', () => {
    it('should generate affiliate link for loan product', async () => {
      const baseUrl = 'https://testplatform.com';
      
      const affiliateLink = await AffiliateTrackingService.generateAffiliateLink(
        testPartner._id.toString(),
        testLoanProduct._id.toString(),
        baseUrl,
        {
          source: 'loan_comparison',
          medium: 'web',
          campaign: 'personal_loan'
        }
      );

      expect(affiliateLink).toContain('/api/affiliate/redirect');
      expect(affiliateLink).toContain(`p=${testPartner._id}`);
      expect(affiliateLink).toContain(`pr=${testLoanProduct._id}`);
      expect(affiliateLink).toContain('utm_source=loan_comparison');
      expect(affiliateLink).toContain('utm_medium=web');
      expect(affiliateLink).toContain('utm_campaign=personal_loan');
    });

    it('should fail to generate link for inactive partner', async () => {
      // Deactivate partner
      await AffiliatePartner.findByIdAndUpdate(testPartner._id, { isActive: false });

      await expect(
        AffiliateTrackingService.generateAffiliateLink(
          testPartner._id.toString(),
          testLoanProduct._id.toString(),
          'https://testplatform.com'
        )
      ).rejects.toThrow('Partner not found or inactive');
    });

    it('should fail to generate link for inactive product', async () => {
      // Deactivate product
      await Product.findByIdAndUpdate(testLoanProduct._id, { isActive: false });

      await expect(
        AffiliateTrackingService.generateAffiliateLink(
          testPartner._id.toString(),
          testLoanProduct._id.toString(),
          'https://testplatform.com'
        )
      ).rejects.toThrow('Product not found or inactive');
    });
  });

  describe('Click Tracking', () => {
    it('should track affiliate click for loan product', async () => {
      trackingId = await AffiliateTrackingService.trackClick({
        partnerId: testPartner._id.toString(),
        productId: testLoanProduct._id.toString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referrer: 'https://google.com',
        utmSource: 'loan_comparison',
        utmMedium: 'web',
        utmCampaign: 'personal_loan'
      });

      expect(trackingId).toBeDefined();
      expect(typeof trackingId).toBe('string');

      // Verify click was stored
      const click = await AffiliateClick.findOne({ trackingId });
      expect(click).toBeDefined();
      expect(click!.partnerId.toString()).toBe(testPartner._id.toString());
      expect(click!.productId.toString()).toBe(testLoanProduct._id.toString());
      expect(click!.utmSource).toBe('loan_comparison');
      expect(click!.converted).toBe(false);
    });

    it('should process redirect and track click', async () => {
      const result = await AffiliateTrackingService.processRedirect(
        testPartner._id.toString(),
        testLoanProduct._id.toString(),
        {
          ip: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://testplatform.com',
          utmSource: 'loan_search',
          utmMedium: 'web',
          utmCampaign: 'personal_loan_promo'
        }
      );

      expect(result.trackingId).toBeDefined();
      expect(result.redirectUrl).toContain('testloanpartner.com/apply');
      expect(result.redirectUrl).toContain(`ref=${result.trackingId}`);
      expect(result.redirectUrl).toContain('utm_source=loan_search');

      // Verify click was tracked
      const click = await AffiliateClick.findOne({ trackingId: result.trackingId });
      expect(click).toBeDefined();
      expect(click!.utmSource).toBe('loan_search');
    });
  });

  describe('Conversion Tracking', () => {
    beforeEach(async () => {
      // Create a tracked click for conversion testing
      trackingId = await AffiliateTrackingService.trackClick({
        partnerId: testPartner._id.toString(),
        productId: testLoanProduct._id.toString(),
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        referrer: 'https://testplatform.com'
      });
    });

    it('should record loan application conversion', async () => {
      const success = await AffiliateTrackingService.recordConversion({
        trackingId,
        conversionType: 'application_submitted',
        conversionValue: 200000,
        metadata: {
          loanAmount: 200000,
          interestRate: 12.5,
          tenure: 24,
          loanType: 'personal_loan'
        }
      });

      expect(success).toBe(true);

      // Verify conversion was recorded
      const click = await AffiliateClick.findOne({ trackingId });
      expect(click!.converted).toBe(true);
      expect(click!.conversionDate).toBeDefined();
      expect(click!.commissionAmount).toBeGreaterThan(0);
    });

    it('should calculate correct commission for percentage-based structure', async () => {
      const loanAmount = 500000;
      const expectedCommission = (loanAmount * testPartner.commissionStructure.amount) / 100;

      await AffiliateTrackingService.recordConversion({
        trackingId,
        conversionType: 'loan_disbursed',
        conversionValue: loanAmount
      });

      const click = await AffiliateClick.findOne({ trackingId });
      expect(click!.commissionAmount).toBe(expectedCommission);
    });

    it('should fail to convert already converted click', async () => {
      // First conversion
      await AffiliateTrackingService.recordConversion({
        trackingId,
        conversionType: 'application_submitted',
        conversionValue: 100000
      });

      // Second conversion should fail
      await expect(
        AffiliateTrackingService.recordConversion({
          trackingId,
          conversionType: 'loan_disbursed',
          conversionValue: 100000
        })
      ).rejects.toThrow('already converted');
    });

    it('should fail to convert click outside attribution window', async () => {
      // Update click to be older than attribution window
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago, beyond 30-day window

      await AffiliateClick.findOneAndUpdate(
        { trackingId },
        { clickedAt: oldDate }
      );

      await expect(
        AffiliateTrackingService.recordConversion({
          trackingId,
          conversionType: 'application_submitted',
          conversionValue: 100000
        })
      ).rejects.toThrow('attribution window');
    });
  });

  describe('Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create multiple clicks and conversions for analytics testing
      const clicks = [];
      for (let i = 0; i < 5; i++) {
        const clickTrackingId = await AffiliateTrackingService.trackClick({
          partnerId: testPartner._id.toString(),
          productId: testLoanProduct._id.toString(),
          ipAddress: `192.168.1.${i + 10}`,
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://testplatform.com'
        });
        clicks.push(clickTrackingId);
      }

      // Convert some clicks
      for (let i = 0; i < 3; i++) {
        await AffiliateTrackingService.recordConversion({
          trackingId: clicks[i],
          conversionType: 'application_submitted',
          conversionValue: (i + 1) * 100000
        });
      }
    });

    it('should get partner analytics', async () => {
      const analytics = await AffiliateTrackingService.getPartnerAnalytics(
        testPartner._id.toString()
      );

      expect(analytics.partnerId).toBe(testPartner._id.toString());
      expect(analytics.partnerName).toBe('Test Loan Partner');
      expect(analytics.totalClicks).toBeGreaterThanOrEqual(5);
      expect(analytics.totalConversions).toBeGreaterThanOrEqual(3);
      expect(analytics.conversionRate).toBeGreaterThan(0);
      expect(analytics.totalCommission).toBeGreaterThan(0);
      expect(analytics.topProducts).toHaveLength(1);
      expect(analytics.topProducts[0].productName).toBe('Test Personal Loan Product');
    });

    it('should get overall analytics', async () => {
      const analytics = await AffiliateTrackingService.getOverallAnalytics();

      expect(analytics).toBeDefined();
      expect(Array.isArray(analytics)).toBe(true);
    });

    it('should get analytics with date filtering', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const analytics = await AffiliateTrackingService.getPartnerAnalytics(
        testPartner._id.toString(),
        startDate,
        endDate
      );

      expect(analytics.partnerId).toBe(testPartner._id.toString());
      expect(analytics.totalClicks).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fraud Detection', () => {
    it('should detect suspicious click patterns', async () => {
      const suspiciousTrackingId = await AffiliateTrackingService.trackClick({
        partnerId: testPartner._id.toString(),
        productId: testLoanProduct._id.toString(),
        ipAddress: '192.168.1.100',
        userAgent: 'bot/1.0',
        referrer: undefined
      });

      const fraudCheck = await AffiliateTrackingService.detectFraud(suspiciousTrackingId);

      expect(fraudCheck.riskScore).toBeGreaterThan(0);
      expect(fraudCheck.reasons.length).toBeGreaterThan(0);
      expect(fraudCheck.reasons).toContain('Bot-like user agent detected');
      expect(fraudCheck.reasons).toContain('Missing referrer information');
    });

    it('should detect multiple clicks from same IP', async () => {
      const sameIP = '192.168.1.200';
      const trackingIds = [];

      // Create multiple clicks from same IP
      for (let i = 0; i < 12; i++) {
        const trackingId = await AffiliateTrackingService.trackClick({
          partnerId: testPartner._id.toString(),
          productId: testLoanProduct._id.toString(),
          ipAddress: sameIP,
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://testplatform.com'
        });
        trackingIds.push(trackingId);
      }

      const fraudCheck = await AffiliateTrackingService.detectFraud(trackingIds[11]);

      expect(fraudCheck.riskScore).toBeGreaterThan(30);
      expect(fraudCheck.reasons).toContain('Multiple clicks from same IP address');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid partner ID', async () => {
      await expect(
        AffiliateTrackingService.trackClick({
          partnerId: 'invalid-id',
          productId: testLoanProduct._id.toString(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test Browser)'
        })
      ).rejects.toThrow('Invalid partner ID');
    });

    it('should handle invalid product ID', async () => {
      await expect(
        AffiliateTrackingService.trackClick({
          partnerId: testPartner._id.toString(),
          productId: 'invalid-id',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test Browser)'
        })
      ).rejects.toThrow('Invalid product ID');
    });

    it('should handle non-existent tracking ID for conversion', async () => {
      await expect(
        AffiliateTrackingService.recordConversion({
          trackingId: 'non-existent-id',
          conversionType: 'application_submitted',
          conversionValue: 100000
        })
      ).rejects.toThrow('Tracking ID not found');
    });
  });
});