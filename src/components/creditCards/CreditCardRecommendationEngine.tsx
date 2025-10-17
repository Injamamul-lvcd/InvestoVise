'use client';

import React, { useState } from 'react';
import { CreditCardRecommendationEngineProps, SpendingProfile } from '@/types/creditCards';
import creditCardService from '@/lib/services/creditCardService';

const CreditCardRecommendationEngine: React.FC<CreditCardRecommendationEngineProps> = ({
  onRecommendationGenerated,
  products,
  isLoading = false,
}) => {
  const [spendingProfile, setSpendingProfile] = useState<SpendingProfile>({
    monthlySpend: 0,
    categories: {
      dining: 0,
      fuel: 0,
      groceries: 0,
      shopping: 0,
      travel: 0,
      utilities: 0,
      others: 0,
    },
    preferredBenefits: [],
    annualFeePreference: 'low',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSpendingChange = (field: keyof SpendingProfile, value: any) => {
    setSpendingProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (category: keyof SpendingProfile['categories'], value: number) => {
    setSpendingProfile(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value,
      },
    }));
  };

  const handleBenefitToggle = (benefit: string) => {
    setSpendingProfile(prev => ({
      ...prev,
      preferredBenefits: prev.preferredBenefits.includes(benefit as any)
        ? prev.preferredBenefits.filter(b => b !== benefit)
        : [...prev.preferredBenefits, benefit as any],
    }));
  };

  const generateRecommendations = async () => {
    try {
      setIsGenerating(true);
      const recommendations = await creditCardService.generateRecommendations(spendingProfile, products);
      onRecommendationGenerated(recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalCategorySpend = Object.values(spendingProfile.categories).reduce((sum, amount) => sum + amount, 0);
  const remainingSpend = Math.max(0, spendingProfile.monthlySpend - totalCategorySpend);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Get Personalized Recommendations</h3>
          <p className="text-sm text-gray-600">Tell us about your spending habits to find the perfect credit card</p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          {showAdvanced ? 'Simple View' : 'Advanced Options'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Spending (₹)
            </label>
            <input
              type="number"
              value={spendingProfile.monthlySpend || ''}
              onChange={(e) => handleSpendingChange('monthlySpend', Number(e.target.value) || 0)}
              placeholder="Enter your monthly spending"
              className="input-field"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your total monthly credit card spending
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Fee Preference
            </label>
            <select
              value={spendingProfile.annualFeePreference}
              onChange={(e) => handleSpendingChange('annualFeePreference', e.target.value)}
              className="input-field"
            >
              <option value="free">Free cards only</option>
              <option value="low">Low fee (up to ₹1,000)</option>
              <option value="medium">Medium fee (up to ₹5,000)</option>
              <option value="high">High fee (₹5,000+) for premium benefits</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Benefits (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'rewards', label: 'Reward Points' },
                { key: 'cashback', label: 'Cashback' },
                { key: 'travel', label: 'Travel Benefits' },
                { key: 'fuel', label: 'Fuel Savings' },
                { key: 'dining', label: 'Dining Offers' },
                { key: 'shopping', label: 'Shopping Rewards' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={spendingProfile.preferredBenefits.includes(key as any)}
                    onChange={() => handleBenefitToggle(key)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Spending Categories */}
        {showAdvanced && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spending Breakdown by Category (₹)
              </label>
              <div className="space-y-3">
                {[
                  { key: 'dining', label: 'Dining & Restaurants' },
                  { key: 'fuel', label: 'Fuel & Petrol' },
                  { key: 'groceries', label: 'Groceries & Supermarkets' },
                  { key: 'shopping', label: 'Shopping & E-commerce' },
                  { key: 'travel', label: 'Travel & Hotels' },
                  { key: 'utilities', label: 'Utilities & Bills' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="w-32 text-sm text-gray-600">{label}:</label>
                    <input
                      type="number"
                      value={spendingProfile.categories[key as keyof SpendingProfile['categories']] || ''}
                      onChange={(e) => handleCategoryChange(key as keyof SpendingProfile['categories'], Number(e.target.value) || 0)}
                      className="input-field flex-1"
                      min="0"
                      max={spendingProfile.monthlySpend}
                    />
                  </div>
                ))}
                
                {spendingProfile.monthlySpend > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Total categorized:</span>
                      <span>₹{totalCategorySpend.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining (Others):</span>
                      <span className={remainingSpend < 0 ? 'text-red-600' : 'text-gray-900'}>
                        ₹{remainingSpend.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {remainingSpend < 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Category totals exceed monthly spending
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={generateRecommendations}
          disabled={isGenerating || isLoading || spendingProfile.monthlySpend === 0}
          className={`btn-primary px-8 py-3 ${
            (isGenerating || isLoading || spendingProfile.monthlySpend === 0) 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          {isGenerating ? 'Generating Recommendations...' : 'Get My Recommendations'}
        </button>
      </div>

      {/* Quick Presets */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setSpendingProfile({
              monthlySpend: 15000,
              categories: { dining: 3000, fuel: 2000, groceries: 4000, shopping: 3000, travel: 1000, utilities: 2000, others: 0 },
              preferredBenefits: ['cashback', 'fuel'],
              annualFeePreference: 'free',
            })}
            className="p-3 text-left border rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium text-sm">Budget Conscious</div>
            <div className="text-xs text-gray-600">₹15K/month, free cards, cashback focus</div>
          </button>
          
          <button
            onClick={() => setSpendingProfile({
              monthlySpend: 40000,
              categories: { dining: 8000, fuel: 3000, groceries: 6000, shopping: 10000, travel: 8000, utilities: 3000, others: 2000 },
              preferredBenefits: ['rewards', 'travel', 'dining'],
              annualFeePreference: 'medium',
            })}
            className="p-3 text-left border rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium text-sm">Regular Spender</div>
            <div className="text-xs text-gray-600">₹40K/month, rewards & travel benefits</div>
          </button>
          
          <button
            onClick={() => setSpendingProfile({
              monthlySpend: 80000,
              categories: { dining: 15000, fuel: 5000, groceries: 8000, shopping: 20000, travel: 25000, utilities: 5000, others: 2000 },
              preferredBenefits: ['rewards', 'travel', 'shopping'],
              annualFeePreference: 'high',
            })}
            className="p-3 text-left border rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium text-sm">High Spender</div>
            <div className="text-xs text-gray-600">₹80K/month, premium benefits</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditCardRecommendationEngine;