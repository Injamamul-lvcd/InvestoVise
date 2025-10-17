import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { Product } from '@/models';
import { EligibilityCheck, EligibilityResult } from '@/types/loans';
import { validateRequest } from '@/lib/middleware/validation';

// POST /api/loans/eligibility - Check loan eligibility
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, {
      criteria: { required: true, type: 'object' },
      productIds: { required: false, type: 'array' }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { criteria, productIds }: { criteria: EligibilityCheck; productIds?: string[] } = body;

    // Build filter for loan products
    const filter: any = {
      isActive: true,
      type: { $in: ['personal_loan', 'home_loan', 'car_loan', 'business_loan'] }
    };

    // If specific product IDs are provided, filter by them
    if (productIds && productIds.length > 0) {
      filter._id = { $in: productIds };
    }

    // Get loan products
    const products = await Product.find(filter).populate('partnerId', 'name logoUrl');

    // Check eligibility for each product
    const eligibilityResults: EligibilityResult[] = products.map(product => {
      const result = checkProductEligibility(product, criteria);
      return {
        productId: product._id.toString(),
        eligible: result.eligible,
        score: result.score,
        reasons: result.reasons,
        recommendations: result.recommendations
      };
    });

    // Sort by eligibility score (highest first)
    eligibilityResults.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      data: {
        eligibilityResults,
        criteria,
        totalProducts: products.length,
        eligibleProducts: eligibilityResults.filter(r => r.eligible).length
      },
      message: 'Eligibility check completed successfully'
    });

  } catch (error) {
    console.error('Error checking loan eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check loan eligibility' },
      { status: 500 }
    );
  }
}

// Helper function to check eligibility for a specific product
function checkProductEligibility(product: any, criteria: EligibilityCheck): {
  eligible: boolean;
  score: number;
  reasons: string[];
  recommendations: string[];
} {
  let score = 100;
  const reasons: string[] = [];
  const recommendations: string[] = [];
  let eligible = true;

  // Check age requirements
  if (criteria.age) {
    const ageRequirement = product.eligibility.find((req: any) => req.type === 'age');
    if (ageRequirement) {
      if (ageRequirement.minValue && criteria.age < ageRequirement.minValue) {
        eligible = false;
        score -= 30;
        reasons.push(`Minimum age requirement: ${ageRequirement.minValue} years`);
      }
      if (ageRequirement.maxValue && criteria.age > ageRequirement.maxValue) {
        eligible = false;
        score -= 30;
        reasons.push(`Maximum age limit: ${ageRequirement.maxValue} years`);
      }
    }
  }

  // Check income requirements
  if (criteria.annualIncome) {
    const incomeRequirement = product.eligibility.find((req: any) => req.type === 'income');
    if (incomeRequirement && incomeRequirement.minValue) {
      if (criteria.annualIncome < incomeRequirement.minValue) {
        eligible = false;
        score -= 40;
        reasons.push(`Minimum income requirement: ₹${incomeRequirement.minValue.toLocaleString('en-IN')} per annum`);
      } else if (criteria.annualIncome < incomeRequirement.minValue * 1.5) {
        score -= 10;
        recommendations.push('Consider improving your income for better loan terms');
      }
    }
  }

  // Check credit score requirements
  if (criteria.creditScore) {
    const creditRequirement = product.eligibility.find((req: any) => req.type === 'credit_score');
    if (creditRequirement && creditRequirement.minValue) {
      if (criteria.creditScore < creditRequirement.minValue) {
        eligible = false;
        score -= 35;
        reasons.push(`Minimum credit score requirement: ${creditRequirement.minValue}`);
      } else if (criteria.creditScore < creditRequirement.minValue + 50) {
        score -= 15;
        recommendations.push('Improve your credit score for better interest rates');
      }
    }
  }

  // Check employment type
  if (criteria.employmentType) {
    const employmentRequirement = product.eligibility.find((req: any) => req.type === 'employment');
    if (employmentRequirement) {
      // This is a simplified check - in reality, you'd have more complex logic
      if (criteria.employmentType === 'self_employed' && product.type === 'personal_loan') {
        score -= 5;
        recommendations.push('Self-employed applicants may need additional documentation');
      }
    }
  }

  // Check work experience
  if (criteria.workExperience !== undefined) {
    if (criteria.workExperience < 2) {
      score -= 10;
      recommendations.push('Longer work experience may improve your eligibility');
    }
  }

  // Check existing loans
  if (criteria.existingLoans !== undefined && criteria.existingLoans > 3) {
    score -= 15;
    recommendations.push('Consider consolidating existing loans');
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    eligible,
    score,
    reasons,
    recommendations
  };
}