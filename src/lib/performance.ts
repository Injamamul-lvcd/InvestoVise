// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface WebVitals {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
}

// Web Vitals thresholds
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

export function getRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function sendToAnalytics(metric: PerformanceMetrics) {
  // In a real application, send to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metric:', metric);
  }
  
  // Example: Send to Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value),
      custom_map: {
        metric_rating: metric.rating,
      },
    });
  }
}

// Performance observer for monitoring
export function observePerformance() {
  if (typeof window === 'undefined') return;

  // Observe navigation timing
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Time to First Byte
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            sendToAnalytics({
              name: 'TTFB',
              value: ttfb,
              rating: getRating('TTFB', ttfb),
              timestamp: Date.now(),
            });
          }
          
          if (entry.entryType === 'paint') {
            const paintEntry = entry as PerformancePaintTiming;
            if (paintEntry.name === 'first-contentful-paint') {
              sendToAnalytics({
                name: 'FCP',
                value: paintEntry.startTime,
                rating: getRating('FCP', paintEntry.startTime),
                timestamp: Date.now(),
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }
}

// Image optimization utilities
export function getOptimizedImageUrl(
  src: string,
  width: number,
  height?: number,
  quality: number = 75
): string {
  if (!src) return '';
  
  // For Next.js Image Optimization API
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: quality.toString(),
  });
  
  if (height) {
    params.set('h', height.toString());
  }
  
  return `/_next/image?${params.toString()}`;
}

// Lazy loading utilities
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Resource preloading
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
}

// Critical resource hints
export function addResourceHints() {
  if (typeof document === 'undefined') return;
  
  // DNS prefetch for external domains
  const domains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'images.unsplash.com',
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

// Bundle analysis helper
export function logBundleSize() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Log approximate bundle size
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('/_next/static/')) {
        // Estimate size based on typical Next.js bundle patterns
        if (src.includes('chunks/main')) totalSize += 50; // ~50KB
        if (src.includes('chunks/framework')) totalSize += 40; // ~40KB
        if (src.includes('chunks/pages')) totalSize += 20; // ~20KB per page
      }
    });
    
    console.log(`Estimated bundle size: ~${totalSize}KB`);
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !(performance as any).memory) return;
  
  const memory = (performance as any).memory;
  const memoryInfo = {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Memory Usage:', memoryInfo);
  }
  
  return memoryInfo;
}