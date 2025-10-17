'use client';

import React from 'react';
import { CreditCardGrid } from '@/components/creditCards';

export default function CreditCardsDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Credit Cards Demo</h1>
          <p className="text-lg text-gray-600">
            Explore our credit card comparison and recommendation system
          </p>
        </div>

        <CreditCardGrid
          showRecommendationEngine={true}
          maxComparisons={3}
          layout="grid"
        />
      </div>
    </div>
  );
}