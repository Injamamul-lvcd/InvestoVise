'use client';

import React, { useState } from 'react';
import { CreditCardProps } from '@/types/creditCards';
import creditCardService from '@/lib/services/creditCardService';

const CreditCard: React.FC<CreditCardProps> = ({
  product,
  partner,
  isSelected = false,
  isComparing = false,
  recommendation,
  onSelect,
  onCompare,
  onApply,
  layout = 'card'
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const annualFee = creditCardService.getAnnualFee(product);
  const joiningFee = creditCardService.getJoiningFee(product);
  const rewardRate = creditCardService.getRewardRate(product);
  const cashbackRate = creditCardService.getCashbackRate(product);
  
  const handleApply = async () => {
    if (onApply) {
      onApply(product);
      return;
    }

    try {
      setIsApplying(true);
      const { trackingUrl } = await creditCardService.generateAffiliateLink(product._id.toString());
      
      // Track the application
      await creditCardService.trackApplication(trackingId, {
        productId: product._id.toString(),
        status: 'initiated',
        redirectUrl: trackingUrl,
      });

      // Redirect to partner application page
      window.open(trackingUrl, '_blank');
    } catch (error) {
      console.error('Failed to apply for credit card:', error);
      // Fallback to direct application URL
      window.open(product.applicationUrl, '_blank');
    } finally {
      setIsApplying(false);
    }
  };

  const getRecommendationBadge = () => {
    if (!recommendation) return null;

    const categoryLabels = {
      'best_overall': 'Best Overall',
      'best_rewards': 'Best Rewards',
      'best_cashback': 'Best Cashback',
      'best_premium': 'Best Premium',
      'best_beginner': 'Best for Beginners'
    };

    return (
      <div className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
        ⭐ {categoryLabels[recommendation.category]} ({recommendation.score}% match)
      </div>
    );
  };

  const getCardNetworkIcon = (network: string) => {
    const icons = {
      'visa': '💳',
      'mastercard': '💳',
      'rupay': '💳',
      'amex': '💳'
    };
    return icons[network as keyof typeof icons] || '💳';
  };

  if (layout === 'compact') {
    return (
      <div className={`flex items-center p-4 border rounded-lg transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
      }`}>
        {/* Selection Checkbox */}
        {isComparing && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(product)}
            className="mr-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        )}

        {/* Card Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <img
              src={partner?.logoUrl}
              alt={partner?.name}
              className="w-8 h-8 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-logo.png';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600">{partner?.name}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {annualFee.amount === 0 ? 'Free' : creditCardService.formatCurrency(annualFee.amount)}
            </div>
            <div className="text-gray-600">Annual Fee</div>
          </div>
          
          {rewardRate > 0 && (
            <div className="text-center">
              <div className="font-semibold text-primary-600">{rewardRate}%</div>
              <div className="text-gray-600">Rewards</div>
            </div>
          )}
          
          {cashbackRate > 0 && (
            <div className="text-center">
              <div className="font-semibold text-green-600">{cashbackRate}%</div>
              <div className="text-gray-600">Cashback</div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={isApplying}
          className={`ml-4 px-4 py-2 text-sm btn-primary ${
            isApplying ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isApplying ? 'Applying...' : 'Apply'}
        </button>
      </div>
    );
  }

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

      {/* Partner Logo and Card Info */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={partner?.logoUrl}
          alt={partner?.name}
          className="w-12 h-12 object-contain rounded-lg border border-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-logo.png';
          }}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">{partner?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">
              {getCardNetworkIcon(product.cardNetwork)} {creditCardService.getCardNetworkLabel(product.cardNetwork)}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {creditCardService.getCardTypeLabel(product.cardType)}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation Badge */}
      {recommendation && (
        <div className="mb-3">
          {getRecommendationBadge()}
        </div>
      )}

      {/* Key Features */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Annual Fee</span>
          <span className={`font-semibold ${annualFee.amount === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {annualFee.amount === 0 ? 'FREE' : creditCardService.formatCurrency(annualFee.amount)}
          </span>
        </div>

        {joiningFee.amount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Joining Fee</span>
            <span className="font-medium text-gray-900">
              {creditCardService.formatCurrency(joiningFee.amount)}
            </span>
          </div>
        )}

        {rewardRate > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Reward Rate</span>
            <span className="font-semibold text-primary-600">
              {rewardRate}% on purchases
            </span>
          </div>
        )}

        {cashbackRate > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cashback Rate</span>
            <span className="font-semibold text-green-600">
              {cashbackRate}% on purchases
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Processing Time</span>
          <span className="font-medium text-gray-900">{product.processingTime}</span>
        </div>
      </div>

      {/* Welcome Bonus */}
      {product.welcomeBonus && (
        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">🎁</span>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Welcome Bonus</h4>
              <p className="text-sm text-yellow-700">{product.welcomeBonus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Benefits */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Benefits</h4>
        <ul className="space-y-1">
          {product.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{feature.name}: {feature.value}</span>
            </li>
          ))}
          {product.features.length > 3 && (
            <li 
              className="text-sm text-primary-600 cursor-pointer hover:text-primary-700"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Show less' : `+${product.features.length - 3} more benefits`}
            </li>
          )}
        </ul>
        
        {/* Additional Features */}
        {showDetails && product.features.length > 3 && (
          <ul className="space-y-1 mt-2 pt-2 border-t border-gray-100">
            {product.features.slice(3).map((feature, index) => (
              <li key={index + 3} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{feature.name}: {feature.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recommendation Reasons */}
      {recommendation && recommendation.reasons.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Why this card is recommended:</h4>
          <ul className="space-y-1">
            {recommendation.reasons.slice(0, 2).map((reason, index) => (
              <li key={index} className="text-xs text-blue-700">• {reason}</li>
            ))}
          </ul>
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

      {/* Card Type Badge */}
      <div className="absolute top-4 left-4">
        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
          {creditCardService.getCardTypeLabel(product.cardType)}
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

export default CreditCard;