import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AffiliatePartnerService } from '@/lib/services/affiliatePartnerService';
import { AffiliatePartner } from '@/models';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/lib/database');
jest.mock('@/models');
jest.mock('mongoose');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const mockAffiliatePartner = AffiliatePartner as jest.Mocked<typeof AffiliatePartner>;
const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('AffiliatePartnerService', () => {
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

  describe('getPartners', () => {
    it('should return paginated partners with default filters', async () => {
      const mockPartners = [
        { _id: '507f1f77bcf86cd799439011', name: 'Test Bank', type: 'loan' }
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

      const result = await AffiliatePartnerService.getPartners();

      expect(result.partners).toEqual(mockPartners);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      });
      expect(mockConnectToDatabase).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
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

      await AffiliatePartnerService.getPartners({
        type: 'loan',
        isActive: true,
        page: 2,
        limit: 5
      });

      expect(mockAffiliatePartner.find).toHaveBeenCalledWith({
        type: 'loan',
        isActive: true
      });
    });
  });

  describe('getPartnerById', () => {
    it('should return partner by valid ID', async () => {
      const mockPartner = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Bank',
        type: 'loan'
      };

      mockAffiliatePartner.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPartner)
      } as any);

      const result = await AffiliatePartnerService.getPartnerById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockPartner);
      expect(mockAffiliatePartner.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw error for invalid ID', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(
        AffiliatePartnerService.getPartnerById('invalid-id')
      ).rejects.toThrow('Invalid partner ID');
    });

    it('should throw error when partner not found', async () => {
      mockAffiliatePartner.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        AffiliatePartnerService.getPartnerById('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Affiliate partner not found');
    });
  });

  describe('createPartner', () => {
    it('should create new partner successfully', async () => {
      const partnerData = {
        name: 'Test Bank',
        type: 'loan' as const,
        logoUrl: 'https://example.com/logo.png',
        description: 'Test bank description',
        website: 'https://testbank.com',
        contactEmail: 'contact@testbank.com',
        commissionStructure: {
          type: 'percentage' as const,
          amount: 5,
          currency: 'INR'
        },
        trackingConfig: {
          conversionGoals: ['application_submitted'],
          attributionWindow: 30
        }
      };

      const mockSavedPartner = { ...partnerData, _id: '507f1f77bcf86cd799439011' };
      
      // Mock the constructor and save method
      const mockSave = jest.fn().mockResolvedValue(mockSavedPartner);
      mockAffiliatePartner.mockImplementation(() => ({
        save: mockSave
      }) as any);

      const result = await AffiliatePartnerService.createPartner(partnerData);

      expect(mockAffiliatePartner).toHaveBeenCalledWith(partnerData);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('updatePartner', () => {
    it('should update partner successfully', async () => {
      const updateData = { name: 'Updated Bank' };
      const updatedPartner = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Bank',
        type: 'loan'
      };

      mockAffiliatePartner.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedPartner)
      } as any);

      const result = await AffiliatePartnerService.updatePartner('507f1f77bcf86cd799439011', updateData);

      expect(result).toEqual(updatedPartner);
      expect(mockAffiliatePartner.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining(updateData),
        { new: true, runValidators: true }
      );
    });

    it('should throw error for invalid ID', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(
        AffiliatePartnerService.updatePartner('invalid-id', { name: 'Updated' })
      ).rejects.toThrow('Invalid partner ID');
    });

    it('should throw error when partner not found', async () => {
      mockAffiliatePartner.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        AffiliatePartnerService.updatePartner('507f1f77bcf86cd799439011', { name: 'Updated' })
      ).rejects.toThrow('Affiliate partner not found');
    });
  });

  describe('deletePartner', () => {
    it('should delete partner successfully', async () => {
      const deletedPartner = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Bank'
      };

      mockAffiliatePartner.findByIdAndDelete.mockResolvedValue(deletedPartner);

      const result = await AffiliatePartnerService.deletePartner('507f1f77bcf86cd799439011');

      expect(result).toEqual(deletedPartner);
      expect(mockAffiliatePartner.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw error when partner not found', async () => {
      mockAffiliatePartner.findByIdAndDelete.mockResolvedValue(null);

      await expect(
        AffiliatePartnerService.deletePartner('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Affiliate partner not found');
    });
  });

  describe('getActivePartnersByType', () => {
    it('should return active partners by type', async () => {
      const mockPartners = [
        { _id: '1', name: 'Bank 1', type: 'loan', isActive: true },
        { _id: '2', name: 'Bank 2', type: 'loan', isActive: true }
      ];

      mockAffiliatePartner.findByType.mockResolvedValue(mockPartners);

      const result = await AffiliatePartnerService.getActivePartnersByType('loan');

      expect(result).toEqual(mockPartners);
      expect(mockAffiliatePartner.findByType).toHaveBeenCalledWith('loan');
    });
  });

  describe('addProductToPartner', () => {
    it('should add product to partner successfully', async () => {
      const mockPartner = {
        addProduct: jest.fn().mockResolvedValue(true)
      };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);

      const result = await AffiliatePartnerService.addProductToPartner(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012'
      );

      expect(result).toEqual(mockPartner);
      expect(mockPartner.addProduct).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });

    it('should throw error when partner not found', async () => {
      mockAffiliatePartner.findById.mockResolvedValue(null);

      await expect(
        AffiliatePartnerService.addProductToPartner('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012')
      ).rejects.toThrow('Affiliate partner not found');
    });
  });

  describe('searchPartners', () => {
    it('should search partners by query', async () => {
      const mockPartners = [
        { _id: '1', name: 'HDFC Bank', description: 'Leading bank' }
      ];

      mockAffiliatePartner.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockPartners)
          })
        })
      } as any);

      const result = await AffiliatePartnerService.searchPartners('HDFC');

      expect(result).toEqual(mockPartners);
      expect(mockAffiliatePartner.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'HDFC', $options: 'i' } },
          { description: { $regex: 'HDFC', $options: 'i' } }
        ]
      });
    });
  });
});