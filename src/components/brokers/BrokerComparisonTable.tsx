'use client';

import React, { useState } from 'react';
import { BrokerComparisonTableProps } from '@/types/brokers';
import brokerService from '@/lib/services/brokerService';

const BrokerComparisonTable: React.FC<BrokerComparisonTableProps> = ({
  products,
  partners,
  onRemoveProduct
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'charges' | 'features' | 'platforms'>('overview');

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Select brokers to compare</p>
      </div>
    );
  }

  const partnerMap = partners.reduce((acc, partner) => {
    acc[partner._id.toString()] = partner;
    return acc;
  }, {} as Record<string, any>);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'charges', label: 'Charges', icon: '💰' },
    { id: 'features', label: 'Features', icon: '⚡' },
    { id: 'platforms', label: 'Platforms', icon: '💻' },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900 w-32">Broker</td>
                {products.map((product) => {
                  const partner = partnerMap[product.partnerId.toString()];
                  return (
                    <td key={product._id.toString()} className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={partner?.logoUrl}
                          alt={partner?.name}
                          className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">{partner?.name}</div>
                        </div>
                        <button
                          onClick={() => onRemoveProduct(product._id.toString())}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Rating</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-yellow-500">{brokerService.getRatingStars(product.rating)}</span>
                      <span className="text-sm text-gray-600">({product.userReviews} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">SEBI Registration</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-sm">{product.sebiRegistration.number}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.sebiRegistration.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.sebiRegistration.isActive ? 'Active' : 'Expired'}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Account Types</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {product.accountTypes.map((type) => (
                        <span key={type} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {brokerService.getAccountTypeLabel(type)}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderChargesTab = () => (
    <div className="space-y-6">
      {/* Account Charges */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Account Charges</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900 w-32">Account Opening</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`font-semibold ${
                      product.accountCharges.opening === 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {product.accountCharges.opening === 0 
                        ? 'FREE' 
                        : brokerService.formatCurrency(product.accountCharges.opening)
                      }
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Annual Maintenance</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatCurrency(product.accountCharges.maintenance)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Demat Charges</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatCurrency(product.accountCharges.demat)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Brokerage Charges */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Brokerage Charges</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900 w-32">Equity Delivery</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatBrokerage(product.brokerage.equity.delivery, product.brokerage.equity.isPercentage)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Equity Intraday</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatBrokerage(product.brokerage.equity.intraday, product.brokerage.equity.isPercentage)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Futures</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatBrokerage(product.brokerage.derivatives.futures, product.brokerage.derivatives.isPercentage)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Options</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatBrokerage(product.brokerage.derivatives.options, product.brokerage.derivatives.isPercentage)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Currency</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatBrokerage(product.brokerage.currency.rate, product.brokerage.currency.isPercentage)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Commodity</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {brokerService.formatBrokerage(product.brokerage.commodity.rate, product.brokerage.commodity.isPercentage)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Key Features</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900 w-32">Research Reports</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.researchReports ? 'text-green-500' : 'text-red-500'}`}>
                      {product.researchReports ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Margin Trading</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.marginFunding ? 'text-green-500' : 'text-red-500'}`}>
                      {product.marginFunding ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">IPO Access</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.ipoAccess ? 'text-green-500' : 'text-red-500'}`}>
                      {product.ipoAccess ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Mutual Funds</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.mutualFunds ? 'text-green-500' : 'text-red-500'}`}>
                      {product.mutualFunds ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Bond Investment</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.bonds ? 'text-green-500' : 'text-red-500'}`}>
                      {product.bonds ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlatformsTab = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Trading Platforms</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900 w-32">Web Platform</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.platforms.web ? 'text-green-500' : 'text-red-500'}`}>
                      {product.platforms.web ? '🌐 ✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Mobile App</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.platforms.mobile ? 'text-green-500' : 'text-red-500'}`}>
                      {product.platforms.mobile ? '📱 ✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">Desktop Software</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.platforms.desktop ? 'text-green-500' : 'text-red-500'}`}>
                      {product.platforms.desktop ? '💻 ✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 text-sm font-medium text-gray-900">API Access</td>
                {products.map((product) => (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`text-lg ${product.platforms.api ? 'text-green-500' : 'text-red-500'}`}>
                      {product.platforms.api ? '⚡ ✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Compare Brokers ({products.length})
        </h3>
        <button
          onClick={() => products.forEach(p => onRemoveProduct(p._id.toString()))}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Clear All
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white">
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'charges' && renderChargesTab()}
        {selectedTab === 'features' && renderFeaturesTab()}
        {selectedTab === 'platforms' && renderPlatformsTab()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
        {products.map((product) => {
          const partner = partnerMap[product.partnerId.toString()];
          return (
            <button
              key={product._id.toString()}
              onClick={() => window.open(product.applicationUrl, '_blank')}
              className="btn-primary"
            >
              Open Account with {partner?.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BrokerComparisonTable;