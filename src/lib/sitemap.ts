import { IArticle } from '@/types/database';
import { DEFAULT_SEO } from './seo';

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapUrls(): SitemapUrl[] {
  const baseUrl = DEFAULT_SEO.siteUrl;
  
  // Static pages
  const staticPages: SitemapUrl[] = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/loans`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/credit-cards`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/brokers`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calculators`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  return staticPages;
}

export function generateArticleSitemapUrls(articles: IArticle[]): SitemapUrl[] {
  const baseUrl = DEFAULT_SEO.siteUrl;
  
  return articles.map(article => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: article.updatedAt || article.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
}

export function generateXmlSitemap(urls: SitemapUrl[]): string {
  const urlElements = urls.map(({ url, lastModified, changeFrequency, priority }) => {
    const lastMod = lastModified ? `<lastmod>${lastModified.toISOString()}</lastmod>` : '';
    const changeFreq = changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : '';
    const priorityElement = priority !== undefined ? `<priority>${priority}</priority>` : '';
    
    return `  <url>
    <loc>${url}</loc>${lastMod}${changeFreq}${priorityElement}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

export function generateRobotsTxt(): string {
  const baseUrl = DEFAULT_SEO.siteUrl;
  
  return `User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/

# Allow specific API endpoints that should be crawled
Allow: /api/articles/sitemap
Allow: /api/sitemap

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;
}