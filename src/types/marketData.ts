export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
  currency: 'INR';
  marketStatus: 'open' | 'closed' | 'pre_market' | 'after_hours';
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: Date;
  currency: 'INR';
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  description: string;
  website?: string;
  employees?: number;
  headquarters?: string;
  ceo?: string;
  founded?: number;
  exchange: string;
}

export interface MarketDataResponse {
  success: boolean;
  data: MarketIndex[] | StockData | CompanyProfile;
  timestamp: Date;
  source: string;
}

export interface MarketDataError {
  code: string;
  message: string;
  details?: any;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
}

export interface MarketDataApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}