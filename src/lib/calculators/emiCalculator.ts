import { CalculatorConfig, CalculatorResult, CalculatorChartData } from '@/types/calculators';
import { calculateEMI, formatCurrency, formatNumber } from './utils';
import { LOAN_RATES } from './constants';

export const emiCalculatorConfig: CalculatorConfig = {
  id: 'emi-calculator',
  name: 'EMI Calculator',
  description: 'Calculate Equated Monthly Installments (EMI) for loans with Indian interest rates and terms.',
  category: 'loan',
  helpText: 'Enter loan amount, interest rate, and tenure to calculate your monthly EMI and total payment details.',
  inputs: [
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'currency',
      value: 1000000,
      required: true,
      min: 10000,
      max: 100000000,
      placeholder: 'Enter loan amount'
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate',
      type: 'percentage',
      value: 9.5,
      required: true,
      min: 1,
      max: 30,
      placeholder: 'Annual interest rate'
    },
    {
      id: 'loanTenure',
      label: 'Loan Tenure (Years)',
      type: 'number',
      value: 20,
      required: true,
      min: 1,
      max: 40,
      placeholder: 'Loan duration in years'
    },
    {
      id: 'loanType',
      label: 'Loan Type',
      type: 'select',
      value: 'homeLoan',
      required: true,
      options: [
        { value: 'homeLoan', label: 'Home Loan' },
        { value: 'personalLoan', label: 'Personal Loan' },
        { value: 'carLoan', label: 'Car Loan' },
        { value: 'educationLoan', label: 'Education Loan' },
        { value: 'businessLoan', label: 'Business Loan' }
      ]
    },
    {
      id: 'processingFee',
      label: 'Processing Fee (%)',
      type: 'percentage',
      value: 1,
      required: false,
      min: 0,
      max: 5,
      placeholder: 'Processing fee percentage'
    }
  ],
  calculate: (inputs) => {
    const { loanAmount, interestRate, loanTenure, processingFee = 0 } = inputs;
    
    const monthlyEMI = calculateEMI(loanAmount, interestRate, loanTenure);
    const totalPayment = monthlyEMI * loanTenure * 12;
    const totalInterest = totalPayment - loanAmount;
    const processingFeeAmount = (loanAmount * processingFee) / 100;
    const totalCost = totalPayment + processingFeeAmount;
    
    // Calculate year-wise breakdown
    const yearlyBreakdown = [];
    let remainingPrincipal = loanAmount;
    const monthlyRate = interestRate / (12 * 100);
    
    for (let year = 1; year <= Math.min(loanTenure, 10); year++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      
      for (let month = 1; month <= 12; month++) {
        const monthlyInterest = remainingPrincipal * monthlyRate;
        const monthlyPrincipal = monthlyEMI - monthlyInterest;
        
        yearlyInterest += monthlyInterest;
        yearlyPrincipal += monthlyPrincipal;
        remainingPrincipal -= monthlyPrincipal;
        
        if (remainingPrincipal <= 0) break;
      }
      
      yearlyBreakdown.push({
        year,
        interest: yearlyInterest,
        principal: yearlyPrincipal,
        balance: Math.max(0, remainingPrincipal)
      });
      
      if (remainingPrincipal <= 0) break;
    }
    
    const results: CalculatorResult[] = [
      {
        id: 'monthlyEMI',
        label: 'Monthly EMI',
        value: monthlyEMI,
        formattedValue: formatCurrency(monthlyEMI),
        type: 'currency',
        description: 'Equated Monthly Installment'
      },
      {
        id: 'totalPayment',
        label: 'Total Payment',
        value: totalCost,
        formattedValue: formatCurrency(totalCost),
        type: 'currency',
        description: 'Total amount to be paid including fees',
        breakdown: [
          {
            label: 'Principal Amount',
            value: loanAmount,
            formattedValue: formatCurrency(loanAmount),
            percentage: (loanAmount / totalCost) * 100
          },
          {
            label: 'Total Interest',
            value: totalInterest,
            formattedValue: formatCurrency(totalInterest),
            percentage: (totalInterest / totalCost) * 100
          },
          {
            label: 'Processing Fee',
            value: processingFeeAmount,
            formattedValue: formatCurrency(processingFeeAmount),
            percentage: (processingFeeAmount / totalCost) * 100
          }
        ]
      },
      {
        id: 'totalInterest',
        label: 'Total Interest',
        value: totalInterest,
        formattedValue: formatCurrency(totalInterest),
        type: 'currency',
        description: 'Total interest paid over loan tenure'
      },
      {
        id: 'interestPercentage',
        label: 'Interest as % of Loan',
        value: (totalInterest / loanAmount) * 100,
        formattedValue: `${((totalInterest / loanAmount) * 100).toFixed(1)}%`,
        type: 'percentage',
        description: 'Interest as percentage of principal'
      }
    ];
    
    return results;
  },
  generateChart: (inputs, results) => {
    const { loanAmount, interestRate, loanTenure } = inputs;
    const monthlyEMI = calculateEMI(loanAmount, interestRate, loanTenure);
    
    // Generate amortization schedule for chart
    const years = Math.min(loanTenure, 20); // Show max 20 years in chart
    const yearlyData = [];
    let remainingPrincipal = loanAmount;
    const monthlyRate = interestRate / (12 * 100);
    
    for (let year = 1; year <= years; year++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      
      for (let month = 1; month <= 12; month++) {
        const monthlyInterest = remainingPrincipal * monthlyRate;
        const monthlyPrincipalPayment = monthlyEMI - monthlyInterest;
        
        yearlyInterest += monthlyInterest;
        yearlyPrincipal += monthlyPrincipalPayment;
        remainingPrincipal -= monthlyPrincipalPayment;
        
        if (remainingPrincipal <= 0) break;
      }
      
      yearlyData.push({
        year,
        interest: Math.round(yearlyInterest),
        principal: Math.round(yearlyPrincipal),
        balance: Math.round(Math.max(0, remainingPrincipal))
      });
      
      if (remainingPrincipal <= 0) break;
    }
    
    const chartData: CalculatorChartData = {
      type: 'bar',
      data: {
        labels: yearlyData.map(d => `Year ${d.year}`),
        datasets: [
          {
            label: 'Principal Payment',
            data: yearlyData.map(d => d.principal),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1
          },
          {
            label: 'Interest Payment',
            data: yearlyData.map(d => d.interest),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Loan Amortization Schedule'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true
          }
        }
      }
    };
    
    return chartData;
  },
  examples: [
    {
      name: 'Home Loan',
      description: 'Typical home loan scenario',
      inputs: {
        loanAmount: 5000000,
        interestRate: 8.5,
        loanTenure: 20,
        loanType: 'homeLoan',
        processingFee: 0.5
      }
    },
    {
      name: 'Personal Loan',
      description: 'Short-term personal loan',
      inputs: {
        loanAmount: 500000,
        interestRate: 14,
        loanTenure: 5,
        loanType: 'personalLoan',
        processingFee: 2
      }
    },
    {
      name: 'Car Loan',
      description: 'Vehicle financing',
      inputs: {
        loanAmount: 800000,
        interestRate: 9,
        loanTenure: 7,
        loanType: 'carLoan',
        processingFee: 1
      }
    }
  ]
};