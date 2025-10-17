import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = generatePageMetadata(
  'Compare Loans in India - Personal, Home, Car Loans',
  'Compare and apply for the best loan offers in India. Find personal loans, home loans, car loans with lowest interest rates and quick approval.',
  '/loans',
  ['loans India', 'personal loan', 'home loan', 'car loan', 'loan comparison', 'best loan rates']
);

export default function LoansPage() {
  const loanTypes = [
    {
      name: 'Home Loans',
      description: 'Get the best home loan rates from top banks in India',
      features: ['Low interest rates', 'Quick approval', 'Flexible tenure'],
      href: '/loans/home-loans'
    },
    {
      name: 'Personal Loans',
      description: 'Instant personal loans with minimal documentation',
      features: ['No collateral', 'Quick disbursal', 'Competitive rates'],
      href: '/loans/personal-loans'
    },
    {
      name: 'Car Loans',
      description: 'Finance your dream car with attractive interest rates',
      features: ['Up to 90% funding', 'Fast processing', 'Flexible EMIs'],
      href: '/loans/car-loans'
    },
    {
      name: 'Business Loans',
      description: 'Grow your business with customized loan solutions',
      features: ['Working capital', 'Equipment finance', 'Term loans'],
      href: '/loans/business-loans'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Loans in India',
    description: 'Compare and apply for the best loan offers from top banks and NBFCs in India.',
    url: 'https://investovise.com/loans',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Loan Types',
      itemListElement: loanTypes.map((loan, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: loan.name,
        description: loan.description,
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
            Loans in India
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Compare and apply for the best loan offers from top banks and NBFCs in India. 
            Get instant approval and competitive interest rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {loanTypes.map((loan) => (
            <div key={loan.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-200">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {loan.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {loan.description}
              </p>
              <ul className="space-y-2 mb-6">
                {loan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-slate-700 dark:text-slate-300">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={loan.href}
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              >
                Explore {loan.name}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Need help choosing the right loan?
          </p>
          <Link
            href="/calculators?calc=emi"
            className="inline-block bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Use EMI Calculator
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}