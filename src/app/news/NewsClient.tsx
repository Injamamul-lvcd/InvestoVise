'use client';

import React from 'react';
import { NewsAggregator } from '../../components';

export default function NewsClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial News
          </h1>
          <p className="text-gray-600">
            Stay updated with the latest Indian financial market news and insights
          </p>
        </div>

        <NewsAggregator
          showSearch={true}
          showFilters={true}
          showImages={true}
          showSummary={true}
          showBreakingNews={true}
          enableInfiniteScroll={true}
          refreshInterval={300000} // 5 minutes
          className="news-page"
        />
      </div>
    </div>
  );
}