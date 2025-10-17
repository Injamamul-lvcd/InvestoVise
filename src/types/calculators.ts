// Calculator types and interfaces

export interface CalculatorInput {
  id: string;
  label: string;
  type: 'number' | 'percentage' | 'currency' | 'select' | 'date';
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  validation?: (value: any) => string | null;
  format?: (value: any) => string;
}

export interface CalculatorResult {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  type: 'currency' | 'percentage' | 'number' | 'years' | 'months';
  description?: string;
  breakdown?: CalculatorResultBreakdown[];
}

export interface CalculatorResultBreakdown {
  label: string;
  value: number;
  formattedValue: string;
  percentage?: number;
}

export interface CalculatorChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      borderWidth?: number;
      fill?: boolean;
    }[];
  };
  options?: any;
}

export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  category: 'investment' | 'loan' | 'tax' | 'retirement' | 'goal';
  inputs: CalculatorInput[];
  calculate: (inputs: Record<string, any>) => CalculatorResult[];
  generateChart?: (inputs: Record<string, any>, results: CalculatorResult[]) => CalculatorChartData;
  helpText?: string;
  examples?: CalculatorExample[];
}

export interface CalculatorExample {
  name: string;
  description: string;
  inputs: Record<string, any>;
}

export interface CalculatorHistory {
  id: string;
  calculatorId: string;
  calculatorName: string;
  inputs: Record<string, any>;
  results: CalculatorResult[];
  createdAt: Date;
  name?: string;
}

export interface CalculatorState {
  inputs: Record<string, any>;
  results: CalculatorResult[];
  chartData?: CalculatorChartData;
  isCalculating: boolean;
  errors: Record<string, string>;
  history: CalculatorHistory[];
}

// Validation types
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'range' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface InputValidation {
  [inputId: string]: ValidationRule[];
}

// Formatting utilities
export interface FormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// Calculator suite types
export interface CalculatorSuiteProps {
  calculators: CalculatorConfig[];
  selectedCalculatorId?: string;
  onCalculatorSelect: (calculatorId: string) => void;
  showHistory?: boolean;
  showExamples?: boolean;
}

export interface CalculatorProps {
  config: CalculatorConfig;
  onCalculate?: (results: CalculatorResult[]) => void;
  onSaveToHistory?: (calculation: CalculatorHistory) => void;
  initialInputs?: Record<string, any>;
  showChart?: boolean;
  showExamples?: boolean;
}

// Indian financial constants
export interface IndianTaxSlab {
  min: number;
  max: number;
  rate: number;
  cess?: number;
}

export interface IndianFinancialConstants {
  currentFY: string;
  taxSlabs: {
    old: IndianTaxSlab[];
    new: IndianTaxSlab[];
  };
  standardDeduction: number;
  section80C: {
    limit: number;
    instruments: string[];
  };
  section80D: {
    self: number;
    parents: number;
    seniorCitizen: number;
  };
  epfContribution: {
    employeeRate: number;
    employerRate: number;
    maxSalary: number;
  };
  ppfRate: number;
  nscRate: number;
  inflationRate: number;
}