import { CalculatorConfig, CalculatorResult, CalculatorChartData } from '@/types/calculators';
import { calculateSIPFutureValue, calculateCompoundInterest, formatCurrency, formatNumber } from './utils';
import { INDIAN_FINANCIAL_CONSTANTS, INVESTMENT_RETURNS } from './constants';

export const retirementCalculatorConfig: CalculatorConfig = {
  id: 'retirement-calculator',
  name: 'Retirement Planning Calculator',
  description: 'Plan your retirement with EPF, PPF, NPS, and other Indian retirement instruments.',
  category: 'retirement',
  helpText: 'Calculate how much you need to save for retirement considering inflation, EPF contributions, and other retirement savings.',
  inputs: [
    {
      id: 'currentAge',
      label: 'Current Age',
      type: 'number',
      value: 30,
      required: true,
      min: 18,
      max: 65,
      placeholder: 'Your current age'
    },
    {
      id: 'retirementAge',
      label: 'Retirement Age',
      type: 'number',
      value: 60,
      required: true,
      min: 50,
      max: 70,
      placeholder: 'Planned retirement age'
    },
    {
      id: 'currentSalary',
      label: 'Current Annual Salary',
      type: 'currency',
      value: 1200000,
      required: true,
      min: 100000,
      max: 50000000,
      placeholder: 'Current annual salary'
    },
    {
      id: 'currentExpenses',
      label: 'Current Annual Expenses',
      type: 'currency',
      value: 800000,
      required: true,
      min: 50000,
      max: 20000000,
      placeholder: 'Current annual living expenses'
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
      id: 'salaryGrowth',
      label: 'Annual Salary Growth',
      type: 'percentage',
      value: 8,
      required: true,
      min: 0,
      max: 20,
      placeholder: 'Expected salary growth rate'
    },
    {
      id: 'epfContribution',
      label: 'Monthly EPF Contribution',
      type: 'currency',
      value: 21600, // 12% of 15000 * 2 (employee + employer)
      required: false,
      min: 0,
      max: 100000,
      placeholder: 'Total EPF contribution (employee + employer)'
    },
    {
      id: 'ppfContribution',
      label: 'Annual PPF Contribution',
      type: 'currency',
      value: 150000,
      required: false,
      min: 0,
      max: 150000,
      placeholder: 'Annual PPF investment'
    },
    {
      id: 'npsContribution',
      label: 'Monthly NPS Contribution',
      type: 'currency',
      value: 5000,
      required: false,
      min: 0,
      max: 50000,
      placeholder: 'Monthly NPS investment'
    },
    {
      id: 'otherSavings',
      label: 'Other Monthly Savings',
      type: 'currency',
      value: 10000,
      required: false,
      min: 0,
      max: 200000,
      placeholder: 'Mutual funds, stocks, etc.'
    },
    {
      id: 'expectedReturn',
      label: 'Expected Return on Investments',
      type: 'percentage',
      value: 10,
      required: true,
      min: 5,
      max: 20,
      placeholder: 'Expected annual return'
    }
  ],
  calculate: (inputs) => {
    const {
      currentAge,
      retirementAge,
      currentSalary,
      currentExpenses,
      inflationRate,
      salaryGrowth,
      epfContribution = 0,
      ppfContribution = 0,
      npsContribution = 0,
      otherSavings = 0,
      expectedReturn
    } = inputs;
    
    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = 85 - retirementAge; // Assuming life expectancy of 85
    
    // Calculate future expenses at retirement (adjusted for inflation)
    const futureExpenses = currentExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    
    // Calculate retirement corpus needed (25x annual expenses rule)
    const retirementCorpusNeeded = futureExpenses * 25;
    
    // Calculate EPF maturity
    const epfMaturity = epfContribution > 0 ? 
      calculateSIPFutureValue(epfContribution, INDIAN_FINANCIAL_CONSTANTS.ppfRate, yearsToRetirement) : 0;
    
    // Calculate PPF maturity (assuming 15-year cycles)
    let ppfMaturity = 0;
    if (ppfContribution > 0) {
      const ppfCycles = Math.floor(yearsToRetirement / 15);
      const remainingYears = yearsToRetirement % 15;
      
      // Complete 15-year cycles
      for (let i = 0; i < ppfCycles; i++) {
        const cycleMaturity = calculateSIPFutureValue(ppfContribution / 12, INDIAN_FINANCIAL_CONSTANTS.ppfRate, 15);
        const compoundedValue = calculateCompoundInterest(cycleMaturity, INDIAN_FINANCIAL_CONSTANTS.ppfRate, (ppfCycles - i - 1) * 15);
        ppfMaturity += compoundedValue;
      }
      
      // Remaining years
      if (remainingYears > 0) {
        ppfMaturity += calculateSIPFutureValue(ppfContribution / 12, INDIAN_FINANCIAL_CONSTANTS.ppfRate, remainingYears);
      }
    }
    
    // Calculate NPS maturity
    const npsMaturity = npsContribution > 0 ? 
      calculateSIPFutureValue(npsContribution, expectedReturn, yearsToRetirement) : 0;
    
    // Calculate other savings maturity
    const otherSavingsMaturity = otherSavings > 0 ? 
      calculateSIPFutureValue(otherSavings, expectedReturn, yearsToRetirement) : 0;
    
    // Total retirement corpus
    const totalCorpus = epfMaturity + ppfMaturity + npsMaturity + otherSavingsMaturity;
    
    // Shortfall or surplus
    const shortfall = retirementCorpusNeeded - totalCorpus;
    const isShortfall = shortfall > 0;
    
    // Additional monthly savings needed
    const additionalSavingsNeeded = isShortfall ? 
      (shortfall / ((Math.pow(1 + expectedReturn / 100, yearsToRetirement) - 1) / (expectedReturn / 100))) / 12 : 0;
    
    // Monthly pension from corpus (4% withdrawal rule)
    const monthlyPension = (totalCorpus * 0.04) / 12;
    const requiredMonthlyPension = futureExpenses / 12;
    
    const results: CalculatorResult[] = [
      {
        id: 'retirementCorpus',
        label: 'Total Retirement Corpus',
        value: totalCorpus,
        formattedValue: formatCurrency(totalCorpus),
        type: 'currency',
        description: 'Total amount accumulated at retirement',
        breakdown: [
          {
            label: 'EPF Maturity',
            value: epfMaturity,
            formattedValue: formatCurrency(epfMaturity),
            percentage: totalCorpus > 0 ? (epfMaturity / totalCorpus) * 100 : 0
          },
          {
            label: 'PPF Maturity',
            value: ppfMaturity,
            formattedValue: formatCurrency(ppfMaturity),
            percentage: totalCorpus > 0 ? (ppfMaturity / totalCorpus) * 100 : 0
          },
          {
            label: 'NPS Maturity',
            value: npsMaturity,
            formattedValue: formatCurrency(npsMaturity),
            percentage: totalCorpus > 0 ? (npsMaturity / totalCorpus) * 100 : 0
          },
          {
            label: 'Other Savings',
            value: otherSavingsMaturity,
            formattedValue: formatCurrency(otherSavingsMaturity),
            percentage: totalCorpus > 0 ? (otherSavingsMaturity / totalCorpus) * 100 : 0
          }
        ]
      },
      {
        id: 'corpusNeeded',
        label: 'Corpus Needed',
        value: retirementCorpusNeeded,
        formattedValue: formatCurrency(retirementCorpusNeeded),
        type: 'currency',
        description: 'Required corpus for comfortable retirement'
      },
      {
        id: 'shortfallSurplus',
        label: isShortfall ? 'Shortfall' : 'Surplus',
        value: Math.abs(shortfall),
        formattedValue: formatCurrency(Math.abs(shortfall)),
        type: 'currency',
        description: isShortfall ? 'Additional corpus needed' : 'Excess corpus available'
      },
      {
        id: 'monthlyPension',
        label: 'Monthly Pension',
        value: monthlyPension,
        formattedValue: formatCurrency(monthlyPension),
        type: 'currency',
        description: 'Monthly income from retirement corpus (4% rule)'
      },
      {
        id: 'additionalSavings',
        label: 'Additional Monthly Savings Needed',
        value: additionalSavingsNeeded,
        formattedValue: formatCurrency(additionalSavingsNeeded),
        type: 'currency',
        description: isShortfall ? 'Extra savings needed to meet goal' : 'No additional savings required'
      }
    ];
    
    return results;
  },
  generateChart: (inputs, results) => {
    const {
      currentAge,
      retirementAge,
      epfContribution = 0,
      ppfContribution = 0,
      npsContribution = 0,
      otherSavings = 0,
      expectedReturn
    } = inputs;
    
    const yearsToRetirement = retirementAge - currentAge;
    const projectionYears = Math.min(yearsToRetirement, 30);
    
    // Generate year-wise projections
    const yearlyData = [];
    for (let year = 1; year <= projectionYears; year++) {
      const epfValue = epfContribution > 0 ? calculateSIPFutureValue(epfContribution, INDIAN_FINANCIAL_CONSTANTS.ppfRate, year) : 0;
      const ppfValue = ppfContribution > 0 ? calculateSIPFutureValue(ppfContribution / 12, INDIAN_FINANCIAL_CONSTANTS.ppfRate, year) : 0;
      const npsValue = npsContribution > 0 ? calculateSIPFutureValue(npsContribution, expectedReturn, year) : 0;
      const otherValue = otherSavings > 0 ? calculateSIPFutureValue(otherSavings, expectedReturn, year) : 0;
      
      yearlyData.push({
        year: currentAge + year,
        epf: Math.round(epfValue),
        ppf: Math.round(ppfValue),
        nps: Math.round(npsValue),
        other: Math.round(otherValue),
        total: Math.round(epfValue + ppfValue + npsValue + otherValue)
      });
    }
    
    const chartData: CalculatorChartData = {
      type: 'line',
      data: {
        labels: yearlyData.map(d => `Age ${d.year}`),
        datasets: [
          {
            label: 'EPF',
            data: yearlyData.map(d => d.epf),
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'PPF',
            data: yearlyData.map(d => d.ppf),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'NPS',
            data: yearlyData.map(d => d.nps),
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 2,
            fill: false
          },
          {
            label: 'Other Savings',
            data: yearlyData.map(d => d.other),
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 1)',
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
            text: 'Retirement Corpus Growth Projection'
          }
        }
      }
    };
    
    return chartData;
  },
  examples: [
    {
      name: 'Early Career',
      description: 'Young professional starting retirement planning',
      inputs: {
        currentAge: 25,
        retirementAge: 60,
        currentSalary: 600000,
        currentExpenses: 400000,
        inflationRate: 6,
        salaryGrowth: 10,
        epfContribution: 14400,
        ppfContribution: 100000,
        npsContribution: 2000,
        otherSavings: 5000,
        expectedReturn: 12
      }
    },
    {
      name: 'Mid Career',
      description: 'Experienced professional with higher savings',
      inputs: {
        currentAge: 35,
        retirementAge: 60,
        currentSalary: 1500000,
        currentExpenses: 900000,
        inflationRate: 6,
        salaryGrowth: 8,
        epfContribution: 21600,
        ppfContribution: 150000,
        npsContribution: 8000,
        otherSavings: 15000,
        expectedReturn: 10
      }
    },
    {
      name: 'Late Starter',
      description: 'Starting retirement planning at 40',
      inputs: {
        currentAge: 40,
        retirementAge: 60,
        currentSalary: 2000000,
        currentExpenses: 1200000,
        inflationRate: 6,
        salaryGrowth: 6,
        epfContribution: 21600,
        ppfContribution: 150000,
        npsContribution: 15000,
        otherSavings: 25000,
        expectedReturn: 10
      }
    }
  ]
};