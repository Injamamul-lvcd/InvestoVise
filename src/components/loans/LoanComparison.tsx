'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LoanProduct, LoanFilters, LoanComparisonProps, EligibilityCheck, EligibilityResult } from '@/types/loans';
import { IAffiliatePartner } from '@/types/database';
import loanService from '@/lib/services/loanService';
import LoanFilters from './LoanFilters';
import LoanCard from './LoanCard';
import LoanComparisonTable from './LoanComparisonTable';
import EligibilityChecker from './EligibilityChecker';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const LoanComparison: React.FC<LoanComparisonProps> = ({
  initialFilters = {},
  maxComparisons = 3,
  showEligibilityChecker = true,
  onProductSelect,
}) => {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [partners, setPartners] = useState<IAffiliatePartner[]>([]);
  const [filters, setFilters] = useState<LoanFilters>(initialFilters);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showEligibility, setShowEligibility] = useState(false);

  // Fetch loans based on filters
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await loanService.getLoans(filters);
        setProducts(data.products);
        setPartners(data.partners);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch loans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
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
    const loanTypes = products.reduce((acc, product) => {
      const type = product.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const amounts = products.map(p => [p.minAmount, p.maxAmount]).flat().filter(Boolean) as number[];
    const interestRates = products.map(p => p.interestRate).filter(Boolean) as number[];

    return {
      loanTypes: Object.entries(loanTypes).map(([value, count]) => ({
        value,
        label: loanService.getLoanTypeLabel(value),
        count,
      })),
      priceRanges: {
        min: amounts.length > 0 ? Math.min(...amounts) : 0,
        max: amounts.length > 0 ? Math.max(...amounts) : 0,
      },
      interestRateRanges: {
        min: interestRates.length > 0 ? Math.min(...interestRates) : 0,
        max: interestRates.length > 0 ? Math.max(...interestRates) : 0,
      },
    };
  }, [products]);

  const handleFiltersChange = (newFilters: LoanFilters) => {
    setFilters(newFilters);
    setSelectedProducts([]); // Clear selections when filters change
  };

  const handleProductSelect = (product: LoanProduct) => {
    if (selectedProducts.includes(product._id.toString())) {
      setSelectedProducts(prev => prev.filter(id => id !== product._id.toString()));
    } else if (selectedProducts.length < maxComparisons) {
      setSelectedProducts(prev => [...prev, product._id.toString()]);
    }
    onProductSelect?.(product);
  };

  const handleEligibilityCheck = async (criteria: EligibilityCheck) => {
    try {
      const results = await loanService.checkEligibility(criteria, products.map(p => p._id.toString()));
      setEligibilityResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check eligibility');
    }
  };

  const getEligibilityResult = (productId: string): EligibilityResult | undefined => {
    return eligibilityResults.find(result => result.productId === productId);
  };

  const selectedProductsData = useMemo(() => {
    return products.filter(product => selectedProducts.includes(product._id.toString()));
  }, [products, selectedProducts]);

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
          <h1 className="text-3xl font-bold text-gray-900">Loan Comparison</h1>
          <p className="text-gray-600 mt-1">
            Compare loans from top Indian lenders and find the best rates
          </p>
        </div>
        
        <div className="flex gap-2">
          {showEligibilityChecker && (
            <button
              onClick={() => setShowEligibility(!showEligibility)}
              className={`btn-secondary ${showEligibility ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              Check Eligibility
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

      {/* Eligibility Checker */}
      {showEligibility && showEligibilityChecker && (
        <div className="card">
          <EligibilityChecker
            products={products}
            onEligibilityCheck={handleEligibilityCheck}
          />
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <LoanFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loanTypes={filterStats.loanTypes}
          priceRanges={filterStats.priceRanges}
          interestRateRanges={filterStats.interestRateRanges}
        />
      </div>

      {/* Comparison Table */}
      {showComparison && selectedProducts.length > 1 && (
        <div className="card">
          <LoanComparisonTable
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
            {products.length} Loan{products.length !== 1 ? 's' : ''} Found
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

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <LoanCard
                key={product._id.toString()}
                product={product}
                partner={partnerMap[product.partnerId.toString()]}
                isSelected={selectedProducts.includes(product._id.toString())}
                isComparing={selectedProducts.length > 0}
                eligibilityResult={getEligibilityResult(product._id.toString())}
                onSelect={handleProductSelect}
                onCompare={handleProductSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanComparison;