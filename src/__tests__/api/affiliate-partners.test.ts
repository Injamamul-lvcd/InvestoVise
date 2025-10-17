import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Next.js modules before importing
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(),
    json: jest.fn().mockResolvedValue({}),
    ...options
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  }
}));

jest.mock('@/lib/database');
jest.mock('@/lib/middleware/auth');
jest.mock('@/models');

import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { AffiliatePartner } from '@/models';
import { authenticateAdmin } from '@/lib/middleware/auth';

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockAffiliatePartner = AffiliatePartner as jest.Mocked<typeof AffiliatePartner>;

describe('/api/affiliate-partners', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/affiliate-partners', () => {
    it('should return paginated affiliate partners', async () => {
      const mockPartners = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test Bank',
          type: 'loan',
          isActive: true,
          products: []
        }
      ];

      mockAffiliatePartner.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockPartners)
            })
          })
        })
      } as any);

      mockAffiliatePartner.countDocuments.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.partners).toEqual(mockPartners);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      });
    });

    it('should filter partners by type', async () => {
      mockAffiliatePartner.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      mockAffiliatePartner.countDocuments.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners?type=loan');
      await GET(request);

      expect(mockAffiliatePartner.find).toHaveBeenCalledWith({ type: 'loan' });
    });

    it('should handle database errors', async () => {
      mockConnectToDatabase.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch affiliate partners');
    });
  });

  describe('POST /api/affiliate-partners', () => {
    const validPartnerData = {
      name: 'Test Bank',
      type: 'loan',
      logoUrl: 'https://example.com/logo.png',
      description: 'Test bank description',
      website: 'https://testbank.com',
      contactEmail: 'contact@testbank.com',
      commissionStructure: {
        type: 'percentage',
        amount: 5,
        currency: 'INR'
      },
      trackingConfig: {
        conversionGoals: ['application_submitted'],
        attributionWindow: 30
      }
    };

    it('should create a new affiliate partner', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const mockSavedPartner = { ...validPartnerData, _id: '507f1f77bcf86cd799439011' };
      mockAffiliatePartner.prototype.save = jest.fn().mockResolvedValue(mockSavedPartner);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners', {
        method: 'POST',
        body: JSON.stringify(validPartnerData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Affiliate partner created successfully');
    });

    it('should require admin authentication', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: false,
        error: 'Admin access required'
      });

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners', {
        method: 'POST',
        body: JSON.stringify(validPartnerData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Admin access required');
    });

    it('should validate required fields', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const invalidData = { name: 'Test Bank' }; // Missing required fields

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle validation errors from mongoose', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      mockAffiliatePartner.prototype.save = jest.fn().mockRejectedValue(validationError);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners', {
        method: 'POST',
        body: JSON.stringify(validPartnerData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/affiliate-partners/[id]', () => {
    it('should return specific affiliate partner', async () => {
      const mockPartner = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Bank',
        type: 'loan',
        products: []
      };

      mockAffiliatePartner.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPartner)
      } as any);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439011');
      const response = await getById(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPartner);
    });

    it('should return 404 for non-existent partner', async () => {
      mockAffiliatePartner.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439011');
      const response = await getById(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Affiliate partner not found');
    });

    it('should validate ObjectId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/invalid-id');
      const response = await getById(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid partner ID');
    });
  });

  describe('PUT /api/affiliate-partners/[id]', () => {
    it('should update affiliate partner', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const updatedPartner = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Bank',
        type: 'loan'
      };

      mockAffiliatePartner.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedPartner)
      } as any);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Bank' })
      });

      const response = await PUT(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedPartner);
    });

    it('should require admin authentication', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: false,
        error: 'Admin access required'
      });

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Bank' })
      });

      const response = await PUT(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/affiliate-partners/[id]', () => {
    it('should delete affiliate partner', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const deletedPartner = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Bank'
      };

      mockAffiliatePartner.findByIdAndDelete.mockResolvedValue(deletedPartner);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439011', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Affiliate partner deleted successfully');
    });

    it('should return 404 for non-existent partner', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      mockAffiliatePartner.findByIdAndDelete.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439011', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Affiliate partner not found');
    });
  });
});