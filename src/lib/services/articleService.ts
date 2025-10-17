import { Article } from '@/models';
import { IArticle } from '@/types/database';
import { connectToDatabase } from '@/lib/database';

export interface ArticleSearchFilters {
  category?: string;
  subcategory?: string;
  tags?: string[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  published?: boolean;
}

export interface ArticleSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'views' | 'title';
  search?: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ArticleSearchResult {
  articles: IArticle[];
  pagination: PaginationResult;
  searchInfo?: {
    query?: string;
    resultsCount: number;
    suggestions?: string[];
  };
}

export class ArticleService {
  /**
   * Get articles with filtering and pagination
   */
  static async getArticles(
    filters: ArticleSearchFilters = {},
    options: ArticleSearchOptions = {}
  ): Promise<ArticleSearchResult> {
    await connectToDatabase();

    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      search
    } = options;

    // Build filter object
    const filter: any = {};
    
    if (filters.published !== false) {
      filter.isPublished = true;
    }
    
    if (filters.category) {
      filter.category = filters.category;
    }
    
    if (filters.subcategory) {
      filter.subcategory = filters.subcategory;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filter.tags = { $in: filters.tags };
    }

    if (filters.author) {
      filter['author.name'] = { $regex: filters.author, $options: 'i' };
    }

    if (filters.dateFrom || filters.dateTo) {
      filter.publishedAt = {};
      if (filters.dateFrom) {
        filter.publishedAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        filter.publishedAt.$lte = filters.dateTo;
      }
    }

    // Build query
    let query = Article.find(filter);

    // Add text search if provided
    if (search) {
      query = Article.find({
        ...filter,
        $text: { $search: search }
      });
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case 'date':
        sortCriteria = { publishedAt: -1 };
        break;
      case 'views':
        sortCriteria = { viewCount: -1 };
        break;
      case 'title':
        sortCriteria = { title: 1 };
        break;
      case 'relevance':
      default:
        if (search) {
          sortCriteria = { score: { $meta: 'textScore' } };
        } else {
          sortCriteria = { publishedAt: -1 };
        }
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination and sorting
    const articles = await query
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .populate('relatedArticles', 'title slug excerpt featuredImage category subcategory')
      .lean();

    // Get total count for pagination
    const total = await Article.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      articles: articles as IArticle[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      searchInfo: search ? {
        query: search,
        resultsCount: articles.length
      } : undefined
    };
  }

  /**
   * Get single article by slug
   */
  static async getArticleBySlug(slug: string, incrementView = false): Promise<IArticle | null> {
    await connectToDatabase();

    const article = await Article.findOne({ slug, isPublished: true })
      .populate('relatedArticles', 'title slug excerpt featuredImage category subcategory publishedAt')
      .lean();

    if (!article) {
      return null;
    }

    // Increment view count if requested
    if (incrementView) {
      await Article.findByIdAndUpdate(article._id, { $inc: { viewCount: 1 } });
    }

    return article as IArticle;
  }

  /**
   * Create new article
   */
  static async createArticle(articleData: Partial<IArticle>): Promise<IArticle> {
    await connectToDatabase();

    // Check if slug already exists
    if (articleData.slug) {
      const existingArticle = await Article.findOne({ slug: articleData.slug });
      if (existingArticle) {
        throw new Error('Article with this slug already exists');
      }
    }

    const article = new Article(articleData);
    await article.save();
    
    return article.toObject() as IArticle;
  }

  /**
   * Update article by slug
   */
  static async updateArticle(slug: string, updateData: Partial<IArticle>): Promise<IArticle | null> {
    await connectToDatabase();

    // Remove fields that shouldn't be updated directly
    const sanitizedData = { ...updateData };
    delete sanitizedData._id;
    delete (sanitizedData as any).createdAt;
    delete sanitizedData.viewCount;

    // If slug is being changed, check if new slug exists
    if (sanitizedData.slug && sanitizedData.slug !== slug) {
      const existingArticle = await Article.findOne({ slug: sanitizedData.slug });
      if (existingArticle) {
        throw new Error('Article with this slug already exists');
      }
    }

    const article = await Article.findOneAndUpdate(
      { slug },
      { ...sanitizedData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('relatedArticles', 'title slug excerpt featuredImage');

    return article ? article.toObject() as IArticle : null;
  }

  /**
   * Delete article by slug
   */
  static async deleteArticle(slug: string): Promise<boolean> {
    await connectToDatabase();

    const result = await Article.findOneAndDelete({ slug });
    return !!result;
  }

  /**
   * Get related articles for a given article
   */
  static async getRelatedArticles(articleId: string, limit = 5): Promise<IArticle[]> {
    await connectToDatabase();

    const article = await Article.findById(articleId).select('category subcategory tags');
    if (!article) {
      return [];
    }

    // Find articles with similar category, subcategory, or tags
    const relatedArticles = await Article.find({
      _id: { $ne: articleId },
      isPublished: true,
      $or: [
        { category: article.category, subcategory: article.subcategory },
        { category: article.category },
        { tags: { $in: article.tags } }
      ]
    })
    .select('title slug excerpt featuredImage category subcategory publishedAt')
    .sort({ viewCount: -1, publishedAt: -1 })
    .limit(limit)
    .lean();

    return relatedArticles as IArticle[];
  }

  /**
   * Get popular articles
   */
  static async getPopularArticles(limit = 10, category?: string): Promise<IArticle[]> {
    await connectToDatabase();

    const filter: any = { isPublished: true };
    if (category) {
      filter.category = category;
    }

    const articles = await Article.find(filter)
      .select('title slug excerpt featuredImage category subcategory publishedAt viewCount')
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean();

    return articles as IArticle[];
  }

  /**
   * Get recent articles
   */
  static async getRecentArticles(limit = 10, category?: string): Promise<IArticle[]> {
    await connectToDatabase();

    const filter: any = { isPublished: true };
    if (category) {
      filter.category = category;
    }

    const articles = await Article.find(filter)
      .select('title slug excerpt featuredImage category subcategory publishedAt viewCount')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return articles as IArticle[];
  }

  /**
   * Get article categories with counts
   */
  static async getCategories(includeSubcategories = false) {
    await connectToDatabase();

    const pipeline = [
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          subcategories: { $addToSet: '$subcategory' }
        }
      },
      { $sort: { count: -1 } }
    ];

    const result = await Article.aggregate(pipeline);

    return result.map(item => ({
      name: item._id,
      count: item.count,
      subcategories: includeSubcategories ? item.subcategories.sort() : undefined
    }));
  }

  /**
   * Search articles with advanced filtering
   */
  static async searchArticles(
    query: string,
    filters: ArticleSearchFilters = {},
    options: ArticleSearchOptions = {}
  ): Promise<ArticleSearchResult> {
    return this.getArticles(filters, { ...options, search: query });
  }
}