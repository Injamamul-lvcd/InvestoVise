import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProductService } from '@/lib/services/productService';
import { Product, AffiliatePartner } from '@/models';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/lib/database');
jest.mock('@/models');
jest.mock('mongoose');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockProduct = Product as jest.Mocked<typeof Product>;
const mockAffiliatePartner = AffiliatePartner as jest.Mocked<typeof AffiliatePartner>;
const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue();
    
    // Mock mongoose ObjectId validation
    mockMongoose.Types = {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true)
      }
    } as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products with default filters', async () => {
      const mockProducts = [
        { _id: '507f1f77bcf86cd799439011', name: 'Personal Loan', type: 'personal_loan' }
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

      const result = await ProductService.getProducts();

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      });
      expect(mockConnectToDatabase).toHaveBeenCalled();
    });

    it('should apply interest rate filters correctly', async () => {
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

      await ProductService.getProducts({
        minInterestRate: 5,
        maxInterestRate: 15
      });

      expect(mockProduct.find).toHaveBeenCalledWith({
        interestRate: { $gte: 5, $lte: 15 }
      });
    });

    it('should apply amount filters correctly', async () => {
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

      await ProductService.getProducts({
        minAmount: 100000,
        maxAmount: 1000000
      });

      expect(mockProduct.find).toHaveBeenCalledWith({
        minAmount: { $lte: 100000 },
        maxAmount: { $gte: 1000000 }
      });
    });
  });

  describe('getProductById', () => {
    it('should return product by valid ID', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Personal Loan',
        type: 'personal_loan'
      };

      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct)
      } as any);

      const result = await ProductService.getProductById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockProduct);
      expect(mockProduct.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw error for invalid ID', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(
        ProductService.getProductById('invalid-id')
      ).rejects.toThrow('Invalid product ID');
    });

    it('should throw error when product not found', async () => {
      mockProduct.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        ProductService.getProductById('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    it('should create new product successfully', async () => {
      const partnerId = '507f1f77bcf86cd799439012';
      const productData = {
        name: 'Personal Loan',
        type: 'personal_loan' as const,
        features: [{ name: 'Quick approval', value: '24 hours' }],
        eligibility: [{ type: 'income' as const, description: 'Minimum 25000 per month' }],
        applicationUrl: 'https://testbank.com/apply',
        description: 'Quick personal loan',
        termsAndConditions: 'Terms apply',
        processingTime: '24 hours'
      };

      const mockPartner = {
        addProduct: jest.fn().mockResolvedValue(true)
      };

      const mockSavedProduct = {
        ...productData,
        _id: '507f1f77bcf86cd799439011',
        partnerId,
        populate: jest.fn().mockResolvedValue({
          ...productData,
          _id: '507f1f77bcf86cd799439011',
          partnerId: { name: 'Test Bank' }
        })
      };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      
      // Mock the constructor and save method
      const mockSave = jest.fn().mockResolvedValue(mockSavedProduct);
      const mockPopulate = jest.fn().mockResolvedValue(mockSavedProduct);
      mockProduct.mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
        _id: '507f1f77bcf86cd799439011'
      }) as any);

      const result = await ProductService.createProduct(partnerId, productData);

      expect(mockAffiliatePartner.findById).toHaveBeenCalledWith(partnerId);
      expect(mockProduct).toHaveBeenCalledWith({ ...productData, partnerId });
      expect(mockSave).toHaveBeenCalled();
      expect(mockPartner.addProduct).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw error when partner not found', async () => {
      mockAffiliatePartner.findById.mockResolvedValue(null);

      const productData = {
        name: 'Personal Loan',
        type: 'personal_loan' as const,
        features: [],
        eligibility: [],
        applicationUrl: 'https://test.com',
        description: 'Test',
        termsAndConditions: 'Terms',
        processingTime: '24h'
      };

      await expect(
        ProductService.createProduct('507f1f77bcf86cd799439012', productData)
      ).rejects.toThrow('Affiliate partner not found');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Loan' };
      const updatedProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Loan',
        type: 'personal_loan'
      };

      mockProduct.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedProduct)
      } as any);

      const result = await ProductService.updateProduct('507f1f77bcf86cd799439011', updateData);

      expect(result).toEqual(updatedProduct);
      expect(mockProduct.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining(updateData),
        { new: true, runValidators: true }
      );
    });

    it('should throw error when product not found', async () => {
      mockProduct.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        ProductService.updateProduct('507f1f77bcf86cd799439011', { name: 'Updated' })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and remove from partner', async () => {
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

      const result = await ProductService.deleteProduct('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockProduct);
      expect(mockPartner.removeProduct).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockProduct.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw error when product not found', async () => {
      mockProduct.findById.mockResolvedValue(null);

      await expect(
        ProductService.deleteProduct('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Product not found');
    });
  });

  describe('getActiveProductsByType', () => {
    it('should return active products by type', async () => {
      const mockProducts = [
        { _id: '1', name: 'Loan 1', type: 'personal_loan', isActive: true },
        { _id: '2', name: 'Loan 2', type: 'personal_loan', isActive: true }
      ];

      mockProduct.findByTypeWithFilters.mockResolvedValue(mockProducts);

      const result = await ProductService.getActiveProductsByType('personal_loan');

      expect(result).toEqual(mockProducts);
      expect(mockProduct.findByTypeWithFilters).toHaveBeenCalledWith('personal_loan', {});
    });

    it('should apply filters when getting products by type', async () => {
      mockProduct.findByTypeWithFilters.mockResolvedValue([]);

      await ProductService.getActiveProductsByType('personal_loan', {
        minInterestRate: 5,
        maxInterestRate: 15
      });

      expect(mockProduct.findByTypeWithFilters).toHaveBeenCalledWith('personal_loan', {
        minInterestRate: 5,
        maxInterestRate: 15
      });
    });
  });

  describe('checkEligibility', () => {
    it('should check product eligibility for user', async () => {
      const mockProduct = {
        checkEligibility: jest.fn().mockReturnValue({
          eligible: true,
          reasons: []
        })
      };

      const userProfile = {
        age: 30,
        annualIncome: 500000
      };

      mockProduct.findById.mockResolvedValue(mockProduct);

      const result = await ProductService.checkEligibility('507f1f77bcf86cd799439011', userProfile);

      expect(result).toEqual({ eligible: true, reasons: [] });
      expect(mockProduct.checkEligibility).toHaveBeenCalledWith(userProfile);
    });

    it('should throw error when product not found', async () => {
      mockProduct.findById.mockResolvedValue(null);

      await expect(
        ProductService.checkEligibility('507f1f77bcf86cd799439011', {})
      ).rejects.toThrow('Product not found');
    });
  });

  describe('compareProducts', () => {
    it('should return products for comparison', async () => {
      const productIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const mockProducts = [
        { _id: '507f1f77bcf86cd799439011', name: 'Loan 1' },
        { _id: '507f1f77bcf86cd799439012', name: 'Loan 2' }
      ];

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts)
      } as any);

      const result = await ProductService.compareProducts(productIds);

      expect(result).toEqual(mockProducts);
      expect(mockProduct.find).toHaveBeenCalledWith({
        _id: { $in: productIds },
        isActive: true
      });
    });

    it('should throw error if not all products found', async () => {
      const productIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const mockProducts = [
        { _id: '507f1f77bcf86cd799439011', name: 'Loan 1' }
      ]; // Only one product found

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts)
      } as any);

      await expect(
        ProductService.compareProducts(productIds)
      ).rejects.toThrow('One or more products not found');
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [
        { _id: '1', name: 'Personal Loan', description: 'Quick loan' }
      ];

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockProducts)
          })
        })
      } as any);

      const result = await ProductService.searchProducts('Personal');

      expect(result).toEqual(mockProducts);
      expect(mockProduct.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'Personal', $options: 'i' } },
          { description: { $regex: 'Personal', $options: 'i' } },
          { 'features.name': { $regex: 'Personal', $options: 'i' } },
          { 'features.value': { $regex: 'Personal', $options: 'i' } }
        ]
      });
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      const mockProducts = [
        { _id: '1', name: 'Featured Loan', priority: 90 }
      ];

      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockProducts)
          })
        })
      } as any);

      const result = await ProductService.getFeaturedProducts();

      expect(result).toEqual(mockProducts);
      expect(mockProduct.find).toHaveBeenCalledWith({
        isActive: true,
        priority: { $gte: 80 }
      });
    });

    it('should filter featured products by type', async () => {
      mockProduct.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await ProductService.getFeaturedProducts('personal_loan');

      expect(mockProduct.find).toHaveBeenCalledWith({
        isActive: true,
        priority: { $gte: 80 },
        type: 'personal_loan'
      });
    });
  });
});