import { IProduct, IAffiliatePartner } from './database';

// Credit card specific types
export interface CreditCardProduct extends IProduct {
  type: 'credit_card';
  annualFee?: number;
  joiningFee?: number;
  creditLimit?: {
    min: number;
    max: number;
  };
  rewardRate?: number;
  cashbackRate?: number;
  welcomeBonus?: string;
  cardNetwork: 'visa' | 'mastercard' | 'rupay' | 'amex';
  cardType: 'basic' | 'premium' | 'super_premium' | 'business';
}

export interface CreditCardFilters {
  cardType?: 'basic' | 'premium' | 'super_premium' | 'business' | 'all';
  cardNetwork?: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'all';
  maxAnnualFee?: number;
  minCreditLimit?: number;
  maxCreditLimit?: number;
  hasRewards?: boolean;
  hasCashback?: boolean;
  hasWelcomeBonus?: boolean;
  partnerId?: string;
  sortBy?: 'annualFee' | 'rewardRate' | 'cashbackRate' | 'creditLimit' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface CreditCardComparison {
  products: CreditCardProduct[];
  selectedProducts: string[];
}

export interface CreditCardRecommendation {
  productId: string;
  score: number; // 0-100
  reasons: string[];
  category: 'best_overall' | 'best_rewards' | 'best_cashback' | 'best_premium' | 'best_beginner';
}

export interface CreditCardApplication {
  productId: string;
  userId?: string;
  requestedLimit?: number;
  status: 'initiated' | 'redirected' | 'submitted' | 'approved' | 'rejected';
  trackingId: string;
  applicationDate: Date;
  redirectUrl: string;
}

export interface SpendingProfile {
  monthlySpend: number;
  categories: {
    dining: number;
    fuel: number;
    groceries: number;
    shopping: number;
    travel: number;
    utilities: number;
    others: number;
  };
  preferredBenefits: ('rewards' | 'cashback' | 'travel' | 'fuel' | 'dining' | 'shopping')[];
  annualFeePreference: 'free' | 'low' | 'medium' | 'high';
}

// Component props
export interface CreditCardGridProps {
  initialFilters?: CreditCardFilters;
  maxComparisons?: number;
  showRecommendationEngine?: boolean;
  onProductSelect?: (product: CreditCardProduct) => void;
  layout?: 'grid' | 'list';
}

export interface CreditCardProps {
  product: CreditCardProduct;
  partner: IAffiliatePartner;
  isSelected?: boolean;
  isComparing?: boolean;
  recommendation?: CreditCardRecommendation;
  onSelect?: (product: CreditCardProduct) => void;
  onCompare?: (product: CreditCardProduct) => void;
  onApply?: (product: CreditCardProduct) => void;
  layout?: 'card' | 'compact';
}

export interface CreditCardFiltersProps {
  filters: CreditCardFilters;
  onFiltersChange: (filters: CreditCardFilters) => void;
  cardTypes: Array<{ value: string; label: string; count: number }>;
  cardNetworks: Array<{ value: string; label: string; count: number }>;
  feeRanges: { min: number; max: number };
  creditLimitRanges: { min: number; max: number };
}

export interface CreditCardComparisonTableProps {
  products: CreditCardProduct[];
  partners: IAffiliatePartner[];
  onRemoveProduct: (productId: string) => void;
}

export interface CreditCardRecommendationEngineProps {
  onRecommendationGenerated: (recommendations: CreditCardRecommendation[]) => void;
  products: CreditCardProduct[];
  isLoading?: boolean;
}

export interface CreditCardApplicationTrackerProps {
  applications: CreditCardApplication[];
  onStatusUpdate?: (applicationId: string, status: string) => void;
}

// Utility types
export interface CreditCardBenefit {
  category: string;
  description: string;
  value: string;
  conditions?: string[];
}

export interface CreditCardReward {
  type: 'points' | 'cashback' | 'miles';
  rate: number;
  category?: string;
  cap?: number;
  description: string;
}

export interface CreditCardFee {
  type: 'annual' | 'joining' | 'late_payment' | 'overlimit' | 'cash_advance' | 'foreign_transaction';
  amount: number;
  description: string;
  isPercentage: boolean;
  waiver?: string;
}