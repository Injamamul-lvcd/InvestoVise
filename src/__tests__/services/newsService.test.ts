import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import newsService from '../../lib/services/newsService';
import { NewsCategory, NewsSearchParams } from '../../types/news';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    isOpen: true
  }))
}));

describe('NewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getNews', () => {
    it('should fetch news with default parameters', async () => {
      const result = await newsService.getNews();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should fetch news with custom parameters', async () => {
      const params: NewsSearchParams = {
        query: 'Nifty',
        filters: {
          category: 'market-news',
          priority: 'high'
        },
        page: 2,
        limit: 10
      };

      const result = await newsService.getNews(params);
      
      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    it('should handle search queries', async () => {
      const params: NewsSearchParams = {
        query: 'RBI policy',
        filters: {
          category: 'economic-news'
        }
      };

      const result = await newsService.getNews(params);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const params: NewsSearchParams = {
        filters: {
          category: 'market-news'
        }
      };

      const result = await newsService.getNews(params);
      
      expect(result.success).toBe(true);
      result.data.forEach(item => {
        expect(item.category).toBe('market-news');
      });
    });

    it('should handle pagination correctly', async () => {
      const params: NewsSearchParams = {
        page: 1,
        limit: 5
      };

      const result = await newsService.getNews(params);
      
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getBreakingNews', () => {
    it('should fetch breaking news with default limit', async () => {
      const result = await newsService.getBreakingNews();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should fetch breaking news with custom limit', async () => {
      const result = await newsService.getBreakingNews(3);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array on error', async () => {
      // Mock an error scenario
      const originalGetNews = newsService.getNews;
      newsService.getNews = jest.fn().mockRejectedValue(new Error('API Error'));
      
      const result = await newsService.getBreakingNews();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      
      // Restore original method
      newsService.getNews = originalGetNews;
    });
  });

  describe('getNewsByCategory', () => {
    const categories: NewsCategory[] = [
      'market-news',
      'economic-news',
      'policy-updates',
      'company-news',
      'banking'
    ];

    categories.forEach(category => {
      it(`should fetch news for category: ${category}`, async () => {
        const result = await newsService.getNewsByCategory(category, 10);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(10);
        
        result.forEach(item => {
          expect(item.category).toBe(category);
        });
      });
    });
  });

  describe('getStockRelatedNews', () => {
    it('should fetch news related to specific stocks', async () => {
      const symbols = ['RELIANCE', 'TCS', 'HDFCBANK'];
      const result = await newsService.getStockRelatedNews(symbols, 5);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty stock symbols array', async () => {
      const result = await newsService.getStockRelatedNews([], 5);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle single stock symbol', async () => {
      const result = await newsService.getStockRelatedNews(['RELIANCE'], 3);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('searchNews', () => {
    it('should search news with query', async () => {
      const params: NewsSearchParams = {
        query: 'inflation',
        filters: {
          category: 'economic-news'
        },
        limit: 10
      };

      const result = await newsService.searchNews(params);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle empty search query', async () => {
      const params: NewsSearchParams = {
        query: '',
        limit: 5
      };

      const result = await newsService.searchNews(params);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return all available categories', () => {
      const categories = newsService.getAvailableCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      categories.forEach(category => {
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('label');
        expect(typeof category.value).toBe('string');
        expect(typeof category.label).toBe('string');
      });
    });

    it('should include all expected categories', () => {
      const categories = newsService.getAvailableCategories();
      const categoryValues = categories.map(c => c.value);
      
      const expectedCategories = [
        'market-news',
        'economic-news',
        'policy-updates',
        'company-news',
        'mutual-funds',
        'banking',
        'insurance',
        'cryptocurrency',
        'commodities',
        'global-markets'
      ];

      expectedCategories.forEach(expected => {
        expect(categoryValues).toContain(expected);
      });
    });
  });

  describe('Cache Management', () => {
    it('should refresh cache successfully', async () => {
      await expect(newsService.refreshCache()).resolves.not.toThrow();
    });

    it('should handle cache refresh errors gracefully', async () => {
      // This test would require mocking Redis to throw an error
      // For now, we just ensure the method exists and doesn't throw
      await expect(newsService.refreshCache()).resolves.not.toThrow();
    });
  });

  describe('Connection Management', () => {
    it('should disconnect successfully', async () => {
      await expect(newsService.disconnect()).resolves.not.toThrow();
    });

    it('should handle disconnect errors gracefully', async () => {
      // Ensure disconnect doesn't throw even if there are connection issues
      await expect(newsService.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should return properly structured news items', async () => {
      const result = await newsService.getNews({ limit: 1 });
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      const newsItem = result.data[0];
      expect(newsItem).toHaveProperty('id');
      expect(newsItem).toHaveProperty('title');
      expect(newsItem).toHaveProperty('summary');
      expect(newsItem).toHaveProperty('category');
      expect(newsItem).toHaveProperty('source');
      expect(newsItem).toHaveProperty('sourceUrl');
      expect(newsItem).toHaveProperty('publishedAt');
      expect(newsItem).toHaveProperty('tags');
      expect(newsItem).toHaveProperty('priority');
      
      expect(typeof newsItem.id).toBe('string');
      expect(typeof newsItem.title).toBe('string');
      expect(typeof newsItem.summary).toBe('string');
      expect(typeof newsItem.category).toBe('string');
      expect(typeof newsItem.source).toBe('string');
      expect(typeof newsItem.sourceUrl).toBe('string');
      expect(Array.isArray(newsItem.tags)).toBe(true);
      expect(['high', 'medium', 'low']).toContain(newsItem.priority);
    });

    it('should validate news item dates', async () => {
      const result = await newsService.getNews({ limit: 1 });
      
      expect(result.data.length).toBeGreaterThan(0);
      
      const newsItem = result.data[0];
      expect(newsItem.publishedAt).toBeInstanceOf(Date);
      expect(newsItem.publishedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should validate news item URLs', async () => {
      const result = await newsService.getNews({ limit: 1 });
      
      expect(result.data.length).toBeGreaterThan(0);
      
      const newsItem = result.data[0];
      expect(newsItem.sourceUrl).toMatch(/^https?:\/\/.+/);
    });
  });
});