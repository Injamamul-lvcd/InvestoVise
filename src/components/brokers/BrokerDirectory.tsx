'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BrokerProduct, BrokerFilters, BrokerDirectoryProps, BrokerRecommendation } from '@/types/brokers';
import { IAffiliatePartner } from '@/types/database';
import brokerService from '@/lib/services/brokerService';
import BrokerFilters from './BrokerFilters';
import BrokerCard from './BrokerCard';
import BrokerComparisonTable from './BrokerComparisonTable';
import BrokerRecommendationEngine from './BrokerRecommendationEngine';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const BrokerDirectory: React.FC<BrokerDirectoryProps> = ({
  initialFilters = {},
  maxComparisons = 3,
  showRecommendationEngine = true,
  onProductSelect,
  layout = 'grid'
}) => {
  const [products, setProducts] = useState<BrokerProduct[]>([]);
  const [partners, setPartners] = useState<IAffiliatePartner[]>([]);
  const [filters, setFilters] = useState<BrokerFilters>(initialFilters);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<BrokerRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<'grid' | 'list'>(layout);

  // Fetch brokers based on filters
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await brokerService.getBrokers(filters);
        setProducts(data.products);
        setPartners(data.partners);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch brokers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrokers();
  }, [filters]);

  // Create partner lookup map
  const partnerMap = useMemo(() => {
    return partners.reduce((acc, partner) => {
      acc[partner._id.toString()] = partner;
      return acc;
    }, {} as Record<string, IAffiliatePartner>);
  }, [partners]);

  // Filter statistics for the filters component
  const filterStats = useMemo(() => {
    const accountTypes = products.reduce((acc, product) => {
      product.accountTypes.forEach(type => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const platforms = products.reduce((acc, product) => {
      Object.entries(product.platforms).forEach(([platform, available]) => {
        if (available) {
          acc[platform] = (acc[platform] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const brokerageRates = products.map(p => p.brokerage.equity.delivery).filter(Boolean) as number[];
    const charges = products.map(p => p.accountCharges.maintenance + p.accountCharges.demat).filter(Boolean) as number[];

    return {
      accountTypes: Object.entries(accountTypes).map(([value, count]) => ({
        value,
        label: brokerService.getAccountTypeLabel(value),
        count,
      })),
      platforms: Object.entries(platforms).map(([value, count]) => ({
        value,
        label: brokerService.getPlatformLabel(value),
        count,
      })),
      brokerageRanges: {
        min: brokerageRates.length > 0 ? Math.min(...brokerageRates) : 0,
        max: brokerageRates.length > 0 ? Math.max(...brokerageRates) : 2,
      },
      chargesRanges: {
        min: charges.length > 0 ? Math.min(...charges) : 0,
        max: charges.length > 0 ? Math.max(...charges) : 5000,
      },
    };
  }, [products]);

  const handleFiltersChange = (newFilters: BrokerFilters) => {
    setFilters(newFilters);
    setSelectedProducts([]); // Clear selections when filters change
  };

  const handleProductSelect = (product: BrokerProduct) => {
    if (selectedProducts.includes(product._id.toString())) {
      setSelectedProducts(prev => prev.filter(id => id !== product._id.toString()));
    } else if (selectedProducts.length < maxComparisons) {
      setSelectedProducts(prev => [...prev, product._id.toString()]);
    }
    onProductSelect?.(product);
  };

  const handleRecommendationGenerated = (newRecommendations: BrokerRecommendation[]) => {
    setRecommendations(newRecommendations);
    setShowRecommendations(false); // Hide the form after generating
  };

  const getRecommendation = (productId: string): BrokerRecommendation | undefined => {
    return recommendations.find(rec => rec.productId === productId);
  };

  const selectedProductsData = useMemo(() => {
    return products.filter(product => selectedProducts.includes(product._id.toString()));
  }, [products, selectedProducts]);

  // Sort products by recommendations if available
  const sortedProducts = useMemo(() => {
    if (recommendations.length === 0) return products;
    
    return [...products].sort((a, b) => {
      const aRec = getRecommendation(a._id.toString());
      const bRec = getRecommendation(b._id.toString());
      
      if (aRec && bRec) return bRec.score - aRec.score;
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return 0;
    });
  }, [products, recommendations]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Broker Comparison</h1>
          <p className="text-gray-600 mt-1">
            Compare SEBI-registered brokers and find the best trading platform for your needs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setCurrentLayout('grid')}
              className={`px-3 py-2 text-sm ${
                currentLayout === 'grid' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setCurrentLayout('list')}
              className={`px-3 py-2 text-sm ${
                currentLayout === 'list' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>

          {showRecommendationEngine && (
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className={`btn-secondary ${showRecommendations ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              Get Recommendations
            </button>
          )}
          
          {selectedProducts.length > 1 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`btn-primary ${showComparison ? 'bg-primary-700' : ''}`}
            >
              Compare ({selectedProducts.length})
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Engine */}
      {showRecommendations && showRecommendationEngine && (
        <div className="card">
          <BrokerRecommendationEngine
            products={products}
            onRecommendationGenerated={handleRecommendationGenerated}
          />
        </div>
      )}

      {/* Recommendation Results Banner */}
      {recommendations.length > 0 && !showRecommendations && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-900">Personalized Recommendations Ready!</h3>
              <p className="text-sm text-blue-700">
                Brokers are now sorted by your preferences. Top matches are shown first.
              </p>
            </div>
            <button
              onClick={() => setRecommendations([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <BrokerFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          accountTypes={filterStats.accountTypes}
          platforms={filterStats.platforms}
          brokerageRanges={filterStats.brokerageRanges}
          chargesRanges={filterStats.chargesRanges}
        />
      </div>

      {/* Comparison Table */}
      {showComparison && selectedProducts.length > 1 && (
        <div className="card">
          <BrokerComparisonTable
            products={selectedProductsData}
            partners={selectedProductsData.map(p => partnerMap[p.partnerId.toString()])}
            onRemoveProduct={(productId) => 
              setSelectedProducts(prev => prev.filter(id => id !== productId))
            }
          />
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {sortedProducts.length} Broker{sortedProducts.length !== 1 ? 's' : ''} Found
            {recommendations.length > 0 && (
              <span className="text-sm font-normal text-blue-600 ml-2">
                (Sorted by your preferences)
              </span>
            )}
          </h2>
          
          {selectedProducts.length > 0 && (
            <button
              onClick={() => setSelectedProducts([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
          )}
        </div>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brokers found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className={
            currentLayout === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {sortedProducts.map((product) => (
              <BrokerCard
                key={product._id.toString()}
                product={product}
                partner={partnerMap[product.partnerId.toString()]}
                isSelected={selectedProducts.includes(product._id.toString())}
                isComparing={selectedProducts.length > 0}
                recommendation={getRecommendation(product._id.toString())}
                onSelect={handleProductSelect}
                onCompare={handleProductSelect}
                layout={currentLayout === 'list' ? 'compact' : 'card'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load More / Pagination could be added here */}
      {sortedProducts.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Showing {sortedProducts.length} brokers
          </p>
        </div>
      )}
    </div>
  );
};

export default BrokerDirectory;