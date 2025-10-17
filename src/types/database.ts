import { Document, ObjectId } from 'mongoose';

// Common interfaces
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface Author {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}

export interface ProductFeature {
  name: string;
  value: string;
  description?: string;
}

export interface EligibilityRequirement {
  type: 'age' | 'income' | 'credit_score' | 'employment' | 'other';
  description: string;
  minValue?: number;
  maxValue?: number;
}

export interface Fee {
  type: 'processing' | 'annual' | 'late_payment' | 'other';
  amount: number;
  description: string;
  isPercentage: boolean;
}

export interface CommissionStructure {
  type: 'fixed' | 'percentage';
  amount: number;
  currency: 'INR';
  conditions?: string[];
}

export interface TrackingConfig {
  trackingPixel?: string;
  conversionGoals: string[];
  attributionWindow: number; // in days
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  city?: string;
  state?: string;
  occupation?: string;
  annualIncome?: number;
}

export interface UserPreferences {
  newsletter: boolean;
  marketUpdates: boolean;
  productRecommendations: boolean;
  language: 'en' | 'hi';
  investmentExperience: 'beginner' | 'intermediate' | 'advanced';
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface UserActivity {
  type: 'article_view' | 'calculator_use' | 'affiliate_click' | 'search' | 'login';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Document interfaces extending Mongoose Document
export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory: string;
  tags: string[];
  author: Author;
  publishedAt: Date;
  updatedAt: Date;
  viewCount: number;
  seoMetadata: SEOMetadata;
  relatedArticles: ObjectId[];
  isPublished: boolean;
  featuredImage?: string;
}

export interface IUser extends Document {
  email: string;
  hashedPassword: string;
  profile: UserProfile;
  preferences: UserPreferences;
  activityLog: UserActivity[];
  createdAt: Date;
  lastLoginAt?: Date;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: 'user' | 'admin';
}

export interface IProduct extends Document {
  partnerId: ObjectId;
  name: string;
  type: 'personal_loan' | 'home_loan' | 'car_loan' | 'business_loan' | 'credit_card' | 'broker_account';
  features: ProductFeature[];
  eligibility: EligibilityRequirement[];
  interestRate?: number;
  fees: Fee[];
  applicationUrl: string;
  isActive: boolean;
  priority: number;
  description: string;
  termsAndConditions: string;
  processingTime: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface IAffiliatePartner extends Document {
  name: string;
  type: 'loan' | 'credit_card' | 'broker';
  apiEndpoint?: string;
  commissionStructure: CommissionStructure;
  isActive: boolean;
  logoUrl: string;
  description: string;
  website: string;
  contactEmail: string;
  trackingConfig: TrackingConfig;
  products: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAffiliateClick extends Document {
  trackingId: string;
  userId?: ObjectId;
  partnerId: ObjectId;
  productId: ObjectId;
  clickedAt: Date;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  converted: boolean;
  conversionDate?: Date;
  commissionAmount?: number;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface IAdminSession extends Document {
  userId: ObjectId;
  sessionId: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  loginMethod: 'password' | 'mfa';
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
  };
  location: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminAuditLog extends Document {
  adminId: ObjectId;
  action: string;
  resource: string;
  resourceId?: ObjectId;
  details: Record<string, any>;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}