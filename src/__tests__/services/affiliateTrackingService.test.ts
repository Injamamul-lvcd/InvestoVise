import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';
import { AffiliateClick, AffiliatePartner, Product } from '@/models';
import { connectToDatabase } from '@/lib/database';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/lib/database');
jest.mock('@/models');
jest.mock('mongoose');
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'abc123' })
}));

const mockConnectToDatabase = jest.mocked(connectToDatabase);
const mockAffiliateClick = jest.mocked(AffiliateClick);
const mockAffiliatePartner = jest.mocked(AffiliatePartner);
const mockProduct = jest.mocked(Product);
const mockMongoose = jest.mocked(mongoose);

describe('AffiliateTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue();
    
    // Mock mongoose ObjectId validation
    mockMongoose.Types = {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true)
      }
    } as any;

    // Mock Date.now for consistent tracking IDs
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('generateTrackingId', () => {
    it('should generate a unique tracking ID', () => {
      const trackingId = AffiliateTrackingService.generateTrackingId();
      
      expect(trackingId).toMatch(/^[a-z0-9]+-[a-f0-9]{12}$/);
      expect(trackingId).toContain('abc123');
    });
  });

  describe('trackClick', () => {
    const mockTrackingData = {
      partnerId: '507f1f77bcf86cd799439011',
      productId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439013',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      referrer: 'https://example.com',
      sessionId: 'session123',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'test-campaign'
    };

    it('should track click successfully', async () => {
      const mockPartner = { _id: '507f1f77bcf86cd799439011', isActive: true };
      const mockProduct = { _id: '507f1f77bcf86cd799439012', isActive: true };
      const mockSavedClick = { trackingId: 'test-tracking-id' };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      mockProduct.findById.mockResolvedValue(mockProduct);
      
      const mockSave = jest.fn().mockResolvedValue(mockSavedClick);
      mockAffiliateClick.mockImplementation(() => ({
        save: mockSave
      }) as any);

      const result = await AffiliateTrackingService.trackClick(mockTrackingData);

      expect(result).toMatch(/^[a-z0-9]+-[a-f0-9]{12}$/);
      expect(mockAffiliatePartner.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockProduct.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw error for invalid partner ID', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(
        AffiliateTrackingService.trackClick(mockTrackingData)
      ).rejects.toThrow('Invalid partner ID');
    });

    it('should throw error for inactive partner', async () => {
      const mockPartner = { _id: '507f1f77bcf86cd799439011', isActive: false };
      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);

      await expect(
        AffiliateTrackingService.trackClick(mockTrackingData)
      ).rejects.toThrow('Partner not found or inactive');
    });

    it('should throw error for non-existent partner', async () => {
      mockAffiliatePartner.findById.mockResolvedValue(null);

      await expect(
        AffiliateTrackingService.trackClick(mockTrackingData)
      ).rejects.toThrow('Partner not found or inactive');
    });

    it('should throw error for inactive product', async () => {
      const mockPartner = { _id: '507f1f77bcf86cd799439011', isActive: true };
      const mockProduct = { _id: '507f1f77bcf86cd799439012', isActive: false };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      mockProduct.findById.mockResolvedValue(mockProduct);

      await expect(
        AffiliateTrackingService.trackClick(mockTrackingData)
      ).rejects.toThrow('Product not found or inactive');
    });
  });

  describe('generateAffiliateLink', () => {
    it('should generate affiliate link successfully', async () => {
      const mockPartner = { _id: '507f1f77bcf86cd799439011', isActive: true };
      const mockProduct = { _id: '507f1f77bcf86cd799439012', isActive: true };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      mockProduct.findById.mockResolvedValue(mockProduct);

      const result = await AffiliateTrackingService.generateAffiliateLink(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        'https://example.com',
        {
          source: 'google',
          medium: 'cpc',
          campaign: 'test'
        }
      );

      expect(result).toContain('https://example.com/api/affiliate/redirect');
      expect(result).toContain('p=507f1f77bcf86cd799439011');
      expect(result).toContain('pr=507f1f77bcf86cd799439012');
      expect(result).toContain('utm_source=google');
      expect(result).toContain('utm_medium=cpc');
      expect(result).toContain('utm_campaign=test');
    });

    it('should throw error for invalid partner ID', async () => {
      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(
        AffiliateTrackingService.generateAffiliateLink(
          'invalid-id',
          '507f1f77bcf86cd799439012',
          'https://example.com'
        )
      ).rejects.toThrow('Invalid partner ID');
    });
  });

  describe('processRedirect', () => {
    it('should process redirect and return tracking data', async () => {
      const mockPartner = { _id: '507f1f77bcf86cd799439011', isActive: true };
      const mockProduct = { 
        _id: '507f1f77bcf86cd799439012', 
        isActive: true,
        applicationUrl: 'https://partner.com/apply'
      };
      const mockSavedClick = { trackingId: 'test-tracking-id' };

      mockAffiliatePartner.findById.mockResolvedValue(mockPartner);
      mockProduct.findById.mockResolvedValue(mockProduct);
      
      const mockSave = jest.fn().mockResolvedValue(mockSavedClick);
      mockAffiliateClick.mockImplementation(() => ({
        save: mockSave
      }) as any);

      const result = await AffiliateTrackingService.processRedirect(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          referrer: 'https://example.com',
          utmSource: 'google'
        }
      );

      expect(result.trackingId).toMatch(/^[a-z0-9]+-[a-f0-9]{12}$/);
      expect(result.redirectUrl).toContain('https://partner.com/apply');
      expect(result.redirectUrl).toContain('utm_source=google');
    });
  });

  describe('recordConversion', () => {
    it('should record conversion successfully', async () => {
      const mockClick = {
        trackingId: 'test-tracking-id',
        converted: false,
        partnerId: {
          calculateCommission: jest.fn().mockReturnValue(50)
        },
        isWithinAttributionWindow: jest.fn().mockResolvedValue(true),
        markAsConverted: jest.fn().mockResolvedValue(true)
      };

      mockAffiliateClick.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockClick)
      } as any);

      const result = await AffiliateTrackingService.recordConversion({
        trackingId: 'test-tracking-id',
        conversionType: 'application_submitted',
        conversionValue: 1000
      });

      expect(result).toBe(true);
      expect(mockClick.isWithinAttributionWindow).toHaveBeenCalled();
      expect(mockClick.markAsConverted).toHaveBeenCalledWith(50);
    });

    it('should throw error for non-existent tracking ID', async () => {
      mockAffiliateClick.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      await expect(
        AffiliateTrackingService.recordConversion({
          trackingId: 'invalid-tracking-id',
          conversionType: 'application_submitted'
        })
      ).rejects.toThrow('Tracking ID not found or already converted');
    });

    it('should throw error for click outside attribution window', async () => {
      const mockClick = {
        trackingId: 'test-tracking-id',
        converted: false,
        isWithinAttributionWindow: jest.fn().mockResolvedValue(false)
      };

      mockAffiliateClick.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockClick)
      } as any);

      await expect(
        AffiliateTrackingService.recordConversion({
          trackingId: 'test-tracking-id',
          conversionType: 'application_submitted'
        })
      ).rejects.toThrow('Click is outside attribution window');
    });
  });

  describe('detectFraud', () => {
    it('should detect fraudulent activity', async () => {
      const mockClick = {
        trackingId: 'test-tracking-id',
        ipAddress: '192.168.1.1',
        userAgent: 'bot crawler',
        clickedAt: new Date(),
        converted: true,
        conversionDate: new Date(Date.now() + 10000), // 10 seconds later
        referrer: null
      };

      mockAffiliateClick.findOne.mockResolvedValue(mockClick);
      mockAffiliateClick.countDocuments.mockResolvedValue(15); // High click count

      const result = await AffiliateTrackingService.detectFraud('test-tracking-id');

      expect(result.isFraudulent).toBe(true);
      expect(result.riskScore).toBeGreaterThan(50);
      expect(result.reasons).toContain('Multiple clicks from same IP address');
      expect(result.reasons).toContain('Bot-like user agent detected');
      expect(result.reasons).toContain('Suspiciously fast conversion');
      expect(result.reasons).toContain('Missing referrer information');
    });

    it('should not flag legitimate activity as fraud', async () => {
      const mockClick = {
        trackingId: 'test-tracking-id',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        clickedAt: new Date(),
        converted: true,
        conversionDate: new Date(Date.now() + 300000), // 5 minutes later
        referrer: 'https://google.com'
      };

      mockAffiliateClick.findOne.mockResolvedValue(mockClick);
      mockAffiliateClick.countDocuments.mockResolvedValue(2); // Normal click count

      const result = await AffiliateTrackingService.detectFraud('test-tracking-id');

      expect(result.isFraudulent).toBe(false);
      expect(result.riskScore).toBeLessThan(50);
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('validateTrackingParams', () => {
    it('should validate correct parameters', () => {
      const params = {
        partnerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const result = AffiliateTrackingService.validateTrackingParams(params);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid parameters', () => {
      const params = {
        partnerId: 'invalid-id',
        productId: '',
        ipAddress: '',
        userAgent: ''
      };

      mockMongoose.Types.ObjectId.isValid.mockReturnValue(false);

      const result = AffiliateTrackingService.validateTrackingParams(params);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid partner ID is required');
      expect(result.errors).toContain('Valid product ID is required');
      expect(result.errors).toContain('IP address is required');
      expect(result.errors).toContain('User agent is required');
    });
  });
});