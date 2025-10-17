import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelatedContent from '../RelatedContent';
import { IArticle } from '@/types/database';

// Mock fetch globally
global.fetch = jest.fn();

const mockCurrentArticle: IArticle = {
  _id: '507f1f77bcf86cd799439011' as any,
  title: 'Understanding SIP Investments in India',
  slug: 'understanding-sip-investments-india',
  content: 'Content about SIP investments',
  excerpt: 'Learn about SIP investments',
  category: 'mutual-funds',
  subcategory: 'sip',
  tags: ['sip', 'mutual-funds'],
  author: {
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com'
  },
  publishedAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  viewCount: 1250,
  seoMetadata: {
    title: 'Understanding SIP Investments',
    description: 'Learn about SIP investments',
    keywords: ['sip']
  },
  relatedArticles: [],
  isPublished: true
} as IArticle;

const mockRelatedArticles: IArticle[] = [
  {
    _id: '507f1f77bcf86cd799439012' as any,
    title: 'Best Mutual Funds for SIP in 2024',
    slug: 'best-mutual-funds-sip-2024',
    content: 'Content about best mutual funds for SIP',
    excerpt: 'Discover the top mutual funds for SIP investments in 2024.',
    category: 'mutual-funds',
    subcategory: 'recommendations',
    tags: ['mutual-funds', 'sip'],
    author: {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      avatar: 'https://example.com/priya-avatar.jpg'
    },
    publishedAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    viewCount: 890,
    seoMetadata: {
      title: 'Best Mutual Funds for SIP',
      description: 'Top mutual funds for SIP',
      keywords: ['mutual-funds']
    },
    relatedArticles: [],
    isPublished: true,
    featuredImage: 'https://example.com/mutual-funds.jpg'
  } as IArticle,
  {
    _id: '507f1f77bcf86cd799439013' as any,
    title: 'Tax Benefits of ELSS Funds',
    slug: 'tax-benefits-elss-funds',
    content: 'Content about ELSS tax benefits',
    excerpt: 'Learn about tax-saving benefits of ELSS mutual funds.',
    category: 'mutual-funds',
    subcategory: 'elss',
    tags: ['elss', 'tax-saving'],
    author: {
      name: 'Amit Singh',
      email: 'amit@example.com'
    },
    publishedAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    viewCount: 654,
    seoMetadata: {
      title: 'Tax Benefits of ELSS',
      description: 'ELSS tax benefits',
      keywords: ['elss']
    },
    relatedArticles: [],
    isPublished: true
  } as IArticle
];

