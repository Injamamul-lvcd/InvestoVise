'use client';

import React from 'react';
import { CalculatorResult } from '@/types/calculators';

interface CalculatorResultsProps {
  results: CalculatorResult[];
  className?: string;
}

const CalculatorResults: React.FC<CalculatorResultsProps> = ({
  results,
  className = ''
}) => {
  if (!results || results.length === 0) {
    return null;
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'currency':
        return '₹';
      case 'percentage':
        return '%';
      case 'years':
        return 'Y';
      case 'months':
        return 'M';
      default:
        return '';
    }
  };

  const getResultColor = (id: string) => {
    if (id.includes('total') || id.includes('maturity')) {
      return 'bg-green-50 border-green-200 text-green-800';
    }
    if (id.includes('tax') || id.includes('interest')) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (id.includes('return') || id.includes('gain')) {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    }
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Results</h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <div
            key={result.id}
            className={`p-4 rounded-lg border-2 ${getResultColor(result.id)}`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{result.label}</h4>
              <span className="text-xs opacity-75">
                {getResultIcon(result.type)}
              </span>
            </div>
            
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {result.formattedValue}
              </p>
              {result.description && (
                <p className="text-xs mt-1 opacity-75">
                  {result.description}
                </p>
              )}
            </div>

            {result.breakdown && result.breakdown.length > 0 && (
              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                <h5 className="text-xs font-medium mb-2">Breakdown:</h5>
                <div className="space-y-1">
                  {result.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{item.label}</span>
                      <span className="font-medium">
                        {item.formattedValue}
                        {item.percentage && (
                          <span className="ml-1 opacity-75">
                            ({item.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalculatorResults;