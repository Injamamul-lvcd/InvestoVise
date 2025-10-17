import { generateSitemapUrls, generateArticleSitemapUrls, generateXmlSitemap, generateRobotsTxt } from '@/lib/sitemap';
import { IArticle } from '@/types/database';

describe('Sitemap Utils', () => {
  describe('generateSitemapUrls', () => {
    it('should generate static page URLs', () => {
      const urls = generateSitemapUrls();

      expect(urls).toHaveLength(6);
      expect(urls[0].url).toContain('/');
      expect(urls[0].priority).toBe(1.0);
      expect(urls[0].changeFrequency).toBe('daily');

      const loansUrl = urls.find(url => url.url.includes('/loans'));
      expect(loansUrl).toBeDefined();
      expect(loansUrl?.priority).toBe(0.9);
    });
  });

  describe('generateArticleSitemapUrls', () => {
    it('should generate article URLs', () => {
      const mockArticles: IArticle[] = [
        {
          _id: 'article1',
          title: 'Article 1',
          slug: 'article-1',
          content: 'Content',
          excerpt: 'Excerpt',
          category: 'Investment',
          subcategory: 'Stocks',
          tags: ['stocks'],
          author: { name: 'Author', email: 'author@example.com' } as any,
          publishedAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
          viewCount: 100,
          seoMetadata: {},
          relatedArticles: [],
          isPublished: true,
        },
        {
          _id: 'article2',
          title: 'Article 2',
          slug: 'article-2',
          content: 'Content',
          excerpt: 'Excerpt',
          category: 'Loans',
          subcategory: 'Personal',
          tags: ['loans'],
          author: { name: 'Author', email: 'author@example.com' } as any,
          publishedAt: new Date('2023-02-01'),
          updatedAt: new Date('2023-02-02'),
          viewCount: 50,
          seoMetadata: {},
          relatedArticles: [],
          isPublished: true,
        },
      ];

      const urls = generateArticleSitemapUrls(mockArticles);

      expect(urls).toHaveLength(2);
      expect(urls[0].url).toContain('/articles/article-1');
      expect(urls[0].lastModified).toEqual(new Date('2023-01-02'));
      expect(urls[0].priority).toBe(0.7);
      expect(urls[0].changeFrequency).toBe('monthly');
    });
  });

  describe('generateXmlSitemap', () => {
    it('should generate valid XML sitemap', () => {
      const urls = [
        {
          url: 'https://example.com/',
          lastModified: new Date('2023-01-01'),
          changeFrequency: 'daily' as const,
          priority: 1.0,
        },
        {
          url: 'https://example.com/page',
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ];

      const xml = generateXmlSitemap(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('<loc>https://example.com/</loc>');
      expect(xml).toContain('<lastmod>2023-01-01T00:00:00.000Z</lastmod>');
      expect(xml).toContain('<changefreq>daily</changefreq>');
      expect(xml).toContain('<priority>1</priority>');
      expect(xml).toContain('<loc>https://example.com/page</loc>');
      expect(xml).toContain('</urlset>');
    });

    it('should handle URLs without optional fields', () => {
      const urls = [
        {
          url: 'https://example.com/simple',
        },
      ];

      const xml = generateXmlSitemap(urls);

      expect(xml).toContain('<loc>https://example.com/simple</loc>');
      expect(xml).not.toContain('<lastmod>');
      expect(xml).not.toContain('<changefreq>');
      expect(xml).not.toContain('<priority>');
    });
  });

  describe('generateRobotsTxt', () => {
    it('should generate valid robots.txt', () => {
      const robotsTxt = generateRobotsTxt();

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
      expect(robotsTxt).toContain('Disallow: /api/');
      expect(robotsTxt).toContain('Disallow: /admin/');
      expect(robotsTxt).toContain('Allow: /api/articles/sitemap');
      expect(robotsTxt).toContain('Sitemap:');
      expect(robotsTxt).toContain('Crawl-delay: 1');
    });
  });
});