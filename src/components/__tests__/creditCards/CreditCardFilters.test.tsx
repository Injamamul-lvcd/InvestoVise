import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreditCardFilters from '../../creditCards/CreditCardFilters';
import { CreditCardFilters as CreditCardFiltersType } from '@/types/creditCards';

describe('CreditCardFilters Component', () => {
  const mockCardTypes = [
    { value: 'basic', label: 'Basic Card', count: 5 },
    { value: 'premium', label: 'Premium Card', count: 3 },
    { value: 'super_premium', label: 'Super Premium', count: 2 },
    { value: 'business', label: 'Business Card', count: 1 }
  ];

  const mockCardNetworks = [
    { value: 'visa', label: 'Visa', count: 6 },
    { value: 'mastercard', label: 'Mastercard', count: 4 },
    { value: 'rupay', label: 'RuPay', count: 1 }
  ];

  const mockFeeRanges = { min: 0, max: 10000 };
  const mockCreditLimitRanges = { min: 50000, max: 1000000 };

  const defaultProps = {
    filters: {} as CreditCardFiltersType,
    onFiltersChange: jest.fn(),
    cardTypes: mockCardTypes,
    cardNetworks: mockCardNetworks,
    feeRanges: mockFeeRanges,
    creditLimitRanges: mockCreditLimitRanges
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter options', () => {
    render(<CreditCardFilters {...defaultProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Card Type')).toBeInTheDocument();
    expect(screen.getByText('Card Network')).toBeInTheDocument();
    expect(screen.getByText('Max Annual Fee (₹)')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('displays card type options with counts', () => {
    render(<CreditCardFilters {...defaultProps} />);

    const cardTypeSelect = screen.getByDisplayValue('All Types (11)');
    expect(cardTypeSelect).toBeInTheDocument();

    // Check if options are present (they're in the select dropdown)
    fireEvent.click(cardTypeSelect);
    expect(screen.getByText('Basic Card (5)')).toBeInTheDocument();
    expect(screen.getByText('Premium Card (3)')).toBeInTheDocument();
  });

  it('displays card network options with counts', () => {
    render(<CreditCardFilters {...defaultProps} />);

    const networkSelect = screen.getByDisplayValue('All Networks (11)');
    expect(networkSelect).toBeInTheDocument();
  });

  it('handles card type filter change', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const cardTypeSelect = screen.getByDisplayValue('All Types (11)');
    fireEvent.change(cardTypeSelect, { target: { value: 'premium' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ cardType: 'premium' });
  });

  it('handles card network filter change', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const networkSelect = screen.getByDisplayValue('All Networks (11)');
    fireEvent.change(networkSelect, { target: { value: 'visa' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ cardNetwork: 'visa' });
  });

  it('handles annual fee filter change', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const feeInput = screen.getByPlaceholderText('Enter max fee');
    fireEvent.change(feeInput, { target: { value: '5000' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ maxAnnualFee: 5000 });
  });

  it('handles sort by filter change', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const sortSelect = screen.getByDisplayValue('Popularity');
    fireEvent.change(sortSelect, { target: { value: 'annualFee' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ sortBy: 'annualFee' });
  });

  it('handles sort order toggle', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const descendingCheckbox = screen.getByLabelText('Descending');
    fireEvent.click(descendingCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ sortOrder: 'desc' });
  });

  it('handles feature checkboxes', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const rewardsCheckbox = screen.getByLabelText('Has Rewards');
    fireEvent.click(rewardsCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ hasRewards: true });

    const cashbackCheckbox = screen.getByLabelText('Has Cashback');
    fireEvent.click(cashbackCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ hasCashback: true });

    const bonusCheckbox = screen.getByLabelText('Welcome Bonus');
    fireEvent.click(bonusCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ hasWelcomeBonus: true });
  });

  it('handles quick filter buttons', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const freeCardsButton = screen.getByText('Free Cards');
    fireEvent.click(freeCardsButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ maxAnnualFee: 0 });
  });

  it('handles best rewards quick filter', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const bestRewardsButton = screen.getByText('Best Rewards');
    fireEvent.click(bestRewardsButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ 
      hasRewards: true,
      sortBy: 'rewardRate',
      sortOrder: 'desc'
    });
  });

  it('handles best cashback quick filter', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const bestCashbackButton = screen.getByText('Best Cashback');
    fireEvent.click(bestCashbackButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ 
      hasCashback: true,
      sortBy: 'cashbackRate',
      sortOrder: 'desc'
    });
  });

  it('shows clear all button when filters are active', () => {
    const filtersWithValues = { cardType: 'premium', hasRewards: true };
    render(<CreditCardFilters {...defaultProps} filters={filtersWithValues} />);

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('handles clear all filters', () => {
    const mockOnFiltersChange = jest.fn();
    const filtersWithValues = { cardType: 'premium', hasRewards: true };
    
    render(
      <CreditCardFilters 
        {...defaultProps} 
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('displays active filters', () => {
    const filtersWithValues = { 
      cardType: 'premium', 
      maxAnnualFee: 5000,
      hasRewards: true 
    };
    
    render(<CreditCardFilters {...defaultProps} filters={filtersWithValues} />);

    expect(screen.getByText('Active Filters:')).toBeInTheDocument();
    expect(screen.getByText('Premium Card')).toBeInTheDocument();
    expect(screen.getByText('Max Fee: ₹5,000')).toBeInTheDocument();
    expect(screen.getByText('Has Rewards')).toBeInTheDocument();
  });

  it('allows removing individual active filters', () => {
    const mockOnFiltersChange = jest.fn();
    const filtersWithValues = { cardType: 'premium', hasRewards: true };
    
    render(
      <CreditCardFilters 
        {...defaultProps} 
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange} 
      />
    );

    // Find and click the remove button for card type filter
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]); // Remove card type

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ 
      cardType: undefined, 
      hasRewards: true 
    });
  });

  it('toggles filter visibility on mobile', () => {
    render(<CreditCardFilters {...defaultProps} />);

    // Initially filters should be hidden on mobile (we can't test responsive behavior directly)
    const showFiltersButton = screen.getByText('Show Filters');
    fireEvent.click(showFiltersButton);

    expect(screen.getByText('Hide Filters')).toBeInTheDocument();
  });

  it('displays fee and credit limit ranges', () => {
    render(<CreditCardFilters {...defaultProps} />);

    expect(screen.getByText('Range: ₹0 - ₹10,000')).toBeInTheDocument();
  });

  it('handles premium cards quick filter', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const premiumButton = screen.getByText('Premium Cards');
    fireEvent.click(premiumButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ cardType: 'premium' });
  });

  it('handles beginner friendly quick filter', () => {
    const mockOnFiltersChange = jest.fn();
    render(<CreditCardFilters {...defaultProps} onFiltersChange={mockOnFiltersChange} />);

    const beginnerButton = screen.getByText('Beginner Friendly');
    fireEvent.click(beginnerButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ 
      cardType: 'basic',
      maxAnnualFee: 1000
    });
  });
});