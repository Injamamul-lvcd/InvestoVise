import cache, { CacheKeys, CacheTTL, getCachedData } from '@/lib/cache';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    on: jest.fn(),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    flushAll: jest.fn(),
    mGet: jest.fn(),
    multi: jest.fn(() => ({
      setEx: jest.fn(),
      exec: jest.fn(),
    })),
    disconnect: jest.fn(),
  })),
}));

describe('Cache Utils', () => {
  describe('CacheKeys', () => {
    it('should generate article cache key', () => {
      const key = CacheKeys.article('test-slug');
      expect(key).toBe('article:test-slug');
    });

    it('should generate articles cache key with category', () => {
      const key = CacheKeys.articles('investment', 2);
      expect(key).toBe('articles:investment:2');
    });

    it('should generate articles cache key without category', () => {
      const key = CacheKeys.articles(undefined, 1);
      expect(key).toBe('articles:all:1');
    });

    it('should generate market data cache key', () => {
      const key = CacheKeys.marketData('NIFTY');
      expect(key).toBe('market:NIFTY');
    });

    it('should generate news cache key', () => {
      const key = CacheKeys.news('stocks');
      expect(key).toBe('news:stocks');
    });

    it('should generate loan products cache key', () => {
      const key = CacheKeys.loanProducts('personal');
      expect(key).toBe('loans:personal');
    });

    it('should generate credit cards cache key', () => {
      const key = CacheKeys.creditCards('cashback');
      expect(key).toBe('cards:cashback');
    });

    it('should generate brokers cache key', () => {
      const key = CacheKeys.brokers();
      expect(key).toBe('brokers:all');
    });

    it('should generate user profile cache key', () => {
      const key = CacheKeys.userProfile('user123');
      expect(key).toBe('user:user123');
    });

    it('should generate affiliate partner cache key', () => {
      const key = CacheKeys.affiliatePartner('partner456');
      expect(key).toBe('partner:partner456');
    });

    it('should generate sitemap cache key', () => {
      const key = CacheKeys.sitemap();
      expect(key).toBe('sitemap:xml');
    });
  });

  describe('CacheTTL', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SHORT).toBe(300);
      expect(CacheTTL.MEDIUM).toBe(1800);
      expect(CacheTTL.LONG).toBe(3600);
      expect(CacheTTL.VERY_LONG).toBe(86400);
      expect(CacheTTL.STATIC).toBe(604800);
    });
  });

  describe('getCachedData', () => {
    it('should return cached data if available', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockFetch = jest.fn();
      
      // Mock cache.get to return data
      jest.spyOn(cache, 'get').mockResolvedValue(mockData);
      jest.spyOn(cache, 'set').mockResolvedValue(true);

      const result = await getCachedData('test-key', mockFetch);

      expect(result).toEqual(mockData);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(cache.get).toHaveBeenCalledWith('test-key');
    });

    it('should fetch and cache data if not in cache', async () => {
      const mockData = { id: 2, name: 'Fetched' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      // Mock cache.get to return null (not found)
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(cache, 'set').mockResolvedValue(true);

      const result = await getCachedData('test-key', mockFetch, CacheTTL.SHORT);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalled();
      expect(cache.get).toHaveBeenCalledWith('test-key');
      expect(cache.set).toHaveBeenCalledWith('test-key', mockData, CacheTTL.SHORT);
    });

    it('should use default TTL if not specified', async () => {
      const mockData = { id: 3, name: 'Default TTL' };
      const mockFetch = jest.fn().mockResolvedValue(mockData);
      
      jest.spyOn(cache, 'get').mockResolvedValue(null);
      jest.spyOn(cache, 'set').mockResolvedValue(true);

      await getCachedData('test-key', mockFetch);

      expect(cache.set).toHaveBeenCalledWith('test-key', mockData, CacheTTL.MEDIUM);
    });
  });
});