// Calculator configurations
export { sipCalculatorConfig } from './sipCalculator';
export { emiCalculatorConfig } from './emiCalculator';
export { taxCalculatorConfig } from './taxCalculator';
export { retirementCalculatorConfig } from './retirementCalculator';
export { goalCalculatorConfig } from './goalCalculator';

// Utilities and constants
export * from './utils';
export * from './constants';

// All calculator configurations
import { sipCalculatorConfig } from './sipCalculator';
import { emiCalculatorConfig } from './emiCalculator';
import { taxCalculatorConfig } from './taxCalculator';
import { retirementCalculatorConfig } from './retirementCalculator';
import { goalCalculatorConfig } from './goalCalculator';

export const allCalculators = [
  sipCalculatorConfig,
  emiCalculatorConfig,
  taxCalculatorConfig,
  retirementCalculatorConfig,
  goalCalculatorConfig
];