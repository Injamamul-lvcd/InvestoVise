'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NewsItem,
  NewsCategory,
  NewsFilter,
  NewsSearchParams,
  NewsAggregatorState,
  NewsComponentProps
} from '../types/news';

interface NewsAggregatorProps extends NewsComponentProps {
  refreshInterval?: number;
  enableInfiniteScroll?: boolean;
  showBreakingNews?: boolean;
}

const NewsAggregator: React.FC<NewsAggregatorProps> = ({
  category,
  limit = 20,
  showImages = true,
  showSummary = true,
  showFilters = true,
  showSearch = true,
  className = '',
  onNewsClick,
  refreshInterval = 600000,
  enableInfiniteScroll = true,
  showBreakingNews = true
}) => {
  const [state, setState] = useState<NewsAggregatorState>({
    news: [],
    loading: true,
    error: null,
    lastUpdated: null,
    hasMore: true,
    currentPage: 1
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | undefined>(category);
  const [filters, setFilters] = useState<NewsFilter>({});
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);

  const categories = useMemo(() => [
    { value: 'market-news', label: 'Market News' },
    { value: 'economic-news', label: 'Economic News' },
    { value: 'policy-updates', label: 'Policy Updates' },
    { value: 'company-news', label: 'Company News' },
    { value: 'mutual-funds', label: 'Mutual Funds' },
    { value: 'banking', label: 'Banking' }
  ], []);

  const fetchNews = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const searchParams: NewsSearchParams = {
        query: searchQuery || undefined,
        filters: {
          ...filters,
          category: selectedCategory
        },
        page,
        limit,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      };

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        news: append ? [...prev.news, ...data.data] : data.data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        hasMore: data.pagination.page < data.pagination.totalPages,
        currentPage: data.pagination.page
      }));
    } catch (error) {
      console.error('Error fetching news:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news'
      }));
    }
  }, [searchQuery, selectedCategory, filters, limit]);

  const handleNewsClick = useCallback((news: NewsItem) => {
    if (onNewsClick) {
      onNewsClick(news);
    } else {
      window.open(news.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  }, [onNewsClick]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className={`news-aggregator ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search financial news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Category Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1 rounded-full text-sm ${
              !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All News
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === cat.value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {state.loading && state.news.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading news...</span>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{state.error}</p>
          <button
            onClick={() => fetchNews()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* News List */}
      {state.news.length > 0 && (
        <div className="space-y-6">
          {state.news.map((news) => (
            <article
              key={news.id}
              className="border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleNewsClick(news)}
            >
              <div className="flex flex-col lg:flex-row lg:space-x-6">
                {showImages && news.imageUrl && (
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full lg:w-48 h-32 object-cover rounded-lg mb-4 lg:mb-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {news.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {news.source} • {formatTimeAgo(new Date(news.publishedAt))}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{news.title}</h2>
                  {showSummary && news.summary && (
                    <p className="text-gray-600 mb-3">{news.summary}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {news.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsAggregator;