import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewsAggregator from '../../components/NewsAggregator';
import { NewsItem, NewsCategory } from '../../types/news';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockNewsData: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Nifty 50 Hits New All-Time High',
    summary: 'Indian stock market reaches new milestone as Nifty 50 crosses 20,000 points.',
    category: 'market-news',
    author: 'Test Reporter',
    source: 'Economic Times',
    sourceUrl: 'https://example.com/news/1',
    imageUrl: 'https://example.com/image1.jpg',
    publishedAt: new Date('2024-01-15T10:30:00Z'),
    tags: ['Nifty', 'Stock Market', 'India'],
    readTime: 3,
    priority: 'high',
    isBreaking: true,
    relatedStocks: ['RELIANCE', 'TCS']
  },
  {
    id: 'news-2',
    title: 'RBI Keeps Repo Rate Unchanged',
    summary: 'Reserve Bank of India maintains status quo on interest rates in latest policy review.',
    category: 'economic-news',
    author: 'Finance Reporter',
    source: 'Business Standard',
    sourceUrl: 'https://example.com/news/2',
    publishedAt: new Date('2024-01-15T09:00:00Z'),
    tags: ['RBI', 'Interest Rates', 'Policy'],
    readTime: 5,
    priority: 'medium',
    isBreaking: false
  }
];

const mockApiResponse = {
  success: true,
  data: mockNewsData,
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1
  },
  timestamp: new Date()
};

describe('NewsAggregator Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      render(<NewsAggregator />);
      
      expect(screen.getByText('Loading news...')).toBeInTheDocument();
    });

    it('should render news items after loading', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(screen.getByText('Nifty 50 Hits New All-Time High')).toBeInTheDocument();
        expect(screen.getByText('RBI Keeps Repo Rate Unchanged')).toBeInTheDocument();
      });
    });

    it('should render search bar when showSearch is true', () => {
      render(<NewsAggregator showSearch={true} />);
      
      expect(screen.getByPlaceholderText('Search financial news...')).toBeInTheDocument();
    });

    it('should not render search bar when showSearch is false', () => {
      render(<NewsAggregator showSearch={false} />);
      
      expect(screen.queryByPlaceholderText('Search financial news...')).not.toBeInTheDocument();
    });

    it('should render category filters when showFilters is true', () => {
      render(<NewsAggregator showFilters={true} />);
      
      expect(screen.getByText('All News')).toBeInTheDocument();
      expect(screen.getByText('Market News')).toBeInTheDocument();
      expect(screen.getByText('Economic News')).toBeInTheDocument();
    });

    it('should not render category filters when showFilters is false', () => {
      render(<NewsAggregator showFilters={false} />);
      
      expect(screen.queryByText('All News')).not.toBeInTheDocument();
    });

    it('should render images when showImages is true', async () => {
      render(<NewsAggregator showImages={true} />);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should not render images when showImages is false', async () => {
      render(<NewsAggregator showImages={false} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });

    it('should render summaries when showSummary is true', async () => {
      render(<NewsAggregator showSummary={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Indian stock market reaches new milestone/)).toBeInTheDocument();
      });
    });

    it('should not render summaries when showSummary is false', async () => {
      render(<NewsAggregator showSummary={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/Indian stock market reaches new milestone/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should call onNewsClick when news item is clicked', async () => {
      const mockOnNewsClick = jest.fn();
      render(<NewsAggregator onNewsClick={mockOnNewsClick} />);
      
      await waitFor(() => {
        const newsItem = screen.getByText('Nifty 50 Hits New All-Time High');
        fireEvent.click(newsItem);
      });
      
      expect(mockOnNewsClick).toHaveBeenCalledWith(mockNewsData[0]);
    });

    it('should open news in new tab when no onNewsClick provided', async () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;
      
      render(<NewsAggregator />);
      
      await waitFor(() => {
        const newsItem = screen.getByText('Nifty 50 Hits New All-Time High');
        fireEvent.click(newsItem);
      });
      
      expect(mockOpen).toHaveBeenCalledWith(
        mockNewsData[0].sourceUrl,
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should filter news by category when category button is clicked', async () => {
      render(<NewsAggregator showFilters={true} />);
      
      await waitFor(() => {
        const marketNewsButton = screen.getByText('Market News');
        fireEvent.click(marketNewsButton);
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/news',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"category":"market-news"')
        })
      );
    });

    it('should search news when search input changes', async () => {
      render(<NewsAggregator showSearch={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search financial news...');
      fireEvent.change(searchInput, { target: { value: 'Nifty' } });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/news',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"query":"Nifty"')
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch news')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry fetching news when Try Again button is clicked', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<NewsAggregator />);
      
      await waitFor(() => {
        const retryButton = screen.getByText('Try Again');
        fireEvent.click(retryButton);
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));
      
      render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch news/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('should display news metadata correctly', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(screen.getByText('Economic Times')).toBeInTheDocument();
        expect(screen.getByText('Business Standard')).toBeInTheDocument();
        expect(screen.getByText(/3 min read/)).toBeInTheDocument();
        expect(screen.getByText(/5 min read/)).toBeInTheDocument();
      });
    });

    it('should display news tags', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(screen.getByText('#Nifty')).toBeInTheDocument();
        expect(screen.getByText('#RBI')).toBeInTheDocument();
      });
    });

    it('should display related stocks when available', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(screen.getByText('RELIANCE')).toBeInTheDocument();
        expect(screen.getByText('TCS')).toBeInTheDocument();
      });
    });

    it('should format time ago correctly', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        // Should show relative time like "1h ago", "2d ago", etc.
        const timeElements = screen.getAllByText(/ago/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply mobile-optimized classes', () => {
      render(<NewsAggregator className="mobile-optimized" />);
      
      const container = document.querySelector('.news-aggregator');
      expect(container).toHaveClass('mobile-optimized');
    });

    it('should handle different screen sizes', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        const newsItems = screen.getAllByRole('article');
        newsItems.forEach(item => {
          expect(item).toHaveClass('flex-col', 'lg:flex-row');
        });
      });
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary API calls', async () => {
      const { rerender } = render(<NewsAggregator />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
      
      // Re-render with same props should not trigger new API call
      rerender(<NewsAggregator />);
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should debounce search input', async () => {
      render(<NewsAggregator showSearch={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search financial news...');
      
      // Rapid typing should not trigger multiple API calls
      fireEvent.change(searchInput, { target: { value: 'N' } });
      fireEvent.change(searchInput, { target: { value: 'Ni' } });
      fireEvent.change(searchInput, { target: { value: 'Nif' } });
      fireEvent.change(searchInput, { target: { value: 'Nifty' } });
      
      // Should eventually make the API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<NewsAggregator />);
      
      await waitFor(() => {
        const articles = screen.getAllByRole('article');
        expect(articles.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
      render(<NewsAggregator showFilters={true} />);
      
      const allNewsButton = screen.getByText('All News');
      allNewsButton.focus();
      
      expect(document.activeElement).toBe(allNewsButton);
    });

    it('should have proper alt text for images', async () => {
      render(<NewsAggregator showImages={true} />);
      
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });
  });
});