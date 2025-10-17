// Export all models
export { default as Article } from './Article';
export { default as User } from './User';
export { default as AffiliatePartner } from './AffiliatePartner';
export { default as Product } from './Product';
export { default as AffiliateClick } from './AffiliateClick';
export { default as AdminSession } from './AdminSession';
export { default as AdminAuditLog } from './AdminAuditLog';

// Re-export types for convenience
export type {
  IArticle,
  IUser,
  IAffiliatePartner,
  IProduct,
  IAffiliateClick,
  IAdminSession,
  IAdminAuditLog,
  SEOMetadata,
  Author,
  ProductFeature,
  EligibilityRequirement,
  Fee,
  CommissionStructure,
  TrackingConfig,
  UserProfile,
  UserPreferences,
  UserActivity
} from '@/types/database';