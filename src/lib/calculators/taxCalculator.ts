import { CalculatorConfig, CalculatorResult, CalculatorChartData } from '@/types/calculators';
import { calculateTax, formatCurrency, formatNumber } from './utils';
import { INDIAN_FINANCIAL_CONSTANTS } from './constants';

export const taxCalculatorConfig: CalculatorConfig = {
  id: 'tax-calculator',
  name: 'Income Tax Calculator',
  description: 'Calculate income tax liability under both old and new tax regimes for FY 2024-25.',
  category: 'tax',
  helpText: 'Enter your income details and deductions to calculate tax liability under both tax regimes and choose the better option.',
  inputs: [
    {
      id: 'grossSalary',
      label: 'Gross Annual Salary',
      type: 'currency',
      value: 1200000,
      required: true,
      min: 0,
      max: 100000000,
      placeholder: 'Enter gross annual salary'
    },
    {
      id: 'otherIncome',
      label: 'Other Income',
      type: 'currency',
      value: 0,
      required: false,
      min: 0,
      max: 10000000,
      placeholder: 'Interest, rental, etc.'
    },
    {
      id: 'section80C',
      label: 'Section 80C Deductions',
      type: 'currency',
      value: 150000,
      required: false,
      min: 0,
      max: 150000,
      placeholder: 'EPF, PPF, ELSS, etc.'
    },
    {
      id: 'section80D',
      label: 'Section 80D (Health Insurance)',
      type: 'currency',
      value: 25000,
      required: false,
      min: 0,
      max: 100000,
      placeholder: 'Health insurance premium'
    },
    {
      id: 'hra',
      label: 'HRA Exemption',
      type: 'currency',
      value: 0,
      required: false,
      min: 0,
      max: 5000000,
      placeholder: 'House Rent Allowance exemption'
    },
    {
      id: 'homeLoanInterest',
      label: 'Home Loan Interest (80EE)',
      type: 'currency',
      value: 0,
      required: false,
      min: 0,
      max: 200000,
      placeholder: 'Home loan interest deduction'
    },
    {
      id: 'nps',
      label: 'NPS Contribution (80CCD(1B))',
      type: 'currency',
      value: 0,
      required: false,
      min: 0,
      max: 50000,
      placeholder: 'Additional NPS contribution'
    },
    {
      id: 'age',
      label: 'Age',
      type: 'select',
      value: 'below60',
      required: true,
      options: [
        { value: 'below60', label: 'Below 60 years' },
        { value: 'senior', label: '60-80 years (Senior Citizen)' },
        { value: 'superSenior', label: 'Above 80 years (Super Senior)' }
      ]
    }
  ],
  calculate: (inputs) => {
    const {
      grossSalary,
      otherIncome = 0,
      section80C = 0,
      section80D = 0,
      hra = 0,
      homeLoanInterest = 0,
      nps = 0,
      age
    } = inputs;
    
    const totalIncome = grossSalary + otherIncome;
    
    // Old Tax Regime Calculation
    const oldRegimeDeductions = Math.min(section80C, INDIAN_FINANCIAL_CONSTANTS.section80C.limit) +
                               Math.min(section80D, INDIAN_FINANCIAL_CONSTANTS.section80D.self) +
                               hra + homeLoanInterest + nps;
    
    const oldRegimeTaxableIncome = Math.max(0, totalIncome - INDIAN_FINANCIAL_CONSTANTS.standardDeduction - oldRegimeDeductions);
    const oldRegimeTax = calculateTax(oldRegimeTaxableIncome, INDIAN_FINANCIAL_CONSTANTS.taxSlabs.old);
    
    // New Tax Regime Calculation (no deductions except standard deduction)
    const newRegimeTaxableIncome = Math.max(0, totalIncome - INDIAN_FINANCIAL_CONSTANTS.standardDeduction);
    const newRegimeTax = calculateTax(newRegimeTaxableIncome, INDIAN_FINANCIAL_CONSTANTS.taxSlabs.new);
    
    // Determine better regime
    const betterRegime = oldRegimeTax.tax <= newRegimeTax.tax ? 'old' : 'new';
    const taxSaving = Math.abs(oldRegimeTax.tax - newRegimeTax.tax);
    
    // Calculate take-home salary
    const oldRegimeTakeHome = totalIncome - oldRegimeTax.tax;
    const newRegimeTakeHome = totalIncome - newRegimeTax.tax;
    
    const results: CalculatorResult[] = [
      {
        id: 'recommendedRegime',
        label: 'Recommended Tax Regime',
        value: betterRegime === 'old' ? 1 : 2,
        formattedValue: betterRegime === 'old' ? 'Old Tax Regime' : 'New Tax Regime',
        type: 'number',
        description: `Save ₹${formatNumber(taxSaving)} by choosing this regime`
      },
      {
        id: 'oldRegimeTax',
        label: 'Old Regime Tax',
        value: oldRegimeTax.tax,
        formattedValue: formatCurrency(oldRegimeTax.tax),
        type: 'currency',
        description: `Effective rate: ${oldRegimeTax.effectiveRate.toFixed(2)}%`,
        breakdown: [
          {
            label: 'Taxable Income',
            value: oldRegimeTaxableIncome,
            formattedValue: formatCurrency(oldRegimeTaxableIncome)
          },
          {
            label: 'Total Deductions',
            value: oldRegimeDeductions,
            formattedValue: formatCurrency(oldRegimeDeductions)
          },
          {
            label: 'Take Home',
            value: oldRegimeTakeHome,
            formattedValue: formatCurrency(oldRegimeTakeHome)
          }
        ]
      },
      {
        id: 'newRegimeTax',
        label: 'New Regime Tax',
        value: newRegimeTax.tax,
        formattedValue: formatCurrency(newRegimeTax.tax),
        type: 'currency',
        description: `Effective rate: ${newRegimeTax.effectiveRate.toFixed(2)}%`,
        breakdown: [
          {
            label: 'Taxable Income',
            value: newRegimeTaxableIncome,
            formattedValue: formatCurrency(newRegimeTaxableIncome)
          },
          {
            label: 'Total Deductions',
            value: INDIAN_FINANCIAL_CONSTANTS.standardDeduction,
            formattedValue: formatCurrency(INDIAN_FINANCIAL_CONSTANTS.standardDeduction)
          },
          {
            label: 'Take Home',
            value: newRegimeTakeHome,
            formattedValue: formatCurrency(newRegimeTakeHome)
          }
        ]
      },
      {
        id: 'taxSaving',
        label: 'Tax Saving',
        value: taxSaving,
        formattedValue: formatCurrency(taxSaving),
        type: 'currency',
        description: `By choosing ${betterRegime} regime over ${betterRegime === 'old' ? 'new' : 'old'} regime`
      }
    ];
    
    return results;
  },
  generateChart: (inputs, results) => {
    const {
      grossSalary,
      otherIncome = 0,
      section80C = 0,
      section80D = 0,
      hra = 0,
      homeLoanInterest = 0,
      nps = 0
    } = inputs;
    
    const totalIncome = grossSalary + otherIncome;
    const oldRegimeDeductions = Math.min(section80C, INDIAN_FINANCIAL_CONSTANTS.section80C.limit) +
                               Math.min(section80D, INDIAN_FINANCIAL_CONSTANTS.section80D.self) +
                               hra + homeLoanInterest + nps;
    
    const oldRegimeTaxableIncome = Math.max(0, totalIncome - INDIAN_FINANCIAL_CONSTANTS.standardDeduction - oldRegimeDeductions);
    const newRegimeTaxableIncome = Math.max(0, totalIncome - INDIAN_FINANCIAL_CONSTANTS.standardDeduction);
    
    const oldRegimeTax = calculateTax(oldRegimeTaxableIncome, INDIAN_FINANCIAL_CONSTANTS.taxSlabs.old);
    const newRegimeTax = calculateTax(newRegimeTaxableIncome, INDIAN_FINANCIAL_CONSTANTS.taxSlabs.new);
    
    const chartData: CalculatorChartData = {
      type: 'bar',
      data: {
        labels: ['Old Tax Regime', 'New Tax Regime'],
        datasets: [
          {
            label: 'Tax Liability',
            data: [oldRegimeTax.tax, newRegimeTax.tax],
            backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(59, 130, 246, 0.8)'],
            borderColor: ['rgba(239, 68, 68, 1)', 'rgba(59, 130, 246, 1)'],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Tax Comparison: Old vs New Regime'
          },
          legend: {
            display: false
          }
        }
      }
    };
    
    return chartData;
  },
  examples: [
    {
      name: 'Young Professional',
      description: 'Fresh graduate with basic deductions',
      inputs: {
        grossSalary: 800000,
        otherIncome: 0,
        section80C: 50000,
        section80D: 5000,
        hra: 100000,
        homeLoanInterest: 0,
        nps: 0,
        age: 'below60'
      }
    },
    {
      name: 'Mid-Career Professional',
      description: 'Experienced professional with home loan',
      inputs: {
        grossSalary: 1500000,
        otherIncome: 50000,
        section80C: 150000,
        section80D: 25000,
        hra: 200000,
        homeLoanInterest: 150000,
        nps: 50000,
        age: 'below60'
      }
    },
    {
      name: 'Senior Executive',
      description: 'High-income individual with maximum deductions',
      inputs: {
        grossSalary: 2500000,
        otherIncome: 200000,
        section80C: 150000,
        section80D: 50000,
        hra: 400000,
        homeLoanInterest: 200000,
        nps: 50000,
        age: 'below60'
      }
    }
  ]
};