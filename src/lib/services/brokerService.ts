import axios from 'axios';
import { BrokerProduct, BrokerFilters, BrokerApplication, BrokerRecommendation, TradingProfile, BrokerageCalculation } from '@/types/brokers';
import { IAffiliatePartner } from '@/types/database';

class BrokerService {
  private baseURL = '/api/brokers';

  // Get brokers with filters
  async getBrokers(filters: BrokerFilters = {}) {
    try {
      const response = await axios.get(`${this.baseURL}`, { params: filters });
      return {
        products: response.data.products as BrokerProduct[],
        partners: response.data.partners as IAffiliatePartner[],
        total: response.data.total as number,
      };
    } catch (error) {
      console.error('Failed to fetch brokers:', error);
      throw new Error('Failed to fetch brokers');
    }
  }

  // Get single broker by ID
  async getBrokerById(id: string): Promise<{ product: BrokerProduct; partner: IAffiliatePartner }> {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch broker:', error);
      throw new Error('Failed to fetch broker details');
    }
  }

  // Generate affiliate link for broker application
  async generateAffiliateLink(productId: string, userId?: string) {
    try {
      const response = await axios.post(`${this.baseURL}/${productId}/affiliate-link`, {
        userId,
        source: 'broker_directory',
      });
      return {
        trackingId: response.data.trackingId as string,
        trackingUrl: response.data.trackingUrl as string,
      };
    } catch (error) {
      console.error('Failed to generate affiliate link:', error);
      throw new Error('Failed to generate application link');
    }
  }

  // Track broker application
  async trackApplication(trackingId: string, applicationData: Partial<BrokerApplication>) {
    try {
      await axios.post(`${this.baseURL}/track-application`, {
        trackingId,
        ...applicationData,
      });
    } catch (error) {
      console.error('Failed to track application:', error);
      // Don't throw error for tracking failures
    }
  }

  // Get broker recommendations based on trading profile
  async getRecommendations(profile: TradingProfile, products: BrokerProduct[]): Promise<BrokerRecommendation[]> {
    try {
      const response = await axios.post(`${this.baseURL}/recommendations`, {
        profile,
        productIds: products.map(p => p._id),
      });
      return response.data.recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      // Return fallback recommendations based on simple scoring
      return this.generateFallbackRecommendations(profile, products);
    }
  }

  // Calculate brokerage for a transaction
  calculateBrokerage(product: BrokerProduct, segment: string, transactionType: string, amount: number, quantity?: number): BrokerageCalculation {
    let brokerageAmount = 0;
    const { brokerage } = product;

    switch (segment) {
      case 'equity':
        if (transactionType === 'delivery') {
          brokerageAmount = brokerage.equity.isPercentage 
            ? (amount * brokerage.equity.delivery) / 100
            : brokerage.equity.delivery;
        } else if (transactionType === 'intraday') {
          brokerageAmount = brokerage.equity.isPercentage 
            ? (amount * brokerage.equity.intraday) / 100
            : brokerage.equity.intraday;
        }
        break;
      case 'derivatives':
        if (transactionType === 'futures') {
          brokerageAmount = brokerage.derivatives.isPercentage 
            ? (amount * brokerage.derivatives.futures) / 100
            : brokerage.derivatives.futures;
        } else if (transactionType === 'options') {
          brokerageAmount = brokerage.derivatives.isPercentage 
            ? (amount * brokerage.derivatives.options) / 100
            : brokerage.derivatives.options;
        }
        break;
      case 'currency':
        brokerageAmount = brokerage.currency.isPercentage 
          ? (amount * brokerage.currency.rate) / 100
          : brokerage.currency.rate;
        break;
      case 'commodity':
        brokerageAmount = brokerage.commodity.isPercentage 
          ? (amount * brokerage.commodity.rate) / 100
          : brokerage.commodity.rate;
        break;
    }

    // Calculate taxes (simplified calculation)
    const stt = this.calculateSTT(segment, transactionType, amount);
    const exchangeCharges = amount * 0.0000325; // Approximate
    const sebiCharges = amount * 0.000001; // Approximate
    const stampDuty = segment === 'equity' && transactionType === 'delivery' ? amount * 0.00015 : 0;
    const gst = (brokerageAmount + exchangeCharges + sebiCharges) * 0.18;

    const taxes = {
      stt,
      exchangeCharges,
      gst,
      sebiCharges,
      stampDuty,
    };

    const totalCharges = brokerageAmount + Object.values(taxes).reduce((sum, tax) => sum + tax, 0);

    return {
      segment: segment as any,
      transactionType: transactionType as any,
      amount,
      quantity,
      brokerageAmount,
      taxes,
      totalCharges,
    };
  }

  // Helper method to calculate STT
  private calculateSTT(segment: string, transactionType: string, amount: number): number {
    if (segment === 'equity') {
      return transactionType === 'delivery' ? amount * 0.001 : amount * 0.00025;
    } else if (segment === 'derivatives') {
      return transactionType === 'futures' ? amount * 0.0001 : amount * 0.0005;
    }
    return 0;
  }

  // Generate fallback recommendations when API fails
  private generateFallbackRecommendations(profile: TradingProfile, products: BrokerProduct[]): BrokerRecommendation[] {
    return products.map(product => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Score based on experience level
      if (profile.experience === 'beginner') {
        if (product.researchReports) {
          score += 15;
          reasons.push('Provides research reports for beginners');
        }
        if (product.accountCharges.opening === 0) {
          score += 10;
          reasons.push('No account opening charges');
        }
      } else if (profile.experience === 'advanced') {
        if (product.platforms.api) {
          score += 15;
          reasons.push('API access for advanced trading');
        }
        if (product.marginFunding) {
          score += 10;
          reasons.push('Margin funding available');
        }
      }

      // Score based on cost sensitivity
      if (profile.costSensitivity === 'high') {
        if (product.brokerage.equity.delivery < 0.5) {
          score += 20;
          reasons.push('Low brokerage charges');
        }
        if (product.accountCharges.maintenance < 500) {
          score += 10;
          reasons.push('Low maintenance charges');
        }
      }

      // Score based on platform preference
      profile.platformPreference.forEach(platform => {
        if (product.platforms[platform as keyof typeof product.platforms]) {
          score += 5;
          reasons.push(`Supports ${platform} platform`);
        }
      });

      // Score based on segments
      profile.preferredSegments.forEach(segment => {
        if (segment === 'mutual_funds' && product.mutualFunds) {
          score += 10;
          reasons.push('Mutual fund investment available');
        }
      });

      // Cap score at 100
      score = Math.min(score, 100);

      // Determine category
      let category: BrokerRecommendation['category'] = 'best_overall';
      if (profile.costSensitivity === 'high') category = 'best_discount';
      else if (profile.needsResearch) category = 'best_research';
      else if (profile.experience === 'beginner') category = 'best_beginner';
      else if (profile.experience === 'advanced') category = 'best_advanced';

      return {
        productId: product._id.toString(),
        score,
        reasons: reasons.slice(0, 3), // Limit to top 3 reasons
        category,
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Utility methods for formatting and labels
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatBrokerage(brokerage: number, isPercentage: boolean): string {
    if (brokerage === 0) return 'Free';
    return isPercentage ? `${brokerage}%` : this.formatCurrency(brokerage);
  }

  getAccountTypeLabel(type: string): string {
    const labels = {
      'demat': 'Demat Account',
      'trading': 'Trading Account',
      'commodity': 'Commodity Trading',
      'currency': 'Currency Trading',
      'mutual_fund': 'Mutual Fund Investment',
    };
    return labels[type as keyof typeof labels] || type;
  }

  getPlatformLabel(platform: string): string {
    const labels = {
      'web': 'Web Platform',
      'mobile': 'Mobile App',
      'desktop': 'Desktop Software',
      'api': 'API Access',
    };
    return labels[platform as keyof typeof labels] || platform;
  }

  getExperienceLabel(experience: string): string {
    const labels = {
      'beginner': 'Beginner (0-1 years)',
      'intermediate': 'Intermediate (1-3 years)',
      'advanced': 'Advanced (3+ years)',
    };
    return labels[experience as keyof typeof labels] || experience;
  }

  getTradingFrequencyLabel(frequency: string): string {
    const labels = {
      'occasional': 'Occasional (Few times a year)',
      'regular': 'Regular (Monthly)',
      'frequent': 'Frequent (Weekly)',
      'day_trader': 'Day Trader (Daily)',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  }

  // Validate SEBI registration
  validateSebiRegistration(sebiNumber: string): boolean {
    // Basic validation for SEBI registration number format
    const sebiPattern = /^INZ\d{9}$/;
    return sebiPattern.test(sebiNumber);
  }

  // Get broker rating stars
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }
}

const brokerService = new BrokerService();
export default brokerService;