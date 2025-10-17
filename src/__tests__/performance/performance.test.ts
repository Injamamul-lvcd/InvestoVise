import { getRating, sendToAnalytics, getOptimizedImageUrl } from '@/lib/performance';

// Mock window and gtag for testing
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

describe('Performance Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  describe('getRating', () => {
    it('should return good rating for low CLS values', () => {
      expect(getRating('CLS', 0.05)).toBe('good');
      expect(getRating('CLS', 0.1)).toBe('good');
    });

    it('should return needs-improvement rating for medium CLS values', () => {
      expect(getRating('CLS', 0.15)).toBe('needs-improvement');
      expect(getRating('CLS', 0.25)).toBe('needs-improvement');
    });

    it('should return poor rating for high CLS values', () => {
      expect(getRating('CLS', 0.3)).toBe('poor');
      expect(getRating('CLS', 0.5)).toBe('poor');
    });

    it('should return good rating for low FID values', () => {
      expect(getRating('FID', 50)).toBe('good');
      expect(getRating('FID', 100)).toBe('good');
    });

    it('should return needs-improvement rating for medium FID values', () => {
      expect(getRating('FID', 200)).toBe('needs-improvement');
      expect(getRating('FID', 300)).toBe('needs-improvement');
    });

    it('should return poor rating for high FID values', () => {
      expect(getRating('FID', 400)).toBe('poor');
      expect(getRating('FID', 500)).toBe('poor');
    });

    it('should return good rating for low LCP values', () => {
      expect(getRating('LCP', 2000)).toBe('good');
      expect(getRating('LCP', 2500)).toBe('good');
    });

    it('should return needs-improvement rating for medium LCP values', () => {
      expect(getRating('LCP', 3000)).toBe('needs-improvement');
      expect(getRating('LCP', 4000)).toBe('needs-improvement');
    });

    it('should return poor rating for high LCP values', () => {
      expect(getRating('LCP', 5000)).toBe('poor');
      expect(getRating('LCP', 6000)).toBe('poor');
    });
  });

  describe('sendToAnalytics', () => {
    it('should log metrics in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const metric = {
        name: 'LCP',
        value: 2000,
        rating: 'good' as const,
        timestamp: Date.now(),
      };

      sendToAnalytics(metric);

      expect(console.log).toHaveBeenCalledWith('Performance Metric:', metric);

      process.env.NODE_ENV = originalEnv;
    });

    it('should send to gtag when available', () => {
      const metric = {
        name: 'CLS',
        value: 0.1,
        rating: 'good' as const,
        timestamp: Date.now(),
      };

      sendToAnalytics(metric);

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'CLS',
        value: 0,
        custom_map: {
          metric_rating: 'good',
        },
      });
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should generate optimized image URL', () => {
      const src = 'https://example.com/image.jpg';
      const width = 800;
      const height = 600;
      const quality = 80;

      const optimizedUrl = getOptimizedImageUrl(src, width, height, quality);

      expect(optimizedUrl).toContain('/_next/image');
      expect(optimizedUrl).toContain('url=https%3A%2F%2Fexample.com%2Fimage.jpg');
      expect(optimizedUrl).toContain('w=800');
      expect(optimizedUrl).toContain('h=600');
      expect(optimizedUrl).toContain('q=80');
    });

    it('should handle missing height parameter', () => {
      const src = 'https://example.com/image.jpg';
      const width = 400;

      const optimizedUrl = getOptimizedImageUrl(src, width);

      expect(optimizedUrl).toContain('w=400');
      expect(optimizedUrl).toContain('q=75'); // default quality
      expect(optimizedUrl).not.toContain('h=');
    });

    it('should return empty string for empty src', () => {
      const optimizedUrl = getOptimizedImageUrl('', 400);
      expect(optimizedUrl).toBe('');
    });
  });
});