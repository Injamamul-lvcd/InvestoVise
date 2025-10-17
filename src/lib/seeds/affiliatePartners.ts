import { AffiliatePartner, Product } from '@/models';
import { IAffiliatePartner, IProduct } from '@/types/database';

const samplePartners: Partial<IAffiliatePartner>[] = [
  {
    name: 'HDFC Bank',
    type: 'loan',
    commissionStructure: {
      type: 'percentage',
      amount: 0.5,
      currency: 'INR',
      conditions: ['Loan amount minimum ₹1 lakh', 'Customer must complete KYC']
    },
    isActive: true,
    logoUrl: 'https://example.com/logos/hdfc-bank.png',
    description: 'HDFC Bank is one of India\'s leading private sector banks, offering a wide range of loan products including personal loans, home loans, and business loans with competitive interest rates.',
    website: 'https://www.hdfcbank.com',
    contactEmail: 'partnerships@hdfcbank.com',
    trackingConfig: {
      conversionGoals: ['application_submitted', 'loan_approved'],
      attributionWindow: 30
    }
  },
  {
    name: 'ICICI Bank',
    type: 'credit_card',
    commissionStructure: {
      type: 'fixed',
      amount: 2000,
      currency: 'INR',
      conditions: ['Card must be activated within 30 days', 'First transaction within 60 days']
    },
    isActive: true,
    logoUrl: 'https://example.com/logos/icici-bank.png',
    description: 'ICICI Bank offers a comprehensive range of credit cards with attractive rewards, cashback offers, and premium benefits for different customer segments.',
    website: 'https://www.icicibank.com',
    contactEmail: 'creditcards@icicibank.com',
    trackingConfig: {
      conversionGoals: ['application_submitted', 'card_approved'],
      attributionWindow: 45
    }
  },
  {
    name: 'Zerodha',
    type: 'broker',
    commissionStructure: {
      type: 'fixed',
      amount: 500,
      currency: 'INR',
      conditions: ['Account must be opened and activated', 'Minimum first trade within 30 days']
    },
    isActive: true,
    logoUrl: 'https://example.com/logos/zerodha.png',
    description: 'Zerodha is India\'s largest discount broker offering equity, commodity, and currency trading with industry-leading technology platforms.',
    website: 'https://zerodha.com',
    contactEmail: 'partnerships@zerodha.com',
    trackingConfig: {
      conversionGoals: ['account_opened', 'first_transaction'],
      attributionWindow: 30
    }
  },
  {
    name: 'SBI Bank',
    type: 'loan',
    commissionStructure: {
      type: 'percentage',
      amount: 0.3,
      currency: 'INR',
      conditions: ['Home loan minimum ₹10 lakh', 'Personal loan minimum ₹2 lakh']
    },
    isActive: true,
    logoUrl: 'https://example.com/logos/sbi-bank.png',
    description: 'State Bank of India is the largest public sector bank in India, offering various loan products with attractive interest rates and flexible repayment options.',
    website: 'https://www.onlinesbi.com',
    contactEmail: 'partnerships@sbi.co.in',
    trackingConfig: {
      conversionGoals: ['application_submitted', 'loan_approved'],
      attributionWindow: 45
    }
  },
  {
    name: 'Axis Bank',
    type: 'credit_card',
    commissionStructure: {
      type: 'fixed',
      amount: 1500,
      currency: 'INR',
      conditions: ['Premium cards: ₹3000 commission', 'Card activation required']
    },
    isActive: true,
    logoUrl: 'https://example.com/logos/axis-bank.png',
    description: 'Axis Bank offers premium credit cards with exclusive benefits, travel rewards, and lifestyle privileges for discerning customers.',
    website: 'https://www.axisbank.com',
    contactEmail: 'creditcards@axisbank.com',
    trackingConfig: {
      conversionGoals: ['application_submitted', 'card_approved'],
      attributionWindow: 30
    }
  }
];

const sampleProducts: Partial<IProduct>[] = [
  // HDFC Bank Products
  {
    name: 'HDFC Personal Loan',
    type: 'personal_loan',
    features: [
      { name: 'Interest Rate', value: '10.50% - 24.00% p.a.', description: 'Competitive interest rates based on profile' },
      { name: 'Loan Amount', value: '₹50,000 - ₹40,00,000', description: 'Flexible loan amounts' },
      { name: 'Tenure', value: '12 - 60 months', description: 'Convenient repayment tenure' },
      { name: 'Processing Fee', value: 'Up to 2.50%', description: 'Minimal processing charges' }
    ],
    eligibility: [
      { type: 'age', description: 'Age between 21-60 years', minValue: 21, maxValue: 60 },
      { type: 'income', description: 'Minimum monthly income ₹25,000', minValue: 300000 },
      { type: 'employment', description: 'Salaried or self-employed' },
      { type: 'credit_score', description: 'Good credit score preferred', minValue: 650 }
    ],
    interestRate: 10.50,
    fees: [
      { type: 'processing', amount: 2.50, description: 'Processing fee up to 2.50% of loan amount', isPercentage: true },
      { type: 'late_payment', amount: 500, description: 'Late payment charges', isPercentage: false }
    ],
    applicationUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan',
    isActive: true,
    priority: 90,
    description: 'HDFC Personal Loan offers quick approval and disbursal with minimal documentation. Get funds for any personal need with competitive interest rates.',
    termsAndConditions: 'Subject to bank approval. Interest rates may vary based on credit profile. Processing fee and other charges applicable as per bank policy.',
    processingTime: '24-48 hours',
    minAmount: 50000,
    maxAmount: 4000000
  },
  {
    name: 'HDFC Home Loan',
    type: 'home_loan',
    features: [
      { name: 'Interest Rate', value: '8.40% - 9.65% p.a.', description: 'Attractive home loan rates' },
      { name: 'Loan Amount', value: 'Up to ₹10 Crores', description: 'High loan amounts available' },
      { name: 'Tenure', value: 'Up to 30 years', description: 'Long repayment tenure' },
      { name: 'LTV Ratio', value: 'Up to 90%', description: 'High loan-to-value ratio' }
    ],
    eligibility: [
      { type: 'age', description: 'Age between 18-65 years', minValue: 18, maxValue: 65 },
      { type: 'income', description: 'Minimum monthly income ₹40,000', minValue: 480000 },
      { type: 'employment', description: 'Salaried or self-employed with stable income' }
    ],
    interestRate: 8.40,
    fees: [
      { type: 'processing', amount: 0.50, description: 'Processing fee 0.50% of loan amount', isPercentage: true },
      { type: 'other', amount: 5000, description: 'Legal and technical charges', isPercentage: false }
    ],
    applicationUrl: 'https://www.hdfcbank.com/personal/borrow/home-loan',
    isActive: true,
    priority: 95,
    description: 'HDFC Home Loan helps you buy your dream home with attractive interest rates, high loan amounts, and flexible repayment options.',
    termsAndConditions: 'Property should be approved by HDFC Bank. Insurance mandatory. Prepayment charges may apply.',
    processingTime: '7-10 working days',
    minAmount: 1000000,
    maxAmount: 100000000
  },
  // ICICI Bank Credit Cards
  {
    name: 'ICICI Amazon Pay Credit Card',
    type: 'credit_card',
    features: [
      { name: 'Amazon Cashback', value: '5% on Amazon', description: 'Unlimited 5% cashback on Amazon purchases' },
      { name: 'Other Cashback', value: '1% on others', description: '1% cashback on all other purchases' },
      { name: 'Annual Fee', value: 'Nil', description: 'Lifetime free credit card' },
      { name: 'Welcome Benefit', value: '₹500 Amazon voucher', description: 'Welcome gift voucher' }
    ],
    eligibility: [
      { type: 'age', description: 'Age between 18-65 years', minValue: 18, maxValue: 65 },
      { type: 'income', description: 'Minimum annual income ₹3,00,000', minValue: 300000 },
      { type: 'credit_score', description: 'Good credit score required', minValue: 700 }
    ],
    fees: [
      { type: 'annual', amount: 0, description: 'Lifetime free', isPercentage: false },
      { type: 'late_payment', amount: 500, description: 'Late payment charges up to ₹1,300', isPercentage: false }
    ],
    applicationUrl: 'https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay',
    isActive: true,
    priority: 85,
    description: 'ICICI Amazon Pay Credit Card offers the highest cashback on Amazon purchases with no annual fee. Perfect for online shoppers.',
    termsAndConditions: 'Cashback credited monthly. Subject to terms and conditions. Card approval at bank discretion.',
    processingTime: '7-10 working days'
  },
  // Zerodha Broker Account
  {
    name: 'Zerodha Demat & Trading Account',
    type: 'broker_account',
    features: [
      { name: 'Equity Brokerage', value: '₹20 per order', description: 'Flat ₹20 for equity delivery and intraday' },
      { name: 'Account Opening', value: '₹200', description: 'One-time account opening charge' },
      { name: 'AMC', value: '₹300/year', description: 'Annual maintenance charges' },
      { name: 'Platform', value: 'Kite & Console', description: 'Advanced trading platforms' }
    ],
    eligibility: [
      { type: 'age', description: 'Age 18 years and above', minValue: 18 },
      { type: 'other', description: 'Valid PAN and Aadhaar required' },
      { type: 'other', description: 'Bank account for fund transfer' }
    ],
    fees: [
      { type: 'other', amount: 200, description: 'Account opening charges', isPercentage: false },
      { type: 'annual', amount: 300, description: 'Annual maintenance charges', isPercentage: false }
    ],
    applicationUrl: 'https://zerodha.com/open-account',
    isActive: true,
    priority: 90,
    description: 'Open Zerodha demat and trading account to invest in stocks, mutual funds, and other securities with India\'s largest discount broker.',
    termsAndConditions: 'Subject to regulatory compliance. Trading involves market risks. Brokerage as per published schedule.',
    processingTime: '24-48 hours'
  }
];

