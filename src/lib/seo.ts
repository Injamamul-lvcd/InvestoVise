import { Metadata } from 'next';
import { IArticle } from '@/types/database';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export const DEFAULT_SEO = {
  siteName: 'InvestoVise',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://investovise.com',
  defaultTitle: 'InvestoVise - Indian Investment Platform',
  defaultDescription: 'Comprehensive financial education and investment platform for India. Learn about stocks, mutual funds, loans, credit cards, and brokers.',
  defaultKeywords: ['investment', 'finance', 'India', 'stocks', 'mutual funds', 'loans', 'credit cards', 'brokers', 'financial education'],
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@investovise',
};

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage,
    ogType = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
  } = config;

  const fullTitle = title.includes(DEFAULT_SEO.siteName) 
    ? title 
    : `${title} | ${DEFAULT_SEO.siteName}`;

  const allKeywords = [...DEFAULT_SEO.defaultKeywords, ...keywords, ...tags];
  const imageUrl = ogImage || DEFAULT_SEO.defaultImage;
  const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${DEFAULT_SEO.siteUrl}${imageUrl}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: allKeywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    creator: DEFAULT_SEO.siteName,
    publisher: DEFAULT_SEO.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: ogType,
      locale: 'en_IN',
      url: canonicalUrl || DEFAULT_SEO.siteUrl,
      siteName: DEFAULT_SEO.siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(ogType === 'article' && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        section,
        tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_SEO.twitterHandle,
      creator: DEFAULT_SEO.twitterHandle,
      title: fullTitle,
      description,
      images: [fullImageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };

  return metadata;
}

export function generateArticleMetadata(article: IArticle): Metadata {
  const canonicalUrl = `${DEFAULT_SEO.siteUrl}/articles/${article.slug}`;
  
  return generateMetadata({
    title: article.title,
    description: article.excerpt || article.seoMetadata?.description || '',
    keywords: article.seoMetadata?.keywords || article.tags,
    canonicalUrl,
    ogImage: article.featuredImage,
    ogType: 'article',
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedAt?.toISOString(),
    author: article.author?.name,
    section: article.category,
    tags: article.tags,
  });
}

export function generatePageMetadata(
  title: string,
  description: string,
  path: string,
  keywords?: string[]
): Metadata {
  const canonicalUrl = `${DEFAULT_SEO.siteUrl}${path}`;
  
  return generateMetadata({
    title,
    description,
    keywords,
    canonicalUrl,
  });
}

// Structured data generators
export function generateArticleStructuredData(article: IArticle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author?.name || 'InvestoVise Team',
    },
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_SEO.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${DEFAULT_SEO.siteUrl}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${DEFAULT_SEO.siteUrl}/articles/${article.slug}`,
    },
    keywords: article.tags?.join(', '),
    articleSection: article.category,
  };
}

export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function generateFinancialServiceStructuredData(service: {
  name: string;
  description: string;
  provider: string;
  url: string;
  interestRate?: number;
  fees?: Array<{ name: string; amount: number }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: service.provider,
    },
    url: service.url,
    ...(service.interestRate && {
      interestRate: {
        '@type': 'QuantitativeValue',
        value: service.interestRate,
        unitText: 'PERCENT',
      },
    }),
    ...(service.fees && {
      fees: service.fees.map(fee => ({
        '@type': 'MonetaryAmount',
        name: fee.name,
        value: fee.amount,
        currency: 'INR',
      })),
    }),
  };
}