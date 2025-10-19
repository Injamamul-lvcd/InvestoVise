'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorProps, CalculatorState, CalculatorHistory } from '@/types/calculators';
import { validateInput, sanitizeInputs } from '@/lib/calculators/utils';
import CalculatorInput from './CalculatorInput';
import CalculatorResults from './CalculatorResults';
import CalculatorChart from './CalculatorChart';

const Calculator: React.FC<CalculatorProps> = ({
  config,
  onCalculate,
  onSaveToHistory,
  initialInputs = {},
  showChart = true,
  showExamples = true
}) => {
  const [state, setState] = useState<CalculatorState>({
    inputs: initialInputs,
    results: [],
    chartData: undefined,
    isCalculating: false,
    errors: {},
    history: []
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [calculationName, setCalculationName] = useState('');

  // Initialize inputs with default values
  useEffect(() => {
    const defaultInputs: Record<string, any> = {};
    config.inputs.forEach(input => {
      if (initialInputs[input.id] !== undefined) {
        defaultInputs[input.id] = initialInputs[input.id];
      } else if (input.type === 'select' && input.options && input.options.length > 0) {
        defaultInputs[input.id] = input.options[0].value;
      } else {
        defaultInputs[input.id] = input.type === 'number' || input.type === 'currency' || input.type === 'percentage' ? 0 : '';
      }
    });
    
    setState(prev => ({
      ...prev,
      inputs: { ...defaultInputs, ...initialInputs }
    }));
  }, [config.id]); // Only depend on config.id to avoid infinite loops

  const handleInputChange = useCallback((inputId: string, value: any) => {
    setState(prev => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [inputId]: value
      },
      errors: {
        ...prev.errors,
        [inputId]: ''
      }
    }));
  }, []);

  const validateInputs = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    config.inputs.forEach(input => {
      const value = state.inputs[input.id];
      
      // Built-in validation
      if (input.required && (value === null || value === undefined || value === '')) {
        errors[input.id] = `${input.label} is required`;
        isValid = false;
      } else if (input.min !== undefined && typeof value === 'number' && value < input.min) {
        errors[input.id] = `${input.label} must be at least ${input.min}`;
        isValid = false;
      } else if (input.max !== undefined && typeof value === 'number' && value > input.max) {
        errors[input.id] = `${input.label} must be at most ${input.max}`;
        isValid = false;
      }
      
      // Custom validation
      if (input.validation && !errors[input.id]) {
        const validationError = input.validation(value);
        if (validationError) {
          errors[input.id] = validationError;
          isValid = false;
        }
      }
    });

    setState(prev => ({ ...prev, errors }));
    return isValid;
  }, [config.inputs, state.inputs]);

  const calculate = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const sanitizedInputs = sanitizeInputs(state.inputs);
      const results = config.calculate(sanitizedInputs);
      
      let chartData: any = undefined;
      if (config.generateChart && showChart) {
        chartData = config.generateChart(sanitizedInputs, results);
      }

      setState(prev => ({
        ...prev,
        results,
        chartData,
        isCalculating: false
      }));

      if (onCalculate) {
        onCalculate(results);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setState(prev => ({
        ...prev,
        isCalculating: false,
        errors: { general: 'An error occurred during calculation. Please check your inputs.' }
      }));
    }
  }, [config, state.inputs, validateInputs, showChart, onCalculate]);

  const saveToHistory = useCallback(() => {
    if (state.results.length === 0) return;

    const historyItem: CalculatorHistory = {
      id: Date.now().toString(),
      calculatorId: config.id,
      calculatorName: config.name,
      inputs: { ...state.inputs },
      results: [...state.results],
      createdAt: new Date(),
      name: calculationName || `${config.name} - ${new Date().toLocaleDateString()}`
    };

    setState(prev => ({
      ...prev,
      history: [historyItem, ...prev.history]
    }));

    if (onSaveToHistory) {
      onSaveToHistory(historyItem);
    }

    setShowSaveDialog(false);
    setCalculationName('');
  }, [config, state.inputs, state.results, calculationName, onSaveToHistory]);

  const loadExample = useCallback((example: any) => {
    setState(prev => ({
      ...prev,
      inputs: { ...prev.inputs, ...example.inputs },
      errors: {}
    }));
  }, []);

  const resetCalculator = useCallback(() => {
    const defaultInputs: Record<string, any> = {};
    config.inputs.forEach(input => {
      if (input.type === 'select' && input.options && input.options.length > 0) {
        defaultInputs[input.id] = input.options[0].value;
      } else {
        defaultInputs[input.id] = input.type === 'number' || input.type === 'currency' || input.type === 'percentage' ? 0 : '';
      }
    });
    
    setState(prev => ({
      ...prev,
      inputs: defaultInputs,
      results: [],
      chartData: undefined,
      errors: {}
    }));
  }, [config.inputs]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 transition-colors duration-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">{config.name}</h2>
        <p className="text-gray-600 dark:text-slate-300 transition-colors duration-200">{config.description}</p>
        {config.helpText && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md transition-colors duration-200">
            <p className="text-sm text-blue-800 dark:text-blue-300 transition-colors duration-200">{config.helpText}</p>
          </div>
        )}
      </div>

      {/* Examples */}
      {showExamples && config.examples && config.examples.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-200">Examples</h3>
          <div className="flex flex-wrap gap-2">
            {config.examples.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-md transition-colors duration-200"
                title={example.description}
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">Input Parameters</h3>
          
          {state.errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md transition-colors duration-200">
              <p className="text-sm text-red-800 dark:text-red-300 transition-colors duration-200">{state.errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            {config.inputs.map((input) => (
              <CalculatorInput
                key={input.id}
                input={input}
                value={state.inputs[input.id]}
                onChange={handleInputChange}
                error={state.errors[input.id]}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={calculate}
              disabled={state.isCalculating}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-amber-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {state.isCalculating ? 'Calculating...' : 'Calculate'}
            </button>
            
            <button
              onClick={resetCalculator}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors duration-200"
            >
              Reset
            </button>
            
            {state.results.length > 0 && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {state.results.length > 0 && (
            <>
              <CalculatorResults results={state.results} />
              
              {state.chartData && showChart && (
                <CalculatorChart chartData={state.chartData} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700 transition-colors duration-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-200">Save Calculation</h3>
            <input
              type="text"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
              placeholder="Enter a name for this calculation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 focus:border-transparent transition-colors duration-200"
            />
            <div className="flex gap-3">
              <button
                onClick={saveToHistory}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-amber-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-amber-700 transition-colors duration-200"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;