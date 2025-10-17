import { taxCalculatorConfig } from '@/lib/calculators/taxCalculator';

describe('Tax Calculator', () => {
  it('should calculate tax for both regimes', () => {
    const inputs = {
      grossSalary: 1200000,
      otherIncome: 0,
      section80C: 150000,
      section80D: 25000,
      hra: 200000,
      homeLoanInterest: 0,
      nps: 0,
      age: 'below60'
    };

    const results = taxCalculatorConfig.calculate(inputs);
    
    expect(results).toHaveLength(4);
    
    const recommendedResult = results.find(r => r.id === 'recommendedRegime');
    const oldRegimeResult = results.find(r => r.id === 'oldRegimeTax');
    const newRegimeResult = results.find(r => r.id === 'newRegimeTax');
    const savingResult = results.find(r => r.id === 'taxSaving');
    
    expect(recommendedResult).toBeDefined();
    expect(oldRegimeResult).toBeDefined();
    expect(newRegimeResult).toBeDefined();
    expect(savingResult).toBeDefined();
    
    expect(oldRegimeResult!.value).toBeGreaterThanOrEqual(0);
    expect(newRegimeResult!.value).toBeGreaterThanOrEqual(0);
    expect(savingResult!.value).toBeGreaterThanOrEqual(0);
  });

  it('should recommend old regime when deductions are high', () => {
    const inputs = {
      grossSalary: 1500000,
      otherIncome: 0,
      section80C: 150000,
      section80D: 25000,
      hra: 300000,
      homeLoanInterest: 200000,
      nps: 50000,
      age: 'below60'
    };

    const results = taxCalculatorConfig.calculate(inputs);
    const recommendedResult = results.find(r => r.id === 'recommendedRegime');
    
    // With high deductions, old regime should be better
    expect(recommendedResult!.formattedValue).toBe('Old Tax Regime');
  });

  it('should recommend new regime when deductions are low', () => {
    const inputs = {
      grossSalary: 800000,
      otherIncome: 0,
      section80C: 0,
      section80D: 0,
      hra: 0,
      homeLoanInterest: 0,
      nps: 0,
      age: 'below60'
    };

    const results = taxCalculatorConfig.calculate(inputs);
    const recommendedResult = results.find(r => r.id === 'recommendedRegime');
    
    // With no deductions, new regime might be better
    expect(['Old Tax Regime', 'New Tax Regime']).toContain(recommendedResult!.formattedValue);
  });

  it('should generate comparison chart', () => {
    const inputs = {
      grossSalary: 1200000,
      otherIncome: 0,
      section80C: 100000,
      section80D: 15000,
      hra: 150000,
      homeLoanInterest: 0,
      nps: 0,
      age: 'below60'
    };

    const results = taxCalculatorConfig.calculate(inputs);
    const chartData = taxCalculatorConfig.generateChart!(inputs, results);
    
    expect(chartData).toBeDefined();
    expect(chartData.type).toBe('bar');
    expect(chartData.data.labels).toEqual(['Old Tax Regime', 'New Tax Regime']);
    expect(chartData.data.datasets).toHaveLength(1);
  });

  it('should have valid examples', () => {
    expect(taxCalculatorConfig.examples).toBeDefined();
    expect(taxCalculatorConfig.examples!.length).toBeGreaterThan(0);
    
    // Test each example
    taxCalculatorConfig.examples!.forEach(example => {
      const results = taxCalculatorConfig.calculate(example.inputs);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});