import { CalculatorConfig, CalculatorResult, CalculatorChartData } from '@/types/calculators';
import { calculateSIPFutureValue, calculateCompoundInterest, formatCurrency, formatNumber } from './utils';
import { INVESTMENT_RETURNS } from './constants';

export const goalCalculatorConfig: CalculatorConfig = {
  id: 'goal-calculator',
  name: 'Goal-Based Investment Calculator',
  description: 'Plan and calculate investments needed to achieve specific financial goals like home purchase, education, or vacation.',
  category: 'goal',
  helpText: 'Set your financial goal and timeline to calculate how much you need to invest monthly to achieve it.',
  inputs: [
    {
      id: 'goalName',
      label: 'Goal Name',
      type: 'select',
      value: 'home',
      required: true,
      options: [
        { value: 'home', label: 'Home Purchase' },
        { value: 'education', label: 'Child Education' },
        { value: 'marriage', label: 'Child Marriage' },
        { value: 'vacation', label: 'Dream Vacation' },
        { value: 'car', label: 'Car Purchase' },
        { value: 'business', label: 'Start Business' },
        { value: 'emergency', label: 'Emergency Fund' },
        { value: 'custom', label: 'Custom Goal' }
      ]
    },
    {
      id: 'goalAmount',
      label: 'Goal Amount (Today\'s Value)',
      type: 'currency',
      value: 5000000,
      required: true,
      min: 10000,
      max: 100000000,
      placeholder: 'Target amount in today\'s money'
    },
    {
      id: 'timeHorizon',
      label: 'Time to Achieve Goal (Years)',
      type: 'number',
      value: 10,
      required: true,
      min: 1,
      max: 30,
      placeholder: 'Years to achieve the goal'
    },
    {
      id: 'inflationRate',
      label: 'Expected Inflation Rate',
      type: 'percentage',
      value: 6,
      required: true,
      min: 2,
      max: 15,
      placeholder: 'Annual inflation rate'
    },
    {
      id: 'expectedReturn',
      label: 'Expected Annual Return',
      type: 'percentage',
      value: 12,
      required: true,
      min: 5,
      max: 20,
      placeholder: 'Expected investment return'
    },
    {
      id: 'currentSavings',
      label: 'Current Savings for Goal',
      type: 'currency',
      value: 0,
      required: false,
      min: 0,
      max: 50000000,
      placeholder: 'Amount already saved'
    },
    {
      id: 'investmentType',
      label: 'Investment Type',
      type: 'select',
      value: 'equity',
      required: true,
      options: [
        { value: 'equity', label: 'Equity Mutual Funds' },
        { value: 'debt', label: 'Debt Mutual Funds' },
        { value: 'hybrid', label: 'Hybrid Funds' },
        { value: 'ppf', label: 'PPF' },
        { value: 'fd', label: 'Fixed Deposits' },
        { value: 'mixed', label: 'Mixed Portfolio' }
      ]
    },
    {
      id: 'riskTolerance',
      label: 'Risk Tolerance',
      type: 'select',
      value: 'moderate',
      required: true,
      options: [
        { value: 'conservative', label: 'Conservative (Low Risk)' },
        { value: 'moderate', label: 'Moderate (Medium Risk)' },
        { value: 'aggressive', label: 'Aggressive (High Risk)' }
      ]
    }
  ],
  calculate: (inputs) => {
    const {
      goalAmount,
      timeHorizon,
      inflationRate,
      expectedReturn,
      currentSavings = 0,
      investmentType,
      riskTolerance
    } = inputs;
    
    // Adjust expected return based on investment type and risk tolerance
    let adjustedReturn = expectedReturn;
    const investmentReturns = INVESTMENT_RETURNS[investmentType as keyof typeof INVESTMENT_RETURNS];
    if (investmentReturns) {
      adjustedReturn = investmentReturns;
    }
    
    // Risk adjustment
    const riskAdjustment = {
      conservative: -1,
      moderate: 0,
      aggressive: 1
    };
    adjustedReturn += riskAdjustment[riskTolerance as keyof typeof riskAdjustment];
    
    // Calculate future value of goal considering inflation
    const futureGoalAmount = goalAmount * Math.pow(1 + inflationRate / 100, timeHorizon);
    
    // Calculate future value of current savings
    const futureCurrentSavings = currentSavings * Math.pow(1 + adjustedReturn / 100, timeHorizon);
    
    // Calculate remaining amount needed
    const remainingAmount = Math.max(0, futureGoalAmount - futureCurrentSavings);
    
    // Calculate monthly SIP needed
    const monthlyRate = adjustedReturn / (12 * 100);
    const months = timeHorizon * 12;
    
    let monthlySIPNeeded = 0;
    if (remainingAmount > 0 && monthlyRate > 0) {
      monthlySIPNeeded = remainingAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
    } else if (remainingAmount > 0) {
      monthlySIPNeeded = remainingAmount / months;
    }
    
    // Calculate total investment needed
    const totalInvestmentNeeded = (monthlySIPNeeded * months) + currentSavings;
    
    // Calculate wealth creation
    const wealthCreated = futureGoalAmount - totalInvestmentNeeded;
    
    // Calculate goal achievement probability based on risk tolerance
    const achievementProbability = {
      conservative: 85,
      moderate: 75,
      aggressive: 65
    };
    
    // Alternative scenarios
    const scenarios = [
      {
        name: 'Conservative',
        return: adjustedReturn - 2,
        sip: remainingAmount > 0 ? remainingAmount * (adjustedReturn - 2) / (12 * 100) / (Math.pow(1 + (adjustedReturn - 2) / (12 * 100), months) - 1) : 0
      },
      {
        name: 'Optimistic',
        return: adjustedReturn + 2,
        sip: remainingAmount > 0 ? remainingAmount * (adjustedReturn + 2) / (12 * 100) / (Math.pow(1 + (adjustedReturn + 2) / (12 * 100), months) - 1) : 0
      }
    ];
    
    const results: CalculatorResult[] = [
      {
        id: 'monthlySIP',
        label: 'Monthly SIP Required',
        value: monthlySIPNeeded,
        formattedValue: formatCurrency(monthlySIPNeeded),
        type: 'currency',
        description: `To achieve goal in ${timeHorizon} years`
      },
      {
        id: 'futureGoalAmount',
        label: 'Future Goal Value',
        value: futureGoalAmount,
        formattedValue: formatCurrency(futureGoalAmount),
        type: 'currency',
        description: `Goal amount adjusted for ${inflationRate}% inflation`
      },
      {
        id: 'totalInvestment',
        label: 'Total Investment Needed',
        value: totalInvestmentNeeded,
        formattedValue: formatCurrency(totalInvestmentNeeded),
        type: 'currency',
        description: 'Total amount you need to invest',
        breakdown: [
          {
            label: 'Current Savings',
            value: currentSavings,
            formattedValue: formatCurrency(currentSavings),
            percentage: totalInvestmentNeeded > 0 ? (currentSavings / totalInvestmentNeeded) * 100 : 0
          },
          {
            label: 'Future SIP Investments',
            value: monthlySIPNeeded * months,
            formattedValue: formatCurrency(monthlySIPNeeded * months),
            percentage: totalInvestmentNeeded > 0 ? ((monthlySIPNeeded * months) / totalInvestmentNeeded) * 100 : 0
          }
        ]
      },
      {
        id: 'wealthCreated',
        label: 'Wealth Created',
        value: wealthCreated,
        formattedValue: formatCurrency(wealthCreated),
        type: 'currency',
        description: 'Returns generated on your investments'
      },
      {
        id: 'achievementProbability',
        label: 'Achievement Probability',
        value: achievementProbability[riskTolerance as keyof typeof achievementProbability],
        formattedValue: `${achievementProbability[riskTolerance as keyof typeof achievementProbability]}%`,
        type: 'percentage',
        description: `Based on ${riskTolerance} risk profile`
      }
    ];
    
    return results;
  },
  generateChart: (inputs, results) => {
    const {
      goalAmount,
      timeHorizon,
      inflationRate,
      expectedReturn,
      currentSavings = 0,
      investmentType
    } = inputs;
    
    // Adjust return based on investment type
    let adjustedReturn = expectedReturn;
    const investmentReturns = INVESTMENT_RETURNS[investmentType as keyof typeof INVESTMENT_RETURNS];
    if (investmentReturns) {
      adjustedReturn = investmentReturns;
    }
    
    const futureGoalAmount = goalAmount * Math.pow(1 + inflationRate / 100, timeHorizon);
    const monthlySIPNeeded = results.find(r => r.id === 'monthlySIP')?.value || 0;
    
    // Generate year-wise projection
    const yearlyData = [];
    let cumulativeInvestment = currentSavings;
    let portfolioValue = currentSavings;
    
    for (let year = 1; year <= timeHorizon; year++) {
      // Add annual SIP investment
      const annualSIP = monthlySIPNeeded * 12;
      cumulativeInvestment += annualSIP;
      
      // Calculate portfolio growth
      portfolioValue = (portfolioValue + annualSIP) * (1 + adjustedReturn / 100);
      
      // Calculate goal value at this point
      const goalValueAtYear = goalAmount * Math.pow(1 + inflationRate / 100, year);
      
      yearlyData.push({
        year,
        invested: Math.round(cumulativeInvestment),
        portfolio: Math.round(portfolioValue),
        goalValue: Math.round(goalValueAtYear)
      });
    }
    
    const chartData: CalculatorChartData = {
      type: 'line',
      data: {
        labels: yearlyData.map(d => `Year ${d.year}`),
        datasets: [
          {
            label: 'Total Investment',
            data: yearlyData.map(d => d.invested),
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'Portfolio Value',
            data: yearlyData.map(d => d.portfolio),
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'Goal Value (Inflation Adjusted)',
            data: yearlyData.map(d => d.goalValue),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            fill: false,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Goal Achievement Progress'
          }
        }
      }
    };
    
    return chartData;
  },
  examples: [
    {
      name: 'Home Purchase',
      description: 'Saving for a home in 10 years',
      inputs: {
        goalName: 'home',
        goalAmount: 8000000,
        timeHorizon: 10,
        inflationRate: 6,
        expectedReturn: 12,
        currentSavings: 500000,
        investmentType: 'equity',
        riskTolerance: 'moderate'
      }
    },
    {
      name: 'Child Education',
      description: 'Planning for child\'s higher education',
      inputs: {
        goalName: 'education',
        goalAmount: 2500000,
        timeHorizon: 15,
        inflationRate: 8,
        expectedReturn: 12,
        currentSavings: 100000,
        investmentType: 'equity',
        riskTolerance: 'moderate'
      }
    },
    {
      name: 'Emergency Fund',
      description: 'Building emergency fund',
      inputs: {
        goalName: 'emergency',
        goalAmount: 600000,
        timeHorizon: 3,
        inflationRate: 4,
        expectedReturn: 7,
        currentSavings: 50000,
        investmentType: 'debt',
        riskTolerance: 'conservative'
      }
    }
  ]
};