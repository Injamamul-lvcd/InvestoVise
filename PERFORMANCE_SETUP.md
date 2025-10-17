# Performance Optimization Setup

This document outlines the additional packages needed for full performance optimization features.

## Required Dependencies

To enable all performance optimization features, install the following packages:

```bash
npm install @next/bundle-analyzer@15.5.3 cross-env@7.0.3 web-vitals@3.5.0
```

## Package Descriptions

### @next/bundle-analyzer
- **Purpose**: Analyzes JavaScript bundle sizes and dependencies
- **Usage**: Run `npm run analyze` to generate bundle analysis report
- **Features**: 
  - Visual bundle size analysis
  - Dependency tree visualization
  - Performance bottleneck identification

### cross-env
- **Purpose**: Cross-platform environment variable setting
- **Usage**: Enables `ANALYZE=true` flag across different operating systems
- **Features**: 
  - Windows/Mac/Linux compatibility
  - Environment variable management

### web-vitals
- **Purpose**: Measures Core Web Vitals metrics
- **Usage**: Automatically tracks performance metrics in production
- **Features**: 
  - CLS (Cumulative Layout Shift) tracking
  - FID (First Input Delay) measurement
  - LCP (Largest Contentful Paint) monitoring
  - FCP (First Contentful Paint) tracking
  - TTFB (Time to First Byte) measurement

## Available Scripts

After installing the dependencies, you can use these performance-related scripts:

```bash
# Analyze bundle sizes
npm run analyze

# Run performance benchmarks
npm run benchmark

# Build with performance optimizations
npm run build
```

## Performance Features

### Already Implemented (No Additional Dependencies)
- ✅ SEO optimization with meta tags and structured data
- ✅ Image optimization with Next.js Image component
- ✅ Lazy loading components
- ✅ Redis caching utilities
- ✅ Performance monitoring API endpoints
- ✅ Code splitting with dynamic imports

### Requires Additional Dependencies
- 🔄 Bundle size analysis (`@next/bundle-analyzer`)
- 🔄 Web Vitals tracking (`web-vitals`)
- 🔄 Cross-platform build scripts (`cross-env`)

## Fallback Behavior

The application is designed to work without these optional dependencies:

- **Bundle Analyzer**: Falls back to standard Next.js build
- **Web Vitals**: Gracefully skips performance tracking
- **Cross-env**: Uses standard environment variables

## Installation Instructions

1. Open terminal in project root
2. Run the installation command:
   ```bash
   npm install @next/bundle-analyzer@15.5.3 cross-env@7.0.3 web-vitals@3.5.0
   ```
3. Restart the development server:
   ```bash
   npm run dev
   ```

## Verification

To verify the installation worked:

1. Check that the dev server starts without errors
2. Run `npm run analyze` to test bundle analyzer
3. Open browser dev tools and check for Web Vitals logs in console
4. Visit `/api/performance` to test performance monitoring endpoint

## Troubleshooting

### PowerShell Execution Policy Error
If you encounter execution policy errors on Windows:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Module Not Found Errors
If you see "Cannot find module" errors:

1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install`
4. Restart development server

### Performance Monitoring Not Working
1. Ensure `web-vitals` package is installed
2. Check browser console for Web Vitals logs
3. Verify performance API endpoint at `/api/performance`