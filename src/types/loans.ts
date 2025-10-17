import { IProduct, IAffiliatePartner } from './database';

// Loan-specific types
export interface LoanProduct extends IProduct {
  type: 'personal_loan' | 'home_loan' | 'car_loan' | 'business_loan';
  interestRate: number;
  minAmount: number;
  maxAmount: number;
}

export interface LoanFilters {
  loanType?: 'personal_loan' | 'home_loan' | 'car_loan' | 'business_loan' | 'all';
  minAmount?: number;
  maxAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  maxProcessingFee?: number;
  partnerId?: string;
  sortBy?: 'interestRate' | 'processingFee' | 'maxAmount' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface LoanComparison {
  products: LoanProduct[];
  selectedProducts: string[];
}

export interface EligibilityCheck {
  age?: number;
  annualIncome?: number;
  creditScore?: number;
  employmentType?: 'salaried' | 'self_employed' | 'business';
  workExperience?: number;
  existingLoans?: number;
}

export interface EligibilityResult {
  productId: string;
  eligible: boolean;
  score: number; // 0-100
  reasons: string[];
  recommendations?: string[];
}

export interface EMICalculation {
  principal: number;
  interestRate: number;
  tenure: number; // in months
  emi: number;
  totalInterest: number;
  totalAmount: number;
  amortizationSchedule?: EMIScheduleItem[];
}

export interface EMIScheduleItem {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanApplication {
  productId: string;
  userId?: string;
  amount: number;
  tenure: number;
  purpose?: string;
  status: 'initiated' | 'redirected' | 'submitted' | 'approved' | 'rejected';
  trackingId: string;
  applicationDate: Date;
  redirectUrl: string;
}

// Component props
export interface LoanComparisonProps {
  initialFilters?: LoanFilters;
  maxComparisons?: number;
  showEligibilityChecker?: boolean;
  onProductSelect?: (product: LoanProduct) => void;
}

export interface LoanCardProps {
  product: LoanProduct;
  partner: IAffiliatePartner;
  isSelected?: boolean;
  isComparing?: boolean;
  eligibilityResult?: EligibilityResult;
  onSelect?: (product: LoanProduct) => void;
  onCompare?: (product: LoanProduct) => void;
  onApply?: (product: LoanProduct) => void;
}

export interface LoanFiltersProps {
  filters: LoanFilters;
  onFiltersChange: (filters: LoanFilters) => void;
  loanTypes: Array<{ value: string; label: string; count: number }>;
  priceRanges: { min: number; max: number };
  interestRateRanges: { min: number; max: number };
}

export interface EligibilityCheckerProps {
  onEligibilityCheck: (criteria: EligibilityCheck) => Promise<EligibilityResult[]>;
  products: LoanProduct[];
  isLoading?: boolean;
}

export interface EMICalculatorProps {
  product?: LoanProduct;
  onCalculate?: (calculation: EMICalculation) => void;
  showAmortization?: boolean;
}

export interface LoanApplicationTrackerProps {
  applications: LoanApplication[];
  onStatusUpdate?: (applicationId: string, status: string) => void;
}