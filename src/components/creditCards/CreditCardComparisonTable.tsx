'use client';

import React from 'react';
import { CreditCardComparisonTableProps } from '@/types/creditCards';
import creditCardService from '@/lib/services/creditCardService';

const CreditCardComparisonTable: React.FC<CreditCardComparisonTableProps> = ({
  products,
  partners,
  onRemoveProduct,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No credit cards selected for comparison</p>
      </div>
    );
  }

  const getPartner = (partnerId: string) => {
    return partners.find(p => p._id.toString() === partnerId.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Credit Card Comparison ({products.length} cards)
        </h3>
        <button
          onClick={() => products.forEach(p => onRemoveProduct(p._id.toString()))}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All
        </button>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        {products.map((product) => {
          const partner = getPartner(product.partnerId.toString());
          const annualFee = creditCardService.getAnnualFee(product);
          const joiningFee = creditCardService.getJoiningFee(product);
          const rewardRate = creditCardService.getRewardRate(product);
          const cashbackRate = creditCardService.getCashbackRate(product);

          return (
            <div key={product._id.toString()} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={partner?.logoUrl}
                    alt={partner?.name}
                    className="w-10 h-10 object-contain rounded"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{partner?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveProduct(product._id.toString())}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Fee:</span>
                  <span className="font-medium">
                    {annualFee.amount === 0 ? 'FREE' : creditCardService.formatCurrency(annualFee.amount)}
                  </span>
                </div>
                
                {joiningFee.amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joining Fee:</span>
                    <span className="font-medium">{creditCardService.formatCurrency(joiningFee.amount)}</span>
                  </div>
                )}
                
                {rewardRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reward Rate:</span>
                    <span className="font-medium text-primary-600">{rewardRate}%</span>
                  </div>
                )}
                
                {cashbackRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cashback Rate:</span>
                    <span className="font-medium text-green-600">{cashbackRate}%</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-medium">{product.processingTime}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Card Type:</span>
                  <span className="font-medium">{creditCardService.getCardTypeLabel(product.cardType)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-medium">{creditCardService.getCardNetworkLabel(product.cardNetwork)}</span>
                </div>
              </div>

              <button
                onClick={() => window.open(product.applicationUrl, '_blank')}
                className="w-full mt-4 btn-primary"
              >
                Apply Now
              </button>
            </div>
          );
        })}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900 w-48">Credit Card</th>
              {products.map((product) => (
                <th key={product._id.toString()} className="text-center py-3 px-4 min-w-48">
                  <div className="flex flex-col items-center">
                    <div className="flex justify-between items-start w-full mb-2">
                      <div className="flex-1" />
                      <button
                        onClick={() => onRemoveProduct(product._id.toString())}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <img
                      src={getPartner(product.partnerId.toString())?.logoUrl}
                      alt={getPartner(product.partnerId.toString())?.name}
                      className="w-12 h-12 object-contain rounded mb-2"
                    />
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                      <p className="text-xs text-gray-600">{getPartner(product.partnerId.toString())?.name}</p>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Annual Fee */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Annual Fee</td>
              {products.map((product) => {
                const annualFee = creditCardService.getAnnualFee(product);
                return (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`font-semibold ${annualFee.amount === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {annualFee.amount === 0 ? 'FREE' : creditCardService.formatCurrency(annualFee.amount)}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Joining Fee */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Joining Fee</td>
              {products.map((product) => {
                const joiningFee = creditCardService.getJoiningFee(product);
                return (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className="font-medium text-gray-900">
                      {joiningFee.amount === 0 ? 'FREE' : creditCardService.formatCurrency(joiningFee.amount)}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Reward Rate */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Reward Rate</td>
              {products.map((product) => {
                const rewardRate = creditCardService.getRewardRate(product);
                return (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`font-medium ${rewardRate > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                      {rewardRate > 0 ? `${rewardRate}%` : 'N/A'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Cashback Rate */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Cashback Rate</td>
              {products.map((product) => {
                const cashbackRate = creditCardService.getCashbackRate(product);
                return (
                  <td key={product._id.toString()} className="py-3 px-4 text-center">
                    <span className={`font-medium ${cashbackRate > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {cashbackRate > 0 ? `${cashbackRate}%` : 'N/A'}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Card Type */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Card Type</td>
              {products.map((product) => (
                <td key={product._id.toString()} className="py-3 px-4 text-center">
                  <span className="font-medium text-gray-900">
                    {creditCardService.getCardTypeLabel(product.cardType)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Card Network */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Network</td>
              {products.map((product) => (
                <td key={product._id.toString()} className="py-3 px-4 text-center">
                  <span className="font-medium text-gray-900">
                    {creditCardService.getCardNetworkLabel(product.cardNetwork)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Processing Time */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Processing Time</td>
              {products.map((product) => (
                <td key={product._id.toString()} className="py-3 px-4 text-center">
                  <span className="font-medium text-gray-900">{product.processingTime}</span>
                </td>
              ))}
            </tr>

            {/* Welcome Bonus */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Welcome Bonus</td>
              {products.map((product) => (
                <td key={product._id.toString()} className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-600">
                    {product.welcomeBonus || 'None'}
                  </span>
                </td>
              ))}
            </tr>

            {/* Key Features */}
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-700">Key Features</td>
              {products.map((product) => (
                <td key={product._id.toString()} className="py-3 px-4">
                  <ul className="text-xs text-gray-600 space-y-1">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{feature.name}</span>
                      </li>
                    ))}
                    {product.features.length > 3 && (
                      <li className="text-primary-600">+{product.features.length - 3} more</li>
                    )}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Apply Button */}
            <tr>
              <td className="py-4 px-4"></td>
              {products.map((product) => (
                <td key={product._id.toString()} className="py-4 px-4 text-center">
                  <button
                    onClick={() => window.open(product.applicationUrl, '_blank')}
                    className="btn-primary w-full"
                  >
                    Apply Now
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreditCardComparisonTable;