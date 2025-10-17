'use client';

import React, { useState } from 'react';
import { CreditCardFilters as CreditCardFiltersType, CreditCardFiltersProps } from '@/types/creditCards';

const CreditCardFilters: React.FC<CreditCardFiltersProps> = ({
  filters,
  onFiltersChange,
  cardTypes,
  cardNetworks,
  feeRanges,
  creditLimitRanges,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof CreditCardFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== '' && value !== 'all' && value !== false
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
        {/* Card Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Type
          </label>
          <select
            value={filters.cardType || 'all'}
            onChange={(e) => handleFilterChange('cardType', e.target.value === 'all' ? undefined : e.target.value)}
            className="input-field"
          >
            <option value="all">All Types ({cardTypes.reduce((sum, type) => sum + type.count, 0)})</option>
            {cardTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.count})
              </option>
            ))}
          </select>
        </div>

        {/* Card Network Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Network
          </label>
          <select
            value={filters.cardNetwork || 'all'}
            onChange={(e) => handleFilterChange('cardNetwork', e.target.value === 'all' ? undefined : e.target.value)}
            className="input-field"
          >
            <option value="all">All Networks ({cardNetworks.reduce((sum, network) => sum + network.count, 0)})</option>
            {cardNetworks.map((network) => (
              <option key={network.value} value={network.value}>
                {network.label} ({network.count})
              </option>
            ))}
          </select>
        </div>

        {/* Annual Fee Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Annual Fee (₹)
          </label>
          <input
            type="number"
            placeholder="Enter max fee"
            value={filters.maxAnnualFee || ''}
            onChange={(e) => handleFilterChange('maxAnnualFee', e.target.value ? Number(e.target.value) : undefined)}
            className="input-field"
            min={0}
            max={feeRanges.max}
          />
          <div className="text-xs text-gray-500 mt-1">
            Range: ₹0 - ₹{feeRanges.max?.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Sort By Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'popularity'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="input-field"
          >
            <option value="popularity">Popularity</option>
            <option value="annualFee">Annual Fee</option>
            <option value="rewardRate">Reward Rate</option>
            <option value="cashbackRate">Cashback Rate</option>
            <option value="creditLimit">Credit Limit</option>
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

      {/* Feature Filters */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!isExpanded ? 'hidden md:grid' : ''}`}>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hasRewards || false}
            onChange={(e) => handleFilterChange('hasRewards', e.target.checked || undefined)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Has Rewards</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hasCashback || false}
            onChange={(e) => handleFilterChange('hasCashback', e.target.checked || undefined)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Has Cashback</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hasWelcomeBonus || false}
            onChange={(e) => handleFilterChange('hasWelcomeBonus', e.target.checked || undefined)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">Welcome Bonus</span>
        </label>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
        
        <button
          onClick={() => handleFilterChange('maxAnnualFee', 0)}
          className={`px-3 py-1 text-xs rounded-full border ${
            filters.maxAnnualFee === 0
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          Free Cards
        </button>
        
        <button
          onClick={() => {
            handleFilterChange('hasRewards', true);
            handleFilterChange('sortBy', 'rewardRate');
            handleFilterChange('sortOrder', 'desc');
          }}
          className="px-3 py-1 text-xs rounded-full border bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
        >
          Best Rewards
        </button>
        
        <button
          onClick={() => {
            handleFilterChange('hasCashback', true);
            handleFilterChange('sortBy', 'cashbackRate');
            handleFilterChange('sortOrder', 'desc');
          }}
          className="px-3 py-1 text-xs rounded-full border bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
        >
          Best Cashback
        </button>
        
        <button
          onClick={() => handleFilterChange('cardType', 'premium')}
          className={`px-3 py-1 text-xs rounded-full border ${
            filters.cardType === 'premium'
              ? 'bg-primary-100 text-primary-700 border-primary-300'
              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
          }`}
        >
          Premium Cards
        </button>
        
        <button
          onClick={() => {
            handleFilterChange('cardType', 'basic');
            handleFilterChange('maxAnnualFee', 1000);
          }}
          className="px-3 py-1 text-xs rounded-full border bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
        >
          Beginner Friendly
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Active Filters:</span>
          
          {filters.cardType && filters.cardType !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              {cardTypes.find(t => t.value === filters.cardType)?.label}
              <button
                onClick={() => handleFilterChange('cardType', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.cardNetwork && filters.cardNetwork !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              {cardNetworks.find(n => n.value === filters.cardNetwork)?.label}
              <button
                onClick={() => handleFilterChange('cardNetwork', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.maxAnnualFee !== undefined && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Max Fee: ₹{filters.maxAnnualFee.toLocaleString('en-IN')}
              <button
                onClick={() => handleFilterChange('maxAnnualFee', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.hasRewards && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Has Rewards
              <button
                onClick={() => handleFilterChange('hasRewards', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.hasCashback && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Has Cashback
              <button
                onClick={() => handleFilterChange('hasCashback', undefined)}
                className="ml-1 text-primary-500 hover:text-primary-700"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.hasWelcomeBonus && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Welcome Bonus
              <button
                onClick={() => handleFilterChange('hasWelcomeBonus', undefined)}
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

export default CreditCardFilters;