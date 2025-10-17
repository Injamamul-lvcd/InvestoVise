import { sipCalculatorConfig } from '@/lib/calculators/sipCalculator';

describe('SIP Calculator', () => {
  it('should calculate basic SIP correctly', () => {
    const inputs = {
      monthlyAmount: 10000,
      annualReturn: 12,
      investmentPeriod: 10,
      fundType: 'equity',
      stepUpPercentage: 0
    };

    const results = sipCalculatorConfig.calculate(inputs);
    
    expect(results).toHaveLength(4);
    
    const maturityResult = results.find(r => r.id === 'maturityAmount');
    const investmentResult = results.find(r => r.id === 'totalInvestment');
    const gainsResult = results.find(r => r.id === 'totalGains');
    const cagrResult = results.find(r => r.id === 'cagr');
    
    expect(maturityResult).toBeDefined();
    expect(investmentResult).toBeDefined();
    expect(gainsResult).toBeDefined();
    expect(cagrResult).toBeDefined();
    
    expect(investmentResult!.value).toBe(1200000); // 10000 * 12 * 10
    expect(maturityResult!.value).toBeGreaterThan(investmentResult!.value);
    expect(gainsResult!.value).toBeGreaterThan(0);
    expect(cagrResult!.value).toBeGreaterThan(0);
  });

  it('should handle step-up SIP correctly', () => {
    const inputs = {
      monthlyAmount: 5000,
      annualReturn: 12,
      investmentPeriod: 5,
      fundType: 'equity',
      stepUpPercentage: 10
    };

    const results = sipCalculatorConfig.calculate(inputs);
    const investmentResult = results.find(r => r.id === 'totalInvestment');
    
    // With 10% step-up, total investment should be more than basic SIP
    expect(investmentResult!.value).toBeGreaterThan(300000); // 5000 * 12 * 5
  });

  it('should generate chart data', () => {
    const inputs = {
      monthlyAmount: 5000,
      annualReturn: 12,
      investmentPeriod: 10,
      fundType: 'equity',
      stepUpPercentage: 0
    };

    const results = sipCalculatorConfig.calculate(inputs);
    const chartData = sipCalculatorConfig.generateChart!(inputs, results);
    
    expect(chartData).toBeDefined();
    expect(chartData.type).toBe('line');
    expect(chartData.data.labels).toHaveLength(10);
    expect(chartData.data.datasets).toHaveLength(2);
  });

  it('should have valid examples', () => {
    expect(sipCalculatorConfig.examples).toBeDefined();
    expect(sipCalculatorConfig.examples!.length).toBeGreaterThan(0);
    
    // Test each example
    sipCalculatorConfig.examples!.forEach(example => {
      const results = sipCalculatorConfig.calculate(example.inputs);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});