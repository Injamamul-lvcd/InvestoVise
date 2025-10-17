import { 
  CreditCardProduct, 
  CreditCardFilters, 
  CreditCardRecommendation, 
  SpendingProfile,
  CreditCardApplication 
} from '@/types/creditCards';
import { IAffiliatePartner } from '@/types/database';
import AffiliateClick from '@/models/AffiliateClick';

class CreditCardService {
  /**
   * Get credit cards with filters
   */
  async getCreditCards(filters: CreditCardFilters = {}) {
    try {
      // For demo purposes, return mock data
      // In production, this would query the database
      const mockProducts = this.getMockCreditCards();
      const mockPartners = this.getMockPartners();
      
      // Apply filters to mock data
      let filteredProducts = mockProducts;
      
      if (filters.cardType && filters.cardType !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.cardType === filters.cardType);
      }
      
      if (filters.cardNetwork && filters.cardNetwork !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.cardNetwork === filters.cardNetwork);
      }
      
      if (filters.maxAnnualFee !== undefined) {
        filteredProducts = filteredProducts.filter(p => {
          const annualFee = this.getAnnualFee(p).amount;
          return annualFee <= filters.maxAnnualFee!;
        });
      }
      
      if (filters.hasRewards) {
        filteredProducts = filteredProducts.filter(p => 
          p.features.some(f => f.name.toLowerCase().includes('reward'))
        );
      }
      
      if (filters.hasCashback) {
        filteredProducts = filteredProducts.filter(p => 
          p.features.some(f => f.name.toLowerCase().includes('cashback'))
        );
      }
      
      if (filters.hasWelcomeBonus) {
        filteredProducts = filteredProducts.filter(p => 
          p.features.some(f => f.name.toLowerCase().includes('welcome') || f.name.toLowerCase().includes('bonus'))
        );
      }
      
      // Sort products
      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          switch (filters.sortBy) {
            case 'annualFee':
              return (this.getAnnualFee(a).amount - this.getAnnualFee(b).amount) * order;
            case 'popularity':
              return (b.priority - a.priority) * order;
            case 'creditLimit':
              return ((b.maxAmount || 0) - (a.maxAmount || 0)) * order;
            default:
              return 0;
          }
        });
      }
      
      return {
        products: filteredProducts.map(product => this.transformProduct(product)),
        partners: mockPartners,
        total: filteredProducts.length
      };
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      throw new Error('Failed to fetch credit cards');
    }
  }
  
  /**
   * Generate credit card recommendations based on spending profile
   */
  async generateRecommendations(
    spendingProfile: SpendingProfile, 
    products: CreditCardProduct[]
  ): Promise<CreditCardRecommendation[]> {
    const recommendations: CreditCardRecommendation[] = [];
    
    for (const product of products) {
      const score = this.calculateRecommendationScore(product, spendingProfile);
      const reasons = this.generateRecommendationReasons(product, spendingProfile);
      const category = this.determineRecommendationCategory(product, spendingProfile);
      
      recommendations.push({
        productId: product._id.toString(),
        score,
        reasons,
        category
      });
    }
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  
  /**
   * Generate affiliate tracking link for credit card application
   */
  async generateAffiliateLink(productId: string, userId?: string): Promise<{ trackingUrl: string; trackingId: string }> {
    // Import here to avoid circular dependency
    const creditCardAffiliateService = (await import('./creditCardAffiliateService')).default;
    return creditCardAffiliateService.generateTrackingLink(productId, userId);
  }
  
  /**
   * Track credit card application
   */
  async trackApplication(trackingId: string, application: Partial<CreditCardApplication>): Promise<void> {
    // Import here to avoid circular dependency
    const creditCardAffiliateService = (await import('./creditCardAffiliateService')).default;
    return creditCardAffiliateService.trackApplication(trackingId, application);
  }
  
  /**
   * Get credit card type label
   */
  getCardTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'basic': 'Basic Card',
      'premium': 'Premium Card',
      'super_premium': 'Super Premium',
      'business': 'Business Card'
    };
    return labels[type] || type;
  }
  
  /**
   * Get card network label
   */
  getCardNetworkLabel(network: string): string {
    const labels: Record<string, string> = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'rupay': 'RuPay',
      'amex': 'American Express'
    };
    return labels[network] || network;
  }
  
  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  /**
   * Format percentage
   */
  formatPercentage(rate: number): string {
    return `${rate.toFixed(1)}%`;
  }
  
  /**
   * Get annual fee from product
   */
  getAnnualFee(product: CreditCardProduct): { amount: number; isPercentage: boolean; waiver?: string } {
    const annualFee = product.fees.find(fee => fee.type === 'annual');
    return annualFee || { amount: 0, isPercentage: false };
  }
  
  /**
   * Get joining fee from product
   */
  getJoiningFee(product: CreditCardProduct): { amount: number; isPercentage: boolean; waiver?: string } {
    const joiningFee = product.fees.find(fee => fee.type === 'joining');
    return joiningFee || { amount: 0, isPercentage: false };
  }
  
  /**
   * Get reward rate from product features
   */
  getRewardRate(product: CreditCardProduct): number {
    const rewardFeature = product.features.find(f => 
      f.name.toLowerCase().includes('reward') || 
      f.name.toLowerCase().includes('points')
    );
    
    if (rewardFeature) {
      const match = rewardFeature.value.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return 0;
  }
  
  /**
   * Get cashback rate from product features
   */
  getCashbackRate(product: CreditCardProduct): number {
    const cashbackFeature = product.features.find(f => 
      f.name.toLowerCase().includes('cashback')
    );
    
    if (cashbackFeature) {
      const match = cashbackFeature.value.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return 0;
  }
  
  // Private helper methods
  private transformProduct(product: any): CreditCardProduct {
    return {
      ...product,
      annualFee: this.extractFeeAmount(product.fees, 'annual'),
      joiningFee: this.extractFeeAmount(product.fees, 'joining'),
      rewardRate: this.extractRewardRate(product.features),
      cashbackRate: this.extractCashbackRate(product.features),
      cardNetwork: this.extractCardNetwork(product.features),
      cardType: this.extractCardType(product.features),
      welcomeBonus: this.extractWelcomeBonus(product.features)
    };
  }
  
  private extractFeeAmount(fees: any[], type: string): number {
    const fee = fees.find(f => f.type === type);
    return fee ? fee.amount : 0;
  }
  
  private extractRewardRate(features: any[]): number {
    const rewardFeature = features.find(f => 
      f.name.toLowerCase().includes('reward') || 
      f.name.toLowerCase().includes('points')
    );
    
    if (rewardFeature) {
      const match = rewardFeature.value.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return 0;
  }
  
  private extractCashbackRate(features: any[]): number {
    const cashbackFeature = features.find(f => 
      f.name.toLowerCase().includes('cashback')
    );
    
    if (cashbackFeature) {
      const match = cashbackFeature.value.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return 0;
  }
  
  private extractCardNetwork(features: any[]): 'visa' | 'mastercard' | 'rupay' | 'amex' {
    const networkFeature = features.find(f => 
      f.name.toLowerCase().includes('network') || 
      f.name.toLowerCase().includes('brand')
    );
    
    if (networkFeature) {
      const value = networkFeature.value.toLowerCase();
      if (value.includes('visa')) return 'visa';
      if (value.includes('mastercard')) return 'mastercard';
      if (value.includes('rupay')) return 'rupay';
      if (value.includes('amex') || value.includes('american express')) return 'amex';
    }
    
    return 'visa'; // Default
  }
  
  private extractCardType(features: any[]): 'basic' | 'premium' | 'super_premium' | 'business' {
    const typeFeature = features.find(f => 
      f.name.toLowerCase().includes('type') || 
      f.name.toLowerCase().includes('category')
    );
    
    if (typeFeature) {
      const value = typeFeature.value.toLowerCase();
      if (value.includes('business')) return 'business';
      if (value.includes('super premium') || value.includes('super-premium')) return 'super_premium';
      if (value.includes('premium')) return 'premium';
      if (value.includes('basic')) return 'basic';
    }
    
    return 'basic'; // Default
  }
  
  private extractWelcomeBonus(features: any[]): string | undefined {
    const bonusFeature = features.find(f => 
      f.name.toLowerCase().includes('welcome') || 
      f.name.toLowerCase().includes('bonus') ||
      f.name.toLowerCase().includes('signup')
    );
    
    return bonusFeature?.value;
  }
  
  private calculateRecommendationScore(
    product: CreditCardProduct, 
    profile: SpendingProfile
  ): number {
    let score = 50; // Base score
    
    // Annual fee preference
    const annualFee = this.getAnnualFee(product).amount;
    switch (profile.annualFeePreference) {
      case 'free':
        score += annualFee === 0 ? 20 : -20;
        break;
      case 'low':
        score += annualFee <= 1000 ? 15 : -10;
        break;
      case 'medium':
        score += annualFee <= 5000 ? 10 : -5;
        break;
      case 'high':
        score += annualFee > 5000 ? 10 : 0;
        break;
    }
    
    // Benefit preferences
    const rewardRate = this.getRewardRate(product);
    const cashbackRate = this.getCashbackRate(product);
    
    if (profile.preferredBenefits.includes('rewards') && rewardRate > 0) {
      score += Math.min(rewardRate * 5, 20);
    }
    
    if (profile.preferredBenefits.includes('cashback') && cashbackRate > 0) {
      score += Math.min(cashbackRate * 10, 20);
    }
    
    // Monthly spend alignment
    if (profile.monthlySpend > 50000 && product.cardType === 'premium') {
      score += 15;
    } else if (profile.monthlySpend < 20000 && product.cardType === 'basic') {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private generateRecommendationReasons(
    product: CreditCardProduct, 
    profile: SpendingProfile
  ): string[] {
    const reasons: string[] = [];
    
    const annualFee = this.getAnnualFee(product).amount;
    const rewardRate = this.getRewardRate(product);
    const cashbackRate = this.getCashbackRate(product);
    
    if (annualFee === 0) {
      reasons.push('No annual fee');
    }
    
    if (rewardRate > 1) {
      reasons.push(`High reward rate: ${rewardRate}% on purchases`);
    }
    
    if (cashbackRate > 1) {
      reasons.push(`Good cashback: ${cashbackRate}% on purchases`);
    }
    
    if (product.welcomeBonus) {
      reasons.push(`Welcome bonus: ${product.welcomeBonus}`);
    }
    
    if (profile.monthlySpend > 50000 && product.cardType === 'premium') {
      reasons.push('Premium benefits match your high spending');
    }
    
    return reasons;
  }
  
  private determineRecommendationCategory(
    product: CreditCardProduct, 
    profile: SpendingProfile
  ): 'best_overall' | 'best_rewards' | 'best_cashback' | 'best_premium' | 'best_beginner' {
    const rewardRate = this.getRewardRate(product);
    const cashbackRate = this.getCashbackRate(product);
    const annualFee = this.getAnnualFee(product).amount;
    
    if (rewardRate > 2) return 'best_rewards';
    if (cashbackRate > 2) return 'best_cashback';
    if (product.cardType === 'premium' || product.cardType === 'super_premium') return 'best_premium';
    if (annualFee === 0 && product.cardType === 'basic') return 'best_beginner';
    
    return 'best_overall';
  }
  
  private generateTrackingId(): string {
    return `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get mock credit card data for demo
   */
  private getMockCreditCards(): CreditCardProduct[] {
    return [
      {
        _id: 'mock-cc-1' as any,
        partnerId: 'partner-hdfc' as any,
        name: 'HDFC Regalia Credit Card',
        description: 'Premium lifestyle credit card with exclusive rewards and benefits',
        type: 'credit_card',
        cardType: 'premium',
        cardNetwork: 'visa',
        minAmount: 50000,
        maxAmount: 500000,
        interestRate: 3.5,
        processingTime: '7-10 business days',
        features: [
          { name: 'Reward Points', value: '4 points per ₹150 spent', description: 'Earn reward points on all purchases' },
          { name: 'Welcome Bonus', value: '10,000 points', description: 'Welcome bonus on card activation' },
          { name: 'Airport Lounge Access', value: 'Unlimited domestic', description: 'Free access to airport lounges' },
          { name: 'Fuel Surcharge Waiver', value: '1% waiver', description: 'Fuel surcharge waiver up to ₹250/month' }
        ],
        fees: [
          { type: 'annual', amount: 2500, isPercentage: false, description: 'Annual fee' },
          { type: 'joining', amount: 2500, isPercentage: false, description: 'One-time joining fee' }
        ],
        eligibility: [
          { type: 'income', value: '600000', description: 'Minimum annual income ₹6 lakhs' },
          { type: 'age', value: '21-65', description: 'Age between 21-65 years' },
          { type: 'credit_score', value: '750', description: 'CIBIL score 750+' }
        ],
        applicationUrl: 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia',
        isActive: true,
        priority: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'mock-cc-2' as any,
        partnerId: 'partner-sbi' as any,
        name: 'SBI SimplyCLICK Credit Card',
        description: 'Online shopping credit card with accelerated rewards on e-commerce',
        type: 'credit_card',
        cardType: 'basic',
        cardNetwork: 'visa',
        minAmount: 25000,
        maxAmount: 200000,
        interestRate: 3.35,
        processingTime: '5-7 business days',
        features: [
          { name: 'Online Shopping Rewards', value: '10X points', description: '10X reward points on online shopping' },
          { name: 'Welcome Bonus', value: '2,000 points', description: 'Welcome bonus on first transaction' },
          { name: 'Cashback', value: '1% on all spends', description: 'Cashback on all purchases' },
          { name: 'Movie Tickets', value: '₹100 off', description: 'Discount on movie ticket bookings' }
        ],
        fees: [
          { type: 'annual', amount: 499, isPercentage: false, description: 'Annual fee (waived on ₹1L spend)' },
          { type: 'joining', amount: 499, isPercentage: false, description: 'Joining fee (waived on first transaction)' }
        ],
        eligibility: [
          { type: 'income', value: '300000', description: 'Minimum annual income ₹3 lakhs' },
          { type: 'age', value: '18-65', description: 'Age between 18-65 years' },
          { type: 'credit_score', value: '700', description: 'CIBIL score 700+' }
        ],
        applicationUrl: 'https://www.sbi.co.in/web/personal-banking/cards/credit-cards/simplyclick',
        isActive: true,
        priority: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'mock-cc-3' as any,
        partnerId: 'partner-icici' as any,
        name: 'ICICI Amazon Pay Credit Card',
        description: 'Co-branded credit card with Amazon for enhanced online shopping benefits',
        type: 'credit_card',
        cardType: 'basic',
        cardNetwork: 'visa',
        minAmount: 30000,
        maxAmount: 300000,
        interestRate: 3.4,
        processingTime: '3-5 business days',
        features: [
          { name: 'Amazon Cashback', value: '5% on Amazon', description: '5% cashback on Amazon purchases' },
          { name: 'Other Online Cashback', value: '2% on online', description: '2% cashback on other online purchases' },
          { name: 'Welcome Bonus', value: '₹2,000 Amazon voucher', description: 'Amazon voucher on card approval' },
          { name: 'No Annual Fee', value: 'Lifetime free', description: 'No annual fee for lifetime' }
        ],
        fees: [
          { type: 'annual', amount: 0, isPercentage: false, description: 'Lifetime free' },
          { type: 'joining', amount: 0, isPercentage: false, description: 'No joining fee' }
        ],
        eligibility: [
          { type: 'income', value: '300000', description: 'Minimum annual income ₹3 lakhs' },
          { type: 'age', value: '18-65', description: 'Age between 18-65 years' },
          { type: 'credit_score', value: '700', description: 'CIBIL score 700+' }
        ],
        applicationUrl: 'https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay',
        isActive: true,
        priority: 95,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get mock partner data for demo
   */
  private getMockPartners(): IAffiliatePartner[] {
    return [
      {
        _id: 'partner-hdfc' as any,
        name: 'HDFC Bank',
        type: 'credit_card',
        apiEndpoint: 'https://api.hdfcbank.com/affiliate',
        commissionStructure: {
          type: 'fixed',
          amount: 1500,
          currency: 'INR'
        },
        isActive: true,
        logoUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop',
        description: 'Leading private sector bank in India',
        products: [],
        trackingConfig: {
          clickTrackingEnabled: true,
          conversionTrackingEnabled: true,
          cookieDuration: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'partner-sbi' as any,
        name: 'State Bank of India',
        type: 'credit_card',
        apiEndpoint: 'https://api.sbi.co.in/affiliate',
        commissionStructure: {
          type: 'fixed',
          amount: 1200,
          currency: 'INR'
        },
        isActive: true,
        logoUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=200&h=100&fit=crop',
        description: 'Largest public sector bank in India',
        products: [],
        trackingConfig: {
          clickTrackingEnabled: true,
          conversionTrackingEnabled: true,
          cookieDuration: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'partner-icici' as any,
        name: 'ICICI Bank',
        type: 'credit_card',
        apiEndpoint: 'https://api.icicibank.com/affiliate',
        commissionStructure: {
          type: 'fixed',
          amount: 1800,
          currency: 'INR'
        },
        isActive: true,
        logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&h=100&fit=crop',
        description: 'Leading private sector bank with digital focus',
        products: [],
        trackingConfig: {
          clickTrackingEnabled: true,
          conversionTrackingEnabled: true,
          cookieDuration: 30
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

const creditCardService = new CreditCardService();
export default creditCardService;