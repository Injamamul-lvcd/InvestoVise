import { generateArticleStructuredData, generateBreadcrumbStructuredData, generateFinancialServiceStructuredData } from '@/lib/seo';
import { IArticle } from '@/types/database';

describe('Structured Data Utils', () => {
  describe('generateArticleStructuredData', () => {
    it('should generate article structured data', () => {
      const mockArticle: IArticle = {
        _id: 'test-id',
        title: 'Understanding SIP Investments',
        slug: 'understanding-sip-investments',
        content: '<p>Article content</p>',
        excerpt: 'Learn about SIP investments in India',
        category: 'Investment',
        subcategory: 'Mutual Funds',
        tags: ['sip', 'mutual funds', 'investment'],
        author: { name: 'John Doe', email: 'john@example.com' } as any,
        publishedAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        viewCount: 100,
        seoMetadata: {},
        relatedArticles: [],
        isPublished: true,
        featuredImage: 'https://example.com/image.jpg',
      };

      const structuredData = generateArticleStructuredData(mockArticle);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('Article');
      expect(structuredData.headline).toBe('Understanding SIP Investments');
      expect(structuredData.description).toBe('Learn about SIP investments in India');
      expect(structuredData.image).toBe('https://example.com/image.jpg');
      expect(structuredData.datePublished).toBe('2023-01-01T00:00:00.000Z');
      expect(structuredData.dateModified).toBe('2023-01-02T00:00:00.000Z');
      expect(structuredData.author.name).toBe('John Doe');
      expect(structuredData.publisher.name).toBe('InvestoVise');
      expect(structuredData.keywords).toBe('sip, mutual funds, investment');
      expect(structuredData.articleSection).toBe('Investment');
    });

    it('should handle article with string author', () => {
      const mockArticle: IArticle = {
        _id: 'test-id',
        title: 'Test Article',
        slug: 'test-article',
        content: '<p>Content</p>',
        excerpt: 'Test excerpt',
        category: 'Test',
        subcategory: 'Test',
        tags: ['test'],
        author: { name: 'String Author', email: 'author@example.com' } as any,
        publishedAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        viewCount: 0,
        seoMetadata: {},
        relatedArticles: [],
        isPublished: true,
      };

      const structuredData = generateArticleStructuredData(mockArticle);

      expect(structuredData.author.name).toBe('String Author');
    });
  });

  describe('generateBreadcrumbStructuredData', () => {
    it('should generate breadcrumb structured data', () => {
      const breadcrumbs = [
        { name: 'Home', url: 'https://example.com' },
        { name: 'Articles', url: 'https://example.com/articles' },
        { name: 'Investment', url: 'https://example.com/articles/investment' },
        { name: 'SIP Guide', url: 'https://example.com/articles/sip-guide' },
      ];

      const structuredData = generateBreadcrumbStructuredData(breadcrumbs);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('BreadcrumbList');
      expect(structuredData.itemListElement).toHaveLength(4);
      expect(structuredData.itemListElement[0].position).toBe(1);
      expect(structuredData.itemListElement[0].name).toBe('Home');
      expect(structuredData.itemListElement[0].item).toBe('https://example.com');
      expect(structuredData.itemListElement[3].position).toBe(4);
      expect(structuredData.itemListElement[3].name).toBe('SIP Guide');
    });
  });

  describe('generateFinancialServiceStructuredData', () => {
    it('should generate financial service structured data', () => {
      const service = {
        name: 'Personal Loan',
        description: 'Quick personal loan with competitive rates',
        provider: 'ABC Bank',
        url: 'https://example.com/personal-loan',
        interestRate: 12.5,
        fees: [
          { name: 'Processing Fee', amount: 1000 },
          { name: 'Annual Fee', amount: 500 },
        ],
      };

      const structuredData = generateFinancialServiceStructuredData(service);

      expect(structuredData['@context']).toBe('https://schema.org');
      expect(structuredData['@type']).toBe('FinancialProduct');
      expect(structuredData.name).toBe('Personal Loan');
      expect(structuredData.description).toBe('Quick personal loan with competitive rates');
      expect(structuredData.provider.name).toBe('ABC Bank');
      expect(structuredData.url).toBe('https://example.com/personal-loan');
      expect(structuredData.interestRate.value).toBe(12.5);
      expect(structuredData.interestRate.unitText).toBe('PERCENT');
      expect(structuredData.fees).toHaveLength(2);
      expect(structuredData.fees[0].name).toBe('Processing Fee');
      expect(structuredData.fees[0].value).toBe(1000);
      expect(structuredData.fees[0].currency).toBe('INR');
    });

    it('should handle service without optional fields', () => {
      const service = {
        name: 'Basic Service',
        description: 'Basic financial service',
        provider: 'Provider',
        url: 'https://example.com/service',
      };

      const structuredData = generateFinancialServiceStructuredData(service);

      expect(structuredData.name).toBe('Basic Service');
      expect(structuredData.interestRate).toBeUndefined();
      expect(structuredData.fees).toBeUndefined();
    });
  });
});