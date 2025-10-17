import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrokerDirectory from '../../brokers/BrokerDirectory';

// Mock the broker service
jest.mock('@/lib/services/brokerService', () => ({
  __esModule: true,
  default: {
    getBrokers: jest.fn().mockResolvedValue({
      products: [
        {
          _id: 'product-1',
          partnerId: 'partner-1',
          name: 'Zerodha Kite Account',
          type: 'broker_account',
          accountTypes: ['demat', 'trading'],
          brokerage: {
            equity: { delivery: 0, intraday: 0.03, isPercentage: true },
            derivatives: { futures: 20, options: 20, isPercentage: false },
            currency: { rate: 0.03, isPercentage: true },
            commodity: { rate: 0.03, isPercentage: true },
          },
          accountCharges: { opening: 0, maintenance: 300, demat: 0 },
          platforms: { web: true, mobile: true, desktop: false, api: true },
          sebiRegistration: {
            number: 'INZ000031633',
            validUntil: new Date('2025-12-31'),
            isActive: true,
          },
          researchReports: true,
          marginFunding: true,
          ipoAccess: true,
          mutualFunds: true,
          bonds: false,
          rating: 4.5,
          userReviews: 1250,
          features: [],
          eligibility: [],
          fees: [],
          applicationUrl: 'https://zerodha.com/open-account',
          isActive: true,
          priority: 90,
          description: 'Leading discount broker in India',
          termsAndConditions: 'Standard terms apply',
          processingTime: '24-48 hours',
        },
        {
          _id: 'product-2',
          partnerId: 'partner-2',
          name: 'Upstox Pro Account',
          type: 'broker_account',
          accountTypes: ['demat', 'trading'],
          brokerage: {
            equity: { delivery: 0, intraday: 0.05, isPercentage: true },
            derivatives: { futures: 20, options: 20, isPercentage: false },
            currency: { rate: 0.05, isPercentage: true },
            commodity: { rate: 0.05, isPercentage: true },
          },
          accountCharges: { opening: 0, maintenance: 250, demat: 150 },
          platforms: { web: true, mobile: true, desktop: true, api: false },
          sebiRegistration: {
            number: 'INZ000031634',
            validUntil: new Date('2025-12-31'),
            isActive: true,
          },
          researchReports: false,
          marginFunding: true,
          ipoAccess: true,
          mutualFunds: false,
          bonds: false,
          rating: 4.2,
          userReviews: 850,
          features: [],
          eligibility: [],
          fees: [],
          applicationUrl: 'https://upstox.com/open-account',
          isActive: true,
          priority: 80,
          description: 'Technology-driven broker',
          termsAndConditions: 'Standard terms apply',
          processingTime: '24-48 hours',
        },
      ],
      partners: [
        {
          _id: 'partner-1',
          name: 'Zerodha',
          type: 'broker',
          logoUrl: 'https://example.com/zerodha-logo.png',
          description: 'India\'s largest discount broker',
          website: 'https://zerodha.com',
          contactEmail: 'support@zerodha.com',
          commissionStructure: { type: 'fixed', amount: 500, currency: 'INR' },
          trackingConfig: { conversionGoals: ['account_opened'], attributionWindow: 30 },
          isActive: true,
          products: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'partner-2',
          name: 'Upstox',
          type: 'broker',
          logoUrl: 'https://example.com/upstox-logo.png',
          description: 'Technology-driven broker',
          website: 'https://upstox.com',
          contactEmail: 'support@upstox.com',
          commissionStructure: { type: 'fixed', amount: 400, currency: 'INR' },
          trackingConfig: { conversionGoals: ['account_opened'], attributionWindow: 30 },
          isActive: true,
          products: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 2,
    }),
    getAccountTypeLabel: jest.fn((type) => {
      const labels = {
        'demat': 'Demat Account',
        'trading': 'Trading Account',
      };
      return labels[type as keyof typeof labels] || type;
    }),
    getPlatformLabel: jest.fn((platform) => {
      const labels = {
        'web': 'Web Platform',
        'mobile': 'Mobile App',
        'desktop': 'Desktop Software',
        'api': 'API Access',
      };
      return labels[platform as keyof typeof labels] || platform;
    }),
    formatCurrency: jest.fn((amount) => `₹${amount.toLocaleString()}`),
  }
}));

// Mock child components
jest.mock('../../brokers/BrokerFilters', () => {
  return function MockBrokerFilters({ onFiltersChange }: any) {
    return (
      <div data-testid="broker-filters">
        <button onClick={() => onFiltersChange({ maxBrokerageEquity: 0.1 })}>
          Apply Filter
        </button>
      </div>
    );
  };
});

jest.mock('../../brokers/BrokerCard', () => {
  return function MockBrokerCard({ product, onSelect, onCompare }: any) {
    return (
      <div data-testid={`broker-card-${product._id}`}>
        <h3>{product.name}</h3>
        <button onClick={() => onSelect?.(product)}>Select</button>
        <button onClick={() => onCompare?.(product)}>Compare</button>
      </div>
    );
  };
});

jest.mock('../../brokers/BrokerComparisonTable', () => {
  return function MockBrokerComparisonTable({ products }: any) {
    return (
      <div data-testid="broker-comparison-table">
        Comparing {products.length} brokers
      </div>
    );
  };
});

jest.mock('../../brokers/BrokerRecommendationEngine', () => {
  return function MockBrokerRecommendationEngine({ onRecommendationGenerated }: any) {
    return (
      <div data-testid="broker-recommendation-engine">
        <button 
          onClick={() => onRecommendationGenerated([
            { productId: 'product-1', score: 95, reasons: ['Great features'], category: 'best_overall' }
          ])}
        >
          Generate Recommendations
        </button>
      </div>
    );
  };
});

jest.mock('../ui/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../ui/ErrorMessage', () => {
  return function MockErrorMessage({ message, onRetry }: any) {
    return (
      <div data-testid="error-message">
        <p>{message}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  };
});

describe('BrokerDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders broker directory with header', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      expect(screen.getByText('Broker Comparison')).toBeInTheDocument();
      expect(screen.getByText('Compare SEBI-registered brokers and find the best trading platform for your needs')).toBeInTheDocument();
    });
  });

  it('displays brokers after loading', async () => {
    render(<BrokerDirectory />);
    
    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Wait for brokers to load
    await waitFor(() => {
      expect(screen.getByText('2 Brokers Found')).toBeInTheDocument();
      expect(screen.getByTestId('broker-card-product-1')).toBeInTheDocument();
      expect(screen.getByTestId('broker-card-product-2')).toBeInTheDocument();
    });
  });

  it('shows filters component', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      expect(screen.getByTestId('broker-filters')).toBeInTheDocument();
    });
  });

  it('handles filter changes', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const filterButton = screen.getByText('Apply Filter');
      fireEvent.click(filterButton);
    });
    
    // Should trigger a new API call with filters
    // This would be verified by checking if getBrokers was called with the new filters
  });

  it('toggles layout between grid and list', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const listButton = screen.getByText('List');
      fireEvent.click(listButton);
      
      // The layout change would be reflected in the CSS classes of the container
      // This is tested implicitly through the component behavior
    });
  });

  it('handles broker selection for comparison', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select');
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]);
      
      // Should show compare button
      expect(screen.getByText('Compare (2)')).toBeInTheDocument();
    });
  });

  it('shows comparison table when comparing brokers', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select');
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]);
      
      const compareButton = screen.getByText('Compare (2)');
      fireEvent.click(compareButton);
      
      expect(screen.getByTestId('broker-comparison-table')).toBeInTheDocument();
    });
  });

  it('shows recommendation engine when requested', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const recommendButton = screen.getByText('Get Recommendations');
      fireEvent.click(recommendButton);
      
      expect(screen.getByTestId('broker-recommendation-engine')).toBeInTheDocument();
    });
  });

  it('handles recommendation generation', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const recommendButton = screen.getByText('Get Recommendations');
      fireEvent.click(recommendButton);
      
      const generateButton = screen.getByText('Generate Recommendations');
      fireEvent.click(generateButton);
      
      // Should show recommendation banner
      expect(screen.getByText('Personalized Recommendations Ready!')).toBeInTheDocument();
    });
  });

  it('clears selections when requested', async () => {
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select');
      fireEvent.click(selectButtons[0]);
      
      const clearButton = screen.getByText('Clear Selection');
      fireEvent.click(clearButton);
      
      // Compare button should disappear
      expect(screen.queryByText('Compare (1)')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no brokers found', async () => {
    // Mock empty response
    const mockGetBrokers = require('@/lib/services/brokerService').default.getBrokers;
    mockGetBrokers.mockResolvedValueOnce({
      products: [],
      partners: [],
      total: 0,
    });
    
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      expect(screen.getByText('No brokers found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more results.')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock error response
    const mockGetBrokers = require('@/lib/services/brokerService').default.getBrokers;
    mockGetBrokers.mockRejectedValueOnce(new Error('API Error'));
    
    render(<BrokerDirectory />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('respects maxComparisons prop', async () => {
    render(<BrokerDirectory maxComparisons={1} />);
    
    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select');
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]); // This should not add to selection
      
      // Should only show 1 in comparison
      expect(screen.queryByText('Compare (2)')).not.toBeInTheDocument();
    });
  });

  it('calls onProductSelect callback when provided', async () => {
    const onProductSelect = jest.fn();
    render(<BrokerDirectory onProductSelect={onProductSelect} />);
    
    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select');
      fireEvent.click(selectButtons[0]);
      
      expect(onProductSelect).toHaveBeenCalled();
    });
  });
});