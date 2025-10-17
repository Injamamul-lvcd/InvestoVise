import mongoose from 'mongoose';
import config from '@/config';

interface ConnectionState {
  isConnected?: number;
  isConnecting?: boolean;
}

const connection: ConnectionState = {};

async function connectToDatabase(): Promise<void> {
  // If already connected, return immediately
  if (connection.isConnected === 1) {
    console.log('Already connected to database');
    return;
  }

  // If currently connecting, wait for it to complete
  if (connection.isConnecting) {
    console.log('Database connection in progress...');
    return;
  }

  try {
    connection.isConnecting = true;
    
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', config.mongodbUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    // Set mongoose options for better connection handling
    mongoose.set('strictQuery', false);
    
    const db = await mongoose.connect(config.mongodbUri, {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    connection.isConnected = db.connections[0].readyState;
    connection.isConnecting = false;
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${db.connections[0].name}`);
    console.log(`🔗 Connection state: ${connection.isConnected}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      connection.isConnected = 0;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      connection.isConnected = 0;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      connection.isConnected = 1;
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Closing MongoDB connection...`);
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    connection.isConnecting = false;
    connection.isConnected = 0;
    
    console.error('❌ Error connecting to MongoDB:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('💡 Tip: Make sure MongoDB is running on the specified host and port');
      } else if (error.message.includes('Authentication failed')) {
        console.error('💡 Tip: Check your username and password in the connection string');
      } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
        console.error('💡 Tip: Check your MongoDB host address and network connection');
      }
    }
    
    throw error;
  }
}

// Helper function to check connection status
export function isConnected(): boolean {
  return connection.isConnected === 1;
}

// Helper function to get connection info
export function getConnectionInfo() {
  return {
    isConnected: connection.isConnected === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
}

// Export the connection function with an alias for backward compatibility
export { connectToDatabase, connectToDatabase as connectDB };
export default mongoose;