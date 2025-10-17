import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = generatePageMetadata(
  'Best Stock Brokers in India - Compare & Open Account',
  'Compare top SEBI-registered stock brokers in India. Find discount and full-service brokers with best brokerage rates and trading platforms.',
  '/brokers',
  ['stock brokers India', 'SEBI registered brokers', 'discount broker', 'trading account', 'demat account']
);

export default function BrokersPage() {
  const brokers = [
    {
      name: 'Zerodha',
      type: 'Discount Broker',
      description: 'India\'s largest discount broker with zero brokerage on equity delivery',
      features: ['₹0 brokerage on delivery', 'Advanced trading platforms', 'Educational resources'],
      rating: 4.5,
      accountOpening: '₹200'
    },
    {
      name: 'Upstox',
      type: 'Discount Broker', 
      description: 'Technology-driven broker with competitive pricing and modern tools',
      features: ['Low brokerage rates', 'Mobile-first platform', 'Research reports'],
      rating: 4.3,
      accountOpening: '₹150'
    },
    {
      name: 'ICICI Direct',
      type: 'Full Service Broker',
      description: 'Full-service broker with comprehensive research and advisory services',
      features: ['Research & advisory', 'IPO applications', 'Mutual fund investments'],
      rating: 4.2,
      accountOpening: '₹975'
    },
    {
      name: 'HDFC Securities',
      type: 'Full Service Broker',
      description: 'Trusted full-service broker with extensive research and support',
      features: ['Expert research', '3-in-1 account', 'Portfolio management'],
      rating: 4.1,
      accountOpening: '₹999'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Stock Brokers in India',
    description: 'Compare and choose from the best SEBI-registered stock brokers in India.',
    url: 'https://investovise.com/brokers',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Stock Brokers',
      itemListElement: brokers.map((broker, index) => ({
        '@type': 'Organization',
        position: index + 1,
        name: broker.name,
        description: broker.description,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: broker.rating,
          ratingCount: 100, // This would come from actual data
        },
      })),
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Stock Brokers in India
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Compare and choose from the best SEBI-registered stock brokers in India. 
            Find the right broker for your trading and investment needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {brokers.map((broker) => (
            <div key={broker.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {broker.name}
                  </h3>
                  <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                    {broker.type}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-amber-500 text-lg font-bold mr-1">{broker.rating}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(broker.rating) ? 'text-amber-500' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {broker.description}
              </p>
              
              <ul className="space-y-2 mb-6">
                {broker.features.map((feature) => (
                  <li key={feature} className="flex items-center text-slate-700 dark:text-slate-300">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">Account Opening</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{broker.accountOpening}</p>
                </div>
                <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                  Open Account
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Need help choosing the right broker?
          </p>
          <Link
            href="/demo?category=brokers"
            className="inline-block bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 mr-4"
          >
            Read Broker Reviews
          </Link>
          <Link
            href="/brokers/compare"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Compare All Brokers
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}