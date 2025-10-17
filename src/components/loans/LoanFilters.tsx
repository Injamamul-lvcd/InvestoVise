'use client';

import React, { useState } from 'react';
import { LoanFilters as LoanFiltersType, LoanFiltersProps } from '@/types/loans';

const LoanFilters: React.FC<LoanFiltersProps> = ({
  filters,
  onFiltersChange,
  loanTypes,
  priceRanges,
  interestRateRanges,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof LoanFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== '' && value !== 'all'
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-700 md:hidden"
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${!isExpanded ? 'hidden md:grid' : ''}`}>
        {/* Loan Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Type
          </label>
          <select
            value={filters.loanType || 'all'}
            onChange={(e) => handleFilterChange('loanType', e.target.value === 'all' ? undefined : e.target.value)}
            className="input-field"
          >
            <option value="all">All Types ({loanTypes.reduce((sum, type) => sum + type.count, 0)})</option>
            {loanTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.count})
              </option>
            ))}
          </select>
        </div>

        {/* Loan Amount Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
              className="input-field text-sm"
              min={priceRanges.min}
              max={priceRanges.max}
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
              className="input-field text-sm"
              min={priceRanges.min}
              max={priceRanges.max}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Range: ₹{priceRanges.min?.toLocaleString('en-IN')} - ₹{priceRanges.max?.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Interest Rate Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interest Rate (% p.a.)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="Min"
              value={filters.minInterestRate || ''}
              onChange={(e) => handleFilterChange('minInterestRate', e.target.value ? Number(e.target.value) : undefined)}
              className="input-field text-sm"
              min={interestRateRanges.min}
              max={interestRateRanges.max}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Max"
              value={filters.maxInterestRate || ''}
              onChange={(e) => handleFilterChange('maxInterestRate', e.target.value ? Number(e.target.value) : undefined)}
              className="input-field text-sm"
              min={interestRateRanges.min}
              max={interestRateRanges.max}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Range: {interestRateRanges.min?.toFixed(1)}% - {interestRateRanges.max?.toFixed(1)}%
          </div>
        </div>

        {/* Sort By Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'interestRate'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="input-field"
          >
            <option value="interestRate">Interest Rate</option>
            <option value="processingFee">Processing Fee</option>
            <option value="maxAmount">Max Amount</option>
            <option value="popularity">Popularity</option>
          </select>
          <div className="mt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.sortOrder === 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.checked ? 'desc' : 'asc')}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">Descending</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
        
        <button
          onClick={() => handleFilterChange('loanType', 'personal_loan')}
          className={`px-3 py-1 text-xs rounded-full border ${
            filters.loanType === 'personal_loan'
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          Personal Loans
        </button>
        
        <button
          onClick={() => handleFilterChange('loanType', 'home_loan')}
          className={`px-3 py-1 text-xs rounded-full border ${
            filters.loanType === 'home_loan'
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          Home Loans
        </button>
        
        <button
          onClick={() => {
            handleFilterChange('maxInterestRate', 12);
            handleFilterChange('sortBy', 'interestRate');
          }}
          className="px-3 py-1 text-xs rounded-full border bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
        >
          Low Interest (&lt; 12%)
        </button>
        
        <button
          onClick={() => {
            handleFilterChange('minAmount', 1000000);
            handleFilterChange('sortBy', 'maxAmount');
          }}
          className="px-3 py-1 text-xs rounded-full border bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
        >
          High Amount (&gt; ₹10L)
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          
          {filters.loanType && filters.loanType !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              {loanTypes.find(t => t.value === filters.loanType)?.label}
              <button
                onClick={() => handleFilterChange('loanType', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.minAmount && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Min: ₹{filters.minAmount.toLocaleString('en-IN')}
              <button
                onClick={() => handleFilterChange('minAmount', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.maxAmount && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Max: ₹{filters.maxAmount.toLocaleString('en-IN')}
              <button
                onClick={() => handleFilterChange('maxAmount', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.minInterestRate && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Min Rate: {filters.minInterestRate}%
              <button
                onClick={() => handleFilterChange('minInterestRate', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.maxInterestRate && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Max Rate: {filters.maxInterestRate}%
              <button
                onClick={() => handleFilterChange('maxInterestRate', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanFilters;