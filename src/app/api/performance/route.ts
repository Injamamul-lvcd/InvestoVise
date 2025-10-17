import { NextRequest, NextResponse } from 'next/server';
import cache, { CacheKeys, CacheTTL } from '@/lib/cache';

interface PerformanceData {
  url: string;
  metrics: {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }[];
  userAgent: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceData = await request.json();
    
    // Validate the data
    if (!data.url || !data.metrics || !Array.isArray(data.metrics)) {
      return NextResponse.json(
        { error: 'Invalid performance data' },
        { status: 400 }
      );
    }

    // Store performance data in cache for analysis
    const cacheKey = cache.generateKey('performance', data.url, Date.now().toString());
    await cache.set(cacheKey, data, CacheTTL.VERY_LONG);

    // Aggregate metrics for reporting
    const aggregateKey = cache.generateKey('performance_aggregate', data.url);
    const existingData = await cache.get<{
      count: number;
      metrics: Record<string, { total: number; count: number; avg: number }>;
    }>(aggregateKey);

    const aggregateData = existingData || {
      count: 0,
      metrics: {},
    };

    aggregateData.count += 1;

    data.metrics.forEach(metric => {
      if (!aggregateData.metrics[metric.name]) {
        aggregateData.metrics[metric.name] = { total: 0, count: 0, avg: 0 };
      }
      
      const metricData = aggregateData.metrics[metric.name];
      metricData.total += metric.value;
      metricData.count += 1;
      metricData.avg = metricData.total / metricData.count;
    });

    await cache.set(aggregateKey, aggregateData, CacheTTL.VERY_LONG);

    // Log performance issues in development
    if (process.env.NODE_ENV === 'development') {
      const poorMetrics = data.metrics.filter(m => m.rating === 'poor');
      if (poorMetrics.length > 0) {
        console.warn('Performance Issues Detected:', {
          url: data.url,
          poorMetrics,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Performance tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track performance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    const aggregateKey = cache.generateKey('performance_aggregate', url);
    const data = await cache.get(aggregateKey);

    if (!data) {
      return NextResponse.json({
        url,
        count: 0,
        metrics: {},
      });
    }

    return NextResponse.json({
      url,
      ...data,
    });
  } catch (error) {
    console.error('Performance data retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance data' },
      { status: 500 }
    );
  }
}