import { connectToDatabase } from '../database';
import { seedArticles } from './articles';
import { seedAffiliatePartners } from './affiliatePartners';

/**
 * Run all seed functions
 */
export async function runSeeds(): Promise<void> {
  console.log('Starting database seeding...');
  
  try {
    await connectToDatabase();
    
    // Run all seed functions
    await seedArticles();
    await seedAffiliatePartners();
    
    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Seeding process failed:', error);
    throw error;
  }
}

/**
 * Clear all data (use with caution!)
 */
export async function clearAllData(): Promise<void> {
  console.log('WARNING: Clearing all data...');
  
  try {
    await connectToDatabase();
    
    const { Article, User, AffiliatePartner, Product, AffiliateClick } = await import('@/models');
    
    await Promise.all([
      Article.deleteMany({}),
      User.deleteMany({}),
      AffiliatePartner.deleteMany({}),
      Product.deleteMany({}),
      AffiliateClick.deleteMany({})
    ]);
    
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

// Export individual seed functions
export { seedArticles } from './articles';
export { seedAffiliatePartners } from './affiliatePartners';