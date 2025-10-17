'use client';

import React, { useState } from 'react';
import { BrokerCardProps } from '@/types/brokers';
import brokerService from '@/lib/services/brokerService';

const BrokerCard: React.FC<BrokerCardProps> = ({
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

  const handleApply = async () => {
    if (onApply) {
      onApply(product);
      return;
    }

    try {
      setIsApplying(true);
      const { trackingUrl, trackingId } = await brokerService.generateAffiliateLink(product._id.toString());
      
      // Track the application
      await brokerService.trackApplication(trackingId, {
        productId: product._id.toString(),
        status: 'initiated',
        redirectUrl: trackingUrl,
        accountTypes: product.accountTypes,
      });

      // Redirect to partner application page
      window.open(trackingUrl, '_blank');
    } catch (error) {
      console.error('Failed to apply for broker account:', error);
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
      'best_discount': 'Best Discount',
      'best_research': 'Best Research',
      'best_beginner': 'Best for Beginners',
      'best_advanced': 'Best for Advanced'
    };

    return (
      <div className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
        ⭐ {categoryLabels[recommendation.category]} ({recommendation.score}% match)
      </div>
    );
  };

  const getSebiVerificationBadge = () => {
    if (!product.sebiRegistration.isActive) {
      return (
        <div className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
          ⚠️ SEBI Registration Expired
        </div>
      );
    }

    return (
      <div className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
        ✓ SEBI Registered
      </div>
    );
  };

  const getPlatformIcons = () => {
    const icons = {
      web: '🌐',
      mobile: '📱',
      desktop: '💻',
      api: '⚡'
    };

    return Object.entries(product.platforms)
      .filter(([_, available]) => available)
      .map(([platform, _]) => (
        <span key={platform} title={brokerService.getPlatformLabel(platform)} className="text-lg">
          {icons[platform as keyof typeof icons]}
        </span>
      ));
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

        {/* Broker Info */}
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
              <div className="flex items-center gap-2 mt-1">
                {getSebiVerificationBadge()}
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">{brokerService.getRatingStars(product.rating)}</span>
                  <span className="text-xs text-gray-500">({product.userReviews})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {brokerService.formatBrokerage(product.brokerage.equity.delivery, product.brokerage.equity.isPercentage)}
            </div>
            <div className="text-gray-600">Equity Delivery</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold text-primary-600">
              {product.accountCharges.opening === 0 ? 'Free' : brokerService.formatCurrency(product.accountCharges.opening)}
            </div>
            <div className="text-gray-600">Account Opening</div>
          </div>
          
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {brokerService.formatCurrency(product.accountCharges.maintenance)}
            </div>
            <div className="text-gray-600">Annual Charges</div>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={isApplying}
          className={`ml-4 px-4 py-2 text-sm btn-primary ${
            isApplying ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isApplying ? 'Opening...' : 'Open Account'}
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

      {/* Partner Logo and Broker Info */}
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
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">{brokerService.getRatingStars(product.rating)}</span>
              <span className="text-xs text-gray-500">({product.userReviews} reviews)</span>
            </div>
            <div className="flex gap-1">
              {getPlatformIcons()}
            </div>
          </div>
        </div>
      </div>

      {/* SEBI Registration and Recommendation */}
      <div className="flex flex-wrap gap-2 mb-4">
        {getSebiVerificationBadge()}
        {recommendation && getRecommendationBadge()}
      </div>

      {/* Account Types */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Account Types</h4>
        <div className="flex flex-wrap gap-1">
          {product.accountTypes.map((type) => (
            <span key={type} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {brokerService.getAccountTypeLabel(type)}
            </span>
          ))}
        </div>
      </div>

      {/* Brokerage Charges */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Equity Delivery</span>
          <span className="font-semibold text-gray-900">
            {brokerService.formatBrokerage(product.brokerage.equity.delivery, product.brokerage.equity.isPercentage)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Equity Intraday</span>
          <span className="font-semibold text-gray-900">
            {brokerService.formatBrokerage(product.brokerage.equity.intraday, product.brokerage.equity.isPercentage)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Account Opening</span>
          <span className={`font-semibold ${product.accountCharges.opening === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {product.accountCharges.opening === 0 ? 'FREE' : brokerService.formatCurrency(product.accountCharges.opening)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Annual Maintenance</span>
          <span className="font-medium text-gray-900">
            {brokerService.formatCurrency(product.accountCharges.maintenance)}
          </span>
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features</h4>
        <ul className="space-y-1">
          {product.researchReports && (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Research Reports & Analysis</span>
            </li>
          )}
          {product.marginFunding && (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Margin Trading Facility</span>
            </li>
          )}
          {product.ipoAccess && (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>IPO Investment Access</span>
            </li>
          )}
          {product.mutualFunds && (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Mutual Fund Investment</span>
            </li>
          )}
          {product.bonds && (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Bond Investment</span>
            </li>
          )}
          
          {product.features.length > 0 && (
            <li 
              className="text-sm text-primary-600 cursor-pointer hover:text-primary-700"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Show less' : `+${product.features.length} more features`}
            </li>
          )}
        </ul>
        
        {/* Additional Features */}
        {showDetails && product.features.length > 0 && (
          <ul className="space-y-1 mt-2 pt-2 border-t border-gray-100">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{feature.name}: {feature.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SEBI Registration Details */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">SEBI Registration</span>
          <span className="font-mono text-gray-900">{product.sebiRegistration.number}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-gray-600">Valid Until</span>
          <span className="text-gray-900">
            {new Date(product.sebiRegistration.validUntil).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>

      {/* Recommendation Reasons */}
      {recommendation && recommendation.reasons.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Why this broker is recommended:</h4>
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
          {isApplying ? 'Opening Account...' : 'Open Account'}
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

export default BrokerCard;