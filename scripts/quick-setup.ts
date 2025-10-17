#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command: string, description: string) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    throw error;
  }
}

async function quickSetup() {
  log('🚀 Indian Investment Platform - Quick Setup', 'bright');
  log('='.repeat(50), 'cyan');

  try {
    // Step 1: Check if .env.local exists
    const envPath = join(process.cwd(), '.env.local');
    if (!existsSync(envPath)) {
      log('\n📋 Creating .env.local file...', 'yellow');
      copyFileSync('.env.local.template', '.env.local');
      log('✅ .env.local created from template', 'green');
      log('⚠️  Please edit .env.local with your database credentials', 'yellow');
    } else {
      log('\n✅ .env.local already exists', 'green');
    }

    // Step 2: Check Docker
    try {
      execSync('docker --version', { stdio: 'pipe' });
      log('\n✅ Docker is available', 'green');
      
      // Ask user if they want to use Docker
      log('\n🐳 Starting MongoDB and Redis with Docker...', 'blue');
      runCommand('docker-compose up -d mongodb redis', 'Starting database services');
      
      // Wait a moment for services to start
      log('\n⏳ Waiting for services to start...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      log('\n⚠️  Docker not available. Please install MongoDB manually.', 'yellow');
      log('   See DATABASE_SETUP_GUIDE.md for instructions', 'yellow');
    }

    // Step 3: Test database connection
    log('\n🔍 Testing database connection...', 'blue');
    try {
      execSync('npm run test:db', { stdio: 'inherit' });
    } catch (error) {
      log('\n❌ Database connection failed. Please check your setup.', 'red');
      log('📚 See DATABASE_SETUP_GUIDE.md for troubleshooting', 'yellow');
      throw error;
    }

    // Step 4: Initialize database
    log('\n📊 Initializing database with sample data...', 'blue');
    try {
      runCommand('npm run db:setup', 'Database initialization');
    } catch (error) {
      log('⚠️  Database initialization failed, but connection works', 'yellow');
      log('   You can run "npm run db:setup" manually later', 'yellow');
    }

    // Step 5: Success message
    log('\n🎉 Setup completed successfully!', 'green');
    log('='.repeat(50), 'cyan');
    log('\n📋 Next steps:', 'bright');
    log('   1. Edit .env.local with your configuration', 'cyan');
    log('   2. Run "npm run dev" to start the development server', 'cyan');
    log('   3. Visit http://localhost:3000 to see your application', 'cyan');
    log('   4. Visit http://localhost:8081 for MongoDB Express (optional)', 'cyan');
    log('\n📚 Documentation:', 'bright');
    log('   - DATABASE_SETUP_GUIDE.md - Database setup instructions', 'cyan');
    log('   - README.md - General project information', 'cyan');
    log('\n🔧 Useful commands:', 'bright');
    log('   - npm run test:db - Test database connection', 'cyan');
    log('   - npm run db:setup - Initialize database', 'cyan');
    log('   - docker-compose logs mongodb - View MongoDB logs', 'cyan');

  } catch (error) {
    log('\n❌ Setup failed. Please check the error messages above.', 'red');
    log('📚 For help, see DATABASE_SETUP_GUIDE.md', 'yellow');
    process.exit(1);
  }
}

quickSetup();