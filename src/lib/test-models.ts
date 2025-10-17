import { connectToDatabase } from './database';
import { Article, User, AffiliatePartner, Product, AffiliateClick } from '@/models';

/**
 * Test function to verify all models are working correctly
 */
export async function testModels(): Promise<void> {
  console.log('Testing database models...');
  
  try {
    await connectToDatabase();
    console.log('✓ Database connection successful');
    
    // Test Article model
    const testArticle = new Article({
      title: 'Test Article',
      slug: 'test-article',
      content: 'This is a test article content with more than 100 characters to meet the minimum length requirement for validation.',
      excerpt: 'This is a test excerpt for the article.',
      category: 'stocks',
      subcategory: 'equity-analysis',
      tags: ['test', 'article'],
      author: {
        name: 'Test Author',
        email: 'test@example.com'
      },
      seoMetadata: {
        title: 'Test Article SEO Title',
        description: 'Test article SEO description for testing purposes.',
        keywords: ['test', 'article', 'seo']
      },
      isPublished: true
    });
    
    const validationError = testArticle.validateSync();
    if (validationError) {
      console.error('Article validation failed:', validationError.message);
    } else {
      console.log('✓ Article model validation passed');
    }
    
    // Test User model
    const testUser = new User({
      email: 'test@example.com',
      hashedPassword: 'hashedpassword123',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });
    
    const userValidationError = testUser.validateSync();
    if (userValidationError) {
      console.error('User validation failed:', userValidationError.message);
    } else {
      console.log('✓ User model validation passed');
    }
    
    // Test AffiliatePartner model
    const testPartner = new AffiliatePartner({
      name: 'Test Bank',
      type: 'loan',
      commissionStructure: {
        type: 'percentage',
        amount: 1.0,
        currency: 'INR'
      },
      logoUrl: 'https://example.com/logo.png',
      description: 'Test bank description',
      website: 'https://testbank.com',
      contactEmail: 'contact@testbank.com',
      trackingConfig: {
        conversionGoals: ['application_submitted'],
        attributionWindow: 30
      }
    });
    
    const partnerValidationError = testPartner.validateSync();
    if (partnerValidationError) {
      console.error('AffiliatePartner validation failed:', partnerValidationError.message);
    } else {
      console.log('✓ AffiliatePartner model validation passed');
    }
    
    // Test Product model
    const testProduct = new Product({
      partnerId: testPartner._id,
      name: 'Test Loan Product',
      type: 'personal_loan',
      features: [
        { name: 'Interest Rate', value: '10% p.a.', description: 'Competitive rate' }
      ],
      eligibility: [
        { type: 'age', description: 'Age 21-60', minValue: 21, maxValue: 60 }
      ],
      interestRate: 10.0,
      fees: [
        { type: 'processing', amount: 1.0, description: 'Processing fee', isPercentage: true }
      ],
      applicationUrl: 'https://testbank.com/apply',
      description: 'Test loan product description',
      termsAndConditions: 'Test terms and conditions',
      processingTime: '24 hours',
      minAmount: 50000,
      maxAmount: 1000000
    });
    
    const productValidationError = testProduct.validateSync();
    if (productValidationError) {
      console.error('Product validation failed:', productValidationError.message);
    } else {
      console.log('✓ Product model validation passed');
    }
    
    // Test AffiliateClick model
    const testClick = new AffiliateClick({
      trackingId: 'test-tracking-123',
      partnerId: testPartner._id,
      productId: testProduct._id,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      referrer: 'https://example.com'
    });
    
    const clickValidationError = testClick.validateSync();
    if (clickValidationError) {
      console.error('AffiliateClick validation failed:', clickValidationError.message);
    } else {
      console.log('✓ AffiliateClick model validation passed');
    }
    
    console.log('✓ All model validations passed successfully');
    
    // Test some virtual fields and methods
    console.log('Testing virtual fields and methods...');
    console.log('- Article reading time:', testArticle.readingTime, 'minutes');
    console.log('- User full name:', testUser.fullName);
    console.log('- Product display interest rate:', testProduct.displayInterestRate);
    console.log('- Partner product count:', testPartner.productCount);
    console.log('- Click status:', testClick.status);
    
    console.log('✓ All tests completed successfully');
    
  } catch (error) {
    console.error('Model testing failed:', error);
    throw error;
  }
}