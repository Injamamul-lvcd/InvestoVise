'use client';

import React, { useState, useEffect } from 'react';
import { EMICalculatorProps, EMICalculation } from '@/types/loans';
import loanService from '@/lib/services/loanService';

const EMICalculator: React.FC<EMICalculatorProps> = ({
  product,
  onCalculate,
  showAmortization = false,
}) => {
  const [principal, setPrincipal] = useState<number>(product?.minAmount || 500000);
  const [interestRate, setInterestRate] = useState<number>(product?.interestRate || 12);
  const [tenure, setTenure] = useState<number>(24); // months
  const [calculation, setCalculation] = useState<EMICalculation | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  // Calculate EMI whenever inputs change
  useEffect(() => {
    if (principal > 0 && interestRate > 0 && tenure > 0) {
      const result = loanService.calculateEMI(principal, interestRate, tenure, showAmortization);
      setCalculation(result);
      onCalculate?.(result);
    }
  }, [principal, interestRate, tenure, showAmortization, onCalculate]);

  const handlePrincipalChange = (value: number) => {
    if (product?.minAmount && value < product.minAmount) {
      setPrincipal(product.minAmount);
    } else if (product?.maxAmount && value > product.maxAmount) {
      setPrincipal(product.maxAmount);
    } else {
      setPrincipal(value);
    }
  };

  const tenureOptions = [
    { months: 6, label: '6 months' },
    { months: 12, label: '1 year' },
    { months: 24, label: '2 years' },
    { months: 36, label: '3 years' },
    { months: 48