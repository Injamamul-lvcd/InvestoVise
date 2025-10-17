import axios, { AxiosInstance } from 'axios';
import { createClient, RedisClientType } from 'redis';
import config from '../../config';
import {
  NewsItem,
  NewsCategory,
  NewsFilter,
  NewsSearchParams,
  NewsResponse,
  NewsSource,
  NewsApiConfig,
  NewsCacheConfig,
  NewsError
} from '../../types/news';

class NewsService {
  private apiClient: AxiosInstance;
  private redisClient: RedisClientType;
  private config: NewsApiConfig;
  private cacheConfig: NewsCacheConfig;

  constructor() {
    this.config = {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: config.newsApiKey,
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 1000,
      sources: this.getIndianFinancialSources()
    };

    this.cacheConfig = {
      ttl: 900, // 15 minutes
      maxItems: 1000,
      refreshInterval: 10 // 10 minutes
    };

    this.apiClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.redisClient = createClient({
      url: config.redisUrl
    });

    this.setupInterceptors();
    this.initializeRedis();
  }

  private getIndianFinancialSources(): NewsSource[] {
    return [
      {
        id: 'economic-times',
        name: 'The Economic Times',
        url: 'https://economictimes.indiatimes.com',
        category: ['market-news', 'economic-news', 'company-news'],
        isActive: true,
        priority: 1,
        updateFrequency: 15
      },
      {
        id: 'business-standard',
        name: 'Business Standard',
        url: 'https://www.business-standard.com',
        category: ['market-news', 'economic-news', 'banking'],
        isActive: true,
        priority: 1,
        updateFrequency: 15
      },
      {
        id: 'livemint',
        name: 'Mint',
        url: 'https://www.livemint.com',
        category: ['market-news', 'mutual-funds', 'banking'],
        isActive: true,
        priority: 1,
        updateFrequency: 15
      },
      {
        id: 'moneycontrol',
        name: 'Moneycontrol',
        url: 'https://www.moneycontrol.com',
        category: ['market-news', 'company-news', 'mutual-funds'],
        isActive: true,
        priority: 1,
        updateFrequency: 10
      },
      {
        id: 'financial-express',
        name: 'The Financial Express',
        url: 'https://www.financialexpress.com',
        category: ['economic-news', 'policy-updates', 'banking'],
        isActive: true,
        priority: 2,
        updateFrequency: 20
      }
    ];
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`News API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('News API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 429 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.delay(this.config.retryDelay * 2); // Longer delay for rate limits
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
        console.log('Redis client connected for news service');
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  private handleApiError(error: any): NewsError {
    if (error.response) {
      return {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || 'News API request failed',
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
      console.error('News cache get error:', error);
      return null;
    }
  }

  private async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      if (!this.redisClient.isOpen) {
        await this.initializeRedis();
      }
      
      const cacheTime = ttl || this.cacheConfig.ttl;
      await this.redisClient.setEx(key, cacheTime, JSON.stringify(data));
    } catch (error) {
      console.error('News cache set error:', error);
    }
  }

  /**
   * Get latest financial news with optional filtering
   */
  async getNews(params: NewsSearchParams = {}): Promise<NewsResponse> {
    const {
      query,
      filters = {},
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = params;

    const cacheKey = `news:${JSON.stringify({ query, filters, sortBy, sortOrder, page, limit })}`;

    try {
      // Try cache first
      const cached = await this.getFromCache<NewsResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build search query for Indian financial news
      const searchQuery = this.buildSearchQuery(query, filters);
      const sources = this.getSourcesForCategory(filters.category);

      // For demo purposes, generate mock news data
      // In production, replace with actual API calls
      const mockNews = await this.generateMockNews(searchQuery, filters, limit, page);
      
      const response: NewsResponse = {
        success: true,
        data: mockNews,
        pagination: {
          page,
          limit,
          total: 150, // Mock total
          totalPages: Math.ceil(150 / limit)
        },
        timestamp: new Date()
      };

      // Cache the response
      await this.setCache(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news data');
    }
  }

  private buildSearchQuery(query?: string, filters?: NewsFilter): string {
    const terms = [];
    
    // Base Indian financial terms
    terms.push('India OR Indian OR NSE OR BSE OR Nifty OR Sensex OR RBI OR SEBI');
    
    if (query) {
      terms.push(query);
    }

    if (filters?.category) {
      const categoryTerms = this.getCategorySearchTerms(filters.category);
      terms.push(`(${categoryTerms})`);
    }

    if (filters?.relatedStocks?.length) {
      const stockTerms = filters.relatedStocks.join(' OR ');
      terms.push(`(${stockTerms})`);
    }

    return terms.join(' AND ');
  }

  private getCategorySearchTerms(category: NewsCategory): string {
    const categoryMap: Record<NewsCategory, string> = {
      'market-news': 'stock market OR share market OR equity OR trading',
      'economic-news': 'economy OR GDP OR inflation OR economic policy',
      'policy-updates': 'RBI policy OR government policy OR regulation OR SEBI',
      'company-news': 'earnings OR quarterly results OR IPO OR corporate',
      'mutual-funds': 'mutual fund OR SIP OR NAV OR fund house',
      'banking': 'bank OR banking OR loan OR credit OR deposit',
      'insurance': 'insurance OR life insurance OR health insurance OR policy',
      'cryptocurrency': 'cryptocurrency OR bitcoin OR crypto OR digital currency',
      'commodities': 'gold OR silver OR crude oil OR commodity OR MCX',
      'global-markets': 'global market OR international OR foreign market OR FII'
    };

    return categoryMap[category] || category;
  }

  private getSourcesForCategory(category?: NewsCategory): string[] {
    if (!category) {
      return this.config.sources
        .filter(source => source.isActive)
        .map(source => source.id);
    }

    return this.config.sources
      .filter(source => source.isActive && source.category.includes(category))
      .map(source => source.id);
  }

  private async generateMockNews(
    query: string, 
    filters: NewsFilter, 
    limit: number, 
    page: number
  ): Promise<NewsItem[]> {
    // Mock news data for demonstration
    const mockTitles = [
      'Nifty 50 Hits New All-Time High as Banking Stocks Rally',
      'RBI Keeps Repo Rate Unchanged at 6.5% in Latest Policy Review',
      'Reliance Industries Reports Strong Q3 Earnings, Beats Estimates',
      'Foreign Institutional Investors Turn Net Buyers After 3 Months',
      'SEBI Introduces New Regulations for Mutual Fund Distributors',
      'Indian Rupee Strengthens Against Dollar Amid Positive Sentiment',
      'HDFC Bank Launches New Digital Banking Platform for SMEs',
      'Government Announces New Tax Benefits for ELSS Investments',
      'Tata Motors Stock Surges on Strong EV Sales Numbers',
      'Gold Prices in India Touch Record High Amid Global Uncertainty'
    ];

    const mockSources = ['Economic Times', 'Business Standard', 'Mint', 'Moneycontrol', 'Financial Express'];
    const categories: NewsCategory[] = ['market-news', 'economic-news', 'policy-updates', 'company-news', 'banking'];

    const news: NewsItem[] = [];
    const startIndex = (page - 1) * limit;

    for (let i = 0; i < limit; i++) {
      const index = (startIndex + i) % mockTitles.length;
      const publishedAt = new Date();
      publishedAt.setHours(publishedAt.getHours() - Math.floor(Math.random() * 24));

      news.push({
        id: `news-${Date.now()}-${i}`,
        title: mockTitles[index],
        summary: `This is a summary of the news article about ${mockTitles[index].toLowerCase()}. The article provides detailed insights into the current market conditions and their impact on Indian financial markets.`,
        category: filters.category || categories[Math.floor(Math.random() * categories.length)],
        author: `Reporter ${i + 1}`,
        source: mockSources[Math.floor(Math.random() * mockSources.length)],
        sourceUrl: `https://example.com/news/${index}`,
        imageUrl: `https://picsum.photos/400/250?random=${index}`,
        publishedAt,
        tags: ['India', 'Finance', 'Market', 'Investment'],
        readTime: Math.floor(Math.random() * 5) + 2,
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        isBreaking: Math.random() > 0.9,
        relatedStocks: ['RELIANCE', 'TCS', 'HDFCBANK'][Math.floor(Math.random() * 3)] ? ['RELIANCE'] : undefined
      });
    }

    return news;
  }

  /**
   * Search news by query and filters
   */
  async searchNews(searchParams: NewsSearchParams): Promise<NewsResponse> {
    return this.getNews(searchParams);
  }

  /**
   * Get breaking news
   */
  async getBreakingNews(limit: number = 5): Promise<NewsItem[]> {
    const cacheKey = 'news:breaking';
    
    try {
      const cached = await this.getFromCache<NewsItem[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.getNews({
        filters: { isBreaking: true },
        limit,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      });

      const breakingNews = response.data;
      await this.setCache(cacheKey, breakingNews, 300); // 5 minutes cache for breaking news
      
      return breakingNews;
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return [];
    }
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(category: NewsCategory, limit: number = 10): Promise<NewsItem[]> {
    const response = await this.getNews({
      filters: { category },
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });

    return response.data;
  }

  /**
   * Get news related to specific stocks
   */
  async getStockRelatedNews(symbols: string[], limit: number = 10): Promise<NewsItem[]> {
    const response = await this.getNews({
      filters: { relatedStocks: symbols },
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });

    return response.data;
  }

  /**
   * Refresh news cache
   */
  async refreshCache(): Promise<void> {
    try {
      if (!this.redisClient.isOpen) {
        await this.initializeRedis();
      }
      
      const keys = await this.redisClient.keys('news:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      
      console.log('News cache refreshed');
    } catch (error) {
      console.error('Error refreshing news cache:', error);
    }
  }

  /**
   * Get available news categories
   */
  getAvailableCategories(): { value: NewsCategory; label: string }[] {
    return [
      { value: 'market-news', label: 'Market News' },
      { value: 'economic-news', label: 'Economic News' },
      { value: 'policy-updates', label: 'Policy Updates' },
      { value: 'company-news', label: 'Company News' },
      { value: 'mutual-funds', label: 'Mutual Funds' },
      { value: 'banking', label: 'Banking' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'cryptocurrency', label: 'Cryptocurrency' },
      { value: 'commodities', label: 'Commodities' },
      { value: 'global-markets', label: 'Global Markets' }
    ];
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
      console.error('Error disconnecting news service:', error);
    }
  }
}

export default new NewsService();