'use client';

import React from 'react';
import { CalculatorInput as CalculatorInputType } from '@/types/calculators';

interface CalculatorInputProps {
  input: CalculatorInputType;
  value: any;
  onChange: (id: string, value: any) => void;
  error?: string;
  className?: string;
}

const CalculatorInput: React.FC<CalculatorInputProps> = ({
  input,
  value,
  onChange,
  error,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let newValue: any = e.target.value;
    
    if (input.type === 'number' || input.type === 'currency' || input.type === 'percentage') {
      newValue = newValue === '' ? '' : Number(newValue);
    }
    
    onChange(input.id, newValue);
  };

  const formatDisplayValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    
    if (input.format) {
      return input.format(val);
    }
    
    if (input.type === 'currency') {
      return val.toString();
    }
    
    if (input.type === 'percentage') {
      return val.toString();
    }
    
    return val.toString();
  };

  const getInputType = (): string => {
    switch (input.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return 'number';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  const renderInput = () => {
    if (input.type === 'select' && input.options) {
      return (
        <select
          id={input.id}
          value={value || ''}
          onChange={handleChange}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 focus:border-blue-500 dark:focus:border-amber-500 transition-colors duration-200 ${
            error ? 'border-red-500 dark:border-red-400' : ''
          }`}
          required={input.required}
        >
          <option value="">Select {input.label}</option>
          {input.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <div className="relative">
        {input.type === 'currency' && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 transition-colors duration-200">
            ₹
          </span>
        )}
        <input
          type={getInputType()}
          id={input.id}
          value={formatDisplayValue(value)}
          onChange={handleChange}
          placeholder={input.placeholder}
          min={input.min}
          max={input.max}
          step={input.step}
          required={input.required}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-amber-500 focus:border-blue-500 dark:focus:border-amber-500 transition-colors duration-200 ${
            input.type === 'currency' ? 'pl-8' : ''
          } ${input.type === 'percentage' ? 'pr-8' : ''} ${
            error ? 'border-red-500 dark:border-red-400' : ''
          }`}
        />
        {input.type === 'percentage' && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 transition-colors duration-200">
            %
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={input.id}
        className="block text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors duration-200"
      >
        {input.label}
        {input.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 transition-colors duration-200">{error}</p>
      )}
    </div>
  );
};

export default CalculatorInput;