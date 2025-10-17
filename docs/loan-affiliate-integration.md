# Loan Affiliate Integration

This document describes the loan affiliate partnership integration implemented for the Indian Investment Platform.

## Overview

The loan affiliate integration provides comprehensive tracking, conversion monitoring, and commission management for loan partner relationships. It enables the platform to:

- Generate trackable affiliate links for loan products
- Monitor user interactions and conversions
- Calculate and track commissions for partners
- Provide detailed analytics and reporting
- Prevent fraud and ensure data integrity

## API Endpoints

### Loan Products

#### GET /api/loans
Retrieve loan products with filtering options.

**Query Parameters:**
- `loanType`: Filter by loan type (personal_loan, home_loan, car_loan, business_loan)
- `minAmount`, `maxAmount`: Filter by loan amount range
- `minInterestRate`, `maxInterestRate`: Filter by interest rate range
- `partnerId`: Filter by specific partner
- `sortBy`: Sort by field (interestRate, maxAmount, popularity)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "partners": [...]
  }
}
```

#### GET /api/loans/[id]
Get specific loan product details.

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {...},
    "partner": {...}
  }
}
```

### Affiliate Link Generation

#### POST /api/loans/[id]/affiliate-link
Generate trackable affiliate link for loan application.

**Request Body:**
```json
{
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingUrl": "https://platform.com/api/affiliate/redirect?p=...&pr=...",
    "trackingId": "unique-tracking-id",
    "product": {...},
    "partner": {...}
  }
}
```

### Eligibility Checking

#### POST /api/loans/eligibility
Check loan eligibility for user criteria.

**Request Body:**
```json
{
  "criteria": {
    "age": 30,
    "annualIncome": 600000,
    "creditScore": 750,
    "employmentType": "salaried",
    "workExperience": 5,
    "existingLoans": 1
  },
  "productIds": ["optional-array-of-product-ids"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eligibilityResults": [
      {
        "productId": "...",
        "eligible": true,
        "score": 85,
        "reasons": [],
        "recommendations": [...]
      }
    ]
  }
}
```

### Application Tracking

#### POST /api/loans/applications
Track loan application initiation.

**Request Body:**
```json
{
  "productId": "product-id",
  "amount": 500000,
  "tenure": 36,
  "userId": "optional-user-id",
  "purpose": "optional-purpose"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "trackingId": "...",
      "redirectUrl": "...",
      "status": "initiated",
      ...
    }
  }
}
```

#### GET /api/loans/applications
Retrieve loan applications with optional user filtering.

### Conversion Tracking

#### POST /api/loans/conversions
Record loan conversion events.

**Request Body:**
```json
{
  "trackingId": "tracking-id",
  "conversionType": "application_submitted|application_approved|loan_disbursed|first_emi_paid",
  "conversionValue": 500000,
  "loanAmount": 500000,
  "interestRate": 14.5,
  "tenure": 36,
  "metadata": {...}
}
```

#### GET /api/loans/conversions
Get conversion analytics with optional partner and date filtering.

### Commission Tracking

#### GET /api/loans/commissions
Retrieve commission data for loan partners.

**Query Parameters:**
- `partnerId`: Filter by specific partner
- `startDate`, `endDate`: Date range filtering
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "commissions": [...],
    "summary": {
      "totalCommissions": 25000,
      "totalConversions": 50,
      "avgCommission": 500
    },
    "partnerBreakdown": [...]
  }
}
```

#### POST /api/loans/commissions
Calculate and update commission for a conversion.

## Service Integration

### LoanService

The `LoanService` class provides client-side methods for interacting with loan affiliate functionality:

```typescript
import { loanService } from '@/lib/services/loanService';

// Get loans with filters
const { products, partners } = await loanService.getLoans({
  loanType: 'personal_loan',
  minAmount: 100000,
  maxAmount: 1000000
});

// Generate affiliate link
const { trackingUrl, trackingId } = await loanService.generateAffiliateLink(
  productId,
  userId
);

// Check eligibility
const eligibilityResults = await loanService.checkEligibility({
  age: 30,
  annualIncome: 600000,
  creditScore: 750
});

// Track application
const application = await loanService.trackApplication({
  productId,
  amount: 500000,
  tenure: 36
});

