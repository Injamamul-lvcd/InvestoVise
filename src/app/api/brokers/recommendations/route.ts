import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database/connection';
import Product from '@/models/Product';
import { TradingProfile, BrokerRecommendation } from '@/types/brokers';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { profile, productIds }: { profile: TradingProfile; productIds: string[] } = body;

    // Get the products
    const products = await Product.find({
      _id: { $in: productIds },
      type: 'broker_account',
      isActive: true,
    }).lean();

    // Generate recommendations based on the trading profile
    const recommendations: BrokerRecommendation[] = products.map(product => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Score based on experience level
      if (profile.experience === 'beginner') {
        if (product.researchReports) {
          score += 15;
          reasons.push('Provides research reports perfect for beginners');
        }
        if (product.accountCharges.opening === 0) {
          score += 10;
          reasons.push('No account opening charges');
        }
        if (product.brokerage.equity.delivery <= 0.5) {
          score += 10;
          reasons.push('Low brokerage charges suitable for learning');
        }
        // Prefer simpler platforms for beginners
        if (product.platforms.mobile && product.platforms.web) {
          score += 8;
          reasons.push('Easy-to-use mobile and web platforms');
        }
      } else if (profile.experience === 'intermediate') {
        if (product.researchReports) {
          score += 10;
          reasons.push('Research reports to enhance your trading');
        }
        if (product.marginFunding) {
          score += 8;
          reasons.push('Margin trading for leveraged positions');
        }
        if (product.platforms.desktop) {
          score += 5;
          reasons.push('Advanced desktop platform available');
        }
      } else if (profile.experience === 'advanced') {
        if (product.platforms.api) {
          score += 20;
          reasons.push('API access for algorithmic trading');
        }
        if (product.marginFunding) {
          score += 15;
          reasons.push('Margin funding for advanced strategies');
        }
        if (product.platforms.desktop) {
          score += 10;
          reasons.push('Professional desktop trading platform');
        }
        if (product.brokerage.derivatives.futures <= 20 && product.brokerage.derivatives.options <= 20) {
          score += 8;
          reasons.push('Competitive derivatives pricing');
        }
      }

      // Score based on trading frequency
      if (profile.tradingFrequency === 'day_trader' || profile.tradingFrequency === 'frequent') {
        if (product.brokerage.equity.intraday <= 0.05) {
          score += 20;
          reasons.push('Very low intraday brokerage for frequent trading');
        }
        if (product.platforms.desktop || product.platforms.api) {
          score += 15;
          reasons.push('Advanced platforms for active trading');
        }
      } else if (profile.tradingFrequency === 'occasional') {
        if (product.accountCharges.maintenance <= 300) {
          score += 15;
          reasons.push('Low annual maintenance charges for occasional traders');
        }
      }

      // Score based on cost sensitivity
      if (profile.costSensitivity === 'high') {
        if (product.brokerage.equity.delivery === 0) {
          score += 25;
          reasons.push('Zero brokerage on delivery trades');
        } else if (product.brokerage.equity.delivery <= 0.25) {
          score += 20;
          reasons.push('Very low brokerage charges');
        }
        
        if (product.accountCharges.opening === 0) {
          score += 15;
          reasons.push('No account opening fees');
        }
        
        const totalAnnualCharges = product.accountCharges.maintenance + product.accountCharges.demat;
        if (totalAnnualCharges <= 500) {
          score += 15;
          reasons.push('Low annual maintenance charges');
        }
      } else if (profile.costSensitivity === 'low') {
        // Focus more on features than cost
        if (product.researchReports) {
          score += 15;
          reasons.push('Premium research and analysis');
        }
        if (product.rating >= 4.5) {
          score += 10;
          reasons.push('Highly rated broker with excellent service');
        }
      }

      // Score based on investment amount
      if (profile.investmentAmount >= 1000000) { // High investment
        if (product.marginFunding) {
          score += 10;
          reasons.push('Margin facilities for large investments');
        }
        if (product.researchReports) {
          score += 8;
          reasons.push('Research support for portfolio management');
        }
      } else if (profile.investmentAmount <= 50000) { // Small investment
        if (product.accountCharges.opening === 0 && product.accountCharges.maintenance <= 300) {
          score += 15;
          reasons.push('Low charges suitable for small investments');
        }
      }

      // Score based on preferred segments
      profile.preferredSegments.forEach(segment => {
        switch (segment) {
          case 'equity':
            if (product.brokerage.equity.delivery <= 0.5) {
              score += 8;
              reasons.push('Competitive equity trading charges');
            }
            break;
          case 'derivatives':
            if (product.brokerage.derivatives.futures <= 20 && product.brokerage.derivatives.options <= 20) {
              score += 10;
              reasons.push('Good derivatives trading rates');
            }
            break;
          case 'mutual_funds':
            if (product.mutualFunds) {
              score += 12;
              reasons.push('Direct mutual fund investment available');
            }
            break;
          case 'currency':
            if (product.brokerage.currency.rate <= 0.05) {
              score += 8;
              reasons.push('Competitive currency trading rates');
            }
            break;
          case 'commodity':
            if (product.brokerage.commodity.rate <= 0.05) {
              score += 8;
              reasons.push('Good commodity trading charges');
            }
            break;
        }
      });

      // Score based on research needs
      if (profile.needsResearch && product.researchReports) {
        score += 15;
        reasons.push('Comprehensive research reports and market analysis');
      }

      // Score based on margin needs
      if (profile.needsMargin && product.marginFunding) {
        score += 15;
        reasons.push('Margin trading facility available');
      }

      // Score based on platform preferences
      profile.platformPreference.forEach(platform => {
        if (product.platforms[platform as keyof typeof product.platforms]) {
          score += 5;
          reasons.push(`Supports ${platform} platform`);
        }
      });

      // Additional scoring factors
      if (product.ipoAccess) {
        score += 5;
        reasons.push('IPO investment access');
      }

      if (product.bonds) {
        score += 3;
        reasons.push('Bond investment options');
      }

      if (product.rating >= 4.0) {
        score += Math.floor((product.rating - 4.0) * 10);
        reasons.push(`Highly rated (${product.rating}/5 stars)`);
      }

      // Cap score at 100
      score = Math.min(score, 100);

      // Determine category based on profile and scoring
      let category: BrokerRecommendation['category'] = 'best_overall';
      
      if (profile.costSensitivity === 'high') {
        category = 'best_discount';
      } else if (profile.needsResearch && product.researchReports) {
        category = 'best_research';
      } else if (profile.experience === 'beginner') {
        category = 'best_beginner';
      } else if (profile.experience === 'advanced' && (product.platforms.api || product.platforms.desktop)) {
        category = 'best_advanced';
      }

      return {
        productId: product._id.toString(),
        score: Math.round(score),
        reasons: reasons.slice(0, 4), // Limit to top 4 reasons
        category,
      };
    });

    // Sort by score and assign categories to top performers
    const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score);

    // Ensure we have diverse categories in top results
    const categoryAssignments = new Set<string>();
    const finalRecommendations = sortedRecommendations.map((rec, index) => {
      // For top 5 results, try to assign unique categories
      if (index < 5 && !categoryAssignments.has(rec.category)) {
        categoryAssignments.add(rec.category);
        return rec;
      } else if (index < 5) {
        // If category already assigned, use best_overall
        return { ...rec, category: 'best_overall' as const };
      }
      return rec;
    });

    return NextResponse.json({
      recommendations: finalRecommendations,
      profile,
    });

  } catch (error) {
    console.error('Error generating broker recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}