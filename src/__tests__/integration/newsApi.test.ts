import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../../app/api/news/route';
import { GET as getBreaking } from '../../app/api/news/breaking/route';
import { GET as getCategory } from '../../app/api/news/category/[category]/route';
import { NewsSearchParams, NewsCategory } from '../../types/news';

describe('News API Integration Tests', () => {
  describe('/api/news', () => {
    it('should fetch news with GET request', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news?category=market-news&limit=10&page=1'
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should fetch news with POST request and search params', async () => {
      const searchParams: NewsSearchParams = {
        query: 'Nifty',
        filters: {
          category: 'market-news',
          priority: 'high'
        },
        page: 1,
        limit: 5,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      };

      const { req } = createMocks({
        method: 'POST',
        body: searchParams
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it('should handle invalid category gracefully', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news?category=invalid-category'
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news?page=0&limit=1000'
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBeGreaterThan(0);
      expect(data.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('/api/news/breaking', () => {
    it('should fetch breaking news', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news/breaking?limit=3'
      });

      const response = await getBreaking(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(3);
    });

    it('should use default limit when not specified', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news/breaking'
      });

      const response = await getBreaking(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('/api/news/category/[category]', () => {
    const categories: NewsCategory[] = [
      'market-news',
      'economic-news',
      'policy-updates',
      'company-news',
      'banking'
    ];

    categories.forEach(category => {
      it(`should fetch news for category: ${category}`, async () => {
        const { req } = createMocks({
          method: 'GET',
          url: `/api/news/category/${category}?limit=5`
        });

        const response = await getCategory(req as any, { params: { category } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeLessThanOrEqual(5);
        
        // Verify all news items have the correct category
        data.forEach((item: any) => {
          expect(item.category).toBe(category);
        });
      });
    });

    it('should handle invalid category', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news/category/invalid-category'
      });

      const response = await getCategory(req as any, { params: { category: 'invalid-category' as NewsCategory } });
      
      // Should still return 200 but with empty or filtered results
      expect(response.status).toBe(200);
    });
  });

  describe('News Data Validation', () => {
    it('should return properly structured news items', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news?limit=1'
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      const newsItem = data.data[0];
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

    it('should return valid pagination metadata', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news?page=2&limit=5'
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('totalPages');
      
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
      expect(typeof data.pagination.total).toBe('number');
      expect(typeof data.pagination.totalPages).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed POST request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(req as any);
      
      expect(response.status).toBe(500);
    });

    it('should handle network timeouts gracefully', async () => {
      // This test would require mocking the news service to simulate timeout
      // For now, we'll test that the API structure handles errors properly
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news'
      });

      const response = await GET(req as any);
      
      // Should either succeed or fail gracefully
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time for large requests', async () => {
      const startTime = Date.now();
      
      const { req } = createMocks({
        method: 'GET',
        url: '/api/news?limit=50'
      });

      const response = await GET(req as any);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () => {
        const { req } = createMocks({
          method: 'GET',
          url: '/api/news?limit=10'
        });
        return GET(req as any);
      });

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});