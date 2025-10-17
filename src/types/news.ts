export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: NewsCategory;
  subcategory?: string;
  author?: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  readTime?: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  isBreaking?: boolean;
  relatedStocks?: string[]; // Stock symbols
}

export type NewsCategory = 
  | 'market-news'
  | 'economic-news' 
  | 'policy-updates'
  | 'company-news'
  | 'mutual-funds'
  | 'banking'
  | 'insurance'
  | 'cryptocurrency'
  | 'commodities'
  | 'global-markets';

export interface NewsFilter {
  category?: NewsCategory;
  subcategory?: string;
  source?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  priority?: 'high' | 'medium' | 'low';
  isBreaking?: boolean;
  relatedStocks?: string[];
}

export interface NewsSearchParams {
  query?: string;
  filters?: NewsFilter;
  sortBy?: 'publishedAt' | 'relevance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: Date;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: NewsCategory[];
  isActive: boolean;
  priority: number;
  rssUrl?: string;
  apiEndpoint?: string;
  updateFrequency: number; // in minutes
}

export interface NewsApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  sources: NewsSource[];
}

export interface NewsCacheConfig {
  ttl: number; // Time to live in seconds
  maxItems: number;
  refreshInterval: number; // in minutes
}

export interface NewsError {
  code: string;
  message: string;
  details?: any;
}

export interface NewsAggregatorState {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  hasMore: boolean;
  currentPage: number;
}

export interface NewsComponentProps {
  category?: NewsCategory;
  limit?: number;
  showImages?: boolean;
  showSummary?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
  onNewsClick?: (news: NewsItem) => void;
}