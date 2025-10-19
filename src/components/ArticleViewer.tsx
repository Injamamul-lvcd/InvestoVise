'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArticleViewerProps } from '@/types/components';
import { IArticle } from '@/types/database';

const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  showRelated = true,
  onViewCountUpdate
}) => {
  const [relatedArticles, setRelatedArticles] = useState<IArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Track view count when component mounts
    if (onViewCountUpdate && article._id) {
      onViewCountUpdate(article._id.toString());
    }

    // Load related articles if showRelated is true
    if (showRelated && article.relatedArticles?.length > 0) {
      loadRelatedArticles();
    }
  }, [article._id, showRelated, onViewCountUpdate]);

  const loadRelatedArticles = async () => {
    setIsLoading(true);
    try {
      // This would typically be an API call
      // For now, we'll simulate it
      const response = await fetch(`/api/articles/related/${article._id}`);
      if (response.ok) {
        const data = await response.json();
        setRelatedArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to load related articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  return (
    <article className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
      {/* Article Header */}
      <header className="px-6 py-8 border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
        {article.featuredImage && (
          <div className="mb-6 relative h-64 md:h-80 rounded-lg overflow-hidden">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {article.category.replace(/-/g, ' ').toUpperCase()}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {article.subcategory}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {article.excerpt}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {article.author.avatar && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{article.author.name}</p>
              <p className="text-sm text-gray-500">
                {formatDate(article.publishedAt)} • {formatReadingTime(article.content)} min read
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {article.viewCount.toLocaleString()} views
            </span>
          </div>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Article Content */}
      <div className="px-6 py-8">
        <div 
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>

      {/* Related Articles */}
      {showRelated && (
        <footer className="px-6 py-8 bg-gray-50 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Related Articles</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : relatedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map((relatedArticle) => (
                <div
                  key={relatedArticle._id.toString()}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {relatedArticle.featuredImage && (
                    <div className="relative h-32">
                      <Image
                        src={relatedArticle.featuredImage}
                        alt={relatedArticle.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {relatedArticle.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(relatedArticle.publishedAt)}</span>
                      <span>{formatReadingTime(relatedArticle.content)} min read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No related articles found.</p>
          )}
        </footer>
      )}
    </article>
  );
};

export default ArticleViewer;