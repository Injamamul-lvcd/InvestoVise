'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { RelatedContentProps } from '@/types/components';
import { IArticle } from '@/types/database';

const RelatedContent: React.FC<RelatedContentProps> = ({
  currentArticle,
  relatedArticles,
  maxItems = 6,
  onArticleClick
}) => {
  const [articles, setArticles] = useState<IArticle[]>(relatedArticles || []);
  const [isLoading, setIsLoading] = useState(!relatedArticles);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!relatedArticles) {
      // For demo purposes, directly use mock data instead of API call
      if (process.env.NODE_ENV === 'development') {
        generateMockRelatedArticles();
        setIsLoading(false);
      } else {
        fetchRelatedArticles();
      }
    }
  }, [currentArticle._id, relatedArticles]);

  const fetchRelatedArticles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would typically be an API call to get related articles
      // For now, we'll simulate the API call
      const response = await fetch(`/api/articles/related/${currentArticle._id}?limit=${maxItems}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch related articles');
      }
      
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error fetching related articles:', err);
      setError('Failed to load related articles');
      
      // Fallback: generate mock related articles based on category and tags
      generateMockRelatedArticles();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockRelatedArticles = () => {
    // This is a fallback method to generate related articles
    // In a real implementation, this would be handled by the backend
    const mockArticles: Partial<IArticle>[] = [
      {
        _id: 'mock-1' as any,
        title: 'Best SIP Mutual Funds for 2024',
        slug: 'best-sip-mutual-funds-2024',
        excerpt: 'Discover the top-performing SIP mutual funds that can help you build wealth systematically in 2024.',
        category: 'mutual-funds',
        subcategory: 'sip',
        publishedAt: new Date(Date.now() - 86400000), // 1 day ago
        viewCount: 1847,
        author: {
          name: 'Priya Sharma',
          email: 'priya@example.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
        },
        featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop',
        content: 'Mock content for related article'
      },
      {
        _id: 'mock-2' as any,
        title: 'Tax Benefits of ELSS Mutual Funds',
        slug: 'tax-benefits-elss-mutual-funds',
        excerpt: 'Learn how ELSS mutual funds can help you save taxes under Section 80C while building wealth.',
        category: 'mutual-funds',
        subcategory: 'elss',
        publishedAt: new Date(Date.now() - 172800000), // 2 days ago
        viewCount: 923,
        author: {
          name: 'Amit Kumar',
          email: 'amit@example.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
        },
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        content: 'Mock content for related article'
      },
      {
        _id: 'mock-3' as any,
        title: 'How to Choose the Right Mutual Fund',
        slug: 'how-to-choose-right-mutual-fund',
        excerpt: 'A step-by-step guide to selecting mutual funds that align with your financial goals and risk tolerance.',
        category: 'mutual-funds',
        subcategory: 'basics',
        publishedAt: new Date(Date.now() - 259200000), // 3 days ago
        viewCount: 2156,
        author: {
          name: 'Rajesh Gupta',
          email: 'rajesh@example.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        },
        featuredImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
        content: 'Mock content for related article'
      }
    ];

    setArticles(mockArticles as IArticle[]);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatReadingTime = (content: string) => {
    if (!content) return '5'; // Default reading time
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute).toString();
  };

  const handleArticleClick = (article: IArticle) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      // Default behavior: navigate to article
      window.location.href = `/articles/${article.slug || article._id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="related-content">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 transition-colors duration-200">Related Articles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                <div className="bg-gray-200 h-3 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="related-content">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Related Articles</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 mb-4">Unable to load related articles</p>
          <button
            onClick={fetchRelatedArticles}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="related-content">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Related Articles</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No related articles found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="related-content">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">Related Articles</h3>
        <span className="text-sm text-gray-500 dark:text-slate-400 transition-colors duration-200">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, maxItems).map((article) => (
          <article
            key={article._id.toString()}
            onClick={() => handleArticleClick(article)}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            {/* Article Image */}
            <div className="relative h-48 bg-gray-100">
              {article.featuredImage ? (
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-50 to-secondary-50">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              
              {/* Category Badge */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-slate-700/90 text-gray-800 dark:text-slate-200 transition-colors duration-200">
                  {article.category.replace(/-/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-amber-400 transition-colors">
                {article.title}
              </h4>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {article.excerpt}
              </p>

              {/* Article Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span>•</span>
                  <span>{formatReadingTime(article.content || '')} min read</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{article.viewCount.toLocaleString()}</span>
                </div>
              </div>

              {/* Author Info */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {article.author.avatar ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={article.author.avatar}
                        alt={article.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {article.author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-600 font-medium">
                    {article.author.name}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* View More Button */}
      {articles.length > maxItems && (
        <div className="text-center mt-8">
          <button className="btn-secondary">
            View More Related Articles
          </button>
        </div>
      )}
    </div>
  );
};

export default RelatedContent;