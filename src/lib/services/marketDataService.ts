import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { createClient, RedisClientType } from 'redis';
import config from '../../config';
import {
  MarketIndex,
  StockData,
  CompanyProfile,
  MarketDataResponse,
  MarketDataError,
  CacheConfig,
  MarketDataApiConfig
} from '../../types/marketData';

class MarketDataService {
  private apiClient: AxiosInstance;
  private redisClient: RedisClientType;
  private config: MarketDataApiConfig;

  constructor() {
    this.config = {
      baseUrl: 'https://api.marketdata.app/v1',
      apiKey: config.marketDataApiKey,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.apiClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.redisClient = createClient({
      url: config.redisUrl
    });

    this.setupInterceptors();
    this.initializeRedis();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`Market Data API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Market Data API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 429 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.delay(this.config.retryDelay);
          return this.apiClient(originalRequest);
        }
        
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private async initializeRedis(): Promise<void> {
    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
        console.log('Redis client connected for market data service');
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  private handleApiError(error: any): MarketDataError {
    if (error.response) {
      return {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || 'API request failed',
        details: error.response.data
      };
    } else if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: error.message
      };
    } else {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        details: error
      };
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      if (!this.redisClient.isOpen) {
        await this.initializeRedis();
      }
      
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      if (!this.redisClient.isOpen) {
        await this.initializeRedis();
      }
      
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Get live Indian market indices (Nifty, Sensex, Bank Nifty)
   */
  async getLiveIndices(): Promise<MarketIndex[]> {
    const cacheKey = 'market:indices:live';
    const cacheTtl = 60; // 1 minute cache

    try {
      // Try to get from cache first
      const cached = await this.getFromCache<MarketIndex[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Indian market indices symbols
      const indices = ['NIFTY', 'SENSEX', 'BANKNIFTY'];
      const promises = indices.map(symbol => this.fetchIndexData(symbol));
      
      const results = await Promise.allSettled(promises);
      const validIndices: MarketIndex[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          validIndices.push(result.value);
        } else {
          console.error(`Failed to fetch data for ${indices[index]}:`, result);
        }
      });

      // Cache the results
      await this.setCache(cacheKey, validIndices, cacheTtl);
      
      return validIndices;
    } catch (error) {
      console.error('Error fetching live indices:', error);
      throw new Error('Failed to fetch market indices data');
    }
  }

  private async fetchIndexData(symbol: string): Promise<MarketIndex | null> {
    try {
      // Mock implementation - replace with actual API call
      // For demo purposes, generating mock data
      const mockData: MarketIndex = {
        symbol,
        name: this.getIndexName(symbol),
        value: this.generateMockPrice(symbol),
        change: Math.random() * 200 - 100, // Random change between -100 and +100
        changePercent: Math.random() * 4 - 2, // Random percentage between -2% and +2%
        lastUpdated: new Date(),
        currency: 'INR',
        marketStatus: this.getMarketStatus()
      };

      mockData.changePercent = (mockData.change / mockData.value) * 100;
      
      return mockData;
    } catch (error) {
      console.error(`Error fetching ${symbol} data:`, error);
      return null;
    }
  }

  private getIndexName(symbol: string): string {
    const names: Record<string, string> = {
      'NIFTY': 'Nifty 50',
      'SENSEX': 'BSE Sensex',
      'BANKNIFTY': 'Bank Nifty'
    };
    return names[symbol] || symbol;
  }

  private generateMockPrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'NIFTY': 19500,
      'SENSEX': 65000,
      'BANKNIFTY': 44000
    };
    const basePrice = basePrices[symbol] || 1000;
    return basePrice + (Math.random() * 1000 - 500); // Add some variation
  }

  private getMarketStatus(): 'open' | 'closed' | 'pre_market' | 'after_hours' {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Weekend
    if (day === 0 || day === 6) {
      return 'closed';
    }

    // Market hours: 9:15 AM to 3:30 PM IST
    if (hour >= 9 && hour < 15) {
      return 'open';
    } else if (hour >= 8 && hour < 9) {
      return 'pre_market';
    } else if (hour >= 15 && hour < 18) {
      return 'after_hours';
    } else {
      return 'closed';
    }
  }

  /**
   * Get stock price data for a specific symbol
   */
  async getStockPrice(symbol: string): Promise<StockData> {
    const cacheKey = `market:stock:${symbol}`;
    const cacheTtl = 300; // 5 minutes cache

    try {
      // Try to get from cache first
      const cached = await this.getFromCache<StockData>(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock implementation - replace with actual API call
      const stockData: StockData = {
        symbol: symbol.toUpperCase(),
        name: `${symbol} Limited`,
        price: Math.random() * 5000 + 100,
        change: Math.random() * 100 - 50,
        changePercent: Math.random() * 10 - 5,
        volume: Math.floor(Math.random() * 1000000),
        marketCap: Math.random() * 100000000000,
        pe: Math.random() * 50 + 5,
        high52Week: Math.random() * 6000 + 100,
        low52Week: Math.random() * 2000 + 50,
        lastUpdated: new Date(),
        currency: 'INR'
      };

      // Cache the result
      await this.setCache(cacheKey, stockData, cacheTtl);
      
      return stockData;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock data for ${symbol}`);
    }
  }

  /**
   * Get company profile information
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const cacheKey = `market:profile:${symbol}`;
    const cacheTtl = 3600; // 1 hour cache

    try {
      // Try to get from cache first
      const cached = await this.getFromCache<CompanyProfile>(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock implementation - replace with actual API call
      const profile: CompanyProfile = {
        symbol: symbol.toUpperCase(),
        name: `${symbol} Limited`,
        sector: 'Technology',
        industry: 'Software Services',
        marketCap: Math.random() * 100000000000,
        description: `${symbol} Limited is a leading Indian technology company providing software services and solutions.`,
        website: `https://www.${symbol.toLowerCase()}.com`,
        employees: Math.floor(Math.random() * 100000),
        headquarters: 'Mumbai, India',
        ceo: 'John Doe',
        founded: 1990 + Math.floor(Math.random() * 30),
        exchange: 'NSE'
      };

      // Cache the result
      await this.setCache(cacheKey, profile, cacheTtl);
      
      return profile;
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error);
      throw new Error(`Failed to fetch company profile for ${symbol}`);
    }
  }

  /**
   * Search for stocks by name or symbol
   */
  async searchStocks(query: string): Promise<StockData[]> {
    const cacheKey = `market:search:${query.toLowerCase()}`;
    const cacheTtl = 1800; // 30 minutes cache

    try {
      // Try to get from cache first
      const cached = await this.getFromCache<StockData[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock implementation - replace with actual API call
      const mockResults: StockData[] = [
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'
      ].filter(symbol => 
        symbol.toLowerCase().includes(query.toLowerCase())
      ).map(symbol => ({
        symbol,
        name: `${symbol} Limited`,
        price: Math.random() * 5000 + 100,
        change: Math.random() * 100 - 50,
        changePercent: Math.random() * 10 - 5,
        volume: Math.floor(Math.random() * 1000000),
        lastUpdated: new Date(),
        currency: 'INR' as const
      }));

      // Cache the results
      await this.setCache(cacheKey, mockResults, cacheTtl);
      
      return mockResults;
    } catch (error) {
      console.error(`Error searching stocks for query "${query}":`, error);
      throw new Error('Failed to search stocks');
    }
  }

  /**
   * Clear all market data cache
   */
  async clearCache(): Promise<void> {
    try {
      if (!this.redisClient.isOpen) {
        await this.initializeRedis();
      }
      
      const keys = await this.redisClient.keys('market:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      
      console.log('Market data cache cleared');
    } catch (error) {
      console.error('Error clearing market data cache:', error);
    }
  }

  /**
   * Close connections
   */
  async disconnect(): Promise<void> {
    try {
      if (this.redisClient.isOpen) {
        await this.redisClient.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting market data service:', error);
    }
  }
}

export default new MarketDataService();