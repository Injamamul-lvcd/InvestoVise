import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/products/route';
import { GET as getById, PUT, DELETE } from '@/app/api/products/[id]/route';
import { GET as getPartnerProducts, POST as addProduct } from '@/app/api/affiliate-partners/[id]/products/route';
import { connectToDatabase } from '@/lib/database';
import { Product, AffiliatePartner } from '@/models';
import { authenticateAdmin } from '@/lib/middleware/auth';

// Mock dependencies
jest.mock('@/lib/database');
jest.mock('@/lib/middleware/auth');
jest.mock('@/models');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockProduct = Product as jest.Mocked<typeof Product>;
const mockAffiliatePartner = AffiliatePartner as jest.Mocked<typeof AffiliatePartner>;

describe('/api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Personal Loan',
          type: 'personal_loan',
          partnerId: { name: 'Test Bank', type: 'loan' }
        }
      ];

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockProducts)
            })
          })
        })
      } as any);

      mockProduct.countDocuments.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/products?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toEqual(mockProducts);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      });
    });

    it('should filter products by type', async () => {
      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      mockProduct.countDocuments.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/products?type=personal_loan');
      await GET(request);

      expect(mockProduct.find).toHaveBeenCalledWith({ type: 'personal_loan' });
    });

    it('should filter products by interest rate range', async () => {
      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      mockProduct.countDocuments.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/products?minInterestRate=5&maxInterestRate=15');
      await GET(request);

      expect(mockProduct.find).toHaveBeenCalledWith({
        interestRate: { $gte: 5, $lte: 15 }
      });
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should return specific product', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Personal Loan',
        type: 'personal_loan',
        partnerId: { name: 'Test Bank' }
      };

      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct)
      } as any);

      const request = new NextRequest('http://localhost:3000/api/products/507f1f77bcf86cd799439011');
      const response = await getById(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      const request = new NextRequest('http://localhost:3000/api/products/507f1f77bcf86cd799439011');
      const response = await getById(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product not found');
    });
  });

  describe('PUT /api/products/[id]', () => {
    it('should update product', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const updatedProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Loan',
        type: 'personal_loan'
      };

      mockProduct.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedProduct)
      } as any);

      const request = new NextRequest('http://localhost:3000/api/products/507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Loan' })
      });

      const response = await PUT(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedProduct);
    });

    it('should require admin authentication', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: false,
        error: 'Admin access required'
      });

      const request = new NextRequest('http://localhost:3000/api/products/507f1f77bcf86cd799439011', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Loan' })
      });

      const response = await PUT(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should delete product and remove from partner', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        partnerId: '507f1f77bcf86cd799439012'
      };

      const mockPartner = {
        removeProduct: jest.fn().mockResolvedValue(true)
      };

      mockProduct.findById.mockResolvedValue(mockProduct);
      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      mockProduct.findByIdAndDelete.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/products/507f1f77bcf86cd799439011', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { id: '507f1f77bcf86cd799439011' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product deleted successfully');
      expect(mockPartner.removeProduct).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('GET /api/affiliate-partners/[id]/products', () => {
    it('should return products for specific partner', async () => {
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Personal Loan',
          partnerId: '507f1f77bcf86cd799439012'
        }
      ];

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockProducts)
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439012/products');
      const response = await getPartnerProducts(request, { params: { id: '507f1f77bcf86cd799439012' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProducts);
      expect(mockProduct.find).toHaveBeenCalledWith({ partnerId: '507f1f77bcf86cd799439012' });
    });

    it('should filter partner products by type', async () => {
      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      } as any);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439012/products?type=personal_loan');
      await getPartnerProducts(request, { params: { id: '507f1f77bcf86cd799439012' } });

      expect(mockProduct.find).toHaveBeenCalledWith({
        partnerId: '507f1f77bcf86cd799439012',
        type: 'personal_loan'
      });
    });
  });

  describe('POST /api/affiliate-partners/[id]/products', () => {
    const validProductData = {
      name: 'Personal Loan',
      type: 'personal_loan',
      features: [{ name: 'Quick approval', value: '24 hours' }],
      eligibility: [{ type: 'income', description: 'Minimum 25000 per month' }],
      applicationUrl: 'https://testbank.com/apply',
      description: 'Quick personal loan',
      termsAndConditions: 'Terms apply',
      processingTime: '24 hours'
    };

    it('should add product to partner', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      const mockPartner = {
        addProduct: jest.fn().mockResolvedValue(true)
      };

      const mockSavedProduct = {
        ...validProductData,
        _id: '507f1f77bcf86cd799439011',
        partnerId: '507f1f77bcf86cd799439012',
        populate: jest.fn().mockResolvedValue({
          ...validProductData,
          _id: '507f1f77bcf86cd799439011',
          partnerId: { name: 'Test Bank' }
        })
      };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      mockProduct.prototype.save = jest.fn().mockResolvedValue(mockSavedProduct);
      mockSavedProduct.populate.mockResolvedValue(mockSavedProduct);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439012/products', {
        method: 'POST',
        body: JSON.stringify(validProductData)
      });

      const response = await addProduct(request, { params: { id: '507f1f77bcf86cd799439012' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product added successfully');
      expect(mockPartner.addProduct).toHaveBeenCalled();
    });

    it('should return 404 if partner not found', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      mockAffiliatePartner.findById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439012/products', {
        method: 'POST',
        body: JSON.stringify(validProductData)
      });

      const response = await addProduct(request, { params: { id: '507f1f77bcf86cd799439012' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Affiliate partner not found');
    });

    it('should validate required fields', async () => {
      mockAuthenticateAdmin.mockResolvedValue({
        success: true,
        user: { userId: 'admin123', role: 'admin' }
      });

      mockAffiliatePartner.findById.mockResolvedValue({});

      const invalidData = { name: 'Test Product' }; // Missing required fields

      const request = new NextRequest('http://localhost:3000/api/affiliate-partners/507f1f77bcf86cd799439012/products', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await addProduct(request, { params: { id: '507f1f77bcf86cd799439012' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });
});