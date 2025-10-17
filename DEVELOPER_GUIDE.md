# Developer Guide - Indian Investment Platform

Welcome to the Indian Investment Platform! This comprehensive guide will help new developers get up and running quickly with our financial education and investment platform tailored for the Indian market.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [Development Workflow](#development-workflow)
7. [Database Setup](#database-setup)
8. [Environment Configuration](#environment-configuration)
9. [Available Scripts](#available-scripts)
10. [Testing](#testing)
11. [Performance Optimization](#performance-optimization)
12. [Docker Development](#docker-development)
13. [Code Standards](#code-standards)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

## 🎯 Project Overview

The Indian Investment Platform is a comprehensive financial education and investment platform similar to Investopedia, but specifically focused on:

- **Educational Content**: Articles about Indian financial markets, investment strategies, and regulations
- **Financial Tools**: Calculators for SIP, EMI, tax planning, and retirement planning
- **Product Comparison**: Compare loans, credit cards, and brokers
- **Market Data**: Real-time Indian market indices and news
- **Affiliate Integration**: Seamless integration with financial product providers

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **React Query** - Server state management

### Backend
- **Node.js** - Runtime environment
- **Next.js API Routes** - Backend API
- **MongoDB** - Primary database
- **Mongoose** - MongoDB ODM
- **Redis** - Caching and session storage
- **JWT** - Authentication

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Testing framework
- **TypeScript** - Static type checking
- **Docker** - Containerization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Git** - Version control
- **MongoDB** - Database (local, Atlas, or Docker)
- **Redis** - Caching (local or Docker)
- **Docker** (optional) - For containerized development

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd indian-investment-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.local.template .env.local

# Edit .env.local with your configuration
# See Environment Configuration section for details
```

### 4. Database Setup (Choose One Option)

#### Option A: Docker (Recommended for Development)
```bash
# Start MongoDB and Redis with Docker
docker-compose up -d

# Verify services are running
docker-compose ps
```

#### Option B: Local Installation
- Install MongoDB and Redis locally
- Update `.env.local` with local connection strings

#### Option C: Cloud Services
- Set up MongoDB Atlas and Redis Cloud
- Update `.env.local` with cloud connection strings

### 5. Initialize Database
```bash
# Run migrations and seed data
npm run db:setup

# Test database connection
npm run test:db
```

### 6. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application running!

## 📁 Project Structure

```
indian-investment-platform/
├── .husky/                 # Git hooks
├── .kiro/                  # Kiro IDE configuration
├── .next/                  # Next.js build output
├── .vscode/                # VS Code settings
├── docs/                   # Documentation
├── public/                 # Static assets
├── scripts/                # Utility scripts
│   ├── db-setup.ts        # Database management
│   ├── mongo-init.js      # MongoDB initialization
│   ├── performance-benchmark.js
│   ├── quick-setup.ts     # Quick project setup
│   └── test-*.ts          # Test utilities
├── src/                    # Source code
│   ├── __tests__/         # Test files
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # Reusable React components
│   │   ├── ui/            # Basic UI components
│   │   ├── forms/         # Form components
│   │   ├── charts/        # Chart components
│   │   └── layout/        # Layout components
│   ├── config/            # Configuration files
│   │   ├── database.ts    # Database config
│   │   ├── redis.ts       # Redis config
│   │   └── index.ts       # Main config
│   ├── lib/               # Utility libraries
│   │   ├── auth/          # Authentication utilities
│   │   ├── database/      # Database utilities
│   │   ├── migrations/    # Database migrations
│   │   ├── seeds/         # Database seeds
│   │   ├── cache/         # Caching utilities
│   │   └── utils/         # General utilities
│   ├── models/            # Database models
│   │   ├── User.ts        # User model
│   │   ├── Article.ts     # Article model
│   │   ├── Product.ts     # Product model
│   │   └── Affiliate.ts   # Affiliate model
│   └── types/             # TypeScript type definitions
├── .dockerignore          # Docker ignore file
├── .env.local.template    # Environment template
├── .eslintrc.json         # ESLint configuration
├── .gitignore             # Git ignore file
├── .prettierrc            # Prettier configuration
├── docker-compose.yml     # Docker services
├── Dockerfile             # Production Docker image
├── jest.config.js         # Jest configuration
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 🔄 Development Workflow

### Daily Development Process

1. **Pull Latest Changes**
   ```bash
   git pull origin main
   npm install  # Install any new dependencies
   ```

2. **Start Development Environment**
   ```bash
   # Start database services (if using Docker)
   docker-compose up -d
   
   # Start development server
   npm run dev
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Development Cycle**
   - Make changes to code
   - Test changes locally
   - Run linting and formatting
   - Commit changes with descriptive messages

5. **Pre-commit Checks** (Automated via Husky)
   ```bash
   # These run automatically on commit
   npm run lint:fix
   npm run format
   npm run type-check
   ```

6. **Testing**
   ```bash
   # Run all tests
   npm test
   
   # Run tests in watch mode
   npm run test:watch
   
   # Run tests with coverage
   npm run test:coverage
   ```

### Code Review Process

1. Push your feature branch
2. Create a Pull Request
3. Ensure all CI checks pass
4. Request review from team members
5. Address feedback and make changes
6. Merge after approval

## 🗄 Database Setup

### Quick Setup with Docker (Recommended)

```bash
# Start MongoDB and Redis
docker-compose up -d

# Initialize database with sample data
npm run db:setup

# Test connection
npm run test:db
```

### Manual Setup Options

For detailed database setup instructions, see:
- [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) - Comprehensive setup guide
- [DATABASE.md](./DATABASE.md) - Database schema and models
- [DATABASE_CONNECTION_SOLUTION.md](./DATABASE_CONNECTION_SOLUTION.md) - Troubleshooting

### Database Management Commands

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Complete setup (migrate + seed)
npm run db:setup

# Reset database (WARNING: Deletes all data)
npm run db:reset --confirm

# Check migration status
npm run db status
```

## ⚙️ Environment Configuration

### Required Environment Variables

Create `.env.local` from the template and configure:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/indian_investment_platform
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum
SESSION_SECRET=your_super_secure_session_secret_32_chars_minimum
JWT_EXPIRES_IN=7d

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Environment
NODE_ENV=development
PORT=3000
```

### Generate Secure Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment-Specific Configurations

- **Development**: Use `.env.local`
- **Testing**: Use `.env.test`
- **Production**: Use environment variables or `.env.production`

## 📜 Available Scripts

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run setup        # Quick project setup
```

### Code Quality Scripts
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
```

### Database Scripts
```bash
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:setup     # Run migrations and seeds
npm run db:reset     # Reset database (use --confirm)
npm run test:db      # Test database connection
```

### Testing Scripts
```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci      # Run tests for CI/CD
```

### Performance Scripts
```bash
npm run analyze      # Analyze bundle sizes
npm run benchmark    # Run performance benchmarks
```

## 🧪 Testing

### Testing Strategy

We use **Jest** and **React Testing Library** for comprehensive testing:

- **Unit Tests**: Individual functions and components
- **Integration Tests**: API routes and database operations
- **Component Tests**: React component behavior
- **E2E Tests**: Full user workflows (planned)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=components/Button

# Run tests matching a pattern
npm test -- --testNamePattern="should render correctly"
```

### Test File Structure

```
src/
├── __tests__/
│   ├── components/
│   │   └── Button.test.tsx
│   ├── lib/
│   │   └── utils.test.ts
│   └── api/
│       └── auth.test.ts
```

### Writing Tests

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## ⚡ Performance Optimization

### Core Web Vitals Monitoring

The platform includes built-in performance monitoring:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

### Performance Features

- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Dynamic imports for large components
- **Caching**: Redis caching for API responses
- **Bundle Analysis**: Webpack bundle analyzer
- **SEO Optimization**: Meta tags and structured data

### Performance Scripts

```bash
# Analyze bundle sizes
npm run analyze

# Run performance benchmarks
npm run benchmark

# Build with optimizations
npm run build
```

### Performance Best Practices

1. **Use Next.js Image component** for all images
2. **Implement lazy loading** for heavy components
3. **Cache API responses** using Redis
4. **Minimize bundle size** with dynamic imports
5. **Monitor Core Web Vitals** in production

For detailed performance setup, see [PERFORMANCE_SETUP.md](./PERFORMANCE_SETUP.md).

## 🐳 Docker Development

### Development with Docker

```bash
# Start all services (MongoDB, Redis, App)
docker-compose -f docker-compose.dev.yml up

# Start only database services
docker-compose up -d mongodb redis

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build production image
docker build -t indian-investment-platform .

# Run production container
docker run -p 3000:3000 indian-investment-platform
```

### Docker Services

- **MongoDB**: Database on port 27017
- **Redis**: Cache on port 6379
- **Mongo Express**: Database GUI on port 8081 (optional)

## 📏 Code Standards

### ESLint Configuration

We use strict ESLint rules for code quality:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Prettier Configuration

Consistent code formatting with Prettier:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### TypeScript Standards

- Use strict TypeScript configuration
- Define types for all props and functions
- Avoid `any` type usage
- Use proper type imports

### Git Hooks (Husky)

Pre-commit hooks automatically run:
- ESLint fixing
- Prettier formatting
- TypeScript type checking

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`, `ApiResponse`)

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues
```bash
# Check if MongoDB is running
docker-compose ps

# Test database connection
npm run test:db

# Reset database connection
npm run db:reset --confirm
```

#### 2. Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript Errors
```bash
# Run type checking
npm run type-check

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### 4. Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

#### 5. Docker Issues
```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# View service logs
docker-compose logs mongodb
```

### Getting Help

1. **Check existing documentation** in the `docs/` folder
2. **Search issues** in the project repository
3. **Run diagnostic scripts** (`npm run test:db`)
4. **Check logs** for specific error messages
5. **Ask team members** for assistance

## 🤝 Contributing

### Development Process

1. **Fork the repository** (if external contributor)
2. **Create feature branch** from `main`
3. **Make changes** following code standards
4. **Write tests** for new functionality
5. **Run all checks** before committing
6. **Submit Pull Request** with clear description

### Pull Request Guidelines

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Link to issues** if applicable
- **Screenshots** for UI changes
- **Test coverage** for new features

### Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed

## 📚 Additional Resources

### Documentation Files
- [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) - Detailed database setup
- [PERFORMANCE_SETUP.md](./PERFORMANCE_SETUP.md) - Performance optimization
- [DATABASE.md](./DATABASE.md) - Database schema and models
- [NAVBAR_ADMIN_FIXES.md](./NAVBAR_ADMIN_FIXES.md) - Admin interface fixes
- [REACT_ERROR_FIX.md](./REACT_ERROR_FIX.md) - Common React issues

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Jest Testing Framework](https://jestjs.io/docs)

## 🎉 Welcome to the Team!

You're now ready to start developing on the Indian Investment Platform! This guide should help you get up and running quickly. Remember:

- **Start with the Quick Start** section to get your environment running
- **Follow the Development Workflow** for daily development
- **Use the available scripts** to automate common tasks
- **Write tests** for your code
- **Ask questions** when you need help

Happy coding! 🚀