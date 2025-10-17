'use client';

import { useEffect } from 'react';
import { sendToAnalytics, getRating } from '@/lib/performance';

export function WebVitals() {
  useEffect(() => {
    // Try to load web-vitals dynamically
    const loadWebVitals = async () => {
      try {
        const webVitals = await import('web-vitals');
        
        // Measure and report Web Vitals
        webVitals.getCLS((metric) => {
          sendToAnalytics({
            name: 'CLS',
            value: metric.value,
            rating: getRating('CLS', metric.value),
            timestamp: Date.now(),
          });
        });

        webVitals.getFID((metric) => {
          sendToAnalytics({
            name: 'FID',
            value: metric.value,
            rating: getRating('FID', metric.value),
            timestamp: Date.now(),
          });
        });

        webVitals.getFCP((metric) => {
          sendToAnalytics({
            name: 'FCP',
            value: metric.value,
            rating: getRating('FCP', metric.value),
            timestamp: Date.now(),
          });
        });

        webVitals.getLCP((metric) => {
          sendToAnalytics({
            name: 'LCP',
            value: metric.value,
            rating: getRating('LCP', metric.value),
            timestamp: Date.now(),
          });
        });

        webVitals.getTTFB((metric) => {
          sendToAnalytics({
            name: 'TTFB',
            value: metric.value,
            rating: getRating('TTFB', metric.value),
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        console.warn('Web Vitals library not available. Install web-vitals package for performance monitoring.');
      }
    };

    loadWebVitals();
  }, []);

  return null; // This component doesn't render anything
}

export default WebVitals;