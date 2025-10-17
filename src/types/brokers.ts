import { IProduct, IAffiliatePartner } from './database';

// Broker specific types
export interface BrokerProduct extends IProduct {
  type: 'broker_account';
  accountTypes: ('demat' | 'trading' | 'commodity' | 'currency' | 'mutual_fund')[];
  brokerage: {
    equity: {
      delivery: number; // percentage or flat fee
      intraday: number;
      isPercentage: boolean;
    };
    derivatives: {
      futures: number;
      options: number;
      isPercentage: boolean;
    };
    currency: {
      rate: number;
      isPercentage: boolean;
    };
    commodity: {
      rate: number;
      isPercentage: boolean;
    };
  };
  accountCharges: {
    opening: number;
    maintenance: number; // annual
    demat: number; // annual
  };
  platforms: {
    web: boolean;
    mobile: boolean;
    desktop: boolean;
    api: boolean;
  };
  sebiRegistration: {
    number: string;
    validUntil: Date;
    isActive: boolean;
  };
  researchReports: boolean;
  marginFunding: boolean;
  ipoAccess: boolean;
  mutualFunds: boolean;
  bonds: boolean;
  rating: number; // 1-5 stars
  userReviews: number;
}

export interface BrokerFilters {
  accountTypes?: ('demat' | 'trading' | 'commodity' | 'currency' | 'mutual_fund')[];
  maxBrokerageEquity?: number;
  maxAccountOpening?: number;
  maxAnnualCharges?: number;
  platforms?: ('web' | 'mobile' | 'desktop' | 'api')[];
  hasResearchReports?: boolean;
  hasMarginFunding?: boolean;
  hasIpoAccess?: boolean;
  hasMutualFunds?: boolean;
  hasBonds?: boolean;
  minRating?: number;
  partnerId?: string;
  sortBy?: 'brokerage' | 'charges' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface BrokerComparison {
  products: BrokerProduct[];
  selectedProducts: string[];
}

export interface BrokerRecommendation {
  productId: string;
  score: number; // 0-100
  reasons: string[];
  category: 'best_overall' | 'best_discount' | 'best_research' | 'best_beginner' | 'best_advanced';
}

export interface BrokerApplication {
  productId: string;
  userId?: string;
  accountTypes: string[];
  status: 'initiated' | 'redirected' | 'documents_submitted' | 'under_review' | 'approved' | 'rejected';
  trackingId: string;
  applicationDate: Date;
  redirectUrl: string;
}

export interface TradingProfile {
  experience: 'beginner' | 'intermediate' | 'advanced';
  tradingFrequency: 'occasional' | 'regular' | 'frequent' | 'day_trader';
  investmentAmount: number;
  preferredSegments: ('equity' | 'derivatives' | 'currency' | 'commodity' | 'mutual_funds')[];
  needsResearch: boolean;
  needsMargin: boolean;
  platformPreference: ('web' | 'mobile' | 'desktop' | 'api')[];
  costSensitivity: 'low' | 'medium' | 'high';
}

// Component props
export interface BrokerDirectoryProps {
  initialFilters?: BrokerFilters;
  maxComparisons?: number;
  showRecommendationEngine?: boolean;
  onProductSelect?: (product: BrokerProduct) => void;
  layout?: 'grid' | 'list';
}

export interface BrokerCardProps {
  product: BrokerProduct;
  partner: IAffiliatePartner;
  isSelected?: boolean;
  isComparing?: boolean;
  recommendation?: BrokerRecommendation;
  onSelect?: (product: BrokerProduct) => void;
  onCompare?: (product: BrokerProduct) => void;
  onApply?: (product: BrokerProduct) => void;
  layout?: 'card' | 'compact';
}

export interface BrokerFiltersProps {
  filters: BrokerFilters;
  onFiltersChange: (filters: BrokerFilters) => void;
  accountTypes: Array<{ value: string; label: string; count: number }>;
  platforms: Array<{ value: string; label: string; count: number }>;
  brokerageRanges: { min: number; max: number };
  chargesRanges: { min: number; max: number };
}

export interface BrokerComparisonTableProps {
  products: BrokerProduct[];
  partners: IAffiliatePartner[];
  onRemoveProduct: (productId: string) => void;
}

export interface BrokerRecommendationEngineProps {
  onRecommendationGenerated: (recommendations: BrokerRecommendation[]) => void;
  products: BrokerProduct[];
  isLoading?: boolean;
}

export interface BrokerApplicationTrackerProps {
  applications: BrokerApplication[];
  onStatusUpdate?: (applicationId: string, status: string) => void;
}

// Utility types
export interface BrokerFeature {
  category: 'trading' | 'research' | 'platform' | 'support' | 'charges';
  name: string;
  description: string;
  isAvailable: boolean;
  additionalInfo?: string;
}

export interface BrokerageCalculation {
  segment: 'equity' | 'derivatives' | 'currency' | 'commodity';
  transactionType: 'delivery' | 'intraday' | 'futures' | 'options';
  amount: number;
  quantity?: number;
  brokerageAmount: number;
  taxes: {
    stt: number;
    exchangeCharges: number;
    gst: number;
    sebiCharges: number;
    stampDuty: number;
  };
  totalCharges: number;
}

export interface BrokerReview {
  userId: string;
  rating: number;
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  tradingExperience: string;
  datePosted: Date;
  isVerified: boolean;
}