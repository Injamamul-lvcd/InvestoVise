'use client';

import Head from 'next/head';
import { StructuredData } from './StructuredData';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object | object[];
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  structuredData,
  noIndex = false,
}: SEOHeadProps) {
  return (
    <>
      {canonicalUrl && (
        <Head>
          <link rel="canonical" href={canonicalUrl} />
        </Head>
      )}
      
      {noIndex && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}
      
      {structuredData && <StructuredData data={structuredData} />}
    </>
  );
}