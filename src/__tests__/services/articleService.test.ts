import { ArticleService } from '@/lib/services/articleService';
import { Article } from '@/models';
import { connectToDatabase } from '@/lib/database';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock the database connection
jest.mock('@/lib/database');

describe('ArticleService', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Article.deleteMany({});
  });

  describe('getArticles', () => {
    beforeEach(async () => {
      await Article.create([
        {
          title: 'Stock Market Basics',
          slug: 'stock-market-basics',
          content: 'Learn about stock market fundamentals and how to start investing in Indian stock market.',
          excerpt: 'A comprehensive guide to stock market basics',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['stocks', 'investing', 'basics'],
          author: { name: 'John Doe', email: 'john@example.com' },
          seoMetadata: { title: 'Stock Market Basics', description: 'Learn stock market basics', keywords: ['stocks'] },
          isPublished: true,
          viewCount: 150,
          publishedAt: new Date('2024-01-15')
        },
        {
          title: 'Mutual Fund SIP Guide',
          slug: 'mutual-fund-sip-guide',
          content: 'Complete guide to Systematic Investment Plans in mutual funds for Indian investors.',
          excerpt: 'Everything you need to know about SIP investing',
          category: 'mutual-funds',
          subcategory: 'sip',
          tags: ['mutual-funds', 'sip', 'investing'],
          author: { name: 'Jane Smith', email: 'jane@example.com' },
          seoMetadata: { title: 'SIP Guide', description: 'Learn about SIP investing', keywords: ['sip'] },
          isPublished: true,
          viewCount: 200,
          publishedAt: new Date('2024-01-20')
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'This is a draft article that is not published yet.',
          excerpt: 'Draft article excerpt',
          category: 'stocks',
          subcategory: 'analysis',
          tags: ['draft'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Draft', description: 'Draft article', keywords: ['draft'] },
          isPublished: false,
          viewCount: 0
        }
      ]);
    });

    it('should return published articles by default', async () => {
      const result = await ArticleService.getArticles();

      expect(result.articles).toHaveLength(2);
      expect(result.articles.every(article => article.isPublished)).toBe(true);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter articles by category', async () => {
      const result = await ArticleService.getArticles({ category: 'stocks' });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].category).toBe('stocks');
      expect(result.articles[0].slug).toBe('stock-market-basics');
    });

    it('should filter articles by subcategory', async () => {
      const result = await ArticleService.getArticles({ 
        category: 'mutual-funds', 
        subcategory: 'sip' 
      });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].subcategory).toBe('sip');
    });

    it('should filter articles by tags', async () => {
      const result = await ArticleService.getArticles({ tags: ['sip'] });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].tags).toContain('sip');
    });

    it('should filter articles by author', async () => {
      const result = await ArticleService.getArticles({ author: 'John' });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].author.name).toContain('John');
    });

    it('should filter articles by date range', async () => {
      const result = await ArticleService.getArticles({
        dateFrom: new Date('2024-01-18'),
        dateTo: new Date('2024-01-25')
      });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].slug).toBe('mutual-fund-sip-guide');
    });

    it('should sort articles by date (default)', async () => {
      const result = await ArticleService.getArticles({}, { sortBy: 'date' });

      expect(result.articles[0].slug).toBe('mutual-fund-sip-guide'); // More recent
      expect(result.articles[1].slug).toBe('stock-market-basics');
    });

    it('should sort articles by views', async () => {
      const result = await ArticleService.getArticles({}, { sortBy: 'views' });

      expect(result.articles[0].viewCount).toBe(200); // Higher views first
      expect(result.articles[1].viewCount).toBe(150);
    });

    it('should sort articles by title', async () => {
      const result = await ArticleService.getArticles({}, { sortBy: 'title' });

      expect(result.articles[0].title).toBe('Mutual Fund SIP Guide'); // Alphabetical
      expect(result.articles[1].title).toBe('Stock Market Basics');
    });

    it('should paginate results correctly', async () => {
      const result = await ArticleService.getArticles({}, { page: 1, limit: 1 });

      expect(result.articles).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should search articles by text', async () => {
      const result = await ArticleService.getArticles({}, { search: 'mutual fund' });

      expect(result.articles.length).toBeGreaterThan(0);
      expect(result.searchInfo?.query).toBe('mutual fund');
    });

    it('should include unpublished articles when specified', async () => {
      const result = await ArticleService.getArticles({ published: false });

      expect(result.articles).toHaveLength(3); // All articles including draft
    });
  });

  describe('getArticleBySlug', () => {
    let testArticle: any;

    beforeEach(async () => {
      testArticle = await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        category: 'stocks',
        subcategory: 'basics',
        tags: ['test'],
        author: { name: 'Test Author', email: 'test@example.com' },
        seoMetadata: { title: 'Test', description: 'Test desc', keywords: ['test'] },
        isPublished: true,
        viewCount: 10
      });
    });

    it('should return article by slug', async () => {
      const article = await ArticleService.getArticleBySlug('test-article');

      expect(article).toBeTruthy();
      expect(article?.slug).toBe('test-article');
      expect(article?.title).toBe('Test Article');
    });

    it('should increment view count when requested', async () => {
      await ArticleService.getArticleBySlug('test-article', true);

      const updatedArticle = await Article.findById(testArticle._id);
      expect(updatedArticle?.viewCount).toBe(11);
    });

    it('should return null for non-existent article', async () => {
      const article = await ArticleService.getArticleBySlug('non-existent');
      expect(article).toBeNull();
    });

    it('should return null for unpublished article', async () => {
      await Article.findByIdAndUpdate(testArticle._id, { isPublished: false });

      const article = await ArticleService.getArticleBySlug('test-article');
      expect(article).toBeNull();
    });
  });

  describe('createArticle', () => {
    const validArticleData = {
      title: 'New Article',
      slug: 'new-article',
      content: 'This is new article content with sufficient length to meet validation requirements.',
      excerpt: 'New article excerpt',
      category: 'stocks',
      subcategory: 'basics',
      tags: ['new', 'test'],
      author: { name: 'New Author', email: 'new@example.com' },
      seoMetadata: { title: 'New Article', description: 'New article desc', keywords: ['new'] }
    };

    it('should create article successfully', async () => {
      const article = await ArticleService.createArticle(validArticleData);

      expect(article.title).toBe(validArticleData.title);
      expect(article.slug).toBe(validArticleData.slug);
      expect(article.isPublished).toBe(false); // Default value
    });

    it('should throw error for duplicate slug', async () => {
      await Article.create(validArticleData);

      await expect(ArticleService.createArticle(validArticleData))
        .rejects.toThrow('Article with this slug already exists');
    });
  });

  describe('updateArticle', () => {
    let testArticle: any;

    beforeEach(async () => {
      testArticle = await Article.create({
        title: 'Original Title',
        slug: 'original-slug',
        content: 'Original content',
        excerpt: 'Original excerpt',
        category: 'stocks',
        subcategory: 'basics',
        tags: ['original'],
        author: { name: 'Original Author', email: 'original@example.com' },
        seoMetadata: { title: 'Original', description: 'Original desc', keywords: ['original'] },
        isPublished: true
      });
    });

    it('should update article successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };

      const updatedArticle = await ArticleService.updateArticle('original-slug', updateData);

      expect(updatedArticle?.title).toBe('Updated Title');
      expect(updatedArticle?.content).toBe('Updated content');
      expect(updatedArticle?.slug).toBe('original-slug'); // Unchanged
    });

    it('should return null for non-existent article', async () => {
      const result = await ArticleService.updateArticle('non-existent', { title: 'Updated' });
      expect(result).toBeNull();
    });

    it('should throw error when updating to existing slug', async () => {
      await Article.create({
        title: 'Another Article',
        slug: 'another-slug',
        content: 'Another content',
        excerpt: 'Another excerpt',
        category: 'stocks',
        subcategory: 'basics',
        author: { name: 'Author', email: 'author@example.com' },
        seoMetadata: { title: 'Another', description: 'Another desc', keywords: [] }
      });

      await expect(ArticleService.updateArticle('original-slug', { slug: 'another-slug' }))
        .rejects.toThrow('Article with this slug already exists');
    });

    it('should not update protected fields', async () => {
      const updateData = {
        title: 'Updated Title',
        _id: 'new-id',
        createdAt: new Date(),
        viewCount: 999
      };

      const updatedArticle = await ArticleService.updateArticle('original-slug', updateData as any);

      expect(updatedArticle?.title).toBe('Updated Title');
      expect(updatedArticle?._id.toString()).toBe(testArticle._id.toString()); // Unchanged
      expect(updatedArticle?.viewCount).toBe(0); // Unchanged (default value)
    });
  });

  describe('deleteArticle', () => {
    beforeEach(async () => {
      await Article.create({
        title: 'Article to Delete',
        slug: 'article-to-delete',
        content: 'Content to delete',
        excerpt: 'Excerpt to delete',
        category: 'stocks',
        subcategory: 'basics',
        tags: ['delete'],
        author: { name: 'Author', email: 'author@example.com' },
        seoMetadata: { title: 'Delete', description: 'Delete desc', keywords: ['delete'] }
      });
    });

    it('should delete article successfully', async () => {
      const result = await ArticleService.deleteArticle('article-to-delete');

      expect(result).toBe(true);

      const deletedArticle = await Article.findOne({ slug: 'article-to-delete' });
      expect(deletedArticle).toBeNull();
    });

    it('should return false for non-existent article', async () => {
      const result = await ArticleService.deleteArticle('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getRelatedArticles', () => {
    let mainArticle: any;

    beforeEach(async () => {
      // Create main article
      mainArticle = await Article.create({
        title: 'Main Stock Article',
        slug: 'main-stock-article',
        content: 'Main content about stocks',
        excerpt: 'Main excerpt',
        category: 'stocks',
        subcategory: 'basics',
        tags: ['stocks', 'investing'],
        author: { name: 'Author', email: 'author@example.com' },
        seoMetadata: { title: 'Main', description: 'Main desc', keywords: ['stocks'] },
        isPublished: true,
        viewCount: 100
      });

      // Create related articles
      await Article.create([
        {
          title: 'Related Stock Article 1',
          slug: 'related-stock-1',
          content: 'Related content 1',
          excerpt: 'Related excerpt 1',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['stocks'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Related 1', description: 'Related desc 1', keywords: ['stocks'] },
          isPublished: true,
          viewCount: 80
        },
        {
          title: 'Related Stock Article 2',
          slug: 'related-stock-2',
          content: 'Related content 2',
          excerpt: 'Related excerpt 2',
          category: 'stocks',
          subcategory: 'analysis',
          tags: ['investing'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Related 2', description: 'Related desc 2', keywords: ['investing'] },
          isPublished: true,
          viewCount: 60
        },
        {
          title: 'Unrelated Article',
          slug: 'unrelated-article',
          content: 'Unrelated content',
          excerpt: 'Unrelated excerpt',
          category: 'mutual-funds',
          subcategory: 'sip',
          tags: ['mutual-funds'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Unrelated', description: 'Unrelated desc', keywords: ['mutual-funds'] },
          isPublished: true,
          viewCount: 40
        }
      ]);
    });

    it('should return related articles', async () => {
      const relatedArticles = await ArticleService.getRelatedArticles(mainArticle._id.toString());

      expect(relatedArticles.length).toBeGreaterThan(0);
      expect(relatedArticles.length).toBeLessThanOrEqual(5);
      
      // Should prioritize articles with same category/subcategory or tags
      const hasRelatedContent = relatedArticles.some(article => 
        article.category === 'stocks' || 
        article.tags.some(tag => ['stocks', 'investing'].includes(tag))
      );
      expect(hasRelatedContent).toBe(true);
    });

    it('should not include the main article itself', async () => {
      const relatedArticles = await ArticleService.getRelatedArticles(mainArticle._id.toString());

      const includesMainArticle = relatedArticles.some(article => 
        article._id.toString() === mainArticle._id.toString()
      );
      expect(includesMainArticle).toBe(false);
    });

    it('should return empty array for non-existent article', async () => {
      const relatedArticles = await ArticleService.getRelatedArticles('507f1f77bcf86cd799439011');
      expect(relatedArticles).toEqual([]);
    });
  });

  describe('getPopularArticles', () => {
    beforeEach(async () => {
      await Article.create([
        {
          title: 'Most Popular Article',
          slug: 'most-popular',
          content: 'Most popular content',
          excerpt: 'Most popular excerpt',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['popular'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Popular', description: 'Popular desc', keywords: ['popular'] },
          isPublished: true,
          viewCount: 1000
        },
        {
          title: 'Second Popular Article',
          slug: 'second-popular',
          content: 'Second popular content',
          excerpt: 'Second popular excerpt',
          category: 'mutual-funds',
          subcategory: 'sip',
          tags: ['popular'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Second Popular', description: 'Second popular desc', keywords: ['popular'] },
          isPublished: true,
          viewCount: 500
        },
        {
          title: 'Less Popular Article',
          slug: 'less-popular',
          content: 'Less popular content',
          excerpt: 'Less popular excerpt',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['less-popular'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Less Popular', description: 'Less popular desc', keywords: ['less-popular'] },
          isPublished: true,
          viewCount: 100
        }
      ]);
    });

    it('should return articles sorted by view count', async () => {
      const popularArticles = await ArticleService.getPopularArticles(3);

      expect(popularArticles).toHaveLength(3);
      expect(popularArticles[0].viewCount).toBe(1000);
      expect(popularArticles[1].viewCount).toBe(500);
      expect(popularArticles[2].viewCount).toBe(100);
    });

    it('should filter by category when specified', async () => {
      const popularStockArticles = await ArticleService.getPopularArticles(10, 'stocks');

      expect(popularStockArticles).toHaveLength(2);
      expect(popularStockArticles.every(article => article.category === 'stocks')).toBe(true);
    });

    it('should respect the limit parameter', async () => {
      const popularArticles = await ArticleService.getPopularArticles(1);

      expect(popularArticles).toHaveLength(1);
      expect(popularArticles[0].viewCount).toBe(1000);
    });
  });

  describe('getRecentArticles', () => {
    beforeEach(async () => {
      await Article.create([
        {
          title: 'Newest Article',
          slug: 'newest-article',
          content: 'Newest content',
          excerpt: 'Newest excerpt',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['new'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Newest', description: 'Newest desc', keywords: ['new'] },
          isPublished: true,
          publishedAt: new Date('2024-01-25')
        },
        {
          title: 'Middle Article',
          slug: 'middle-article',
          content: 'Middle content',
          excerpt: 'Middle excerpt',
          category: 'mutual-funds',
          subcategory: 'sip',
          tags: ['middle'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Middle', description: 'Middle desc', keywords: ['middle'] },
          isPublished: true,
          publishedAt: new Date('2024-01-20')
        },
        {
          title: 'Oldest Article',
          slug: 'oldest-article',
          content: 'Oldest content',
          excerpt: 'Oldest excerpt',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['old'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Oldest', description: 'Oldest desc', keywords: ['old'] },
          isPublished: true,
          publishedAt: new Date('2024-01-15')
        }
      ]);
    });

    it('should return articles sorted by published date', async () => {
      const recentArticles = await ArticleService.getRecentArticles(3);

      expect(recentArticles).toHaveLength(3);
      expect(recentArticles[0].title).toBe('Newest Article');
      expect(recentArticles[1].title).toBe('Middle Article');
      expect(recentArticles[2].title).toBe('Oldest Article');
    });

    it('should filter by category when specified', async () => {
      const recentStockArticles = await ArticleService.getRecentArticles(10, 'stocks');

      expect(recentStockArticles).toHaveLength(2);
      expect(recentStockArticles.every(article => article.category === 'stocks')).toBe(true);
      expect(recentStockArticles[0].title).toBe('Newest Article');
    });

    it('should respect the limit parameter', async () => {
      const recentArticles = await ArticleService.getRecentArticles(1);

      expect(recentArticles).toHaveLength(1);
      expect(recentArticles[0].title).toBe('Newest Article');
    });
  });

  describe('getCategories', () => {
    beforeEach(async () => {
      await Article.create([
        {
          title: 'Stock Article 1',
          slug: 'stock-1',
          content: 'Stock content 1',
          excerpt: 'Stock excerpt 1',
          category: 'stocks',
          subcategory: 'basics',
          tags: ['stocks'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Stock 1', description: 'Stock desc 1', keywords: ['stocks'] },
          isPublished: true
        },
        {
          title: 'Stock Article 2',
          slug: 'stock-2',
          content: 'Stock content 2',
          excerpt: 'Stock excerpt 2',
          category: 'stocks',
          subcategory: 'analysis',
          tags: ['stocks'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'Stock 2', description: 'Stock desc 2', keywords: ['stocks'] },
          isPublished: true
        },
        {
          title: 'Mutual Fund Article',
          slug: 'mf-1',
          content: 'MF content',
          excerpt: 'MF excerpt',
          category: 'mutual-funds',
          subcategory: 'sip',
          tags: ['mutual-funds'],
          author: { name: 'Author', email: 'author@example.com' },
          seoMetadata: { title: 'MF 1', description: 'MF desc', keywords: ['mutual-funds'] },
          isPublished: true
        }
      ]);
    });

    it('should return categories with counts', async () => {
      const categories = await ArticleService.getCategories();

      expect(categories).toHaveLength(2);
      
      const stocksCategory = categories.find(cat => cat.name === 'stocks');
      const mfCategory = categories.find(cat => cat.name === 'mutual-funds');
      
      expect(stocksCategory?.count).toBe(2);
      expect(mfCategory?.count).toBe(1);
    });

    it('should include subcategories when requested', async () => {
      const categories = await ArticleService.getCategories(true);

      const stocksCategory = categories.find(cat => cat.name === 'stocks');
      expect(stocksCategory?.subcategories).toContain('basics');
      expect(stocksCategory?.subcategories).toContain('analysis');
    });

    it('should sort categories by count (descending)', async () => {
      const categories = await ArticleService.getCategories();

      expect(categories[0].name).toBe('stocks'); // Higher count first
      expect(categories[1].name).toBe('mutual-funds');
    });
  });
});