export async function seedAffiliatePartners(): Promise<void> {
  console.log('Seeding affiliate partners and products...');
  
  try {
    // Check if partners already exist
    const existingPartnersCount = await AffiliatePartner.countDocuments();
    if (existingPartnersCount > 0) {
      console.log(`Affiliate partners already exist (${existingPartnersCount} found). Skipping seed.`);
      return;
    }
    
    // Insert sample partners
    const partners = await AffiliatePartner.insertMany(samplePartners);
    console.log(`Successfully seeded ${partners.length} affiliate partners`);
    
    // Map products to partners
    const productMappings = [
      { partnerName: 'HDFC Bank', productNames: ['HDFC Personal Loan', 'HDFC Home Loan'] },
      { partnerName: 'ICICI Bank', productNames: ['ICICI Amazon Pay Credit Card'] },
      { partnerName: 'Zerodha', productNames: ['Zerodha Demat & Trading Account'] }
    ];
    
    // Insert products with partner references
    for (const mapping of productMappings) {
      const partner = partners.find(p => p.name === mapping.partnerName);
      if (!partner) continue;
      
      const partnerProducts = sampleProducts.filter(p => 
        mapping.productNames.includes(p.name!)
      );
      
      for (const productData of partnerProducts) {
        productData.partnerId = partner._id;
      }
      
      const insertedProducts = await Product.insertMany(partnerProducts);
      
      // Update partner with product references
      const productIds = insertedProducts.map(p => p._id);
      await AffiliatePartner.findByIdAndUpdate(partner._id, {
        $push: { products: { $each: productIds } }
      });
      
      console.log(`Added ${insertedProducts.length} products for ${partner.name}`);
    }
    
    console.log('Affiliate partners and products seeded successfully');
  } catch (error) {
    console.error('Error seeding affiliate partners:', error);
    throw error;
  }
}