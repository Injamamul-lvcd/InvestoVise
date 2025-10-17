#!/usr/bin/env tsx

import { connectToDatabase, getConnectionInfo } from '../src/lib/database';
import config from '../src/config';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Display configuration (hide sensitive data)
    console.log('📋 Configuration:');
    console.log(`   MongoDB URI: ${config.mongodbUri.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Redis URL: ${config.redisUrl}\n`);
    
    // Test MongoDB connection
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    
    // Get connection info
    const info = getConnectionInfo();
    console.log('📊 Connection Details:');
    console.log(`   Status: ${info.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   Host: ${info.host}`);
    console.log(`   Port: ${info.port}`);
    console.log(`   Database: ${info.name}`);
    console.log(`   Ready State: ${info.readyState}\n`);
    
    // Test basic database operations
    console.log('🧪 Testing database operations...');
    const mongoose = require('mongoose');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections (${collections.length}):`, collections.map(c => c.name).join(', ') || 'None');
    
    // Test database stats
    const stats = await mongoose.connection.db.stats();
    console.log(`💾 Database Stats:`);
    console.log(`   Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Objects: ${stats.objects}`);
    
    // Test a simple write/read operation
    console.log('\n🔬 Testing write/read operations...');
    const testCollection = mongoose.connection.db.collection('connection_test');
    
    // Insert test document
    const testDoc = { 
      message: 'Database connection test', 
      timestamp: new Date(),
      nodeEnv: config.nodeEnv 
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log(`✍️  Insert test: ${insertResult.acknowledged ? '✅ Success' : '❌ Failed'}`);
    
    // Read test document
    const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log(`📖 Read test: ${readResult ? '✅ Success' : '❌ Failed'}`);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log(`🗑️  Cleanup: ✅ Complete`);
    
    console.log('\n🎉 All database tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      
      // Provide specific troubleshooting tips
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Troubleshooting Tips:');
        console.error('   1. Make sure MongoDB is running');
        console.error('   2. Check if the port (27017) is correct');
        console.error('   3. Verify the host address');
        console.error('   4. For Docker: run `docker-compose up -d mongodb`');
        console.error('   5. For local: run `mongod` or start MongoDB service');
      } else if (error.message.includes('Authentication failed')) {
        console.error('\n💡 Troubleshooting Tips:');
        console.error('   1. Check username and password in .env.local');
        console.error('   2. Verify database user exists and has correct permissions');
        console.error('   3. For Atlas: check database access settings');
      } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
        console.error('\n💡 Troubleshooting Tips:');
        console.error('   1. Check internet connection');
        console.error('   2. Verify MongoDB Atlas cluster URL');
        console.error('   3. Check DNS resolution');
      } else if (error.message.includes('MongooseError')) {
        console.error('\n💡 Troubleshooting Tips:');
        console.error('   1. Check MONGODB_URI in .env.local file');
        console.error('   2. Ensure .env.local exists and is properly formatted');
        console.error('   3. Restart the development server');
      }
    }
    
    console.error('\n📚 For detailed setup instructions, see: DATABASE_SETUP_GUIDE.md');
    process.exit(1);
  }
  
  process.exit(0);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

testConnection();