'use client';

import React, { useState } from 'react';
import { CalculatorSuite } from '@/components/calculators';
import { allCalculators } from '@/lib/calculators';

export default function CalculatorsClient() {
  const [selectedCalculatorId, setSelectedCalculatorId] = useState(allCalculators[0]?.id || '');

  const handleCalculatorSelect = (calculatorId: string) => {
    setSelectedCalculatorId(calculatorId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CalculatorSuite
        calculators={allCalculators}
        selectedCalculatorId={selectedCalculatorId}
        onCalculatorSelect={handleCalculatorSelect}
        showHistory={true}
        showExamples={true}
      />
    </div>
  );
}