import mongoose, { Schema } from 'mongoose';
import { IArticle } from '@/types/database';

const AuthorSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Author email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Avatar must be a valid image URL'
    }
  }
}, { _id: false });

const SEOMetadataSchema = new Schema({
  title: {
    type: String,
    required: [true, 'SEO title is required'],
    maxlength: [60, 'SEO title should not exceed 60 characters']
  },
  description: {
    type: String,
    required: [true, 'SEO description is required'],
    maxlength: [160, 'SEO description should not exceed 160 characters']
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  canonicalUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Canonical URL must be a valid URL'
    }
  },
  ogImage: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'OG image must be a valid image URL'
    }
  }
}, { _id: false });

const ArticleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    required: [true, 'Article slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Article content is required'],
    minlength: [100, 'Content must be at least 100 characters long']
  },
  excerpt: {
    type: String,
    required: [true, 'Article excerpt is required'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['stocks', 'mutual-funds', 'fixed-deposits', 'ppf', 'elss', 'loans', 'credit-cards', 'brokers', 'tax-planning', 'retirement-planning'],
      message: 'Invalid category'
    },
    index: true
  },
  subcategory: {
    type: String,
    required: [true, 'Subcategory is required'],
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  author: {
    type: AuthorSchema,
    required: [true, 'Author information is required']
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  seoMetadata: {
    type: SEOMetadataSchema,
    required: [true, 'SEO metadata is required']
  },
  relatedArticles: [{
    type: Schema.Types.ObjectId,
    ref: 'Article'
  }],
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  featuredImage: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Featured image must be a valid image URL'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
ArticleSchema.index({ category: 1, subcategory: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ publishedAt: -1 });
ArticleSchema.index({ viewCount: -1 });
ArticleSchema.index({ isPublished: 1, publishedAt: -1 });

// Virtual for reading time estimation
ArticleSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Pre-save middleware to update the updatedAt field
ArticleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Static method to find published articles
ArticleSchema.statics.findPublished = function(filter = {}) {
  return this.find({ ...filter, isPublished: true }).sort({ publishedAt: -1 });
};

// Instance method to increment view count
ArticleSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

const Article = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;