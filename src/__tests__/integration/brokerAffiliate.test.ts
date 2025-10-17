import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createServer } from 'http';
import { NextApiHandler } from 'next';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';
import AffiliateClick from '@/models/AffiliateClick';

// Mock Next.js API route handler
const createTestServer = (handler: NextApiHandler) => {
  return createServer((req, res) => {
    // Parse URL and method
    const url = new URL(req.url || '', 'http://localhost');
    const mockRequest = {
      ...req,
      query: Object.fromEntries(url.searchParams),
      body: {},
    } as any;

    // Parse JSON body for POST requests
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          mockRequest.body = JSON.parse(body);
        } catch (e) {
          mockRequest.body = {};
        }
        handler(mockRequest, res);
      });
    } else {
      handler(mockRequest, res);
    }
  });
};

describe('Broker Affiliate Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testPartner: any;
  let testProduct: any;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Promise.all([
      AffiliatePartner.deleteMany({}),
      Product.deleteMany({}),
      AffiliateClick.deleteMany({}),
    ]);

    // Create test partner
    testPartner = await AffiliatePartner.create({
      name: 'Test Broker',
      type: 'broker',
      logoUrl: 'https://example.com/logo.png',
      description: 'Test broker for integration tests',
      website: 'https://testbroker.com',
      contactEmail: 'test@testbroker.com',
      commissionStructure: {
        type: 'fixed',
        amount: 500,
        currency: 'INR',
      },
      trackingConfig: {
        conversionGoals: ['account_opened', 'first_transaction'],
        attributionWindow: 30,
      },
      isActive: true,
    });

    // Create test product
    testProduct = await Product.create({
      partnerId: testPartner._id,
      name: 'Test Broker Account',
      type: 'broker_account',
      accountTypes: ['demat', 'trading'],
      brokerage: {
        equity: {
          delivery: 0,
          intraday: 0.03,
          isPercentage: true,
        },
        derivatives: {
          futures: 20,
          options: 20,
          isPercentage: false,
        },
        currency: {
          rate: 0.03,
          isPercentage: true,
        },
        commodity: {
          rate: 0.03,
          isPercentage: true,
        },
      },
      accountCharges: {
        opening: 0,
        maintenance: 300,
        demat: 0,
      },
      platforms: {
        web: true,
        mobile: true,
        desktop: false,
        api: true,
      },
      sebiRegistration: {
        number: 'INZ000031633',
        validUntil: new Date('2025-12-31'),
        isActive: true,
      },
      researchReports: true,
      marginFunding: true,
      ipoAccess: true,
      mutualFunds: true,
      bonds: false,
      rating: 4.5,
      userReviews: 1250,
      features: [],
      eligibility: [],
      fees: [],
      applicationUrl: 'https://testbroker.com/apply',
      isActive: true,
      priority: 90,
      description: 'Test broker account',
      termsAndConditions: 'Test terms',
      processingTime: '24 hours',
    });
  });

  describe('Affiliate Link Generation', () => {
    it('should generate affiliate link for broker product', async () => {
      // Import the API handler
      const handler = require('@/app/api/brokers/[id]/affiliate-link/route').POST;
      const server = createTestServer(handler);

      const response = await request(server)
        .post(`/api/brokers/${testProduct._id}/affiliate-link`)
        .send({
          userId: 'test-user-123',
          source: 'broker_directory',
        })
        .expect(200);

      expect(response.body).toHaveProperty('trackingId');
      expect(response.body).toHaveProperty('trackingUrl');
      expect(response.body.trackingUrl).toContain('testbroker.com/apply');
      expect(response.body.trackingUrl).toContain('ref=');
      expect(response.body.partnerId).toBe(testPartner._id.toString());
      expect(response.body.productId).toBe(testProduct._id.toString());

      // Verify affiliate click record was created
      const affiliateClick = await AffiliateClick.findOne({
        trackingId: response.body.trackingId,
      });
      expect(affiliateClick).toBeTruthy();
      expect(affiliateClick?.partnerId.toString()).toBe(testPartner._id.toString());
      expect(affiliateClick?.productId.toString()).toBe(testProduct._id.toString());
      expect(affiliateClick?.converted).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const handler = require('@/app/api/brokers/[id]/affiliate-link/route').POST;
      const server = createTestServer(handler);

      const fakeId = new mongoose.Types.ObjectId();
      await request(server)
        .post(`/api/brokers/${fakeId}/affiliate-link`)
        .send({
          source: 'broker_directory',
        })
        .expect(404);
    });

    it('should return 404 for inactive partner', async () => {
      // Deactivate partner
      await AffiliatePartner.findByIdAndUpdate(testPartner._id, { isActive: false });

      const handler = require('@/app/api/brokers/[id]/affiliate-link/route').POST;
      const server = createTestServer(handler);

      await request(server)
        .post(`/api/brokers/${testProduct._id}/affiliate-link`)
        .send({
          source: 'broker_directory',
        })
        .expect(404);
    });
  });

  describe('Application Tracking', () => {
    let trackingId: string;
    let affiliateClick: any;

    beforeEach(async () => {
      // Create an affiliate click record
      affiliateClick = await AffiliateClick.create({
        trackingId: 'test-tracking-123',
        partnerId: testPartner._id,
        productId: testProduct._id,
        clickedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        referrer: 'https://example.com',
        converted: false,
      });
      trackingId = affiliateClick.trackingId;
    });

    it('should track application initiation', async () => {
      const handler = require('@/app/api/brokers/track-application/route').POST;
      const server = createTestServer(handler);

      const response = await request(server)
        .post('/api/brokers/track-application')
        .send({
          trackingId,
          status: 'initiated',
          accountTypes: ['demat', 'trading'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.trackingId).toBe(trackingId);
      expect(response.body.status).toBe('initiated');

      // Verify database update
      const updatedClick = await AffiliateClick.findOne({ trackingId });
      expect(updatedClick?.applicationInitiated).toBe(true);
      expect(updatedClick?.applicationInitiatedAt).toBeTruthy();
    });

    it('should track successful conversion', async () => {
      const handler = require('@/app/api/brokers/track-application/route').POST;
      const server = createTestServer(handler);

      const response = await request(server)
        .post('/api/brokers/track-application')
        .send({
          trackingId,
          status: 'approved',
          accountTypes: ['demat', 'trading'],
          conversionValue: 1000,
          applicationData: {
            accountNumber: 'ACC123456',
            approvalDate: new Date().toISOString(),
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.converted).toBe(true);
      expect(response.body.commissionAmount).toBe(500); // Fixed commission from partner

      // Verify database update
      const updatedClick = await AffiliateClick.findOne({ trackingId });
      expect(updatedClick?.converted).toBe(true);
      expect(updatedClick?.conversionDate).toBeTruthy();
      expect(updatedClick?.commissionAmount).toBe(500);
      expect(updatedClick?.conversionData).toHaveProperty('accountNumber', 'ACC123456');
    });

    it('should track application rejection', async () => {
      const handler = require('@/app/api/brokers/track-application/route').POST;
      const server = createTestServer(handler);

      const response = await request(server)
        .post('/api/brokers/track-application')
        .send({
          trackingId,
          status: 'rejected',
          applicationData: {
            reason: 'Insufficient documents',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.converted).toBe(false);

      // Verify database update
      const updatedClick = await AffiliateClick.findOne({ trackingId });
      expect(updatedClick?.rejected).toBe(true);
      expect(updatedClick?.rejectedAt).toBeTruthy();
      expect(updatedClick?.rejectionReason).toBe('Insufficient documents');
    });

    it('should track first transaction', async () => {
      // First, mark as converted
      await AffiliateClick.findOneAndUpdate(
        { trackingId },
        { 
          converted: true, 
          conversionDate: new Date(),
          commissionAmount: 500 
        }
      );

      const handler = require('@/app/api/brokers/track-application/route').POST;
      const server = createTestServer(handler);

      const response = await request(server)
        .post('/api/brokers/track-application')
        .send({
          trackingId,
          status: 'first_transaction',
          conversionValue: 10000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify database update
      const updatedClick = await AffiliateClick.findOne({ trackingId });
      expect(updatedClick?.firstTransaction).toBe(true);
      expect(updatedClick?.firstTransactionAt).toBeTruthy();
      expect(updatedClick?.firstTransactionAmount).toBe(10000);
      // Should have additional commission (10% of conversion value)
      expect(updatedClick?.commissionAmount).toBeGreaterThan(500);
    });

    it('should return 404 for invalid tracking ID', async () => {
      const handler = require('@/app/api/brokers/track-application/route').POST;
      const server = createTestServer(handler);

      await request(server)
        .post('/api/brokers/track-application')
        .send({
          trackingId: 'invalid-tracking-id',
          status: 'initiated',
        })
        .expect(404);
    });

    it('should retrieve tracking status', async () => {
      // Update the click with some status
      await AffiliateClick.findOneAndUpdate(
        { trackingId },
        { 
          applicationInitiated: true,
          applicationInitiatedAt: new Date(),
        }
      );

      const handler = require('@/app/api/brokers/track-application/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get(`/api/brokers/track-application?trackingId=${trackingId}`)
        .expect(200);

      expect(response.body.trackingId).toBe(trackingId);
      expect(response.body.status).toBe('initiated');
      expect(response.body.converted).toBe(false);
      expect(response.body.partner).toHaveProperty('name', 'Test Broker');
      expect(response.body.product).toHaveProperty('name', 'Test Broker Account');
    });
  });

  describe('Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create sample data for analytics
      const clicks = [
        {
          trackingId: 'click-1',
          partnerId: testPartner._id,
          productId: testProduct._id,
          clickedAt: new Date('2024-01-01'),
          converted: true,
          conversionDate: new Date('2024-01-02'),
          commissionAmount: 500,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          referrer: 'https://example.com',
        },
        {
          trackingId: 'click-2',
          partnerId: testPartner._id,
          productId: testProduct._id,
          clickedAt: new Date('2024-01-01'),
          converted: false,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          referrer: 'https://example.com',
        },
        {
          trackingId: 'click-3',
          partnerId: testPartner._id,
          productId: testProduct._id,
          clickedAt: new Date('2024-01-02'),
          converted: true,
          conversionDate: new Date('2024-01-03'),
          commissionAmount: 500,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          referrer: 'https://example.com',
        },
      ];

      await AffiliateClick.insertMany(clicks);
    });

    it('should generate summary analytics', async () => {
      const handler = require('@/app/api/brokers/analytics/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get('/api/brokers/analytics?type=summary')
        .expect(200);

      expect(response.body.reportType).toBe('summary');
      expect(response.body.summary).toHaveProperty('totalClicks', 3);
      expect(response.body.summary).toHaveProperty('totalConversions', 2);
      expect(response.body.summary).toHaveProperty('conversionRate', 66.67);
      expect(response.body.summary).toHaveProperty('totalCommissions', 1000);
      expect(response.body.partnerStats).toHaveLength(1);
      expect(response.body.partnerStats[0]).toHaveProperty('partnerName', 'Test Broker');
    });

    it('should generate performance analytics', async () => {
      const handler = require('@/app/api/brokers/analytics/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get('/api/brokers/analytics?type=performance')
        .expect(200);

      expect(response.body.reportType).toBe('performance');
      expect(response.body.performance).toHaveProperty('clicksTrend');
      expect(response.body.performance).toHaveProperty('conversionsTrend');
      expect(response.body.performance).toHaveProperty('topProducts');
      expect(response.body.performance).toHaveProperty('deviceStats');
    });

    it('should generate conversion analytics', async () => {
      const handler = require('@/app/api/brokers/analytics/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get('/api/brokers/analytics?type=conversions')
        .expect(200);

      expect(response.body.reportType).toBe('conversions');
      expect(response.body.conversions).toHaveProperty('funnel');
      expect(response.body.conversions.funnel).toHaveProperty('totalClicks', 3);
      expect(response.body.conversions.funnel).toHaveProperty('approved', 2);
    });

    it('should generate commission analytics', async () => {
      const handler = require('@/app/api/brokers/analytics/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get('/api/brokers/analytics?type=commissions')
        .expect(200);

      expect(response.body.reportType).toBe('commissions');
      expect(response.body.commissions).toHaveProperty('byPartner');
      expect(response.body.commissions).toHaveProperty('byMonth');
      expect(response.body.commissions).toHaveProperty('byProduct');
      expect(response.body.commissions.byPartner[0]).toHaveProperty('totalCommission', 1000);
    });

    it('should filter analytics by date range', async () => {
      const handler = require('@/app/api/brokers/analytics/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get('/api/brokers/analytics?type=summary&startDate=2024-01-02&endDate=2024-01-02')
        .expect(200);

      // Should only include clicks from 2024-01-02
      expect(response.body.summary.totalClicks).toBe(1);
    });

    it('should filter analytics by partner', async () => {
      const handler = require('@/app/api/brokers/analytics/route').GET;
      const server = createTestServer(handler);

      const response = await request(server)
        .get(`/api/brokers/analytics?type=summary&partnerId=${testPartner._id}`)
        .expect(200);

      expect(response.body.summary.totalClicks).toBe(3);
      expect(response.body.partnerStats).toHaveLength(1);
    });
  });
});