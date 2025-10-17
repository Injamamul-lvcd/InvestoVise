import { IndianFinancialConstants } from '@/types/calculators';

// Indian financial constants for FY 2024-25
export const INDIAN_FINANCIAL_CONSTANTS: IndianFinancialConstants = {
  currentFY: '2024-25',
  taxSlabs: {
    old: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: Infinity, rate: 30 }
    ],
    new: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 600000, rate: 5 },
      { min: 600000, max: 900000, rate: 10 },
      { min: 900000, max: 1200000, rate: 15 },
      { min: 1200000, max: 1500000, rate: 20 },
      { min: 1500000, max: Infinity, rate: 30 }
    ]
  },
  standardDeduction: 50000,
  section80C: {
    limit: 150000,
    instruments: ['EPF', 'PPF', 'ELSS', 'NSC', 'Tax Saver FD', 'Life Insurance Premium']
  },
  section80D: {
    self: 25000,
    parents: 25000,
    seniorCitizen: 50000
  },
  epfContribution: {
    employeeRate: 12,
    employerRate: 12,
    maxSalary: 1800000 // 15,000 * 12 months
  },
  ppfRate: 8.1, // Current PPF rate
  nscRate: 6.8, // Current NSC rate
  inflationRate: 6.0 // Average inflation rate assumption
};

// Common calculation utilities
export const MONTHS_IN_YEAR = 12;
export const DAYS_IN_YEAR = 365;

// Investment instrument returns (approximate annual returns)
export const INVESTMENT_RETURNS = {
  equity: 12, // Long-term equity returns
  debt: 7, // Debt fund returns
  hybrid: 9, // Balanced fund returns
  ppf: INDIAN_FINANCIAL_CONSTANTS.ppfRate,
  nsc: INDIAN_FINANCIAL_CONSTANTS.nscRate,
  fd: 6.5, // Fixed deposit returns
  savings: 3.5, // Savings account returns
  gold: 8, // Gold returns
  realestate: 10 // Real estate returns
};

// Loan interest rates (approximate)
export const LOAN_RATES = {
  homeLoan: 8.5,
  personalLoan: 12,
  carLoan: 9,
  educationLoan: 10,
  businessLoan: 11
};

// Mutual fund expense ratios
export const EXPENSE_RATIOS = {
  equity: 1.5,
  debt: 1.0,
  hybrid: 1.25,
  index: 0.5,
  etf: 0.25
};