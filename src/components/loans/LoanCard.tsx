'use client';

import React, { useState } from 'react';
import { LoanCardProps } from '@/types/loans';
import loanService from '@/lib/services/loanService';
import EMICalculator from './EMICalculator';

const LoanCard: React.FC<LoanCardProps> = ({
  product,
  partner,
  isSelected = false,
  isComparing = false,
  eligibilityResult,
  onSelect,
  onCompare,
  onApply,
}) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const processingFee = loanService.getProcessingFee(product);
  
  const handleApply = async () => {
    if (onApply) {
      onApply(product);
      return;
    }

    try {
      setIsApplying(true);
      const { trackingUrl } = await loanService.generateAffiliateLink(product._id.toString());
      
      // Track the application
      await loanService.trackApplication({
        productId: product._id.toString(),
        amount: product.minAmount || 0,
        tenure: 12, // Default tenure
        status: 'initiated',
        redirectUrl: trackingUrl,
      });

      // Redirect to partner application page
      window.open(trackingUrl, '_blank');
    } catch (error) {
      console.error('Failed to apply for loan:', error);
      // Fallback to direct application URL
      window.open(product.applicationUrl, '_blank');
    } finally {
      setIsApplying(false);
    }
  };

  const getEligibilityBadge = () => {
    if (!eligibilityResult) return null;

    const { eligible, score } = eligibilityResult;
    
    if (eligible) {
      return (
        <div className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
          ✓ Eligible ({score}% match)
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
          ✗ Not Eligible
        </div>
      );
    }
  };

  return (
    <div className={`card relative transition-all duration-200 ${
      isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-lg'
    }`}>
      {/* Selection Checkbox */}
      {isComparing && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(product)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Partner Logo and Name */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={partner?.logoUrl}
          alt={partner?.name}
          className="w-12 h-12 object-contain rounded-lg border border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-logo.png';
          }}
        />
        <div>
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">{partner?.name}</p>
        </div>
      </div>

      {/* Eligibility Badge */}
      {eligibilityResult && (
        <div className="mb-3">
          {getEligibilityBadge()}
        </div>
      )}

      {/* Key Features */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Interest Rate</span>
          <span className="font-semibold text-lg text-primary-600">
            {loanService.formatPercentage(product.interestRate)} p.a.
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Loan Amount</span>
          <span className="font-medium text-gray-900">
            {product.minAmount && product.maxAmount
              ? `₹${(product.minAmount / 100000).toFixed(0)}L - ₹${(product.maxAmount / 100000).toFixed(0)}L`
              : 'Contact for details'
            }
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Processing Fee</span>
          <span className="font-medium text-gray-900">
            {processingFee.isPercentage
              ? `${processingFee.amount}%`
              : loanService.formatCurrency(processingFee.amount)
            }
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Processing Time</span>
          <span className="font-medium text-gray-900">{product.processingTime}</span>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features</h4>
        <ul className="space-y-1">
          {product.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{feature.name}: {feature.value}</span>
            </li>
          ))}
          {product.features.length > 3 && (
            <li className="text-sm text-primary-600 cursor-pointer hover:text-primary-700">
              +{product.features.length - 3} more features
            </li>
          )}
        </ul>
      </div>

      {/* Eligibility Requirements */}
      {eligibilityResult && !eligibilityResult.eligible && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <h4 className="text-sm font-medium text-red-900 mb-1">Requirements not met:</h4>
          <ul className="space-y-1">
            {eligibilityResult.reasons.slice(0, 2).map((reason, index) => (
              <li key={index} className="text-xs text-red-700">• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* EMI Calculator Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showCalculator ? 'Hide' : 'Show'} EMI Calculator
        </button>
      </div>

      {/* EMI Calculator */}
      {showCalculator && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <EMICalculator product={product} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={isApplying}
          className={`flex-1 btn-primary ${
            isApplying ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isApplying ? 'Applying...' : 'Apply Now'}
        </button>
        
        {isComparing && (
          <button
            onClick={() => onCompare?.(product)}
            className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary-100 text-primary-700 border-primary-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isSelected ? 'Selected' : 'Compare'}
          </button>
        )}
      </div>

      {/* Loan Type Badge */}
      <div className="absolute top-4 left-4">
        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
          {loanService.getLoanTypeLabel(product.type)}
        </span>
      </div>

      {/* Popular Badge */}
      {product.priority > 80 && (
        <div className="absolute -top-2 -right-2">
          <span className="inline-flex items-center px-2 py-1 text-xs bg-accent-500 text-white rounded-full">
            Popular
          </span>
        </div>
      )}
    </div>
  );
};

export default LoanCard;