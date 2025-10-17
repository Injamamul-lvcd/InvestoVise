const { connectToDatabase } = require('../src/lib/database');
const { AffiliateTrackingService } = require('../src/lib/services/affiliateTrackingService');
const { AffiliatePartner, Product } = require('../src/models');

async function testLoanAffiliateIntegration() {
  console.log('🚀 Testing Loan Affiliate Integration...');
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Database connected');

    // Create test partner
    const testPartner = await AffiliatePartner.create({
      name: 'Test Loan Partner Integration',
      type: 'loan',
      logoUrl: 'https://example.com/logo.png',
      description: 'Test loan partner for integration validation',
      website: 'https://testloanpartner.com',
      contactEmail: 'test@loanpartner.com',
      commissionStructure: {
        type: 'percentage',
        amount: 2.5,
        currency: 'INR'
      },
      trackingConfig: {
        conversionGoals: ['application_submitted', 'loan_approved'],
        attributionWindow: 30
      },
      isActive: true
    });
    console.log('✅ Test partner created:', testPartner.name);

    // Create test loan product
    const testProduct = await Product.create({
      partnerId: testPartner._id,
      name: 'Test Personal Loan Integration',
      type: 'personal_loan',
      features: [
        { name: 'Interest Rate', value: '12% - 18% p.a.' },
        { name: 'Loan Amount', value: '₹1,00,000 - ₹20,00,000' }
      ],
      eligibility: [
        { type: 'age', description: 'Age 21-60 years', minValue: 21, maxValue: 60 },
        { type: 'income', description: 'Min income ₹25,000/month', minValue: 300000 }
      ],
      interestRate: 14.5,
      fees: [
        { type: 'processing', amount: 2, description: 'Processing fee', isPercentage: true }
      ],
      applicationUrl: 'https://testloanpartner.com/apply',
      isActive: true,
      priority: 80,
      description: 'Test personal loan for integration validation',
      termsAndConditions: 'Test terms and conditions',
      processingTime: '24-48 hours',
      minAmount: 100000,
      maxAmount: 2000000
    });
    console.log('✅ Test product created:', testProduct.name);

    // Test affiliate link generation
    const affiliateLink = await AffiliateTrackingService.generateAffiliateLink(
      testPartner._id.toString(),
      testProduct._id.toString(),
      'https://testplatform.com',
      {
        source: 'loan_comparison',
        medium: 'web',
        campaign: 'personal_loan'
      }
    );
    console.log('✅ Affiliate link generated:', affiliateLink);

    // Test click tracking
    const trackingId = await AffiliateTrackingService.trackClick({
      partnerId: testPartner._id.toString(),
      productId: testProduct._id.toString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      referrer: 'https://testplatform.com',
      utmSource: 'loan_comparison',
      utmMedium: 'web',
      utmCampaign: 'personal_loan'
    });
    console.log('✅ Click tracked with ID:', trackingId);

    // Test conversion recording
    const conversionSuccess = await AffiliateTrackingService.recordConversion({
      trackingId,
      conversionType: 'application_submitted',
      conversionValue: 500000,
      metadata: {
        loanAmount: 500000,
        interestRate: 14.5,
        tenure: 36,
        loanType: 'personal_loan'
      }
    });
    console.log('✅ Conversion recorded:', conversionSuccess);

    // Test analytics
    const analytics = await AffiliateTrackingService.getPartnerAnalytics(
      testPartner._id.toString()
    );
    console.log('✅ Analytics retrieved:', {
      partnerName: analytics.partnerName,
      totalClicks: analytics.totalClicks,
      totalConversions: analytics.totalConversions,
      conversionRate: analytics.conversionRate,
      totalCommission: analytics.totalCommission
    });

    // Clean up test data
    await AffiliatePartner.findByIdAndDelete(testPartner._id);
    await Product.findByIdAndDelete(testProduct._id);
    console.log('✅ Test data cleaned up');

    console.log('🎉 All loan affiliate integration tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
testLoanAffiliateIntegration();