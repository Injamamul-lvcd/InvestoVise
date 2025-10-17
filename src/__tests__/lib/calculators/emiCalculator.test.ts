import { emiCalculatorConfig } from '@/lib/calculators/emiCalculator';

describe('EMI Calculator', () => {
  it('should calculate EMI correctly', () => {
    const inputs = {
      loanAmount: 1000000,
      interestRate: 10,
      loanTenure: 20,
      loanType: 'homeLoan',
      processingFee: 1
    };

    const results = emiCalculatorConfig.calculate(inputs);
    
    expect(results).toHaveLength(4);
    
    const emiResult = results.find(r => r.id === 'monthlyEMI');
    const totalPaymentResult = results.find(r => r.id === 'totalPayment');
    const interestResult = results.find(r => r.id === 'totalInterest');
    const interestPercentageResult = results.find(r => r.id === 'interestPercentage');
    
    expect(emiResult).toBeDefined();
    expect(totalPaymentResult).toBeDefined();
    expect(interestResult).toBeDefined();
    expect(interestPercentageResult).toBeDefined();
    
    expect(emiResult!.value).toBeGreaterThan(0);
    expect(totalPaymentResult!.value).toBeGreaterThan(inputs.loanAmount);
    expect(interestResult!.value).toBeGreaterThan(0);
    expect(interestPercentageResult!.value).toBeGreaterThan(0);
  });

  it('should handle zero interest rate', () => {
    const inputs = {
      loanAmount: 1200000,
      interestRate: 0,
      loanTenure: 10,
      loanType: 'homeLoan',
      processingFee: 0
    };

    const results = emiCalculatorConfig.calculate(inputs);
    const emiResult = results.find(r => r.id === 'monthlyEMI');
    
    expect(emiResult!.value).toBe(10000); // 1200000 / (10 * 12)
  });

  it('should include processing fee in total cost', () => {
    const inputs = {
      loanAmount: 1000000,
      interestRate: 10,
      loanTenure: 20,
      loanType: 'homeLoan',
      processingFee: 2
    };

    const results = emiCalculatorConfig.calculate(inputs);
    const totalPaymentResult = results.find(r => r.id === 'totalPayment');
    
    // Should include 2% processing fee
    expect(totalPaymentResult!.breakdown).toBeDefined();
    const processingFeeBreakdown = totalPaymentResult!.breakdown!.find(b => b.label === 'Processing Fee');
    expect(processingFeeBreakdown!.value).toBe(20000); // 2% of 1000000
  });

  it('should generate amortization chart', () => {
    const inputs = {
      loanAmount: 1000000,
      interestRate: 10,
      loanTenure: 20,
      loanType: 'homeLoan',
      processingFee: 1
    };

    const results = emiCalculatorConfig.calculate(inputs);
    const chartData = emiCalculatorConfig.generateChart!(inputs, results);
    
    expect(chartData).toBeDefined();
    expect(chartData.type).toBe('bar');
    expect(chartData.data.datasets).toHaveLength(2); // Principal and Interest
    expect(chartData.data.labels.length).toBeGreaterThan(0);
  });

  it('should have valid examples', () => {
    expect(emiCalculatorConfig.examples).toBeDefined();
    expect(emiCalculatorConfig.examples!.length).toBeGreaterThan(0);
    
    // Test each example
    emiCalculatorConfig.examples!.forEach(example => {
      const results = emiCalculatorConfig.calculate(example.inputs);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});