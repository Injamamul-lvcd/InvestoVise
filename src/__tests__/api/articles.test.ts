import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/articles/route';
import { GET as getBySlug, PUT, DELETE } from '@/app/api/articles/[slug]/route';
import { connectToDatabase } from '@/lib/database';
import { Article } from '@/models';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock the database connection
jest.mock('@/lib/database');

describe('/api/articles', () => {
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

  describe('GET /api/articles', () => {
    beforeEach(async () => {
      // Create test articles
      await Article.create([
        {
          title: 'Test Article 1',
          slug: 'test-article-1',
          content: 'This is test content for article 1',
          excerpt: 'Test excerpt 1',
          category: 'stocks',
          subcategory: 'equity',
          tags: ['investing', 'stocks'],
          author: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          seoMetadata: {
            title: 'Test Article 1 SEO',
            description: 'SEO description for test article 1',
            keywords: ['test', 'article']
          },
          isPublished: true,
          viewCount: 100
        },
        {
          title: 'Test Article 2',
          slug: 'test-article-2',
          content: 'This is test content for article 2',
          excerpt: 'Test excerpt 2',
          category: 'mutual-funds',
          subcategory: 'sip',
          tags: ['mutual-funds', 'sip'],
          author: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          seoMetadata: {
            title: 'Test Article 2 SEO',
            description: 'SEO description for test article 2',
            keywords: ['test', 'mutual-funds']
          },
          isPublished: true,
          viewCount: 50
        },
        {
          title: 'Unpublished Article',
          slug: 'unpublished-article',
          content: 'This is unpublished content',
          excerpt: 'Unpublished excerpt',
          category: 'stocks',
          subcategory: 'equity',
          tags: ['draft'],
          author: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          seoMetadata: {
            title: 'Unpublished Article SEO',
            description: 'SEO description for unpublished article',
            keywords: ['draft']
          },
          isPublished: false
        }
      ]);
    });

    it('should return published articles with pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
      expect(data.data.articles[0].isPublished).toBe(true);
    });

    it('should filter articles by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles?category=stocks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.articles).toHaveLength(1);
      expect(data.data.articles[0].category).toBe('stocks');
    });

    it('should filter articles by tags', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles?tags=investing,stocks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.articles).toHaveLength(1);
      expect(data.data.articles[0].tags).toContain('investing');
    });

    it('should search articles by text', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles?search=mutual funds');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.articles.length).toBeGreaterThan(0);
    });

    it('should paginate results correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles?page=1&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.articles).toHaveLength(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(1);
      expect(data.data.pagination.hasNext).toBe(true);
    });
  });

  describe('POST /api/articles', () => {
    const validArticleData = {
      title: 'New Test Article',
      slug: 'new-test-article',
      content: 'This is new test content with more than 100 characters to meet the minimum length requirement for article content validation.',
      excerpt: 'New test excerpt',
      category: 'stocks',
      subcategory: 'equity',
      tags: ['new', 'test'],
      author: {
        name: 'Test Author',
        email: 'test@example.com'
      },
      seoMetadata: {
        title: 'New Test Article SEO',
        description: 'SEO description for new test article',
        keywords: ['new', 'test']
      }
    };

    it('should create a new article successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(validArticleData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(validArticleData.title);
      expect(data.data.slug).toBe(validArticleData.slug);
    });

    it('should return error for missing required fields', async () => {
      const invalidData = { ...validArticleData };
      delete invalidData.title;

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required field');
    });

    it('should return error for duplicate slug', async () => {
      // Create first article
      await Article.create(validArticleData);

      // Try to create another with same slug
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(validArticleData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('slug already exists');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        ...validArticleData,
        category: 'invalid-category'
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/articles/[slug]', () => {
    let testArticle: any;

    beforeEach(async () => {
      testArticle = await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        category: 'stocks',
        subcategory: 'equity',
        tags: ['test'],
        author: {
          name: 'Test Author',
          email: 'test@example.com'
        },
        seoMetadata: {
          title: 'Test Article SEO',
          description: 'SEO description',
          keywords: ['test']
        },
        isPublished: true,
        viewCount: 10
      });
    });

    it('should return article by slug', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles/test-article');
      const response = await getBySlug(request, { params: { slug: 'test-article' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.slug).toBe('test-article');
      expect(data.data.title).toBe('Test Article');
    });

    it('should increment view count when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles/test-article?incrementView=true');
      const response = await getBySlug(request, { params: { slug: 'test-article' } });
      
      expect(response.status).toBe(200);

      // Check if view count was incremented
      const updatedArticle = await Article.findOne({ slug: 'test-article' });
      expect(updatedArticle?.viewCount).toBe(11);
    });

    it('should return 404 for non-existent article', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles/non-existent');
      const response = await getBySlug(request, { params: { slug: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Article not found');
    });

    it('should not return unpublished articles', async () => {
      await Article.findByIdAndUpdate(testArticle._id, { isPublished: false });

      const request = new NextRequest('http://localhost:3000/api/articles/test-article');
      const response = await getBySlug(request, { params: { slug: 'test-article' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/articles/[slug]', () => {
    let testArticle: any;

    beforeEach(async () => {
      testArticle = await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        category: 'stocks',
        subcategory: 'equity',
        tags: ['test'],
        author: {
          name: 'Test Author',
          email: 'test@example.com'
        },
        seoMetadata: {
          title: 'Test Article SEO',
          description: 'SEO description',
          keywords: ['test']
        },
        isPublished: true
      });
    });

    it('should update article successfully', async () => {
      const updateData = {
        title: 'Updated Test Article',
        content: 'This is updated test content'
      };

      const request = new NextRequest('http://localhost:3000/api/articles/test-article', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: { slug: 'test-article' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Test Article');
      expect(data.data.content).toBe('This is updated test content');
    });

    it('should return 404 for non-existent article', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' })
      });

      const response = await PUT(request, { params: { slug: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return error when updating to existing slug', async () => {
      // Create another article
      await Article.create({
        title: 'Another Article',
        slug: 'another-article',
        content: 'Another content',
        excerpt: 'Another excerpt',
        category: 'stocks',
        subcategory: 'equity',
        author: { name: 'Author', email: 'author@example.com' },
        seoMetadata: { title: 'SEO', description: 'SEO desc', keywords: [] }
      });

      const request = new NextRequest('http://localhost:3000/api/articles/test-article', {
        method: 'PUT',
        body: JSON.stringify({ slug: 'another-article' })
      });

      const response = await PUT(request, { params: { slug: 'test-article' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('slug already exists');
    });
  });

  describe('DELETE /api/articles/[slug]', () => {
    let testArticle: any;

    beforeEach(async () => {
      testArticle = await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content',
        excerpt: 'Test excerpt',
        category: 'stocks',
        subcategory: 'equity',
        tags: ['test'],
        author: {
          name: 'Test Author',
          email: 'test@example.com'
        },
        seoMetadata: {
          title: 'Test Article SEO',
          description: 'SEO description',
          keywords: ['test']
        }
      });
    });

    it('should delete article successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles/test-article', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { slug: 'test-article' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Article deleted successfully');

      // Verify article is deleted
      const deletedArticle = await Article.findOne({ slug: 'test-article' });
      expect(deletedArticle).toBeNull();
    });

    it('should return 404 for non-existent article', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles/non-existent', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: { slug: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Article not found');
    });
  });
});