import { generateMetadata, generateArticleMetadata, generatePageMetadata, DEFAULT_SEO } from '@/lib/seo';
import { IArticle } from '@/types/database';

describe('SEO Utils', () => {
  describe('generateMetadata', () => {
    it('should generate basic metadata correctly', () => {
      const config = {
        title: 'Test Article',
        description: 'Test description',
        keywords: ['test', 'article'],
      };

      const metadata = generateMetadata(config);

      expect(metadata.title).toBe(`Test Article | ${DEFAULT_SEO.siteName}`);
      expect(metadata.description).toBe('Test description');
      expect(metadata.keywords).toContain('test');
      expect(metadata.keywords).toContain('article');
    });

    it('should not duplicate site name in title', () => {
      const config = {
        title: `Test Article | ${DEFAULT_SEO.siteName}`,
        description: 'Test description',
      };

      const metadata = generateMetadata(config);

      expect(metadata.title).toBe(`Test Article | ${DEFAULT_SEO.siteName}`);
    });

    it('should generate OpenGraph metadata', () => {
      const config = {
        title: 'Test Article',
        description: 'Test description',
        canonicalUrl: 'https://example.com/test',
        ogImage: 'https://example.com/image.jpg',
      };

      const metadata = generateMetadata(config);

      expect(metadata.openGraph?.title).toBe(`Test Article | ${DEFAULT_SEO.siteName}`);
      expect(metadata.openGraph?.description).toBe('Test description');
      expect(metadata.openGraph?.url).toBe('https://example.com/test');
      expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/image.jpg');
    });

    it('should generate Twitter metadata', () => {
      const config = {
        title: 'Test Article',
        description: 'Test description',
      };

      const metadata = generateMetadata(config);

      expect(metadata.twitter?.title).toBe(`Test Article | ${DEFAULT_SEO.siteName}`);
      expect(metadata.twitter?.description).toBe('Test description');
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });
  });

  describe('generateArticleMetadata', () => {
    it('should generate article metadata correctly', () => {
      const mockArticle: IArticle = {
        _id: 'test-id',
        title: 'Understanding SIP Investments',
        slug: 'understanding-sip-investments',
        content: '<p>Article content</p>',
        excerpt: 'Learn about SIP investments',
        category: 'Investment',
        subcategory: 'Mutual Funds',
        tags: ['sip', 'mutual funds', 'investment'],
        author: { name: 'John Doe', email: 'john@example.com' } as any,
        publishedAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        viewCount: 100,
        seoMetadata: {
          title: 'Understanding SIP Investments',
          description: 'Learn about SIP investments',
          keywords: ['sip', 'mutual funds'],
        },
        relatedArticles: [],
        isPublished: true,
        featuredImage: 'https://example.com/image.jpg',
      };

      const metadata = generateArticleMetadata(mockArticle);

      expect(metadata.title).toBe(`Understanding SIP Investments | ${DEFAULT_SEO.siteName}`);
      expect(metadata.description).toBe('Learn about SIP investments');
      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.openGraph?.publishedTime).toBe('2023-01-01T00:00:00.000Z');
      expect(metadata.openGraph?.modifiedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(metadata.alternates?.canonical).toBe(`${DEFAULT_SEO.siteUrl}/articles/understanding-sip-investments`);
    });
  });

  describe('generatePageMetadata', () => {
    it('should generate page metadata correctly', () => {
      const metadata = generatePageMetadata(
        'Loans Page',
        'Compare loans in India',
        '/loans',
        ['loans', 'india']
      );

      expect(metadata.title).toBe(`Loans Page | ${DEFAULT_SEO.siteName}`);
      expect(metadata.description).toBe('Compare loans in India');
      expect(metadata.alternates?.canonical).toBe(`${DEFAULT_SEO.siteUrl}/loans`);
      expect(metadata.keywords).toContain('loans');
      expect(metadata.keywords).toContain('india');
    });
  });
});