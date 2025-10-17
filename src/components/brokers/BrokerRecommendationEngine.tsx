'use client';

import React, { useState } from 'react';
import { BrokerRecommendationEngineProps, TradingProfile } from '@/types/brokers';
import brokerService from '@/lib/services/brokerService';
import LoadingSpinner from '../ui/LoadingSpinner';

const BrokerRecommendationEngine: React.FC<BrokerRecommendationEngineProps> = ({
  onRecommendationGenerated,
  products,
  isLoading = false
}) => {
  const [profile, setProfile] = useState<TradingProfile>({
    experience: 'beginner',
    tradingFrequency: 'occasional',
    investmentAmount: 50000,
    preferredSegments: ['equity'],
    needsResearch: true,
    needsMargin: false,
    platformPreference: ['mobile', 'web'],
    costSensitivity: 'medium'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleProfileChange = (key: keyof TradingProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (key: keyof TradingProfile, value: string, checked: boolean) => {
    const currentArray = profile[key] as string[];
    let newArray: string[];
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    handleProfileChange(key, newArray);
  };

  const generateRecommendations = async () => {
    try {
      setIsGenerating(true);
      const recommendations = await brokerService.getRecommendations(profile, products);
      onRecommendationGenerated(recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendations();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trading Experience & Goals</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your trading experience?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'beginner', label: 'Beginner', desc: '0-1 years' },
                { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
                { value: 'advanced', label: 'Advanced', desc: '3+ years' }
              ].map(option => (
                <label key={option.value} className="relative">
                  <input
                    type="radio"
                    name="experience"
                    value={option.value}
                    checked={profile.experience === option.value}
                    onChange={(e) => handleProfileChange('experience', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    profile.experience === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How often do you plan to trade?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'occasional', label: 'Occasional', desc: 'Few times a year' },
                { value: 'regular', label: 'Regular', desc: 'Monthly' },
                { value: 'frequent', label: 'Frequent', desc: 'Weekly' },
                { value: 'day_trader', label: 'Day Trader', desc: 'Daily' }
              ].map(option => (
                <label key={option.value} className="relative">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={profile.tradingFrequency === option.value}
                    onChange={(e) => handleProfileChange('tradingFrequency', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    profile.tradingFrequency === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Amount & Segments</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial investment amount (₹)
            </label>
            <select
              value={profile.investmentAmount}
              onChange={(e) => handleProfileChange('investmentAmount', Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={10000}>₹10,000 - ₹25,000</option>
              <option value={50000}>₹25,000 - ₹1,00,000</option>
              <option value={200000}>₹1,00,000 - ₹5,00,000</option>
              <option value={1000000}>₹5,00,000 - ₹25,00,000</option>
              <option value={5000000}>₹25,00,000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which segments are you interested in? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'equity', label: 'Equity Trading', desc: 'Stocks & shares' },
                { value: 'derivatives', label: 'Derivatives', desc: 'Futures & options' },
                { value: 'currency', label: 'Currency', desc: 'Forex trading' },
                { value: 'commodity', label: 'Commodity', desc: 'Gold, silver, etc.' },
                { value: 'mutual_funds', label: 'Mutual Funds', desc: 'SIP & lump sum' }
              ].map(option => (
                <label key={option.value} className="relative">
                  <input
                    type="checkbox"
                    checked={profile.preferredSegments.includes(option.value)}
                    onChange={(e) => handleArrayChange('preferredSegments', option.value, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    profile.preferredSegments.includes(option.value)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        profile.preferredSegments.includes(option.value)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {profile.preferredSegments.includes(option.value) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.desc}</div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Features & Requirements</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you need research reports and analysis?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="needsResearch"
                  checked={profile.needsResearch === true}
                  onChange={() => handleProfileChange('needsResearch', true)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>Yes, I need research support</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="needsResearch"
                  checked={profile.needsResearch === false}
                  onChange={() => handleProfileChange('needsResearch', false)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>No, I do my own research</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you need margin trading facility?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="needsMargin"
                  checked={profile.needsMargin === true}
                  onChange={() => handleProfileChange('needsMargin', true)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>Yes, I need margin trading</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="needsMargin"
                  checked={profile.needsMargin === false}
                  onChange={() => handleProfileChange('needsMargin', false)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>No, cash trading only</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How important are low costs to you?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'low', label: 'Not Important', desc: 'Focus on features' },
                { value: 'medium', label: 'Somewhat Important', desc: 'Balance cost & features' },
                { value: 'high', label: 'Very Important', desc: 'Lowest cost priority' }
              ].map(option => (
                <label key={option.value} className="relative">
                  <input
                    type="radio"
                    name="costSensitivity"
                    value={option.value}
                    checked={profile.costSensitivity === option.value}
                    onChange={(e) => handleProfileChange('costSensitivity', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    profile.costSensitivity === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which platforms do you prefer? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'mobile', label: 'Mobile App', desc: 'Trade on the go', icon: '📱' },
                { value: 'web', label: 'Web Platform', desc: 'Browser-based trading', icon: '🌐' },
                { value: 'desktop', label: 'Desktop Software', desc: 'Advanced charting', icon: '💻' },
                { value: 'api', label: 'API Access', desc: 'Algorithmic trading', icon: '⚡' }
              ].map(option => (
                <label key={option.value} className="relative">
                  <input
                    type="checkbox"
                    checked={profile.platformPreference.includes(option.value)}
                    onChange={(e) => handleArrayChange('platformPreference', option.value, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    profile.platformPreference.includes(option.value)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.desc}</div>
                      </div>
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        profile.platformPreference.includes(option.value)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {profile.platformPreference.includes(option.value) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">
          {isGenerating ? 'Generating personalized recommendations...' : 'Loading...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Get Personalized Broker Recommendations</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
            currentStep === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        
        <button
          onClick={nextStep}
          disabled={isGenerating}
          className={`px-6 py-2 text-sm btn-primary ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {currentStep === totalSteps ? 'Get Recommendations' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default BrokerRecommendationEngine;