import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';
import NewsClient from './NewsClient';

export const metadata: Metadata = generatePageMetadata(
  'Indian Financial News & Market Updates',
  'Latest Indian financial market news, stock market updates, mutual fund news, and investment insights. Stay updated with real-time market data.',
  '/news',
  ['financial news India', 'stock market news', 'mutual fund news', 'market updates', 'investment news', 'BSE NSE news']
);

export default function NewsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Indian Financial News',
    description: 'Latest Indian financial market news, stock market updates, and investment insights.',
    url: 'https://investovise.com/news',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Financial News Articles',
      description: 'Real-time financial news and market updates from India',
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <NewsClient />
    </>
  );
}