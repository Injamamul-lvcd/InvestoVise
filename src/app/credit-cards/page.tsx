import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = generatePageMetadata(
  'Best Credit Cards in India - Compare & Apply Online',
  'Compare and apply for the best credit cards in India. Find cashback, rewards, and travel credit cards with no annual fee and instant approval.',
  '/credit-cards',
  ['credit cards India', 'best credit cards', 'cashback credit card', 'rewards credit card', 'travel credit card']
);

export default function CreditCardsPage() {
  const creditCards = [
    {
      name: 'HDFC Regalia Credit Card',
      bank: 'HDFC Bank',
      type: 'Premium',
      description: 'Premium lifestyle credit card with exclusive rewards and benefits',
      features: ['4 reward points per ₹150', 'Airport lounge access', 'Dining privileges'],
      annualFee: '₹2,500',
      rating: 4.4,
    },
    {
      name: 'SBI SimplyCLICK Credit Card',
      bank: 'State Bank of India',
      type: 'Cashback',
      description: 'Online shopping credit card with accelerated cashback rewards',
      features: ['10X rewards on online shopping', '5X rewards on dining', 'Fuel surcharge waiver'],
      annualFee: '₹499',
      rating: 4.2,
    },
    {
      name: 'ICICI Amazon Pay Credit Card',
      bank: 'ICICI Bank',
      type: 'Cashback',
      description: 'Co-branded credit card for Amazon shopping with unlimited cashback',
      features: ['5% cashback on Amazon', '2% cashback on bill payments', 'No annual fee'],
      annualFee: 'Nil',
      rating: 4.3,
    },
    {
      name: 'Axis Bank Magnus Credit Card',
      bank: 'Axis Bank',
      type: 'Super Premium',
      description: 'Super premium credit card with luxury benefits and high reward rates',
      features: ['25,000 welcome bonus', 'Airport lounge access', 'Golf privileges'],
      annualFee: '₹12,500',
      rating: 4.5,
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Best Credit Cards in India',
    description: 'Compare and apply for the best credit cards in India with exclusive offers and benefits.',
    url: 'https://investovise.com/credit-cards',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Credit Cards',
      itemListElement: creditCards.map((card, index) => ({
        '@type': 'FinancialProduct',
        position: index + 1,
        name: card.name,
        description: card.description,
        provider: {
          '@type': 'Organization',
          name: card.bank,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: card.rating,
          ratingCount: 100,
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
              Best Credit Cards in India
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Compare and apply for the best credit cards in India. Find cashback, rewards, 
              and travel credit cards with exclusive benefits and instant approval.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {creditCards.map((card) => (
              <div key={card.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {card.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">{card.bank}</p>
                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                      {card.type}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-amber-500 text-lg font-bold mr-1">{card.rating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(card.rating) ? 'text-amber-500' : 'text-gray-300'}`}
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
                  {card.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {card.features.map((feature) => (
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
                    <span className="text-sm text-slate-500 dark:text-slate-400">Annual Fee</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{card.annualFee}</p>
                  </div>
                  <button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Need help choosing the right credit card?
            </p>
            <Link
              href="/calculators?calc=credit-card"
              className="inline-block bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 mr-4"
            >
              Credit Card Calculator
            </Link>
            <Link
              href="/credit-cards/compare"
              className="inline-block bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Compare All Cards
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}