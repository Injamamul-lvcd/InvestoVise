'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MarketIndex } from '../types/marketData';

interface LiveMarketTickerProps {
  refreshInterval?: number; // in milliseconds
  className?: string;
  showStatus?: boolean;
}

interface TickerState {
  indices: MarketIndex[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const LiveMarketTicker: React.FC<LiveMarketTickerProps> = ({
  refreshInterval = 60000, // 1 minute default
  className = '',
  showStatus = true
}) => {
  const [state, setState] = useState<TickerState>({
    indices: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchMarketData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/market-data/indices');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setState({
        indices: data.indices || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market data'
      }));
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchMarketData();

    // Set up interval for periodic updates
    const interval = setInterval(fetchMarketData, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchMarketData, refreshInterval]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatChange = (change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatNumber(change)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMarketStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'text-green-600';
      case 'closed': return 'text-red-600';
      case 'pre_market': return 'text-yellow-600';
      case 'after_hours': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getMarketStatusText = (status: string): string => {
    switch (status) {
      case 'open': return 'Market Open';
      case 'closed': return 'Market Closed';
      case 'pre_market': return 'Pre-Market';
      case 'after_hours': return 'After Hours';
      default: return 'Unknown';
    }
  };

  if (state.loading && state.indices.length === 0) {
    return (
      <div className={`bg-white border-b shadow-sm ${className}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (state.error && state.indices.length === 0) {
    return (
      <div className={`bg-red-50 border-b border-red-200 ${className}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2 text-red-800">Market data unavailable</span>
            </div>
            <button
              onClick={fetchMarketData}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-b shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Market Indices */}
          <div className="flex flex-wrap items-center gap-6 mb-2 lg:mb-0">
            {state.indices.map((index) => (
              <div key={index.symbol} className="flex items-center space-x-2">
                <div className="font-semibold text-gray-900">
                  {index.name}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatNumber(index.value)}
                </div>
                <div className={`text-sm font-medium ${getChangeColor(index.change)}`}>
                  {formatChange(index.change, index.changePercent)}
                </div>
              </div>
            ))}
          </div>

          {/* Status and Last Updated */}
          {showStatus && (
            <div className="flex items-center space-x-4 text-sm">
              {state.indices.length > 0 && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    state.indices[0].marketStatus === 'open' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={getMarketStatusColor(state.indices[0].marketStatus)}>
                    {getMarketStatusText(state.indices[0].marketStatus)}
                  </span>
                </div>
              )}
              
              {state.lastUpdated && (
                <div className="text-gray-500">
                  Updated: {state.lastUpdated.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              
              {state.loading && (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  <span className="text-blue-600">Updating...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message (if data exists but there's an error) */}
        {state.error && state.indices.length > 0 && (
          <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded">
            Warning: {state.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMarketTicker;