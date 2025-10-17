import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  getOverallMetrics,
  getPartnerPerformance,
  getProductPerformance,
  getDailyMetrics,
  exportPerformanceData,
} from '@/lib/services/affiliateAnalytics';
import AffiliateClick from '@/models/AffiliateClick';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';

describe('Affiliate Analytics Service', () => {
  let mongoServer: MongoMemoryServer;
  let partnerId: mongoose.Types.ObjectId;
  let productId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up collections
    await AffiliateClick.deleteMany({});
    await AffiliatePartner.deleteMany({});
    await Product.deleteMany({});

    // Create test partner
    const partner = new AffiliatePartner({
      name: 'Test Partner',
      type: 'loan',
      commissionStructure: {
        type: 'percentage',
        amount: 5,
        currency: 'INR',
      },
      isActive: true,
      logoUrl: 'https://example.com/logo.png',
      description: 'Test partner description',
      website: 'https://example.com',
      contactEmail: 'contact@example.com',
      trackingConfig: {
        conversionGoals: ['application'],
        attributionWindow: 30,
      },
      products: [],
    });
    await partner.save();
    partnerId = partner._id;

    // Create test product
    const product = new Product({
      partnerId: partner._id,
      name: 'Test Loan Product',
      type: 'personal_loan',
      features: [
        { name: 'Interest Rate', value: '10.5%' },
        { name: 'Processing Fee', value: '1%' },
      ],
      eligibility: [
        { type: 'age', description: 'Age 21-65', minValue: 21, maxValue: 65 },
        { type: 'income', description: 'Min income 25000', minValue: 25000 },
      ],
      fees: [
        { type: 'processing', amount: 1, description: 'Processing fee', isPercentage: true },
      ],
      applicationUrl: 'https://example.com/apply',
      isActive: true,
      priority: 1,
      description: 'Test loan product',
      termsAndConditions: 'Test terms',
      processingTime: '2-3 days',
      minAmount: 50000,
      maxAmount: 1000000,
    });
    await product.save();
    productId = product._id;

    // Create test affiliate clicks
    const baseDate = new Date('2024-01-01');
    const clicks = [];

    for (let i = 0; i < 10; i++) {
      const clickDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
      const converted = i % 3 === 0; // Every 3rd click converts

      clicks.push({
        trackingId: `track_${i}`,
        partnerId: partner._id,
        productId: product._id,
        clickedAt: clickDate,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        referrer: 'https://test.com',
        converted,
        conversionDate: converted ? clickDate : undefined,
        commissionAmount: converted ? 100 + i * 10 : 0,
      });
    }

    await AffiliateClick.insertMany(clicks);
  });

  describe('getOverallMetrics', () => {
    it('should calculate overall metrics correctly', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const metrics = await getOverallMetrics(dateRange);

      expect(metrics.totalClicks).toBe(10);
      expect(metrics.totalConversions).toBe(4); // Clicks 0, 3, 6, 9 convert
      expect(metrics.conversionRate).toBeCloseTo(40, 1); // 4/10 * 100
      expect(metrics.totalCommission).toBe(460); // 100 + 130 + 160 + 190
      expect(metrics.averageCommission).toBe(115); // 460/4
    });

    it('should return zero metrics for date range with no data', async () => {
      const dateRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-10'),
      };

      const metrics = await getOverallMetrics(dateRange);

      expect(metrics.totalClicks).toBe(0);
      expect(metrics.totalConversions).toBe(0);
      expect(metrics.conversionRate).toBe(0);
      expect(metrics.totalCommission).toBe(0);
      expect(metrics.averageCommission).toBe(0);
    });
  });

  describe('getPartnerPerformance', () => {
    it('should return partner performance with trends', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const performance = await getPartnerPerformance(dateRange, 10);

      expect(performance).toHaveLength(1);
      expect(performance[0].partnerId).toBe(partnerId.toString());
      expect(performance[0].partnerName).toBe('Test Partner');
      expect(performance[0].partnerType).toBe('loan');
      expect(performance[0].metrics.totalClicks).toBe(10);
      expect(performance[0].metrics.totalConversions).toBe(4);
      expect(performance[0].metrics.totalCommission).toBe(460);
      expect(performance[0].trends).toBeDefined();
    });

    it('should limit results correctly', async () => {
      // Create another partner
      const partner2 = new AffiliatePartner({
        name: 'Test Partner 2',
        type: 'credit_card',
        commissionStructure: {
          type: 'fixed',
          amount: 50,
          currency: 'INR',
        },
        isActive: true,
        logoUrl: 'https://example2.com/logo.png',
        description: 'Test partner 2 description',
        website: 'https://example2.com',
        contactEmail: 'contact@example2.com',
        trackingConfig: {
          conversionGoals: ['application'],
          attributionWindow: 30,
        },
        products: [],
      });
      await partner2.save();

      // Add clicks for second partner
      await AffiliateClick.create({
        trackingId: 'track_partner2',
        partnerId: partner2._id,
        productId: productId,
        clickedAt: new Date('2024-01-05'),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        referrer: 'https://test.com',
        converted: true,
        conversionDate: new Date('2024-01-05'),
        commissionAmount: 200,
      });

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const performance = await getPartnerPerformance(dateRange, 1);

      expect(performance).toHaveLength(1);
      // Should return the partner with highest commission (Test Partner with 460)
      expect(performance[0].partnerName).toBe('Test Partner');
    });
  });

  describe('getProductPerformance', () => {
    it('should return product performance metrics', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const performance = await getProductPerformance(dateRange, undefined, 10);

      expect(performance).toHaveLength(1);
      expect(performance[0].productId).toBe(productId.toString());
      expect(performance[0].productName).toBe('Test Loan Product');
      expect(performance[0].productType).toBe('personal_loan');
      expect(performance[0].partnerId).toBe(partnerId.toString());
      expect(performance[0].partnerName).toBe('Test Partner');
      expect(performance[0].metrics.totalClicks).toBe(10);
      expect(performance[0].metrics.totalConversions).toBe(4);
      expect(performance[0].metrics.totalCommission).toBe(460);
    });

    it('should filter by partner ID', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const performance = await getProductPerformance(dateRange, partnerId.toString(), 10);

      expect(performance).toHaveLength(1);
      expect(performance[0].partnerId).toBe(partnerId.toString());
    });
  });

  describe('getDailyMetrics', () => {
    it('should return daily metrics with filled dates', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      };

      const dailyMetrics = await getDailyMetrics(dateRange);

      expect(dailyMetrics).toHaveLength(5); // 5 days
      expect(dailyMetrics[0].date).toBe('2024-01-01');
      expect(dailyMetrics[0].clicks).toBe(1);
      expect(dailyMetrics[0].conversions).toBe(1); // Click 0 converts
      expect(dailyMetrics[0].commission).toBe(100);

      expect(dailyMetrics[1].date).toBe('2024-01-02');
      expect(dailyMetrics[1].clicks).toBe(1);
      expect(dailyMetrics[1].conversions).toBe(0); // Click 1 doesn't convert
      expect(dailyMetrics[1].commission).toBe(0);
    });

    it('should fill missing dates with zero values', async () => {
      // Clear all clicks
      await AffiliateClick.deleteMany({});

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      };

      const dailyMetrics = await getDailyMetrics(dateRange);

      expect(dailyMetrics).toHaveLength(3);
      dailyMetrics.forEach(metric => {
        expect(metric.clicks).toBe(0);
        expect(metric.conversions).toBe(0);
        expect(metric.commission).toBe(0);
        expect(metric.conversionRate).toBe(0);
      });
    });
  });

  describe('exportPerformanceData', () => {
    it('should export partners data as CSV', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const csvData = await exportPerformanceData(dateRange, 'partners');

      expect(csvData).toContain('Partner ID,Partner Name,Partner Type');
      expect(csvData).toContain('Test Partner');
      expect(csvData).toContain('loan');
      expect(csvData).toContain('10'); // Total clicks
      expect(csvData).toContain('4'); // Total conversions
      expect(csvData).toContain('460.00'); // Total commission
    });

    it('should export products data as CSV', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
      };

      const csvData = await exportPerformanceData(dateRange, 'products');

      expect(csvData).toContain('Product ID,Product Name,Product Type');
      expect(csvData).toContain('Test Loan Product');
      expect(csvData).toContain('personal_loan');
      expect(csvData).toContain('Test Partner');
    });

    it('should export daily data as CSV', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      };

      const csvData = await exportPerformanceData(dateRange, 'daily');

      expect(csvData).toContain('Date,Total Clicks,Total Conversions');
      expect(csvData).toContain('2024-01-01');
      expect(csvData).toContain('2024-01-02');
      expect(csvData).toContain('2024-01-03');
    });
  });
});