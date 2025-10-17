# Database Setup Documentation

## Overview

This document describes the database setup for the Indian Investment Platform, including data models, migrations, and seed data.

## Database Architecture

### Technology Stack
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for session management and caching
- **Connection**: Mongoose with connection pooling and error handling

### Data Models

#### 1. Article Model
Stores financial education content and articles.

**Key Features:**
- Full-text search indexing
- SEO metadata support
- View count tracking
- Related articles linking
- Category and tag-based organization

**Indexes:**
- Text search on title, content, excerpt
- Category and subcategory compound index
- Publication date and view count indexes

#### 2. User Model
Manages user accounts and authentication.

**Key Features:**
- Secure password hashing with bcrypt
- User profile and preferences
- Activity logging
- Email verification and password reset
- Role-based access control

**Security:**
- Password fields excluded from queries by default
- Sensitive tokens stored separately
- Input validation and sanitization

#### 3. AffiliatePartner Model
Manages affiliate partnerships and commission structures.

**Key Features:**
- Flexible commission structures (fixed/percentage)
- Tracking configuration
- Product relationship management
- Partner status and priority management

#### 4. Product Model
Stores financial products from affiliate partners.

**Key Features:**
- Detailed product features and eligibility
- Fee structure management
- Interest rate and amount ranges
- Eligibility checking methods
- Priority-based sorting

#### 5. AffiliateClick Model
Tracks affiliate clicks and conversions.

**Key Features:**
- Unique tracking ID generation
- Conversion tracking and attribution
- UTM parameter support
- Commission calculation
- Analytics aggregation methods

## Database Setup

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/indian_investment_platform
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key
BCRYPT_ROUNDS=12

# External APIs (optional for development)
MARKET_DATA_API_KEY=your-market-data-api-key
NEWS_API_KEY=your-news-api-key
```

### Installation and Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Seed Sample Data**
   ```bash
   npm run db:seed
   ```

4. **Complete Setup (Migrate + Seed)**
   ```bash
   npm run db:setup
   ```

### Available Database Commands

```bash
# Run migrations
npm run db:migrate

# Rollback last migration
npm run db rollback

# Check migration status
npm run db status

# Seed sample data
npm run db:seed

# Complete setup (migrate + seed)
npm run db:setup

# Reset database (clear + migrate + seed)
npm run db:reset --confirm
```

## API Endpoints for Testing

### Health Check
```
GET /api/health
```
Returns database connection status and health information.

### Model Validation Test
```
GET /api/test/validate
```
Tests all data models for validation and functionality.

### Model Data Test
```
GET /api/test/models
```
Returns counts and sample data from all models.

## Data Validation

### Article Validation
- Title: Required, max 200 characters
- Slug: Required, unique, URL-friendly format
- Content: Required, min 100 characters
- Category: Must be from predefined list
- SEO metadata: Required with character limits

### User Validation
- Email: Required, unique, valid format
- Password: Min 8 characters, hashed with bcrypt
- Profile: First name and last name required
- Phone: Indian mobile number format validation

### Product Validation
- Interest rate: Required for loan products
- Amount ranges: Min amount ≤ Max amount
- Features and eligibility: At least one required
- Application URL: Valid URL format

### Affiliate Click Validation
- Tracking ID: Unique, alphanumeric format
- IP Address: Valid IPv4/IPv6 format
- Conversion date: Must be after click date

## Indexing Strategy

### Performance Indexes
- **Articles**: Text search, category filtering, date sorting
- **Users**: Email lookup, verification status
- **Products**: Partner and type filtering, priority sorting
- **Clicks**: Partner analytics, conversion tracking

### TTL Indexes
- **Affiliate Clicks**: Auto-delete after 2 years
- **User Sessions**: Auto-expire based on configuration

## Security Considerations

### Data Protection
- Passwords hashed with bcrypt (12 rounds)
- Sensitive fields excluded from queries
- Input validation and sanitization
- Rate limiting on API endpoints

### Privacy Compliance
- User data encryption for sensitive fields
- Data retention policies
- Audit trails for data access
- GDPR-style data export/deletion

## Monitoring and Maintenance

### Database Monitoring
- Connection pool monitoring
- Query performance tracking
- Index usage analysis
- Storage usage monitoring

### Backup Strategy
- Regular automated backups
- Point-in-time recovery capability
- Cross-region backup replication
- Backup verification procedures

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check MongoDB service status
   - Verify connection string format
   - Check network connectivity

2. **Validation Errors**
   - Review model schema requirements
   - Check data format and types
   - Verify required fields

3. **Index Issues**
   - Run `db:migrate` to ensure indexes
   - Check index usage with explain()
   - Monitor slow query logs

### Debug Mode
Set `NODE_ENV=development` for detailed error logging and debug information.

## Migration History

### 001-initial-setup
- Creates all model indexes
- Sets up database structure
- Ensures proper constraints

Future migrations will be added here as the application evolves.