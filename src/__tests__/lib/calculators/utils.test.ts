import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  validateInput,
  calculateCompoundInterest,
  calculateSIPFutureValue,
  calculateEMI,
  calculateTax,
  parseNumericInput,
  sanitizeInputs
} from '@/lib/calculators/utils';
import { ValidationRule } from '@/types/calculators';

describe('Calculator Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency in Indian format', () => {
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
      expect(formatCurrency(50000.50, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe('₹50,000.50');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1000, { currency: 'USD', locale: 'en-US' })).toBe('$1,000');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers in Indian format', () => {
      expect(formatNumber(100000)).toBe('1,00,000');
      expect(formatNumber(1000000.123, { maximumFractionDigits: 2 })).toBe('10,00,000.12');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(12.5)).toBe('12.50%');
      expect(formatPercentage(8, 1)).toBe('8.0%');
    });
  });

  describe('validateInput', () => {
    it('should validate required fields', () => {
      const rules: ValidationRule[] = [
        { type: 'required', message: 'Field is required' }
      ];
      
      expect(validateInput('', rules)).toBe('Field is required');
      expect(validateInput(null, rules)).toBe('Field is required');
      expect(validateInput('value', rules)).toBeNull();
    });

    it('should validate min/max values', () => {
      const minRule: ValidationRule[] = [
        { type: 'min', value: 10, message: 'Minimum value is 10' }
      ];
      const maxRule: ValidationRule[] = [
        { type: 'max', value: 100, message: 'Maximum value is 100' }
      ];
      
      expect(validateInput(5, minRule)).toBe('Minimum value is 10');
      expect(validateInput(15, minRule)).toBeNull();
      expect(validateInput(150, maxRule)).toBe('Maximum value is 100');
      expect(validateInput(50, maxRule)).toBeNull();
    });

    it('should validate custom rules', () => {
      const customRule: ValidationRule[] = [
        {
          type: 'custom',
          message: 'Must be even number',
          validator: (value) => value % 2 === 0
        }
      ];
      
      expect(validateInput(3, customRule)).toBe('Must be even number');
      expect(validateInput(4, customRule)).toBeNull();
    });
  });

  describe('calculateCompoundInterest', () => {
    it('should calculate compound interest correctly', () => {
      const result = calculateCompoundInterest(100000, 10, 5, 1);
      expect(Math.round(result)).toBe(161051);
    });

    it('should handle quarterly compounding', () => {
      const result = calculateCompoundInterest(100000, 10, 5, 4);
      expect(Math.round(result)).toBe(163862);
    });
  });

  describe('calculateSIPFutureValue', () => {
    it('should calculate SIP future value correctly', () => {
      const result = calculateSIPFutureValue(10000, 12, 10);
      expect(Math.round(result)).toBe(2300387);
    });

    it('should handle zero interest rate', () => {
      const result = calculateSIPFutureValue(10000, 0, 5);
      expect(result).toBe(600000); // 10000 * 12 * 5
    });
  });

  describe('calculateEMI', () => {
    it('should calculate EMI correctly', () => {
      const result = calculateEMI(1000000, 10, 20);
      expect(Math.round(result)).toBe(9650);
    });

    it('should handle zero interest rate', () => {
      const result = calculateEMI(1200000, 0, 10);
      expect(result).toBe(10000); // 1200000 / (10 * 12)
    });
  });

  describe('calculateTax', () => {
    const taxSlabs = [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: Infinity, rate: 30 }
    ];

    it('should calculate tax for income below first slab', () => {
      const result = calculateTax(200000, taxSlabs);
      expect(result.tax).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });

    it('should calculate tax for income in multiple slabs', () => {
      const result = calculateTax(800000, taxSlabs);
      const expectedTax = (250000 * 0.05) + (300000 * 0.20); // 12500 + 60000 = 72500
      const expectedTaxWithCess = expectedTax * 1.04; // 75400
      expect(Math.round(result.tax)).toBe(Math.round(expectedTaxWithCess));
    });

    it('should calculate effective tax rate', () => {
      const result = calculateTax(1000000, taxSlabs);
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(30);
    });
  });

  describe('parseNumericInput', () => {
    it('should parse numeric strings', () => {
      expect(parseNumericInput('100000')).toBe(100000);
      expect(parseNumericInput('₹1,00,000')).toBe(100000);
      expect(parseNumericInput('1,00,000.50')).toBe(100000.50);
    });

    it('should handle numbers', () => {
      expect(parseNumericInput(50000)).toBe(50000);
    });

    it('should return 0 for invalid input', () => {
      expect(parseNumericInput('invalid')).toBe(0);
      expect(parseNumericInput('')).toBe(0);
    });
  });

  describe('sanitizeInputs', () => {
    it('should sanitize numeric string inputs', () => {
      const inputs = {
        amount: '₹1,00,000',
        rate: '12.5',
        years: 10,
        name: 'Test'
      };
      
      const result = sanitizeInputs(inputs);
      expect(result.amount).toBe(100000);
      expect(result.rate).toBe(12.5);
      expect(result.years).toBe(10);
      expect(result.name).toBe('Test');
    });
  });
});