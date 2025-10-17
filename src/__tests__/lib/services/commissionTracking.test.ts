import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  getCommissionSummary,
  getPartnerCommissionDetails,
  markCommissionsAsPaid,
  generateCommissionReport,
} from '@/lib/services/commissionTracking';
import AffiliateClick from '@/models/AffiliateClick';
import AffiliatePartner from '@/models/AffiliatePartner';
import Product from '@/models/Product';

describe('Commission Tracking Service', () => {
  let mongoServer: MongoMemoryServer;
  let partnerId: mongoose.Types.ObjectId;
  let productId: mongoose.Types.ObjectId;
  let commissionIds: string[];

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
      features: [],
      eligibility: [],
      fees: [],
      applicationUrl: 'https://example.com/apply',
      isActive: true,
      priority: 1,
      description: 'Test loan product',
      termsAndConditions: 'Test terms',
      processingTime: '2-3 days',
    });
    await product.save();
    productId = product._id;

    // Create test commission records
    const commissions = [];
    commissionIds = [];

    for (let i = 0; i < 5; i++) {
      const commission = new AffiliateClick({
        trackingId: `track_${i}`,
        partnerId: partner._id,
        productId: product._id,
        clickedAt: new Date('2024-01-01'),
        conversionDate: new Date('2024-01-01'),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        referrer: 'https://test.com',
        converted: true,
        commissionAmount: 100 + i * 50, // 100, 150, 200, 250, 300
        paymentStatus: i < 2 ? 'paid' : 'pending', // First 2 are paid
      });
      
      await commission.save();
      commissions.push(commission);
      commissionIds.push(commission._id.toString());
    }
  });

  describe('getCommissionSummary', () => {
    it('should calculate commission summary correctly', async () => {
      const summary = await getCommissionSummary();

      expect(summary).toHaveLength(1);
      expect(summary[0].partnerId).toBe(partnerId.toString());
      expect(summary[0].partnerName).toBe('Test Partner');
      expect(summary[0].totalCommission).toBe(1000); // 100+150+200+250+300
      expect(summary[0].paidCommission).toBe(250); // 100+150
      expect(summary[0].pendingCommission).toBe(750); // 200+250+300
      expect(summary[0].conversions).toBe(5);
      expect(summary[0].averageCommission).toBe(200); // 1000/5
    });

    it('should filter by date range', async () => {
      // Add commission from different date
      await AffiliateClick.create({
        trackingId: 'track_old',
        partnerId: partnerId,
        productId: productId,
        clickedAt: new Date('2023-01-01'),
        conversionDate: new Date('2023-01-01'),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        referrer: 'https://test.com',
        converted: true,
        commissionAmount: 500,
        paymentStatus: 'pending',
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const summary = await getCommissionSummary(startDate, endDate);

      expect(summary).toHaveLength(1);
      expect(summary[0].totalCommission).toBe(1000); // Should not include the 500 from 2023
    });

    it('should return empty array when no commissions exist', async () => {
      await AffiliateClick.deleteMany({});
      
      const summary = await getCommissionSummary();
      
      expect(summary).toHaveLength(0);
    });
  });

  describe('getPartnerCommissionDetails', () => {
    it('should return paginated commission details', async () => {
      const result = await getPartnerCommissionDetails(partnerId.toString(), 1, 3);

      expect(result.commissions).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
      expect(result.commissions[0].partnerId).toBe(partnerId.toString());
      expect(result.commissions[0].commissionAmount).toBeDefined();
      expect(result.commissions[0].paymentStatus).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const page1 = await getPartnerCommissionDetails(partnerId.toString(), 1, 2);
      const page2 = await getPartnerCommissionDetails(partnerId.toString(), 2, 2);

      expect(page1.commissions).toHaveLength(2);
      expect(page2.commissions).toHaveLength(2);
      expect(page1.commissions[0].clickId).not.toBe(page2.commissions[0].clickId);
    });

    it('should throw error for invalid partner ID', async () => {
      await expect(
        getPartnerCommissionDetails('invalid-id', 1, 10)
      ).rejects.toThrow('Invalid partner ID');
    });
  });

  describe('markCommissionsAsPaid', () => {
    it('should mark pending commissions as paid', async () => {
      // Get pending commission IDs (last 3 commissions)
      const pendingIds = commissionIds.slice(2);

      const result = await markCommissionsAsPaid(
        pendingIds,
        'PAY-123456',
        'bank_transfer',
        'Bulk payment for January'
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
      expect(result.totalAmount).toBe(750); // 200+250+300

      // Verify commissions are marked as paid
      const updatedCommissions = await AffiliateClick.find({
        _id: { $in: pendingIds.map(id => new mongoose.Types.ObjectId(id)) }
      });

      updatedCommissions.forEach(commission => {
        expect(commission.paymentStatus).toBe('paid');
        expect(commission.paymentReference).toBe('PAY-123456');
        expect(commission.paymentMethod).toBe('bank_transfer');
        expect(commission.paymentDate).toBeDefined();
      });
    });

    it('should not update already paid commissions', async () => {
      // Try to mark already paid commissions
      const paidIds = commissionIds.slice(0, 2);

      const result = await markCommissionsAsPaid(
        paidIds,
        'PAY-789012',
        'bank_transfer'
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0); // No updates because already paid
      expect(result.totalAmount).toBe(0);
    });

    it('should throw error for invalid commission IDs', async () => {
      await expect(
        markCommissionsAsPaid(['invalid-id'], 'PAY-123', 'bank_transfer')
      ).rejects.toThrow('Some commission IDs are invalid');
    });

    it('should throw error when no eligible commissions found', async () => {
      await expect(
        markCommissionsAsPaid(['507f1f77bcf86cd799439011'], 'PAY-123', 'bank_transfer')
      ).rejects.toThrow('No eligible commissions found');
    });
  });

  describe('generateCommissionReport', () => {
    it('should generate comprehensive commission report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const report = await generateCommissionReport(startDate, endDate);

      expect(report.summary.totalCommissions).toBe(5);
      expect(report.summary.totalAmount).toBe(1000);
      expect(report.summary.paidAmount).toBe(250);
      expect(report.summary.pendingAmount).toBe(750);
      expect(report.summary.averageCommission).toBe(200);

      expect(report.partnerBreakdown).toHaveLength(1);
      expect(report.partnerBreakdown[0].partnerId).toBe(partnerId.toString());

      expect(report.dailyBreakdown).toHaveLength(1);
      expect(report.dailyBreakdown[0].date).toBe('2024-01-01');
      expect(report.dailyBreakdown[0].commissions).toBe(5);
      expect(report.dailyBreakdown[0].amount).toBe(1000);
    });

    it('should filter by partner ID', async () => {
      // Create another partner with commissions
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

      await AffiliateClick.create({
        trackingId: 'track_partner2',
        partnerId: partner2._id,
        productId: productId,
        clickedAt: new Date('2024-01-01'),
        conversionDate: new Date('2024-01-01'),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        referrer: 'https://test.com',
        converted: true,
        commissionAmount: 300,
        paymentStatus: 'pending',
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const report = await generateCommissionReport(startDate, endDate, partnerId.toString());

      expect(report.summary.totalCommissions).toBe(5); // Only original partner's commissions
      expect(report.summary.totalAmount).toBe(1000);
      expect(report.partnerBreakdown).toHaveLength(0); // No breakdown when filtering by partner
    });

    it('should return zero values for date range with no data', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const report = await generateCommissionReport(startDate, endDate);

      expect(report.summary.totalCommissions).toBe(0);
      expect(report.summary.totalAmount).toBe(0);
      expect(report.summary.paidAmount).toBe(0);
      expect(report.summary.pendingAmount).toBe(0);
      expect(report.summary.averageCommission).toBe(0);
      expect(report.partnerBreakdown).toHaveLength(0);
      expect(report.dailyBreakdown).toHaveLength(0);
    });
  });
});