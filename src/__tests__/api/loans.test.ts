import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { connectToDatabase } from '@/lib/database';
import { AffiliatePartner, Product } from '@/models';
import mongoose from 'mongoose';

// Mock Next.js request/response for API testing
const mockRequest = (method: string, url: string, body?: any, headers?: Record<string, string>) => ({
  method,
  url,
  json: async () => body || {},
  headers: new Map(Object.entries(headers || {})),
  ip: '192.168.1.1'
});

const mockResponse = () => {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.data = data;
    return res;
  };
  return res;
};

describe('Loan API Endpoints', () => {
  let testPartner: any;
  let testLoanProduct: any;

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

    // Create test data
    testPartner = await AffiliatePartner.create({
      name: 'Test Loan Partner API',
      type: 'loan',
      logoUrl: 'https://example.com/logo.png',
      description: 'Test loan partner for API testing',
      website: 'https://testloanpartner.com',
      contactEmail: 'test@loanpartner.com',
      commissionStructure: {
        type: 'percentage',
        amount: 2.0,
        currency: 'INR'
      },
      trackingConfig: {
        conversionGoals: ['application_submitted', 'loan_approved'],
        attributionWindow: 30
      },
      isActive: true
    });

    testLoanProduct = await Product.create({
      partnerId: testPartner._id,
      name: 'Test Personal Loan Product API',
      type: 'personal_loan',
      features: [
        { name: 'Interest Rate', value: '11.5% - 22% p.a.' },
        { name: 'Loan Amount', value: '₹1,00,000 - ₹25,00,000' }
      ],
      eligibility: [
        { type: 'age', description: 'Age 21-60 years', minValue: 21, maxValue: 60 },
        { type: 'income', description: 'Min income ₹30,000/month', minValue: 360000 }
      ],
      interestRate: 15.5,
      fees: [
        { type: 'processing', amount: 1.5, description: 'Processing fee', isPercentage: true }
      ],
      applicationUrl: 'https://testloanpartner.com/apply',
      isActive: true,
      priority: 75,
      description: 'Test personal loan for API testing',
      termsAndConditions: 'Test terms and conditions',
      processingTime: '2-3 business days',
      minAmount: 100000,
      maxAmount: 2500000
    });
  });

  describe('GET /api/loans', () => {
    it('should fetch loan products successfully', async () => {
      // Import the API handler
      const { GET } = await import('@/app/api/loans/route');
      
      const request = mockRequest('GET', '/api/loans');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toBeDefined();
      expect(data.data.partners).toBeDefined();
      expect(Array.isArray(data.data.products)).toBe(true);
      expect(Array.isArray(data.data.partners)).toBe(true);
    });

    it('should filter loans by type', async () => {
      const { GET } = await import('@/app/api/loans/route');
      
      const request = mockRequest('GET', '/api/loans?loanType=personal_loan');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // All products should be personal loans
      data.data.products.forEach((product: any) => {
        expect(product.type).toBe('personal_loan');
      });
    });

    it('should filter loans by interest rate range', async () => {
      const { GET } = await import('@/app/api/loans/route');
      
      const request = mockRequest('GET', '/api/loans?minInterestRate=10&maxInterestRate=20');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // All products should have interest rate between 10-20%
      data.data.products.forEach((product: any) => {
        expect(product.interestRate).toBeGreaterThanOrEqual(10);
        expect(product.interestRate).toBeLessThanOrEqual(20);
      });
    });

    it('should filter loans by amount range', async () => {
      const { GET } = await import('@/app/api/loans/route');
      
      const request = mockRequest('GET', '/api/loans?minAmount=50000&maxAmount=1000000');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Products should support the requested amount range
      data.data.products.forEach((product: any) => {
        expect(product.maxAmount).toBeGreaterThanOrEqual(50000);
        expect(product.minAmount).toBeLessThanOrEqual(1000000);
      });
    });
  });

  describe('GET /api/loans/[id]', () => {
    it('should fetch specific loan product', async () => {
      const { GET } = await import('@/app/api/loans/[id]/route');
      
      const request = mockRequest('GET', `/api/loans/${testLoanProduct._id}`);
      const response = await GET(request as any, { params: { id: testLoanProduct._id.toString() } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.product).toBeDefined();
      expect(data.data.partner).toBeDefined();
      expect(data.data.product._id.toString()).toBe(testLoanProduct._id.toString());
    });

    it('should return 404 for non-existent loan product', async () => {
      const { GET } = await import('@/app/api/loans/[id]/route');
      
      const nonExistentId = new mongoose.Types.ObjectId();
      const request = mockRequest('GET', `/api/loans/${nonExistentId}`);
      const response = await GET(request as any, { params: { id: nonExistentId.toString() } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should return 400 for invalid product ID', async () => {
      const { GET } = await import('@/app/api/loans/[id]/route');
      
      const request = mockRequest('GET', '/api/loans/invalid-id');
      const response = await GET(request as any, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid product ID');
    });
  });

  describe('POST /api/loans/[id]/affiliate-link', () => {
    it('should generate affiliate link for loan product', async () => {
      const { POST } = await import('@/app/api/loans/[id]/affiliate-link/route');
      
      const request = mockRequest(
        'POST', 
        `/api/loans/${testLoanProduct._id}/affiliate-link`,
        { userId: 'test-user-123' },
        { 'host': 'localhost:3000', 'x-forwarded-proto': 'http' }
      );
      
      const response = await POST(request as any, { params: { id: testLoanProduct._id.toString() } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.trackingUrl).toBeDefined();
      expect(data.data.trackingId).toBeDefined();
      expect(data.data.product).toBeDefined();
      expect(data.data.partner).toBeDefined();
      expect(data.data.trackingUrl).toContain('/api/affiliate/redirect');
    });

    it('should return 404 for non-existent loan product', async () => {
      const { POST } = await import('@/app/api/loans/[id]/affiliate-link/route');
      
      const nonExistentId = new mongoose.Types.ObjectId();
      const request = mockRequest(
        'POST',
        `/api/loans/${nonExistentId}/affiliate-link`,
        {},
        { 'host': 'localhost:3000' }
      );
      
      const response = await POST(request as any, { params: { id: nonExistentId.toString() } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/loans/eligibility', () => {
    it('should check loan eligibility successfully', async () => {
      const { POST } = await import('@/app/api/loans/eligibility/route');
      
      const eligibilityCriteria = {
        age: 30,
        annualIncome: 600000,
        creditScore: 750,
        employmentType: 'salaried',
        workExperience: 5,
        existingLoans: 1
      };

      const request = mockRequest('POST', '/api/loans/eligibility', {
        criteria: eligibilityCriteria,
        productIds: [testLoanProduct._id.toString()]
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.eligibilityResults).toBeDefined();
      expect(Array.isArray(data.data.eligibilityResults)).toBe(true);
      expect(data.data.eligibilityResults.length).toBeGreaterThan(0);
      
      const result = data.data.eligibilityResults[0];
      expect(result.productId).toBeDefined();
      expect(typeof result.eligible).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should return validation error for invalid criteria', async () => {
      const { POST } = await import('@/app/api/loans/eligibility/route');
      
      const request = mockRequest('POST', '/api/loans/eligibility', {
        // Missing criteria
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation failed');
    });
  });

  describe('POST /api/loans/applications', () => {
    it('should track loan application successfully', async () => {
      const { POST } = await import('@/app/api/loans/applications/route');
      
      const applicationData = {
        productId: testLoanProduct._id.toString(),
        amount: 500000,
        tenure: 36,
        userId: 'test-user-123',
        purpose: 'Home renovation'
      };

      const request = mockRequest('POST', '/api/loans/applications', applicationData, {
        'user-agent': 'Mozilla/5.0 (Test Browser)',
        'referer': 'https://testplatform.com'
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.application).toBeDefined();
      expect(data.data.application.trackingId).toBeDefined();
      expect(data.data.application.redirectUrl).toBeDefined();
      expect(data.data.application.status).toBe('initiated');
      expect(data.data.application.amount).toBe(500000);
      expect(data.data.application.tenure).toBe(36);
    });

    it('should validate loan amount against product limits', async () => {
      const { POST } = await import('@/app/api/loans/applications/route');
      
      const applicationData = {
        productId: testLoanProduct._id.toString(),
        amount: 50000, // Below minimum
        tenure: 24
      };

      const request = mockRequest('POST', '/api/loans/applications', applicationData);
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Minimum loan amount');
    });

    it('should return validation error for invalid data', async () => {
      const { POST } = await import('@/app/api/loans/applications/route');
      
      const applicationData = {
        productId: testLoanProduct._id.toString(),
        // Missing required fields
      };

      const request = mockRequest('POST', '/api/loans/applications', applicationData);
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation failed');
    });
  });

  describe('GET /api/loans/applications', () => {
    it('should fetch loan applications', async () => {
      const { GET } = await import('@/app/api/loans/applications/route');
      
      const request = mockRequest('GET', '/api/loans/applications');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.applications).toBeDefined();
      expect(Array.isArray(data.data.applications)).toBe(true);
      expect(typeof data.data.total).toBe('number');
    });

    it('should filter applications by user ID', async () => {
      const { GET } = await import('@/app/api/loans/applications/route');
      
      const request = mockRequest('GET', '/api/loans/applications?userId=test-user-123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.applications)).toBe(true);
    });
  });
});