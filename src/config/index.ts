interface Config {
  // Database
  mongodbUri: string;
  redisUrl: string;
  
  // Authentication
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  
  // API
  apiUrl: string;
  apiRateLimit: number;
  
  // External APIs
  marketDataApiKey: string;
  newsApiKey: string;
  
  // Affiliate Partners
  loanPartnerApiKey: string;
  creditCardPartnerApiKey: string;
  brokerPartnerApiKey: string;
  
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  
  // File Upload
  maxFileSize: number;
  uploadDir: string;
  
  // Security
  corsOrigin: string;
  sessionSecret: string;
  
  // Analytics
  googleAnalyticsId: string;
  facebookPixelId: string;
  
  // Environment
  nodeEnv: string;
  port: number;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: Config = {
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/indian_investment_platform',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'fallback-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  
  // API
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
  
  // External APIs
  marketDataApiKey: process.env.MARKET_DATA_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  
  // Affiliate Partners
  loanPartnerApiKey: process.env.LOAN_PARTNER_API_KEY || '',
  creditCardPartnerApiKey: process.env.CREDIT_CARD_PARTNER_API_KEY || '',
  brokerPartnerApiKey: process.env.BROKER_PARTNER_API_KEY || '',
  
  // Email
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Security
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
  
  // Analytics
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
  facebookPixelId: process.env.FACEBOOK_PIXEL_ID || '',
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required environment variables in production
if (config.isProduction) {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export default config;