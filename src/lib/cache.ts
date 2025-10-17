import { createClient, RedisClientType } from 'redis';

class CacheManager {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client || !this.isConnected || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    if (!this.client || !this.isConnected || keyValuePairs.length === 0) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      
      keyValuePairs.forEach(({ key, value, ttl = 3600 }) => {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
    }
  }
}

// Create singleton instance
const cache = new CacheManager();

// Cache key generators
export const CacheKeys = {
  article: (slug: string) => cache.generateKey('article', slug),
  articles: (category?: string, page: number = 1) => 
    cache.generateKey('articles', category || 'all', page),
  marketData: (symbol: string) => cache.generateKey('market', symbol),
  news: (category?: string) => cache.generateKey('news', category || 'all'),
  loanProducts: (type?: string) => cache.generateKey('loans', type || 'all'),
  creditCards: (type?: string) => cache.generateKey('cards', type || 'all'),
  brokers: () => cache.generateKey('brokers', 'all'),
  userProfile: (userId: string) => cache.generateKey('user', userId),
  affiliatePartner: (partnerId: string) => cache.generateKey('partner', partnerId),
  sitemap: () => cache.generateKey('sitemap', 'xml'),
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  STATIC: 604800,   // 1 week
};

// Utility functions for common caching patterns
export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, fetch and cache
  const data = await fetchFunction();
  await cache.set(key, data, ttl);
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  // In a real implementation, you might want to use Redis SCAN
  // to find and delete keys matching a pattern
  console.log(`Invalidating cache pattern: ${pattern}`);
}

export default cache;