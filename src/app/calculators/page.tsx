import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';
import CalculatorsClient from './CalculatorsClient';

export const metadata: Metadata = generatePageMetadata(
  'Financial Calculators - SIP, EMI, Tax Calculator',
  'Free financial calculators for India. Calculate SIP returns, EMI, tax planning, retirement planning and investment goals with accurate results.',
  '/calculators',
  ['financial calculator', 'SIP calculator', 'EMI calculator', 'tax calculator', 'retirement planning', 'investment calculator']
);

export default function CalculatorsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Financial Calculators',
    description: 'Free financial calculators for India including SIP, EMI, tax and retirement planning calculators.',
    url: 'https://investovise.com/calculators',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <CalculatorsClient />
    </>
  );
}