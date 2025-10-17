const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Performance benchmark utility
class PerformanceBenchmark {
  constructor() {
    this.results = [];
  }

  async measureFunction(name, fn, iterations = 1000) {
    console.log(`Benchmarking ${name}...`);
    
    const times = [];
    
    // Warm up
    for (let i = 0; i < 10; i++) {
      await fn();
    }
    
    // Actual measurements
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    
    const result = {
      name,
      iterations,
      average: avg,
      min,
      max,
      median,
      total: times.reduce((a, b) => a + b, 0),
    };
    
    this.results.push(result);
    
    console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
    
    return result;
  }

  async measureBundleSize() {
    console.log('Measuring bundle sizes...');
    
    const buildDir = path.join(process.cwd(), '.next');
    const staticDir = path.join(buildDir, 'static');
    
    if (!fs.existsSync(staticDir)) {
      console.log('Build directory not found. Run "npm run build" first.');
      return null;
    }
    
    const sizes = {};
    
    // Measure JavaScript bundles
    const jsDir = path.join(staticDir, 'chunks');
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
      let totalJsSize = 0;
      
      jsFiles.forEach(file => {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        sizes[file] = sizeKB;
        totalJsSize += sizeKB;
      });
      
      sizes.totalJavaScript = totalJsSize;
    }
    
    // Measure CSS bundles
    const cssDir = path.join(staticDir, 'css');
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
      let totalCssSize = 0;
      
      cssFiles.forEach(file => {
        const filePath = path.join(cssDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        sizes[file] = sizeKB;
        totalCssSize += sizeKB;
      });
      
      sizes.totalCSS = totalCssSize;
    }
    
    console.log('Bundle sizes:', sizes);
    return sizes;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: this.results.length,
        averageTime: this.results.reduce((sum, r) => sum + r.average, 0) / this.results.length,
        slowestTest: this.results.reduce((slowest, current) => 
          current.average > slowest.average ? current : slowest, this.results[0]),
        fastestTest: this.results.reduce((fastest, current) => 
          current.average < fastest.average ? current : fastest, this.results[0]),
      },
    };
    
    return report;
  }

  saveReport(filename = 'performance-report.json') {
    const report = this.generateReport();
    const reportPath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Performance report saved to ${reportPath}`);
    
    return report;
  }
}

// Example benchmark functions
async function benchmarkJSONParsing() {
  const data = JSON.stringify({ 
    articles: Array(100).fill(0).map((_, i) => ({
      id: i,
      title: `Article ${i}`,
      content: 'Lorem ipsum '.repeat(100),
    }))
  });
  
  return () => JSON.parse(data);
}

async function benchmarkArrayOperations() {
  const arr = Array(1000).fill(0).map((_, i) => i);
  
  return () => {
    return arr
      .filter(x => x % 2 === 0)
      .map(x => x * 2)
      .reduce((sum, x) => sum + x, 0);
  };
}

async function benchmarkObjectCreation() {
  return () => {
    const obj = {};
    for (let i = 0; i < 100; i++) {
      obj[`key${i}`] = `value${i}`;
    }
    return obj;
  };
}

// Main benchmark execution
async function runBenchmarks() {
  console.log('Starting performance benchmarks...\n');
  
  const benchmark = new PerformanceBenchmark();
  
  // Run benchmarks
  await benchmark.measureFunction('JSON Parsing', await benchmarkJSONParsing(), 1000);
  await benchmark.measureFunction('Array Operations', await benchmarkArrayOperations(), 1000);
  await benchmark.measureFunction('Object Creation', await benchmarkObjectCreation(), 1000);
  
  // Measure bundle sizes
  await benchmark.measureBundleSize();
  
  // Generate and save report
  const report = benchmark.saveReport();
  
  console.log('\nBenchmark Summary:');
  console.log(`Total tests: ${report.summary.totalTests}`);
  console.log(`Average time: ${report.summary.averageTime.toFixed(2)}ms`);
  console.log(`Slowest test: ${report.summary.slowestTest.name} (${report.summary.slowestTest.average.toFixed(2)}ms)`);
  console.log(`Fastest test: ${report.summary.fastestTest.name} (${report.summary.fastestTest.average.toFixed(2)}ms)`);
}

// Run if called directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { PerformanceBenchmark, runBenchmarks };