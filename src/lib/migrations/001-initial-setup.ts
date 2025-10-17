import { connectToDatabase } from '../database';
import { Article, User, AffiliatePartner, Product, AffiliateClick } from '@/models';

/**
 * Initial database setup migration
 * Creates indexes and ensures database structure
 */
export async function up(): Promise<void> {
  console.log('Running migration: 001-initial-setup');
  
  try {
    await connectToDatabase();
    
    // Ensure indexes are created for all models
    console.log('Creating indexes for Article model...');
    await Article.createIndexes();
    
    console.log('Creating indexes for User model...');
    await User.createIndexes();
    
    console.log('Creating indexes for AffiliatePartner model...');
    await AffiliatePartner.createIndexes();
    
    console.log('Creating indexes for Product model...');
    await Product.createIndexes();
    
    console.log('Creating indexes for AffiliateClick model...');
    await AffiliateClick.createIndexes();
    
    console.log('Migration 001-initial-setup completed successfully');
  } catch (error) {
    console.error('Error running migration 001-initial-setup:', error);
    throw error;
  }
}

/**
 * Rollback migration (drop indexes)
 */
export async function down(): Promise<void> {
  console.log('Rolling back migration: 001-initial-setup');
  
  try {
    await connectToDatabase();
    
    // Drop all indexes except _id (which cannot be dropped)
    console.log('Dropping indexes for Article model...');
    await Article.collection.dropIndexes();
    
    console.log('Dropping indexes for User model...');
    await User.collection.dropIndexes();
    
    console.log('Dropping indexes for AffiliatePartner model...');
    await AffiliatePartner.collection.dropIndexes();
    
    console.log('Dropping indexes for Product model...');
    await Product.collection.dropIndexes();
    
    console.log('Dropping indexes for AffiliateClick model...');
    await AffiliateClick.collection.dropIndexes();
    
    console.log('Migration 001-initial-setup rolled back successfully');
  } catch (error) {
    console.error('Error rolling back migration 001-initial-setup:', error);
    throw error;
  }
}