'use client';

import React, { useState } from 'react';
import { BrokerFiltersProps, BrokerFilters } from '@/types/brokers';
import brokerService from '@/lib/services/brokerService';

const BrokerFiltersComponent: React.FC<BrokerFiltersProps> = ({
  filters,
  onFiltersChange,
  accountTypes,
  platforms,
  brokerageRanges,
  chargesRanges
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<BrokerFilters>(filters);

  const handleFilterChange = (key: keyof BrokerFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterChange = (key: keyof BrokerFilters, value: string, checked: boolean) => {
    const currentArray = (localFilters[key] as string[]) || [];
    let newArray: string[];
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilters = () => {
    const clearedFilters: BrokerFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== null && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">Filter Brokers</h3>
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {isExpanded ? 'Show Less' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={localFilters.sortBy || ''}
          onChange={(e) => handleFilterChange('sortBy', e.target.value || undefined)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Sort By</option>
          <option value="brokerage">Lowest Brokerage</option>
          <option value="charges">Lowest Charges</option>
          <option value="rating">Highest Rating</option>
          <option value="popularity">Most Popular</option>
        </select>

        <select
          value={localFilters.maxBrokerageEquity || ''}
          onChange={(e) => handleFilterChange('maxBrokerageEquity', e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Max Equity Brokerage</option>
          <option value="0">Free</option>
          <option value="0.1">Up to 0.1%</option>
          <option value="0.25">Up to 0.25%</option>
          <option value="0.5">Up to 0.5%</option>
          <option value="1">Up to 1%</option>
        </select>

        <select
          value={localFilters.maxAccountOpening || ''}
          onChange={(e) => handleFilterChange('maxAccountOpening', e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Account Opening Fee</option>
          <option value="0">Free</option>
          <option value="500">Up to ₹500</option>
          <option value="1000">Up to ₹1,000</option>
          <option value="2000">Up to ₹2,000</option>
        </select>

        <select
          value={localFilters.minRating || ''}
          onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Minimum Rating</option>
          <option value="3">3+ Stars</option>
          <option value="3.5">3.5+ Stars</option>
          <option value="4">4+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
        </select>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
          {/* Account Types */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Account Types</h4>
            <div className="space-y-2">
              {accountTypes.map(({ value, label, count }) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(localFilters.accountTypes || []).includes(value)}
                    onChange={(e) => handleArrayFilterChange('accountTypes', value, e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="flex-1">{label}</span>
                  <span className="text-gray-500">({count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Trading Platforms</h4>
            <div className="space-y-2">
              {platforms.map(({ value, label, count }) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(localFilters.platforms || []).includes(value)}
                    onChange={(e) => handleArrayFilterChange('platforms', value, e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="flex-1">{label}</span>
                  <span className="text-gray-500">({count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Features</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.hasResearchReports || false}
                  onChange={(e) => handleFilterChange('hasResearchReports', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Research Reports</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.hasMarginFunding || false}
                  onChange={(e) => handleFilterChange('hasMarginFunding', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Margin Trading</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.hasIpoAccess || false}
                  onChange={(e) => handleFilterChange('hasIpoAccess', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>IPO Access</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.hasMutualFunds || false}
                  onChange={(e) => handleFilterChange('hasMutualFunds', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Mutual Funds</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.hasBonds || false}
                  onChange={(e) => handleFilterChange('hasBonds', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Bond Investment</span>
              </label>
            </div>
          </div>

          {/* Annual Charges Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Annual Charges
              {localFilters.maxAnnualCharges && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Up to {brokerService.formatCurrency(localFilters.maxAnnualCharges)})
                </span>
              )}
            </h4>
            <input
              type="range"
              min={chargesRanges.min}
              max={chargesRanges.max}
              step="100"
              value={localFilters.maxAnnualCharges || chargesRanges.max}
              onChange={(e) => handleFilterChange('maxAnnualCharges', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{brokerService.formatCurrency(chargesRanges.min)}</span>
              <span>{brokerService.formatCurrency(chargesRanges.max)}</span>
            </div>
          </div>

          {/* Brokerage Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Max Equity Brokerage
              {localFilters.maxBrokerageEquity && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Up to {localFilters.maxBrokerageEquity}%)
                </span>
              )}
            </h4>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localFilters.maxBrokerageEquity || 2}
              onChange={(e) => handleFilterChange('maxBrokerageEquity', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>2%</span>
            </div>
          </div>

          {/* Partner Selection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Specific Broker</h4>
            <select
              value={localFilters.partnerId || ''}
              onChange={(e) => handleFilterChange('partnerId', e.target.value || undefined)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Brokers</option>
              {/* This would be populated with actual partner data */}
              <option value="zerodha">Zerodha</option>
              <option value="upstox">Upstox</option>
              <option value="angelone">Angel One</option>
              <option value="groww">Groww</option>
              <option value="icicidirect">ICICI Direct</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {localFilters.sortBy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Sort: {localFilters.sortBy}
              <button
                onClick={() => handleFilterChange('sortBy', undefined)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.maxBrokerageEquity && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Brokerage ≤ {localFilters.maxBrokerageEquity}%
              <button
                onClick={() => handleFilterChange('maxBrokerageEquity', undefined)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.maxAccountOpening && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Opening ≤ {brokerService.formatCurrency(localFilters.maxAccountOpening)}
              <button
                onClick={() => handleFilterChange('maxAccountOpening', undefined)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.minRating && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
              Rating ≥ {localFilters.minRating}★
              <button
                onClick={() => handleFilterChange('minRating', undefined)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          )}
          
          {(localFilters.accountTypes || []).map(type => (
            <span key={type} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {brokerService.getAccountTypeLabel(type)}
              <button
                onClick={() => handleArrayFilterChange('accountTypes', type, false)}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerFiltersComponent;