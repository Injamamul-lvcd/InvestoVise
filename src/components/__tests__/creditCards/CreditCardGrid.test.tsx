import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreditCardGrid from '../../creditCards/CreditCardGrid';
import creditCardService from '@/lib/services/creditCardService';

// Mock the credit card service
jest.mock('@/lib/services/creditCardService');
const mockCreditCardService = creditCardService as jest.Mocked<typeof creditCardService>;

// Mock child components
jest.mock('../../creditCards/CreditCardFilters', () => {
  return function MockCreditCardFilters({ onFiltersChange }: any) {
    return (
      <div data-testid="credit-card-filters">
        <button onClick={() => onFiltersChange({ cardType: 'premium' })}>
          Apply Premium Filter
        </button>
      </div>
    );
  };
});

jest.mock('../../creditCards/CreditCard', () => {
  return function MockCreditCard({ product, onSelect, isSelected }: any) {
    return (
      <div data-testid={`credit-card-${product._id}`}>
        <h3>{product.name}</h3>
        <button onClick={() => onSelect?.(product)}>
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    );
  };
});

jest.mock('../../creditCards/CreditCardComparisonTable', () => {
  return function MockCreditCardComparisonTable({ products }: any) {
    return (
      <div data-testid="comparison-table">
        Comparing {products.length} cards
      </div>
    );
  };
});

jest.mock('../../creditCards/CreditCardRecommendationEngine', () => {
  return function MockCreditCardRecommendationEngine({ onRecommendationGenerated }: any) {
    return (
      <div data-testid="recommendation-engine">
        <button onClick={() => onRecommendationGenerated([
          { productId: '1', score: 90, reasons: ['Great rewards'], category: 'best_rewards' }
        ])}>
          Generate Recommendations
        </button>
      </div>
    );
  };
});

describe('CreditCardGrid Component', () => {
  const mockProducts = [
    {
      _id: '1',
      partnerId: '101',
      name: 'Premium Rewards Card',
      type: 'credit_card',
      cardType: 'premium',
      cardNetwork: 'visa',
      features: [],
      eligibility: [],
      fees: [],
      applicationUrl: 'https://example.com/apply1',
      isActive: true,
      priority: 90,
      description: 'Premium card',
      termsAndConditions: 'Terms',
      processingTime: '7 days'
    },
    {
      _id: '2',
      partnerId: '102',
      name: 'Basic Cashback Card',
      type: 'credit_card',
      cardType: 'basic',
      cardNetwork: 'mastercard',
      features: [],
      eligibility: [],
      fees: [],
      applicationUrl: 'https://example.com/apply2',
      isActive: true,
      priority: 70,
      description: 'Basic card',
      termsAndConditions: 'Terms',
      processingTime: '5 days'
    }
  ];

  const mockPartners = [
    {
      _id: '101',
      name: 'Premium Bank',
      type: 'credit_card',
      logoUrl: 'https://example.com/logo1.png',
      description: 'Premium bank',
      website: 'https://premiumbank.com',
      contactEmail: 'contact@premiumbank.com',
      commissionStructure: { type: 'fixed', amount: 500, currency: 'INR' },
      trackingConfig: { conversionGoals: ['application_submitted'], attributionWindow: 30 },
      isActive: true,
      products: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '102',
      name: 'Basic Bank',
      type: 'credit_card',
      logoUrl: 'https://example.com/logo2.png',
      description: 'Basic bank',
      website: 'https://basicbank.com',
      contactEmail: 'contact@basicbank.com',
      commissionStructure: { type: 'fixed', amount: 300, currency: 'INR' },
      trackingConfig: { conversionGoals: ['application_submitted'], attributionWindow: 30 },
      isActive: true,
      products: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreditCardService.getCreditCards.mockResolvedValue({
      products: mockProducts as any,
      partners: mockPartners as any,
      total: mockProducts.length
    });
    mockCreditCardService.getCardTypeLabel.mockImplementation((type) => 
      type === 'premium' ? 'Premium Card' : 'Basic Card'
    );
    mockCreditCardService.getCardNetworkLabel.mockImplementation((network) => 
      network === 'visa' ? 'Visa' : 'Mastercard'
    );
  });

  it('renders credit card grid with products', async () => {
    render(<CreditCardGrid />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Credit Card Comparison')).toBeInTheDocument();
    expect(screen.getByText('2 Credit Cards Found')).toBeInTheDocument();
    expect(screen.getByTestId('credit-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('credit-card-2')).toBeInTheDocument();
  });

  it('handles filter changes', async () => {
    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Apply Premium Filter'));

    await waitFor(() => {
      expect(mockCreditCardService.getCreditCards).toHaveBeenCalledWith({ cardType: 'premium' });
    });
  });

  it('handles product selection for comparison', async () => {
    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Select first product
    const selectButton1 = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton1);

    // Select second product
    const selectButton2 = screen.getAllByText('Select')[1];
    fireEvent.click(selectButton2);

    // Compare button should appear
    expect(screen.getByText('Compare (2)')).toBeInTheDocument();
  });

  it('shows comparison table when products are selected', async () => {
    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Select products
    fireEvent.click(screen.getAllByText('Select')[0]);
    fireEvent.click(screen.getAllByText('Select')[1]);

    // Click compare button
    fireEvent.click(screen.getByText('Compare (2)'));

    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
    expect(screen.getByText('Comparing 2 cards')).toBeInTheDocument();
  });

  it('shows recommendation engine when enabled', async () => {
    render(<CreditCardGrid showRecommendationEngine={true} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Recommendations'));
    expect(screen.getByTestId('recommendation-engine')).toBeInTheDocument();
  });

  it('handles recommendation generation', async () => {
    render(<CreditCardGrid showRecommendationEngine={true} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get Recommendations'));
    fireEvent.click(screen.getByText('Generate Recommendations'));

    expect(screen.getByText('Personalized Recommendations Ready!')).toBeInTheDocument();
    expect(screen.getByText(/Sorted by your preferences/)).toBeInTheDocument();
  });

  it('toggles between grid and list layout', async () => {
    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    // The layout change would be reflected in the CSS classes, 
    // but since we're mocking the CreditCard component, we can't test the actual layout change
    expect(listButton).toHaveClass('bg-primary-100');
  });

  it('clears selections when clear button is clicked', async () => {
    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Select products
    fireEvent.click(screen.getAllByText('Select')[0]);
    fireEvent.click(screen.getAllByText('Select')[1]);

    // Clear selections
    fireEvent.click(screen.getByText('Clear Selection'));

    // Compare button should disappear
    expect(screen.queryByText(/Compare/)).not.toBeInTheDocument();
  });

  it('handles loading state', () => {
    mockCreditCardService.getCreditCards.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<CreditCardGrid />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockCreditCardService.getCreditCards.mockRejectedValue(
      new Error('Failed to fetch credit cards')
    );

    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch credit cards')).toBeInTheDocument();
    });
  });

  it('shows empty state when no products found', async () => {
    mockCreditCardService.getCreditCards.mockResolvedValue({
      products: [],
      partners: [],
      total: 0
    });

    render(<CreditCardGrid />);

    await waitFor(() => {
      expect(screen.getByText('No credit cards found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more results.')).toBeInTheDocument();
    });
  });

  it('calls onProductSelect callback when provided', async () => {
    const mockOnProductSelect = jest.fn();
    
    render(<CreditCardGrid onProductSelect={mockOnProductSelect} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Select')[0]);

    expect(mockOnProductSelect).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('respects maxComparisons limit', async () => {
    render(<CreditCardGrid maxComparisons={1} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Select first product
    fireEvent.click(screen.getAllByText('Select')[0]);
    
    // Try to select second product - should not work due to limit
    fireEvent.click(screen.getAllByText('Select')[1]);

    // Only one product should be selected
    expect(screen.queryByText('Compare (2)')).not.toBeInTheDocument();
    expect(screen.getByText('Compare (1)')).toBeInTheDocument();
  });
});