// Record conversion
await loanService.recordConversion(
  trackingId,
  'application_submitted',
  500000
);
```

### AffiliateTrackingService

Core service for affiliate tracking functionality:

```typescript
import { AffiliateTrackingService } from '@/lib/services/affiliateTrackingService';

// Generate affiliate link
const link = await AffiliateTrackingService.generateAffiliateLink(
  partnerId,
  productId,
  baseUrl,
  { source: 'loan_comparison', medium: 'web' }
);

// Track click
const trackingId = await AffiliateTrackingService.trackClick({
  partnerId,
  productId,
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  utmSource: 'loan_comparison'
});

// Record conversion
await AffiliateTrackingService.recordConversion({
  trackingId,
  conversionType: 'application_submitted',
  conversionValue: 500000
});

// Get analytics
const analytics = await AffiliateTrackingService.getPartnerAnalytics(partnerId);
```

## Data Models

### LoanProduct
Extends the base Product model with loan-specific fields:
- `interestRate`: Annual interest rate
- `minAmount`, `maxAmount`: Loan amount limits
- `fees`: Array of fee structures
- `eligibility`: Eligibility requirements

### AffiliatePartner
Partner information with commission structure:
- `type`: 'loan' for loan partners
- `commissionStructure`: Commission calculation rules
- `trackingConfig`: Conversion goals and attribution window

### AffiliateClick
Tracking record for each click:
- `trackingId`: Unique identifier
- `partnerId`, `productId`: Related entities
- `converted`: Conversion status
- `commissionAmount`: Calculated commission
- `metadata`: Additional tracking data

## Commission Calculation

Commission is calculated based on the partner's commission structure:

### Fixed Commission
```typescript
commissionAmount = partner.commissionStructure.amount;
```

### Percentage Commission
```typescript
commissionAmount = (loanAmount * partner.commissionStructure.amount) / 100;
```

### Conversion Type Multipliers
Different conversion types have different commission multipliers:
- `application_submitted`: 0.1x
- `application_approved`: 0.5x
- `loan_disbursed`: 1.0x
- `first_emi_paid`: 1.2x

## Fraud Detection

The system includes fraud detection mechanisms:

1. **Multiple clicks from same IP**: Flags suspicious activity
2. **Bot detection**: Identifies automated traffic
3. **Fast conversions**: Detects unrealistic conversion times
4. **Missing referrer**: Flags direct access attempts

## Testing

### Integration Tests
Comprehensive integration tests cover:
- Affiliate link generation
- Click tracking
- Conversion recording
- Commission calculation
- Analytics retrieval
- Fraud detection
- Error handling

### API Tests
API endpoint tests verify:
- Request/response formats
- Validation logic
- Error handling
- Authentication
- Data integrity

### Running Tests
```bash
# Run all loan affiliate tests
npm test -- --testPathPattern=loan

# Run integration tests
npm test -- --testPathPattern=loanAffiliateFlow

# Run API tests
npm test -- --testPathPattern=loans.test
```

## Security Considerations

1. **Input Validation**: All inputs are validated and sanitized
2. **Rate Limiting**: Prevent abuse of tracking endpoints
3. **Attribution Window**: Limit conversion attribution timeframe
4. **Fraud Detection**: Automated fraud prevention
5. **Data Privacy**: PII handling compliance
6. **Secure Tracking**: Encrypted tracking parameters

## Performance Optimization

1. **Database Indexing**: Optimized queries for tracking data
2. **Caching**: Redis caching for frequently accessed data
3. **Pagination**: Large result sets are paginated
4. **Async Processing**: Non-blocking conversion recording
5. **Connection Pooling**: Efficient database connections

## Monitoring and Analytics

The system provides comprehensive analytics:

1. **Partner Performance**: Click-through rates, conversion rates
2. **Product Performance**: Popular products, conversion metrics
3. **Commission Tracking**: Revenue attribution, payout calculations
4. **Fraud Metrics**: Suspicious activity detection
5. **System Health**: API performance, error rates

## Future Enhancements

1. **Real-time Notifications**: Webhook integration for conversions
2. **Advanced Fraud Detection**: Machine learning models
3. **A/B Testing**: Landing page optimization
4. **Mobile App Integration**: Deep linking support
5. **Partner Dashboard**: Self-service analytics portal