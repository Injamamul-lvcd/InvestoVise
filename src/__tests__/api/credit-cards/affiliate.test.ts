import { NextRequest } from 'next/server';
import { POST as trackPOST, PUT as trackPUT } from '@/app/api/credit-cards/affiliate/track/route';
import { POST as webhookPOST } from '@/app/api/credit-cards/affiliate/webhook/route';
import { GET as metricsGET } from '@/app/api/credit-cards/affiliate/metrics/route';
import { POST as syncPOST } from '@/app/api/credit-cards/affiliate/sync/route';
import creditCardAffiliateService from '@/lib/services/creditCardAffiliateService';

// Mock the service
jest.mock('@/lib/services/creditCardAffiliateService');
const mockService = creditCardAffiliateService as jest.Mocked<typeof creditCardAffiliateService>;

// Mock database connection
jest.mock('@/lib/database', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined)
}));

describe('Credit Card Affiliate API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/credit-cards/affiliate/track', () => {
    describe('POST', () => {
      it('should generate tracking link successfully', async () => {
        const mockResult = {
          trackingUrl: 'https://testbank.com/apply?ref=track123',
          trackingId: 'track123'
        };

        mockService.generateTrackingLink.mockResolvedValue(mockResult);

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/track', {
          method: 'POST',
          body: JSON.stringify({
            productId: 'product123',
            userId: 'user123',
            utmParams: { utm_source: 'google' }
          }),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
            'user-agent': 'Mozilla/5.0'
          }
        });

        const response = await trackPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockResult);
        expect(mockService.generateTrackingLink).toHaveBeenCalledWith(
          'product123',
          'user123',
          { utm_source: 'google' }
        );
      });

      it('should return 400 when productId is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/track', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'content-type': 'application/json' }
        });

        const response = await trackPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Product ID is required');
      });

      it('should handle service errors', async () => {
        mockService.generateTrackingLink.mockRejectedValue(new Error('Service error'));

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/track', {
          method: 'POST',
          body: JSON.stringify({ productId: 'product123' }),
          headers: { 'content-type': 'application/json' }
        });

        const response = await trackPOST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to generate tracking link');
      });
    });

    describe('PUT', () => {
      it('should track application successfully', async () => {
        mockService.trackApplication.mockResolvedValue();

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/track', {
          method: 'PUT',
          body: JSON.stringify({
            trackingId: 'track123',
            applicationData: {
              requestedLimit: 100000,
              status: 'initiated'
            }
          }),
          headers: { 'content-type': 'application/json' }
        });

        const response = await trackPUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockService.trackApplication).toHaveBeenCalledWith(
          'track123',
          { requestedLimit: 100000, status: 'initiated' }
        );
      });

      it('should return 400 when trackingId is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/track', {
          method: 'PUT',
          body: JSON.stringify({}),
          headers: { 'content-type': 'application/json' }
        });

        const response = await trackPUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Tracking ID is required');
      });
    });
  });

  describe('/api/credit-cards/affiliate/webhook', () => {
    describe('POST', () => {
      it('should handle webhook successfully', async () => {
        mockService.handleConversionWebhook.mockResolvedValue();

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/webhook', {
          method: 'POST',
          body: JSON.stringify({
            trackingId: 'track123',
            conversionType: 'card_approved',
            conversionValue: 100000
          }),
          headers: {
            'content-type': 'application/json',
            'x-partner-id': 'partner123'
          }
        });

        const response = await webhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockService.handleConversionWebhook).toHaveBeenCalledWith(
          'partner123',
          {
            trackingId: 'track123',
            conversionType: 'card_approved',
            conversionValue: 100000,
            metadata: undefined
          }
        );
      });

      it('should return 400 when partner ID is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/webhook', {
          method: 'POST',
          body: JSON.stringify({
            trackingId: 'track123',
            conversionType: 'card_approved'
          }),
          headers: { 'content-type': 'application/json' }
        });

        const response = await webhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Partner ID is required');
      });

      it('should return 400 when required fields are missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/webhook', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'content-type': 'application/json',
            'x-partner-id': 'partner123'
          }
        });

        const response = await webhookPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Tracking ID and conversion type are required');
      });
    });
  });

  describe('/api/credit-cards/affiliate/metrics', () => {
    describe('GET', () => {
      it('should return metrics successfully', async () => {
        const mockMetrics = {
          totalClicks: 100,
          totalConversions: 10,
          conversionRate: 10,
          totalCommissions: 5000,
          averageCommission: 500,
          topProducts: []
        };

        mockService.getAffiliateMetrics.mockResolvedValue(mockMetrics);

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/metrics?partnerId=partner123&startDate=2024-01-01&endDate=2024-01-31');

        const response = await metricsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockMetrics);
        expect(mockService.getAffiliateMetrics).toHaveBeenCalledWith(
          'partner123',
          {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          }
        );
      });

      it('should handle request without query parameters', async () => {
        const mockMetrics = {
          totalClicks: 0,
          totalConversions: 0,
          conversionRate: 0,
          totalCommissions: 0,
          averageCommission: 0,
          topProducts: []
        };

        mockService.getAffiliateMetrics.mockResolvedValue(mockMetrics);

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/metrics');

        const response = await metricsGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockService.getAffiliateMetrics).toHaveBeenCalledWith(
          undefined,
          undefined
        );
      });
    });
  });

  describe('/api/credit-cards/affiliate/sync', () => {
    describe('POST', () => {
      it('should sync partner products successfully', async () => {
        mockService.syncPartnerProducts.mockResolvedValue();

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/sync', {
          method: 'POST',
          body: JSON.stringify({ partnerId: 'partner123' }),
          headers: { 'content-type': 'application/json' }
        });

        const response = await syncPOST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockService.syncPartnerProducts).toHaveBeenCalledWith('partner123');
      });

      it('should return 400 when partnerId is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/sync', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'content-type': 'application/json' }
        });

        const response = await syncPOST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Partner ID is required');
      });

      it('should handle service errors', async () => {
        mockService.syncPartnerProducts.mockRejectedValue(new Error('Sync failed'));

        const request = new NextRequest('http://localhost:3000/api/credit-cards/affiliate/sync', {
          method: 'POST',
          body: JSON.stringify({ partnerId: 'partner123' }),
          headers: { 'content-type': 'application/json' }
        });

        const response = await syncPOST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to sync partner products');
      });
    });
  });
});