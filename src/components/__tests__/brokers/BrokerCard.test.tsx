import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrokerCard from '../../brokers/BrokerCard';
import { BrokerProduct } from '@/types/brokers';
import { IAffiliatePartner } from '@/types/database';

// Mock the broker service
jest.mock('@/lib/services/brokerService', () => ({
  __esModule: true,
  default: {
    generateAffiliateLink: jest.fn().mockResolvedValue({
      trackingId: 'test-tracking-id',
      trackingUrl: 'https://example.com/apply?ref=test-tracking-id'
    }),
    trackApplication: jest.fn().mockResolvedValue(undefined),
    formatCurrency: jest.fn((amount) => `₹${amount.toLocaleString()}`),
    formatBrokerage: jest.fn((amount, isPercentage) => 
      isPercentage ? `${amount}%` : `₹${amount}`
    ),
    getAccountTypeLabel: jest.fn((type) => {
      const labels = {
        'demat': 'Demat Account',
        'trading': 'Trading Account',
        'commodity': 'Commodity Trading',
        'currency': 'Currency Trading',
        'mutual_fund': 'Mutual Fund Investment',
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
    getRatingStars: jest.fn((rating) => '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))),
  }
}));

const mockProduct: BrokerProduct = {
  _id: 'product-1' as any,
  partnerId: 'partner-1' as any,
  name: 'Zerodha Kite Account',
  type: 'broker_account',
  accountTypes: ['demat', 'trading'],
  brokerage: {
    equity: {
      delivery: 0,
      intraday: 0.03,
      isPercentage: true,
    },
    derivatives: {
      futures: 20,
      options: 20,
      isPercentage: false,
    },
    currency: {
      rate: 0.03,
      isPercentage: true,
    },
    commodity: {
      rate: 0.03,
      isPercentage: true,
    },
  },
  accountCharges: {
    opening: 0,
    maintenance: 300,
    demat: 0,
  },
  platforms: {
    web: true,
    mobile: true,
    desktop: false,
    api: true,
  },
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
  features: [
    { name: 'Zero Brokerage', value: 'On delivery trades', description: 'No charges on delivery trades' },
    { name: 'Advanced Charting', value: 'TradingView integration', description: 'Professional charting tools' },
  ],
  eligibility: [],
  fees: [],
  applicationUrl: 'https://zerodha.com/open-account',
  isActive: true,
  priority: 90,
  description: 'Leading discount broker in India',
  termsAndConditions: 'Standard terms apply',
  processingTime: '24-48 hours',
};

const mockPartner: IAffiliatePartner = {
  _id: 'partner-1' as any,
  name: 'Zerodha',
  type: 'broker',
  logoUrl: 'https://example.com/zerodha-logo.png',
  description: 'India\'s largest discount broker',
  website: 'https://zerodha.com',
  contactEmail: 'support@zerodha.com',
  commissionStructure: {
    type: 'fixed',
    amount: 500,
    currency: 'INR',
  },
  trackingConfig: {
    conversionGoals: ['account_opened'],
    attributionWindow: 30,
  },
  isActive: true,
  products: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BrokerCard', () => {
  const defaultProps = {
    product: mockProduct,
    partner: mockPartner,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders broker card with basic information', () => {
    render(<BrokerCard {...defaultProps} />);
    
    expect(screen.getByText('Zerodha Kite Account')).toBeInTheDocument();
    expect(screen.getByText('Zerodha')).toBeInTheDocument();
    expect(screen.getByText('SEBI Registered')).toBeInTheDocument();
    expect(screen.getByText('★★★★☆ (1250 reviews)')).toBeInTheDocument();
  });

  it('displays account types correctly', () => {
    render(<BrokerCard {...defaultProps} />);
    
    expect(screen.getByText('Demat Account')).toBeInTheDocument();
    expect(screen.getByText('Trading Account')).toBeInTheDocument();
  });

  it('shows brokerage charges', () => {
    render(<BrokerCard {...defaultProps} />);
    
    expect(screen.getByText('FREE')).toBeInTheDocument(); // Zero delivery brokerage
    expect(screen.getByText('0.03%')).toBeInTheDocument(); // Intraday brokerage
  });

  it('displays key features', () => {
    render(<BrokerCard {...defaultProps} />);
    
    expect(screen.getByText('Research Reports & Analysis')).toBeInTheDocument();
    expect(screen.getByText('Margin Trading Facility')).toBeInTheDocument();
    expect(screen.getByText('IPO Investment Access')).toBeInTheDocument();
    expect(screen.getByText('Mutual Fund Investment')).toBeInTheDocument();
  });

  it('shows SEBI registration details', () => {
    render(<BrokerCard {...defaultProps} />);
    
    expect(screen.getByText('INZ000031633')).toBeInTheDocument();
    expect(screen.getByText('31/12/2025')).toBeInTheDocument();
  });

  it('handles apply button click', async () => {
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', { value: mockOpen });

    render(<BrokerCard {...defaultProps} />);
    
    const applyButton = screen.getByText('Open Account');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        'https://example.com/apply?ref=test-tracking-id',
        '_blank'
      );
    });
  });

  it('renders in compact layout', () => {
    render(<BrokerCard {...defaultProps} layout="compact" />);
    
    // In compact layout, should show key info in a single row
    expect(screen.getByText('Zerodha Kite Account')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument(); // Account opening fee
    expect(screen.getByText('₹300')).toBeInTheDocument(); // Annual charges
  });

  it('shows selection checkbox when comparing', () => {
    const onSelect = jest.fn();
    render(
      <BrokerCard 
        {...defaultProps} 
        isComparing={true}
        onSelect={onSelect}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    
    fireEvent.click(checkbox);
    expect(onSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('displays recommendation badge when provided', () => {
    const recommendation = {
      productId: 'product-1',
      score: 95,
      reasons: ['Low brokerage charges', 'Excellent platform'],
      category: 'best_overall' as const,
    };

    render(
      <BrokerCard 
        {...defaultProps} 
        recommendation={recommendation}
      />
    );
    
    expect(screen.getByText('⭐ Best Overall (95% match)')).toBeInTheDocument();
  });

  it('shows recommendation reasons', () => {
    const recommendation = {
      productId: 'product-1',
      score: 95,
      reasons: ['Low brokerage charges', 'Excellent platform'],
      category: 'best_overall' as const,
    };

    render(
      <BrokerCard 
        {...defaultProps} 
        recommendation={recommendation}
      />
    );
    
    expect(screen.getByText('• Low brokerage charges')).toBeInTheDocument();
    expect(screen.getByText('• Excellent platform')).toBeInTheDocument();
  });

  it('handles expired SEBI registration', () => {
    const expiredProduct = {
      ...mockProduct,
      sebiRegistration: {
        ...mockProduct.sebiRegistration,
        isActive: false,
      },
    };

    render(<BrokerCard {...defaultProps} product={expiredProduct} />);
    
    expect(screen.getByText('⚠️ SEBI Registration Expired')).toBeInTheDocument();
  });

  it('shows popular badge for high priority brokers', () => {
    const popularProduct = {
      ...mockProduct,
      priority: 85,
    };

    render(<BrokerCard {...defaultProps} product={popularProduct} />);
    
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('expands additional features when clicked', () => {
    render(<BrokerCard {...defaultProps} />);
    
    const expandButton = screen.getByText('+2 more features');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Zero Brokerage: On delivery trades')).toBeInTheDocument();
    expect(screen.getByText('Advanced Charting: TradingView integration')).toBeInTheDocument();
  });
});