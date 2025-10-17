#!/usr/bin/env tsx

import { runMigrations, rollbackLastMigration, getMigrationStatus } from '../src/lib/migrations/runner';
import { runSeeds, clearAllData } from '../src/lib/seeds';

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'migrate':
        console.log('Running database migrations...');
        await runMigrations();
        break;
        
      case 'rollback':
        console.log('Rolling back last migration...');
        await rollbackLastMigration();
        break;
        
      case 'status':
        console.log('Getting migration status...');
        const status = await getMigrationStatus();
        console.log('Executed migrations:', status.executed);
        console.log('Pending migrations:', status.pending);
        break;
        
      case 'seed':
        console.log('Running database seeds...');
        await runSeeds();
        break;
        
      case 'setup':
        console.log('Setting up database (migrate + seed)...');
        await runMigrations();
        await runSeeds();
        break;
        
      case 'reset':
        console.log('Resetting database (clear + migrate + seed)...');
        const confirm = process.argv[3];
        if (confirm !== '--confirm') {
          console.log('This will delete all data! Use --confirm flag to proceed.');
          process.exit(1);
        }
        await clearAllData();
        await runMigrations();
        await runSeeds();
        break;
        
      default:
        console.log(`
Database Setup CLI

Usage: npm run db <command>

Commands:
  migrate   - Run pending migrations
  rollback  - Rollback last migration
  status    - Show migration status
  seed      - Run database seeds
  setup     - Run migrations and seeds
  reset     - Clear all data, run migrations and seeds (use --confirm)

Examples:
  npm run db migrate
  npm run db seed
  npm run db setup
  npm run db reset --confirm
        `);
        break;
    }
    
    console.log('Database operation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database operation failed:', error);
    process.exit(1);
  }
}

main();