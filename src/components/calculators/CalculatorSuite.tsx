'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorSuiteProps, CalculatorHistory } from '@/types/calculators';
import Calculator from './Calculator';

const CalculatorSuite: React.FC<CalculatorSuiteProps> = ({
  calculators,
  selectedCalculatorId,
  onCalculatorSelect,
  showHistory = true,
  showExamples = true
}) => {
  const [activeCalculatorId, setActiveCalculatorId] = useState<string>(
    selectedCalculatorId || (calculators.length > 0 ? calculators[0].id : '')
  );
  const [history, setHistory] = useState<CalculatorHistory[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  useEffect(() => {
    if (selectedCalculatorId && selectedCalculatorId !== activeCalculatorId) {
      setActiveCalculatorId(selectedCalculatorId);
    }
  }, [selectedCalculatorId, activeCalculatorId]);

  const activeCalculator = calculators.find(calc => calc.id === activeCalculatorId);

  const handleCalculatorSelect = (calculatorId: string) => {
    setActiveCalculatorId(calculatorId);
    onCalculatorSelect(calculatorId);
  };

  const handleSaveToHistory = (calculation: CalculatorHistory) => {
    setHistory(prev => [calculation, ...prev.slice(0, 49)]); // Keep last 50 calculations
  };

  const loadFromHistory = (historyItem: CalculatorHistory) => {
    if (historyItem.calculatorId !== activeCalculatorId) {
      setActiveCalculatorId(historyItem.calculatorId);
      onCalculatorSelect(historyItem.calculatorId);
    }
    // The Calculator component will handle loading the inputs
    setShowHistoryPanel(false);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'investment':
        return '📈';
      case 'loan':
        return '🏦';
      case 'tax':
        return '📊';
      case 'retirement':
        return '🏖️';
      case 'goal':
        return '🎯';
      default:
        return '🧮';
    }
  };

  const groupedCalculators = calculators.reduce((groups, calculator) => {
    const category = calculator.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(calculator);
    return groups;
  }, {} as Record<string, typeof calculators>);

  if (!activeCalculator) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No calculators available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Financial Calculators</h1>
            {showHistory && (
              <button
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                History ({history.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 sticky top-8 transition-colors duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Calculators</h2>
              
              <div className="space-y-4">
                {Object.entries(groupedCalculators).map(([category, calcs]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {getCategoryIcon(category)} {category}
                    </h3>
                    <div className="space-y-1">
                      {calcs.map((calculator) => (
                        <button
                          key={calculator.id}
                          onClick={() => handleCalculatorSelect(calculator.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            calculator.id === activeCalculatorId
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {calculator.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Calculator
              config={activeCalculator}
              onSaveToHistory={handleSaveToHistory}
              showChart={true}
              showExamples={showExamples}
            />
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistoryPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden border border-gray-200 dark:border-slate-700 transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Calculation History</h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearHistory}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    disabled={history.length === 0}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowHistoryPanel(false)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No calculations saved yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <span className="text-sm text-gray-500">
                          {item.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.calculatorName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.results.slice(0, 3).map((result) => (
                          <span
                            key={result.id}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {result.label}: {result.formattedValue}
                          </span>
                        ))}
                        {item.results.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{item.results.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorSuite;