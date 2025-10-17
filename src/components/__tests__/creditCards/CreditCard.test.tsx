import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreditCard from '../../creditCards/CreditCard';
import { CreditCardProduct } from '@/types/creditCards';
import { IAffiliatePartner } from '@/types/database';
import creditCardService from '@/lib/services/creditCardService';

// Mock the credit card service
jest.mock('@/lib/services/creditCardService');
const mockCreditCardService = creditCardService as jest.Mocked<typeof creditCardService>;

describe('CreditCard Component', () => {
  const mockProduct: CreditCardProduct = {
    _id: '507f1f77bcf86cd799439011',
    partnerId: '507f1f77bcf86cd799439012',
    name: 'Test Rewards Card',
    type: 'credit_card',
    features: [
      { name: 'Reward Rate', value: '2% on all purchases', description: 'Earn 2% rewards' },
      { name: 'Annual Fee', value: 'Free for first year', description: 'No fee first year' },
      { name: 'Welcome Bonus', value: '5000 points', description: 'Sign up bonus' }
    ],
    eligibility: [
      { type: 'income', description: 'Minimum income ₹3L', minValue: 300000 }
    ],
    fees: [
      { type: 'annual', amount: 1000, description: 'Annual fee', isPercentage: false },
      { type: 'joining', amount: 0, description: 'Joining fee', isPercentage: false }
    ],
    applicationUrl: 'https://example.com/apply',
    isActive: true,
    priority: 85,
    description: 'Best rewards credit card',
    termsAndConditions: 'Terms apply',
    processingTime: '7-10 days',
    annualFee: 1000,
    joiningFee: 0,
    rewardRate: 2,
    cashbackRate: 0,
    cardNetwork: 'visa',
    cardType: 'premium',
    welcomeBonus: '5000 points'
  };

  const mockPartner: IAffiliatePartner = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Test Bank',
    type: 'credit_card',
    logoUrl: 'https://example.com/logo.png',
    description: 'Leading bank',
    website: 'https://testbank.com',
    contactEmail: 'contact@testbank.com',
    commissionStructure: {
      type: 'fixed',
      amount: 500,
      currency: 'INR'
    },
    trackingConfig: {
      conversionGoals: ['application_submitted'],
      attributionWindow: 30
    },
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreditCardService.getAnnualFee.mockReturnValue({ amount: 1000, isPercentage: false });
    mockCreditCardService.getJoiningFee.mockReturnValue({ amount: 0, isPercentage: false });
    mockCreditCardService.getRewardRate.mockReturnValue(2);
    mockCreditCardService.getCashbackRate.mockReturnValue(0);
    mockCreditCardService.getCardTypeLabel.mockReturnValue('Premium Card');
    mockCreditCardService.getCardNetworkLabel.mockReturnValue('Visa');
    mockCreditCardService.formatCurrency.mockImplementation((amount) => `₹${amount.toLocaleString('en-IN')}`);
  });

  it('renders credit card information correctly', () => {
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
      />
    );

    expect(screen.getByText('Test Rewards Card')).toBeInTheDocument();
    expect(screen.getByText('Test Bank')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument(); // Annual fee
    expect(screen.getByText('2% on purchases')).toBeInTheDocument(); // Reward rate
    expect(screen.getByText('7-10 days')).toBeInTheDocument(); // Processing time
  });

  it('shows free annual fee correctly', () => {
    mockCreditCardService.getAnnualFee.mockReturnValue({ amount: 0, isPercentage: false });
    
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
      />
    );

    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('displays welcome bonus when available', () => {
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
      />
    );

    expect(screen.getByText('Welcome Bonus')).toBeInTheDocument();
    expect(screen.getByText('5000 points')).toBeInTheDocument();
  });

  it('shows recommendation badge when recommendation is provided', () => {
    const recommendation = {
      productId: mockProduct._id.toString(),
      score: 85,
      reasons: ['High reward rate', 'No joining fee'],
      category: 'best_rewards' as const
    };

    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
        recommendation={recommendation}
      />
    );

    expect(screen.getByText(/Best Rewards/)).toBeInTheDocument();
    expect(screen.getByText(/85% match/)).toBeInTheDocument();
  });

  it('handles apply button click', async () => {
    const mockOnApply = jest.fn();
    
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
        onApply={mockOnApply}
      />
    );

    const applyButton = screen.getByText('Apply Now');
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith(mockProduct);
  });

  it('generates affiliate link when no onApply handler provided', async () => {
    mockCreditCardService.generateAffiliateLink.mockResolvedValue({
      trackingUrl: 'https://example.com/track/123',
      trackingId: 'track123'
    });
    mockCreditCardService.trackApplication.mockResolvedValue({
      productId: mockProduct._id.toString(),
      status: 'initiated',
      trackingId: 'track123',
      applicationDate: new Date(),
      redirectUrl: 'https://example.com/track/123'
    });

    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', { value: mockOpen });

    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
      />
    );

    const applyButton = screen.getByText('Apply Now');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockCreditCardService.generateAffiliateLink).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(mockCreditCardService.trackApplication).toHaveBeenCalled();
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/track/123', '_blank');
    });
  });

  it('handles selection checkbox when comparing', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
        isComparing={true}
        onSelect={mockOnSelect}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('renders in compact layout', () => {
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
        layout="compact"
      />
    );

    // In compact layout, the structure is different
    expect(screen.getByText('Test Rewards Card')).toBeInTheDocument();
    expect(screen.getByText('Annual Fee')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument(); // Shorter button text
  });

  it('shows popular badge for high priority products', () => {
    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
      />
    );

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('toggles additional features display', () => {
    const productWithManyFeatures = {
      ...mockProduct,
      features: [
        { name: 'Feature 1', value: 'Value 1' },
        { name: 'Feature 2', value: 'Value 2' },
        { name: 'Feature 3', value: 'Value 3' },
        { name: 'Feature 4', value: 'Value 4' },
        { name: 'Feature 5', value: 'Value 5' }
      ]
    };

    render(
      <CreditCard
        product={productWithManyFeatures}
        partner={mockPartner}
      />
    );

    expect(screen.getByText('+2 more benefits')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('+2 more benefits'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(screen.getByText('Feature 4: Value 4')).toBeInTheDocument();
  });

  it('displays recommendation reasons when available', () => {
    const recommendation = {
      productId: mockProduct._id.toString(),
      score: 85,
      reasons: ['High reward rate: 2% on purchases', 'No joining fee'],
      category: 'best_rewards' as const
    };

    render(
      <CreditCard
        product={mockProduct}
        partner={mockPartner}
        recommendation={recommendation}
      />
    );

    expect(screen.getByText('Why this card is recommended:')).toBeInTheDocument();
    expect(screen.getByText('• High reward rate: 2% on purchases')).toBeInTheDocument();
    expect(screen.getByText('• No joining fee')).toBeInTheDocument();
  });
});