describe('RelatedContent', () => {
  const mockOnArticleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders related content title', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getByText('Related Articles')).toBeInTheDocument();
  });

  it('displays article count', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getByText('2 articles')).toBeInTheDocument();
  });

  it('displays singular article count', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={[mockRelatedArticles[0]]}
      />
    );
    
    expect(screen.getByText('1 article')).toBeInTheDocument();
  });

  it('renders related articles with correct information', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getByText('Best Mutual Funds for SIP in 2024')).toBeInTheDocument();
    expect(screen.getByText('Tax Benefits of ELSS Funds')).toBeInTheDocument();
    expect(screen.getByText('Discover the top mutual funds for SIP investments in 2024.')).toBeInTheDocument();
    expect(screen.getByText('Learn about tax-saving benefits of ELSS mutual funds.')).toBeInTheDocument();
  });

  it('displays author information', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Amit Singh')).toBeInTheDocument();
  });

  it('shows author avatar when available', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    const avatar = screen.getByAltText('Priya Sharma');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/priya-avatar.jpg');
  });

  it('shows author initials when avatar is not available', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    // Amit Singh doesn't have an avatar, so should show initials
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('displays featured images when available', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    const featuredImage = screen.getByAltText('Best Mutual Funds for SIP in 2024');
    expect(featuredImage).toBeInTheDocument();
    expect(featuredImage).toHaveAttribute('src', 'https://example.com/mutual-funds.jpg');
  });

  it('shows placeholder when featured image is not available', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    // Second article doesn't have featured image, should show placeholder
    const placeholderIcons = screen.getAllByTestId ? screen.getAllByTestId('placeholder-icon') : document.querySelectorAll('svg');
    expect(placeholderIcons.length).toBeGreaterThan(0);
  });

  it('formats dates correctly', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getByText('Jan 10, 2024')).toBeInTheDocument();
    expect(screen.getByText('Jan 8, 2024')).toBeInTheDocument();
  });

  it('displays view counts', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getByText('890')).toBeInTheDocument();
    expect(screen.getByText('654')).toBeInTheDocument();
  });

  it('calculates reading time', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    // Should show reading time for articles
    expect(screen.getAllByText(/min read/)).toHaveLength(2);
  });

  it('calls onArticleClick when article is clicked', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
        onArticleClick={mockOnArticleClick}
      />
    );
    
    fireEvent.click(screen.getByText('Best Mutual Funds for SIP in 2024'));
    expect(mockOnArticleClick).toHaveBeenCalledWith(mockRelatedArticles[0]);
  });

  it('respects maxItems limit', () => {
    const manyArticles = Array.from({ length: 10 }, (_, i) => ({
      ...mockRelatedArticles[0],
      _id: `article-${i}` as any,
      title: `Article ${i}`
    }));
    
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={manyArticles}
        maxItems={3}
      />
    );
    
    expect(screen.getByText('Article 0')).toBeInTheDocument();
    expect(screen.getByText('Article 1')).toBeInTheDocument();
    expect(screen.getByText('Article 2')).toBeInTheDocument();
    expect(screen.queryByText('Article 3')).not.toBeInTheDocument();
  });

  it('shows "View More" button when there are more articles than maxItems', () => {
    const manyArticles = Array.from({ length: 10 }, (_, i) => ({
      ...mockRelatedArticles[0],
      _id: `article-${i}` as any,
      title: `Article ${i}`
    }));
    
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={manyArticles}
        maxItems={3}
      />
    );
    
    expect(screen.getByText('View More Related Articles')).toBeInTheDocument();
  });

  it('fetches related articles when not provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: mockRelatedArticles })
    });

    render(<RelatedContent currentArticle={mockCurrentArticle} />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/articles/related/507f1f77bcf86cd799439011?limit=6');
    });
  });

  it('shows loading state while fetching', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<RelatedContent currentArticle={mockCurrentArticle} />);
    
    expect(screen.getByText('Related Articles')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('handles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<RelatedContent currentArticle={mockCurrentArticle} />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load related articles')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('retries fetching when "Try Again" is clicked', async () => {
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: mockRelatedArticles })
      });
    
    render(<RelatedContent currentArticle={mockCurrentArticle} />);
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Try Again'));
    
    await waitFor(() => {
      expect(screen.getByText('Best Mutual Funds for SIP in 2024')).toBeInTheDocument();
    });
  });

  it('shows empty state when no articles are found', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={[]}
      />
    );
    
    expect(screen.getByText('No related articles found')).toBeInTheDocument();
  });

  it('generates fallback articles on fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<RelatedContent currentArticle={mockCurrentArticle} />);
    
    await waitFor(() => {
      // Should show mock articles based on category
      expect(screen.getByText(/Understanding.*mutual-funds.*in India/)).toBeInTheDocument();
    });
  });

  it('displays category badges', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    expect(screen.getAllByText('MUTUAL-FUNDS')).toHaveLength(2);
  });

  it('applies hover effects on article cards', () => {
    render(
      <RelatedContent 
        currentArticle={mockCurrentArticle}
        relatedArticles={mockRelatedArticles}
      />
    );
    
    const articleCards = screen.getAllByRole('article');
    expect(articleCards[0]).toHaveClass('hover:shadow-md');
    expect(articleCards[0]).toHaveClass('cursor-pointer');
  });
});