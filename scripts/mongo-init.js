// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

print('🚀 Starting MongoDB initialization...');

// Switch to the application database
db = db.getSiblingDB('indian_investment_platform');

// Create application user with read/write permissions
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'indian_investment_platform'
    }
  ]
});

print('✅ Created application user: app_user');

// Create collections
const collections = [
  'articles',
  'users', 
  'affiliatepartners',
  'affiliateclicks',
  'products',
  'adminsessions',
  'adminauditlogs'
];

collections.forEach(collectionName => {
  db.createCollection(collectionName);
  print(`📁 Created collection: ${collectionName}`);
});

// Create indexes for better performance
print('🔍 Creating database indexes...');

// Articles indexes
db.articles.createIndex({ "slug": 1 }, { unique: true });
db.articles.createIndex({ "category": 1 });
db.articles.createIndex({ "subcategory": 1 });
db.articles.createIndex({ "tags": 1 });
db.articles.createIndex({ "publishedAt": -1 });
db.articles.createIndex({ "isPublished": 1 });
db.articles.createIndex({ "author.name": 1 });
db.articles.createIndex({ "$**": "text" }); // Full text search
print('✅ Articles indexes created');

// Users indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isVerified": 1 });
print('✅ Users indexes created');

// Affiliate clicks indexes
db.affiliateclicks.createIndex({ "trackingId": 1 }, { unique: true });
db.affiliateclicks.createIndex({ "partnerId": 1 });
db.affiliateclicks.createIndex({ "productId": 1 });
db.affiliateclicks.createIndex({ "userId": 1 });
db.affiliateclicks.createIndex({ "clickedAt": -1 });
db.affiliateclicks.createIndex({ "converted": 1 });
db.affiliateclicks.createIndex({ "conversionDate": -1 });
print('✅ Affiliate clicks indexes created');

// Affiliate partners indexes
db.affiliatepartners.createIndex({ "name": 1 });
db.affiliatepartners.createIndex({ "type": 1 });
db.affiliatepartners.createIndex({ "isActive": 1 });
print('✅ Affiliate partners indexes created');

// Products indexes
db.products.createIndex({ "partnerId": 1 });
db.products.createIndex({ "type": 1 });
db.products.createIndex({ "isActive": 1 });
db.products.createIndex({ "priority": -1 });
print('✅ Products indexes created');

// Admin sessions indexes
db.adminsessions.createIndex({ "userId": 1 });
db.adminsessions.createIndex({ "sessionId": 1 }, { unique: true });
db.adminsessions.createIndex({ "isActive": 1 });
db.adminsessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
print('✅ Admin sessions indexes created');

// Admin audit logs indexes
db.adminauditlogs.createIndex({ "adminId": 1 });
db.adminauditlogs.createIndex({ "action": 1 });
db.adminauditlogs.createIndex({ "resource": 1 });
db.adminauditlogs.createIndex({ "createdAt": -1 });
db.adminauditlogs.createIndex({ "severity": 1 });
print('✅ Admin audit logs indexes created');

// Insert sample data for development
print('📊 Inserting sample data...');

// Sample articles
db.articles.insertMany([
  {
    title: "Understanding SIP Investments in India",
    slug: "understanding-sip-investments-india",
    content: "<h2>What is SIP?</h2><p>SIP or Systematic Investment Plan is a popular investment method...</p>",
    excerpt: "Learn about SIP investments and how they can help you build wealth systematically.",
    category: "Investment",
    subcategory: "Mutual Funds",
    tags: ["sip", "mutual-funds", "investment", "india"],
    author: {
      name: "Financial Expert",
      email: "expert@investovise.com"
    },
    publishedAt: new Date(),
    updatedAt: new Date(),
    viewCount: 0,
    seoMetadata: {
      title: "Understanding SIP Investments in India - Complete Guide",
      description: "Learn about SIP investments and how they can help you build wealth systematically.",
      keywords: ["sip", "mutual funds", "investment", "india"]
    },
    relatedArticles: [],
    isPublished: true,
    featuredImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop"
  },
  {
    title: "Best Credit Cards in India 2024",
    slug: "best-credit-cards-india-2024",
    content: "<h2>Top Credit Cards</h2><p>Discover the best credit cards available in India...</p>",
    excerpt: "Compare and find the best credit cards in India with cashback, rewards, and benefits.",
    category: "Credit Cards",
    subcategory: "Reviews",
    tags: ["credit-cards", "cashback", "rewards", "india"],
    author: {
      name: "Credit Card Expert",
      email: "cards@investovise.com"
    },
    publishedAt: new Date(),
    updatedAt: new Date(),
    viewCount: 0,
    seoMetadata: {
      title: "Best Credit Cards in India 2024 - Compare & Apply",
      description: "Compare and find the best credit cards in India with cashback, rewards, and benefits.",
      keywords: ["credit cards", "best credit cards", "india", "cashback"]
    },
    relatedArticles: [],
    isPublished: true,
    featuredImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop"
  }
]);

// Sample affiliate partner
db.affiliatepartners.insertOne({
  name: "HDFC Bank",
  type: "credit_card",
  apiEndpoint: "https://api.hdfcbank.com/affiliate",
  commissionStructure: {
    type: "fixed",
    amount: 500,
    currency: "INR",
    conditions: ["successful_application", "card_activation"]
  },
  isActive: true,
  logoUrl: "https://example.com/hdfc-logo.png",
  description: "Leading private sector bank in India offering various financial products",
  website: "https://www.hdfcbank.com",
  contactEmail: "affiliate@hdfcbank.com",
  trackingConfig: {
    conversionGoals: ["application_submitted", "card_approved"],
    attributionWindow: 30
  },
  products: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Sample data inserted successfully');

// Create a test admin user (password: admin123)
db.users.insertOne({
  email: "admin@investovise.com",
  hashedPassword: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G", // admin123
  profile: {
    firstName: "Admin",
    lastName: "User",
    phone: "+91-9999999999",
    city: "Mumbai",
    state: "Maharashtra"
  },
  preferences: {
    newsletter: true,
    marketUpdates: true,
    productRecommendations: true,
    language: "en",
    investmentExperience: "advanced",
    riskTolerance: "medium"
  },
  activityLog: [],
  createdAt: new Date(),
  lastLoginAt: null,
  isVerified: true,
  role: "admin"
});

print('✅ Admin user created (email: admin@investovise.com, password: admin123)');

print('🎉 MongoDB initialization completed successfully!');
print('');
print('📋 Summary:');
print('   - Database: indian_investment_platform');
print('   - User: app_user / app_password');
print('   - Admin: admin@investovise.com / admin123');
print('   - Collections: ' + collections.length);
print('   - Indexes: Created for optimal performance');
print('   - Sample data: Articles, partners, and admin user');
print('');