import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArticleViewer from '../ArticleViewer';
import { IArticle } from '@/types/database';

// Mock fetch globally
global.fetch = jest.fn();

const mockArticle: IArticle = {
  _id: '507f1f77bcf86cd799439011' as any,
  title: 'Understanding SIP Investments in India',
  slug: 'understanding-sip-investments-india',
  content: '<p>This is a comprehensive guide to SIP investments in India. SIP or Systematic Investment Plan is a popular investment method.</p><p>It allows investors to invest regularly in mutual funds.</p>',
  excerpt: 'Learn about SIP investments and how they can help you build wealth systematically in the Indian market.',
  category: 'mutual-funds',
  subcategory: 'sip',
  tags: ['sip', 'mutual-funds', 'investment', 'india'],
  author: {
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    bio: 'Financial advisor with 10 years of experience',
    avatar: 'https://example.com/avatar.jpg'
  },
  publishedAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-16'),
  viewCount: 1250,
  seoMetadata: {
    title: 'Understanding SIP Investments in India - Complete Guide',
    description: 'Learn about SIP investments and how they can help you build wealth systematically in the Indian market.',
    keywords: ['sip', 'mutual funds', 'investment', 'india']
  },
  relatedArticles: ['507f1f77bcf86cd799439012' as any, '507f1f77bcf86cd799439013' as any],
  isPublished: true,
  featuredImage: 'https://example.com/featured-image.jpg'
} as IArticle;

const mockRelatedArticles: IArticle[] = [
  {
    _id: '507f1f77bcf86cd799439012' as any,
    title: 'Best Mutual Funds for SIP in 2024',
    slug: 'best-mutual-funds-sip-2024',
    content: 'Content about best mutual funds',
    excerpt: 'Discover the top mutual funds for SIP investments in 2024.',
    category: 'mutual-funds',
    subcategory: 'recommendations',
    tags: ['mutual-funds', 'sip', '2024'],
    author: {
      name: 'Priya Sharma',
      email: 'priya@example.com'
    },
    publishedAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    viewCount: 890,
    seoMetadata: {
      title: 'Best Mutual Funds for SIP in 2024',
      description: 'Discover the top mutual funds for SIP investments in 2024.',
      keywords: ['mutual funds', 'sip', '2024']
    },
    relatedArticles: [],
    isPublished: true,
    featuredImage: 'https://example.com/related-image.jpg'
  } as IArticle
];

describe('ArticleViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders article content correctly', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    expect(screen.getByText('Understanding SIP Investments in India')).toBeInTheDocument();
    expect(screen.getByText('Learn about SIP investments and how they can help you build wealth systematically in the Indian market.')).toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('1,250 views')).toBeInTheDocument();
  });

  it('displays category and subcategory badges', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    expect(screen.getByText('MUTUAL-FUNDS')).toBeInTheDocument();
    expect(screen.getByText('sip')).toBeInTheDocument();
  });

  it('shows tags when available', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    expect(screen.getByText('#sip')).toBeInTheDocument();
    expect(screen.getByText('#mutual-funds')).toBeInTheDocument();
    expect(screen.getByText('#investment')).toBeInTheDocument();
    expect(screen.getByText('#india')).toBeInTheDocument();
  });

  it('calculates and displays reading time', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    // The content has about 25 words, so at 200 words per minute, it should be 1 min
    expect(screen.getByText(/1 min read/)).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
  });

  it('calls onViewCountUpdate when provided', () => {
    const mockOnViewCountUpdate = jest.fn();
    render(<ArticleViewer article={mockArticle} onViewCountUpdate={mockOnViewCountUpdate} />);
    
    expect(mockOnViewCountUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('renders featured image when available', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    const featuredImage = screen.getByAltText('Understanding SIP Investments in India');
    expect(featuredImage).toBeInTheDocument();
    expect(featuredImage).toHaveAttribute('src', 'https://example.com/featured-image.jpg');
  });

  it('renders author avatar when available', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    const authorAvatar = screen.getByAltText('Rajesh Kumar');
    expect(authorAvatar).toBeInTheDocument();
  });

  it('loads related articles when showRelated is true', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: mockRelatedArticles })
    });

    render(<ArticleViewer article={mockArticle} showRelated={true} />);
    
    expect(screen.getByText('Related Articles')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/articles/related/507f1f77bcf86cd799439011');
    });
  });

  it('shows loading state for related articles', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ArticleViewer article={mockArticle} showRelated={true} />);
    
    expect(screen.getByText('Related Articles')).toBeInTheDocument();
    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('handles related articles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<ArticleViewer article={mockArticle} showRelated={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('No related articles found.')).toBeInTheDocument();
    });
  });

  it('does not show related articles section when showRelated is false', () => {
    render(<ArticleViewer article={mockArticle} showRelated={false} />);
    
    expect(screen.queryByText('Related Articles')).not.toBeInTheDocument();
  });

  it('renders article without featured image', () => {
    const articleWithoutImage = { ...mockArticle, featuredImage: undefined };
    render(<ArticleViewer article={articleWithoutImage} />);
    
    expect(screen.getByText('Understanding SIP Investments in India')).toBeInTheDocument();
    expect(screen.queryByAltText('Understanding SIP Investments in India')).not.toBeInTheDocument();
  });

  it('renders article without author avatar', () => {
    const articleWithoutAvatar = {
      ...mockArticle,
      author: { ...mockArticle.author, avatar: undefined }
    };
    render(<ArticleViewer article={articleWithoutAvatar} />);
    
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.queryByAltText('Rajesh Kumar')).not.toBeInTheDocument();
  });

  it('handles empty tags array', () => {
    const articleWithoutTags = { ...mockArticle, tags: [] };
    render(<ArticleViewer article={articleWithoutTags} />);
    
    expect(screen.queryByText('#sip')).not.toBeInTheDocument();
  });

  it('renders HTML content safely', () => {
    render(<ArticleViewer article={mockArticle} />);
    
    // The content should be rendered as HTML
    expect(screen.getByText(/This is a comprehensive guide to SIP investments/)).toBeInTheDocument();
    expect(screen.getByText(/It allows investors to invest regularly/)).toBeInTheDocument();
  });
});