import { connectToDatabase } from '../database';
import mongoose from 'mongoose';

// Migration interface
interface Migration {
  up(): Promise<void>;
  down(): Promise<void>;
}

// Migration record schema
const MigrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  executedAt: { type: Date, default: Date.now }
});

const MigrationRecord = mongoose.models.MigrationRecord || mongoose.model('MigrationRecord', MigrationSchema);

// Available migrations
const migrations: { [key: string]: () => Promise<Migration> } = {
  '001-initial-setup': () => import('./001-initial-setup')
};

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...');
  
  try {
    await connectToDatabase();
    
    // Get list of executed migrations
    const executedMigrations = await MigrationRecord.find({}).select('name');
    const executedNames = executedMigrations.map(m => m.name);
    
    // Get list of available migrations
    const availableMigrations = Object.keys(migrations).sort();
    
    // Find pending migrations
    const pendingMigrations = availableMigrations.filter(name => !executedNames.includes(name));
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations:`, pendingMigrations);
    
    // Execute pending migrations
    for (const migrationName of pendingMigrations) {
      console.log(`Executing migration: ${migrationName}`);
      
      try {
        const migration = await migrations[migrationName]();
        await migration.up();
        
        // Record successful migration
        await MigrationRecord.create({ name: migrationName });
        console.log(`Migration ${migrationName} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migrationName} failed:`, error);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}

/**
 * Rollback the last migration
 */
export async function rollbackLastMigration(): Promise<void> {
  console.log('Rolling back last migration...');
  
  try {
    await connectToDatabase();
    
    // Get the last executed migration
    const lastMigration = await MigrationRecord.findOne({}).sort({ executedAt: -1 });
    
    if (!lastMigration) {
      console.log('No migrations to rollback');
      return;
    }
    
    const migrationName = lastMigration.name;
    console.log(`Rolling back migration: ${migrationName}`);
    
    if (!migrations[migrationName]) {
      throw new Error(`Migration ${migrationName} not found`);
    }
    
    const migration = await migrations[migrationName]();
    await migration.down();
    
    // Remove migration record
    await MigrationRecord.deleteOne({ name: migrationName });
    
    console.log(`Migration ${migrationName} rolled back successfully`);
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  executed: string[];
  pending: string[];
}> {
  try {
    await connectToDatabase();
    
    const executedMigrations = await MigrationRecord.find({}).select('name').sort({ executedAt: 1 });
    const executedNames = executedMigrations.map(m => m.name);
    
    const availableMigrations = Object.keys(migrations).sort();
    const pendingMigrations = availableMigrations.filter(name => !executedNames.includes(name));
    
    return {
      executed: executedNames,
      pending: pendingMigrations
    };
  } catch (error) {
    console.error('Failed to get migration status:', error);
    throw error;
  }
}