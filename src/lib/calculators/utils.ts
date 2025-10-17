import { FormatOptions, ValidationRule } from '@/types/calculators';

// Formatting utilities
export const formatCurrency = (
  amount: number,
  options: FormatOptions = {}
): string => {
  const {
    currency = 'INR',
    locale = 'en-IN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

export const formatNumber = (
  value: number,
  options: FormatOptions = {}
): string => {
  const {
    locale = 'en-IN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

export const formatPercentage = (
  value: number,
  decimals: number = 2
): string => {
  return `${value.toFixed(decimals)}%`;
};

// Validation utilities
export const validateInput = (
  value: any,
  rules: ValidationRule[]
): string | null => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return rule.message;
        }
        break;
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message;
        }
        break;
      case 'range':
        if (typeof value === 'number' && (value < rule.value.min || value > rule.value.max)) {
          return rule.message;
        }
        break;
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message;
        }
        break;
    }
  }
  return null;
};

// Financial calculation utilities
export const calculateCompoundInterest = (
  principal: number,
  rate: number,
  time: number,
  compoundingFrequency: number = 1
): number => {
  return principal * Math.pow(1 + rate / (100 * compoundingFrequency), compoundingFrequency * time);
};

export const calculateSIPFutureValue = (
  monthlyAmount: number,
  annualRate: number,
  years: number
): number => {
  const monthlyRate = annualRate / (12 * 100);
  const months = years * 12;
  
  if (monthlyRate === 0) {
    return monthlyAmount * months;
  }
  
  return monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
};

export const calculateEMI = (
  principal: number,
  annualRate: number,
  years: number
): number => {
  const monthlyRate = annualRate / (12 * 100);
  const months = years * 12;
  
  if (monthlyRate === 0) {
    return principal / months;
  }
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
         (Math.pow(1 + monthlyRate, months) - 1);
};

export const calculateTax = (
  income: number,
  taxSlabs: { min: number; max: number; rate: number }[],
  cess: number = 4
): { tax: number; effectiveRate: number; breakdown: any[] } => {
  let tax = 0;
  const breakdown = [];
  
  for (const slab of taxSlabs) {
    if (income > slab.min) {
      const taxableInSlab = Math.min(income, slab.max) - slab.min;
      const slabTax = (taxableInSlab * slab.rate) / 100;
      tax += slabTax;
      
      if (taxableInSlab > 0) {
        breakdown.push({
          range: `₹${formatNumber(slab.min)} - ${slab.max === Infinity ? 'Above' : '₹' + formatNumber(slab.max)}`,
          rate: slab.rate,
          taxableAmount: taxableInSlab,
          tax: slabTax
        });
      }
    }
  }
  
  // Add cess
  const cessAmount = (tax * cess) / 100;
  tax += cessAmount;
  
  const effectiveRate = income > 0 ? (tax / income) * 100 : 0;
  
  return { tax, effectiveRate, breakdown };
};

// Utility functions for chart data generation
export const generateYearlyProjection = (
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): { year: number; amount: number; invested: number; returns: number }[] => {
  const projection = [];
  let currentAmount = initialAmount;
  let totalInvested = initialAmount;
  
  for (let year = 1; year <= years; year++) {
    // Add monthly contributions for the year
    const yearlyContribution = monthlyContribution * 12;
    totalInvested += yearlyContribution;
    
    // Calculate growth
    currentAmount = calculateSIPFutureValue(
      monthlyContribution,
      annualRate,
      year
    ) + (initialAmount * Math.pow(1 + annualRate / 100, year));
    
    const returns = currentAmount - totalInvested;
    
    projection.push({
      year,
      amount: Math.round(currentAmount),
      invested: Math.round(totalInvested),
      returns: Math.round(returns)
    });
  }
  
  return projection;
};

// Input parsing utilities
export const parseNumericInput = (value: string | number): number => {
  if (typeof value === 'number') return value;
  
  // Remove commas and currency symbols
  const cleaned = value.toString().replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

export const sanitizeInputs = (inputs: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'string' && !isNaN(Number(value.replace(/[₹,\s]/g, '')))) {
      sanitized[key] = parseNumericInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};