import { LoanProduct, LoanFilters, EligibilityCheck, EligibilityResult, EMICalculation, LoanApplication } from '@/types/loans';
import { IAffiliatePartner } from '@/types/database';

class LoanService {
  private baseUrl = '/api/loans';

  async getLoans(filters?: LoanFilters): Promise<{ products: LoanProduct[]; partners: IAffiliatePartner[] }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch loans: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getLoanById(id: string): Promise<{ product: LoanProduct; partner: IAffiliatePartner }> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch loan: ${response.statusText}`);
    }
    
    return response.json();
  }

  async checkEligibility(criteria: EligibilityCheck, productIds?: string[]): Promise<EligibilityResult[]> {
    const response = await fetch(`${this.baseUrl}/eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ criteria, productIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check eligibility: ${response.statusText}`);
    }
    
    return response.json();
  }

  calculateEMI(principal: number, interestRate: number, tenure: number, includeSchedule = false): EMICalculation {
    // Convert annual interest rate to monthly and percentage to decimal
    const monthlyRate = (interestRate / 100) / 12;
    
    // Calculate EMI using the formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalAmount = emi * tenure;
    const totalInterest = totalAmount - principal;
    
    const calculation: EMICalculation = {
      principal,
      interestRate,
      tenure,
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalAmount: Math.round(totalAmount),
    };

    if (includeSchedule) {
      calculation.amortizationSchedule = this.generateAmortizationSchedule(
        principal, 
        monthlyRate, 
        tenure, 
        emi
      );
    }

    return calculation;
  }

  private generateAmortizationSchedule(
    principal: number, 
    monthlyRate: number, 
    tenure: number, 
    emi: number
  ) {
    const schedule = [];
    let balance = principal;

    for (let month = 1; month <= tenure; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        emi: Math.round(emi),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(Math.max(0, balance)),
      });
    }

    return schedule;
  }

  async trackApplication(application: Omit<LoanApplication, 'trackingId' | 'applicationDate'>): Promise<LoanApplication> {
    const response = await fetch(`${this.baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(application),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to track application: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getApplications(userId?: string): Promise<LoanApplication[]> {
    const url = userId ? `${this.baseUrl}/applications?userId=${userId}` : `${this.baseUrl}/applications`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }
    
    return response.json();
  }

  async generateAffiliateLink(productId: string, userId?: string): Promise<{ trackingUrl: string; trackingId: string }> {
    const response = await fetch(`${this.baseUrl}/${productId}/affiliate-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate affiliate link: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      trackingUrl: data.data.trackingUrl,
      trackingId: data.data.trackingId
    };
  }

  async recordConversion(trackingId: string, conversionType: string, loanAmount?: number, metadata?: Record<string, any>): Promise<boolean> {
    const response = await fetch('/api/loans/conversions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingId,
        conversionType,
        conversionValue: loanAmount,
        loanAmount,
        metadata
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to record conversion: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  }

  async getCommissionAnalytics(partnerId?: string, startDate?: Date, endDate?: Date) {
    const queryParams = new URLSearchParams();
    if (partnerId) queryParams.append('partnerId', partnerId);
    if (startDate) queryParams.append('startDate', startDate.toISOString());
    if (endDate) queryParams.append('endDate', endDate.toISOString());

    const url = `/api/loans/commissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch commission analytics: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatPercentage(rate: number): string {
    return `${rate.toFixed(2)}%`;
  }

  getLoanTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      personal_loan: 'Personal Loan',
      home_loan: 'Home Loan',
      car_loan: 'Car Loan',
      business_loan: 'Business Loan',
    };
    return labels[type] || type;
  }

  getProcessingFee(product: LoanProduct): { amount: number; isPercentage: boolean } {
    const processingFee = product.fees.find(fee => fee.type === 'processing');
    return processingFee 
      ? { amount: processingFee.amount, isPercentage: processingFee.isPercentage }
      : { amount: 0, isPercentage: false };
  }
}

export const loanService = new LoanService();
export default loanService;