'use client';

import React, { useState } from 'react';
import { 
  ArticleViewer, 
  CategoryBrowser, 
  SearchInterface, 
  RelatedContent 
} from '@/components';
import { LazyLoad } from '@/components/performance/LazyLoad';
import { OptimizedImage } from '@/components/performance/OptimizedImage';
import { IArticle } from '@/types/database';
import { CategoryHierarchy, SearchFilters, SearchSuggestion } from '@/types/components';

// Mock data for demonstration
const mockArticle: IArticle = {
  _id: '507f1f77bcf86cd799439011' as any,
  title: 'Understanding SIP Investments in India',
  slug: 'understanding-sip-investments-india',
  content: `
    <h2>What is SIP?</h2>
    <p>SIP or Systematic Investment Plan is a popular investment method that allows investors to invest regularly in mutual funds. It's a disciplined approach to investing that helps in building wealth over time.</p>
    
    <h3>Benefits of SIP</h3>
    <ul>
      <li><strong>Rupee Cost Averaging:</strong> SIP helps in averaging out the cost of investment over time.</li>
      <li><strong>Disciplined Investing:</strong> Regular investments help in building a disciplined investment habit.</li>
      <li><strong>Power of Compounding:</strong> Long-term SIP investments benefit from the power of compounding.</li>
    </ul>
    
    <h3>How to Start SIP?</h3>
    <p>Starting a SIP is simple. You can start with as little as ₹500 per month. Choose a good mutual fund scheme, complete the KYC process, and set up automatic deductions from your bank account.</p>
    
    <blockquote>
      <p>"The best time to start investing was 20 years ago. The second best time is now." - Warren Buffett</p>
    </blockquote>
  `,
  excerpt: 'Learn about SIP investments and how they can help you build wealth systematically in the Indian market.',
  category: 'mutual-funds',
  subcategory: 'sip',
  tags: ['sip', 'mutual-funds', 'investment', 'india'],
  author: {
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    bio: 'Financial advisor with 10 years of experience',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  },
  publishedAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-16'),
  viewCount: 1250,
  seoMetadata: {
    title: 'Understanding SIP Investments in India - Complete Guide',
    description: 'Learn about SIP investments and how they can help you build wealth systematically in the Indian market.',
    keywords: ['sip', 'mutual funds', 'investment', 'india']
  },
  relatedArticles: [],
  isPublished: true,
  featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop'
} as IArticle;

const mockCategories: CategoryHierarchy = {
  'stocks': {
    id: 'stocks',
    name: 'Stocks',
    slug: 'stocks',
    description: 'Learn about stock market investing',
    articleCount: 45,
    children: [
      {
        id: 'stocks-basics',
        name: 'Stock Basics',
        slug: 'stocks-basics',
        description: 'Fundamental concepts of stock investing',
        articleCount: 15,
        parent: 'stocks'
      },
      {
        id: 'stocks-analysis',
        name: 'Stock Analysis',
        slug: 'stocks-analysis',
        description: 'Technical and fundamental analysis',
        articleCount: 20,
        parent: 'stocks'
      }
    ]
  },
  'mutual-funds': {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    slug: 'mutual-funds',
    description: 'Comprehensive guide to mutual fund investing',
    articleCount: 38,
    children: [
      {
        id: 'sip',
        name: 'SIP',
        slug: 'sip',
        description: 'Systematic Investment Plans',
        articleCount: 18,
        parent: 'mutual-funds'
      }
    ]
  },
  'loans': {
    id: 'loans',
    name: 'Loans',
    slug: 'loans',
    description: 'Everything about loans in India',
    articleCount: 25
  }
};

const mockSuggestions: SearchSuggestion[] = [
  { text: 'SIP investment', type: 'term', count: 25 },
  { text: 'Mutual Funds', type: 'category', count: 38 },
  { text: 'tax planning', type: 'tag', count: 15 },
  { text: 'Understanding SIP Investments', type: 'article', count: 1 },
  { text: 'ELSS funds', type: 'term', count: 12 }
];

export default function DemoPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<string>('');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    console.log('Selected category:', categoryId);
  };

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSearch = (query: string, filters: SearchFilters) => {
    setSearchResults(`Searched for: "${query}" with filters: ${JSON.stringify(filters)}`);
    console.log('Search:', query, filters);
  };

  const handleViewCountUpdate = (articleId: string) => {
    console.log('View count updated for article:', articleId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Content Display Components Demo
        </h1>

        {/* Search Interface Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Search Interface</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <SearchInterface
              onSearch={handleSearch}
              suggestions={mockSuggestions}
              placeholder="Search for financial articles, guides, and tools..."
              showFilters={true}
            />
            {searchResults && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">{searchResults}</p>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Browser Demo */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Category Browser</h2>
            <CategoryBrowser
              categories={mockCategories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              expandedCategories={expandedCategories}
              onToggleExpand={handleToggleExpand}
              showArticleCount={true}
            />
          </div>

          {/* Article Viewer Demo */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Article Viewer</h2>
            <LazyLoad height={600} onLoad={() => console.log('Article viewer loaded')}>
              <ArticleViewer
                article={mockArticle}
                showRelated={true}
                onViewCountUpdate={handleViewCountUpdate}
              />
            </LazyLoad>

            {/* Related Content Demo */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Related Content</h2>
              <LazyLoad height={300} onLoad={() => console.log('Related content loaded')}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <RelatedContent
                    currentArticle={mockArticle}
                    maxItems={4}
                  />
                </div>
              </LazyLoad>
            </div>

            {/* Performance Demo Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Performance Optimizations Demo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimized Image</h3>
                  <OptimizedImage
                    src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop"
                    alt="Investment planning"
                    width={400}
                    height={200}
                    className="rounded-lg"
                    placeholder="blur"
                    quality={80}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    This image uses Next.js optimization with blur placeholder and quality settings.
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Lazy Loading</h3>
                  <LazyLoad 
                    height={200} 
                    placeholder={
                      <div className="bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg h-48 flex items-center justify-center">
                        <span className="text-gray-500">Loading content...</span>
                      </div>
                    }
                    onLoad={() => console.log('Lazy content loaded')}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg h-48 flex items-center justify-center text-white">
                      <div className="text-center">
                        <h4 className="text-xl font-bold mb-2">Lazy Loaded Content</h4>
                        <p>This content was loaded when it came into view!</p>
                      </div>
                    </div>
                  </LazyLoad>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Features */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ArticleViewer</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Rich text rendering</li>
                <li>• Author information</li>
                <li>• Reading time calculation</li>
                <li>• View count tracking</li>
                <li>• Related articles</li>
                <li>• Responsive design</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">CategoryBrowser</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Hierarchical navigation</li>
                <li>• Expandable categories</li>
                <li>• Article count display</li>
                <li>• Selection highlighting</li>
                <li>• Category statistics</li>
                <li>• Mobile-friendly</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">SearchInterface</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Auto-complete suggestions</li>
                <li>• Advanced filtering</li>
                <li>• Keyboard navigation</li>
                <li>• Category filtering</li>
                <li>• Tag-based search</li>
                <li>• Sort options</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">RelatedContent</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Smart recommendations</li>
                <li>• Fallback content</li>
                <li>• Loading states</li>
                <li>• Error handling</li>
                <li>• Click tracking</li>
                <li>• Grid layout</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}