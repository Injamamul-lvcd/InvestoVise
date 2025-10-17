import { CalculatorConfig, CalculatorResult, CalculatorChartData } from '@/types/calculators';
import { 
  calculateSIPFutureValue, 
  formatCurrency, 
  formatNumber, 
  generateYearlyProjection 
} from './utils';
import { EXPENSE_RATIOS, INVESTMENT_RETURNS } from './constants';

export const sipCalculatorConfig: CalculatorConfig = {
  id: 'sip-calculator',
  name: 'SIP Calculator',
  description: 'Calculate the future value of your Systematic Investment Plan (SIP) investments with Indian mutual fund parameters.',
  category: 'investment',
  helpText: 'Enter your monthly SIP amount, expected annual return rate, and investment period to see how your investment will grow over time.',
  inputs: [
    {
      id: 'monthlyAmount',
      label: 'Monthly SIP Amount',
      type: 'currency',
      value: 5000,
      required: true,
      min: 500,
      max: 1000000,
      placeholder: 'Enter monthly investment amount'
    },
    {
      id: 'annualReturn',
      label: 'Expected Annual Return',
      type: 'percentage',
      value: 12,
      required: true,
      min: 1,
      max: 30,
      placeholder: 'Expected return percentage'
    },
    {
      id: 'investmentPeriod',
      label: 'Investment Period (Years)',
      type: 'number',
      value: 10,
      required: true,
      min: 1,
      max: 50,
      placeholder: 'Investment duration in years'
    },
    {
      id: 'fundType',
      label: 'Fund Type',
      type: 'select',
      value: 'equity',
      required: true,
      options: [
        { value: 'equity', label: 'Equity Fund' },
        { value: 'debt', label: 'Debt Fund' },
        { value: 'hybrid', label: 'Hybrid Fund' },
        { value: 'index', label: 'Index Fund' },
        { value: 'etf', label: 'ETF' }
      ]
    },
    {
      id: 'stepUpPercentage',
      label: 'Annual Step-up (%)',
      type: 'percentage',
      value: 0,
      required: false,
      min: 0,
      max: 20,
      placeholder: 'Annual increase in SIP amount'
    }
  ],
  calculate: (inputs) => {
    const { monthlyAmount, annualReturn, investmentPeriod, fundType, stepUpPercentage = 0 } = inputs;
    
    // Calculate basic SIP without step-up
    const basicMaturityAmount = calculateSIPFutureValue(monthlyAmount, annualReturn, investmentPeriod);
    const totalInvestment = monthlyAmount * 12 * investmentPeriod;
    
    // Calculate with step-up if applicable
    let maturityAmount = basicMaturityAmount;
    let totalInvestedWithStepUp = totalInvestment;
    
    if (stepUpPercentage > 0) {
      maturityAmount = 0;
      totalInvestedWithStepUp = 0;
      let currentMonthlyAmount = monthlyAmount;
      
      for (let year = 1; year <= investmentPeriod; year++) {
        const yearlyInvestment = currentMonthlyAmount * 12;
        totalInvestedWithStepUp += yearlyInvestment;
        
        // Calculate future value for this year's investment
        const remainingYears = investmentPeriod - year + 1;
        const yearContribution = calculateSIPFutureValue(currentMonthlyAmount, annualReturn, remainingYears);
        maturityAmount += yearContribution;
        
        // Step up for next year
        currentMonthlyAmount *= (1 + stepUpPercentage / 100);
      }
    }
    
    const totalGains = maturityAmount - totalInvestedWithStepUp;
    const expenseRatio = EXPENSE_RATIOS[fundType as keyof typeof EXPENSE_RATIOS] || 1.0;
    const expenseAmount = (maturityAmount * expenseRatio * investmentPeriod) / 100;
    const netMaturityAmount = maturityAmount - expenseAmount;
    
    // Calculate CAGR
    const cagr = Math.pow(maturityAmount / totalInvestedWithStepUp, 1 / investmentPeriod) - 1;
    
    const results: CalculatorResult[] = [
      {
        id: 'maturityAmount',
        label: 'Maturity Amount',
        value: netMaturityAmount,
        formattedValue: formatCurrency(netMaturityAmount),
        type: 'currency',
        description: 'Total amount at maturity after expenses'
      },
      {
        id: 'totalInvestment',
        label: 'Total Investment',
        value: totalInvestedWithStepUp,
        formattedValue: formatCurrency(totalInvestedWithStepUp),
        type: 'currency',
        description: 'Total amount invested over the period'
      },
      {
        id: 'totalGains',
        label: 'Total Gains',
        value: totalGains,
        formattedValue: formatCurrency(totalGains),
        type: 'currency',
        description: 'Total returns earned on investment',
        breakdown: [
          {
            label: 'Gross Gains',
            value: totalGains + expenseAmount,
            formattedValue: formatCurrency(totalGains + expenseAmount)
          },
          {
            label: 'Expense Charges',
            value: expenseAmount,
            formattedValue: formatCurrency(expenseAmount)
          }
        ]
      },
      {
        id: 'cagr',
        label: 'CAGR',
        value: cagr * 100,
        formattedValue: `${(cagr * 100).toFixed(2)}%`,
        type: 'percentage',
        description: 'Compound Annual Growth Rate'
      }
    ];
    
    return results;
  },
  generateChart: (inputs, results) => {
    const { monthlyAmount, annualReturn, investmentPeriod, stepUpPercentage = 0 } = inputs;
    
    const projection = generateYearlyProjection(0, monthlyAmount, annualReturn, investmentPeriod);
    
    const chartData: CalculatorChartData = {
      type: 'line',
      data: {
        labels: projection.map(p => `Year ${p.year}`),
        datasets: [
          {
            label: 'Total Investment',
            data: projection.map(p => p.invested),
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'Maturity Value',
            data: projection.map(p => p.amount),
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'SIP Growth Projection'
          }
        }
      }
    };
    
    return chartData;
  },
  examples: [
    {
      name: 'Conservative SIP',
      description: 'Low-risk debt fund SIP',
      inputs: {
        monthlyAmount: 3000,
        annualReturn: 8,
        investmentPeriod: 15,
        fundType: 'debt',
        stepUpPercentage: 0
      }
    },
    {
      name: 'Aggressive SIP',
      description: 'High-growth equity fund SIP',
      inputs: {
        monthlyAmount: 10000,
        annualReturn: 15,
        investmentPeriod: 20,
        fundType: 'equity',
        stepUpPercentage: 10
      }
    },
    {
      name: 'Balanced SIP',
      description: 'Moderate hybrid fund SIP',
      inputs: {
        monthlyAmount: 5000,
        annualReturn: 12,
        investmentPeriod: 10,
        fundType: 'hybrid',
        stepUpPercentage: 5
      }
    }
  ]
};