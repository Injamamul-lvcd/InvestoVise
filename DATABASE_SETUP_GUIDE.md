# Database Setup Guide

This guide will help you set up and connect to MongoDB for the Indian Investment Platform.

## 🚀 Quick Setup Options

### Option 1: MongoDB Atlas (Cloud - Recommended for Production)
### Option 2: Local MongoDB Installation
### Option 3: Docker MongoDB (Recommended for Development)

---

## 🌐 Option 1: MongoDB Atlas (Cloud Setup)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Sandbox is free)

### Step 2: Configure Database Access
1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Create username/password (save these!)
4. Set permissions to "Read and write to any database"

### Step 3: Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your specific IP addresses

### Step 4: Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

### Step 5: Update Environment Variables
```bash
# Create .env.local file with:
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/indian_investment_platform?retryWrites=true&w=majority
```

---

## 💻 Option 2: Local MongoDB Installation

### Windows Installation
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Install MongoDB as a Windows Service
4. MongoDB will start automatically on port 27017

### macOS Installation (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

### Linux Installation (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Environment Configuration for Local MongoDB
```bash
# Add to .env.local:
MONGODB_URI=mongodb://localhost:27017/indian_investment_platform
```

---

## 🐳 Option 3: Docker MongoDB (Recommended for Development)

### Step 1: Create Docker Compose File
Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: indian_investment_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: indian_investment_platform
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: indian_investment_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  mongodb_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Step 2: Create MongoDB Initialization Script
Create `scripts/mongo-init.js`:

```javascript
// Create application database and user
db = db.getSiblingDB('indian_investment_platform');

// Create application user
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

// Create initial collections with indexes
db.createCollection('articles');
db.createCollection('users');
db.createCollection('affiliatepartners');
db.createCollection('affiliateclicks');
db.createCollection('products');

// Create indexes for better performance
db.articles.createIndex({ "slug": 1 }, { unique: true });
db.articles.createIndex({ "category": 1 });
db.articles.createIndex({ "tags": 1 });
db.articles.createIndex({ "publishedAt": -1 });
db.articles.createIndex({ "$**": "text" }); // Text search index

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

db.affiliateclicks.createIndex({ "trackingId": 1 }, { unique: true });
db.affiliateclicks.createIndex({ "partnerId": 1 });
db.affiliateclicks.createIndex({ "clickedAt": -1 });

db.products.createIndex({ "partnerId": 1 });
db.products.createIndex({ "type": 1 });
db.products.createIndex({ "isActive": 1 });

print('Database initialization completed successfully!');
```

### Step 3: Start Docker Services
```bash
# Start MongoDB and Redis
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs mongodb
docker-compose logs redis
```

### Step 4: Environment Configuration for Docker
```bash
# Add to .env.local:
MONGODB_URI=mongodb://app_user:app_password@localhost:27017/indian_investment_platform
REDIS_URL=redis://localhost:6379
```

---

## 🔧 Environment Configuration

### Create .env.local File
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your database configuration
```

### Required Environment Variables
```bash
# Database (choose one based on your setup)
MONGODB_URI=mongodb://localhost:27017/indian_investment_platform  # Local
# OR
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/indian_investment_platform  # Atlas

# Redis
REDIS_URL=redis://localhost:6379

# Authentication (generate secure secrets)
JWT_SECRET=your_super_secure_jwt_secret_key_here
SESSION_SECRET=your_super_secure_session_secret_here

# Basic API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
PORT=3000
```

---

## 🧪 Test Database Connection

### Step 1: Create Database Test Script
Create `scripts/test-db-connection.ts`:

```typescript
#!/usr/bin/env tsx

import { connectToDatabase } from '../src/lib/database';
import config from '../src/config';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('MongoDB URI:', config.mongodbUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await connectToDatabase();
    console.log('✅ Database connection successful!');
    
    // Test basic operations
    const mongoose = require('mongoose');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

### Step 2: Add Test Script to package.json
```json
{
  "scripts": {
    "test:db": "tsx scripts/test-db-connection.ts"
  }
}
```

### Step 3: Run Connection Test
```bash
npm run test:db
```

---

## 🚀 Initialize Database with Sample Data

### Run Database Setup
```bash
# Run migrations and seed data
npm run db:setup

# Or step by step:
npm run db:migrate  # Run migrations
npm run db:seed     # Add sample data
```

---

## 🔍 Troubleshooting Common Issues

### Issue 1: "MongooseError: Operation buffering timed out"
**Solution:**
- Check if MongoDB is running
- Verify connection string in .env.local
- Ensure network access (for Atlas)

### Issue 2: "Authentication failed"
**Solution:**
- Verify username/password in connection string
- Check database user permissions
- Ensure database name is correct

### Issue 3: "Connection refused"
**Solution:**
- Check if MongoDB is running on correct port
- Verify firewall settings
- For Docker: ensure containers are running

### Issue 4: "Cannot find module '@/config'"
**Solution:**
- Ensure TypeScript paths are configured
- Check tsconfig.json baseUrl and paths
- Restart development server

---

## 📊 Database Monitoring

### MongoDB Compass (GUI Tool)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your MongoDB URI
3. Browse collections and documents visually

### Command Line Monitoring
```bash
# Connect to MongoDB shell
mongosh "mongodb://localhost:27017/indian_investment_platform"

# Basic commands
show dbs
use indian_investment_platform
show collections
db.articles.find().limit(5)
```

---

## 🔒 Security Best Practices

### For Production:
1. **Never use default passwords**
2. **Restrict network access to specific IPs**
3. **Enable MongoDB authentication**
4. **Use SSL/TLS connections**
5. **Regular backups**
6. **Monitor database access logs**

### Environment Variables Security:
```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📝 Next Steps After Database Setup

1. **Test the connection**: `npm run test:db`
2. **Initialize database**: `npm run db:setup`
3. **Start development server**: `npm run dev`
4. **Test API endpoints**: Visit `http://localhost:3000/api/health`
5. **Check database data**: Use MongoDB Compass or shell

---

## 🆘 Need Help?

If you're still having issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB/Redis services are running
4. Test network connectivity to your database
5. Check firewall and security group settings

The most common issue is incorrect connection strings or services not running. Follow this guide step by step, and your database should be connected successfully!