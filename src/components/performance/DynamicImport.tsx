'use client';

import React, { Suspense, ComponentType } from 'react';
import dynamic from 'next/dynamic';

interface DynamicImportProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  loading?: ComponentType;
  error?: ComponentType<{ error: Error; retry: () => void }>;
  ssr?: boolean;
  [key: string]: any;
}

function DefaultLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

function DefaultError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load component</h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export function createDynamicComponent<T = {}>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: ComponentType;
    error?: ComponentType<{ error: Error; retry: () => void }>;
    ssr?: boolean;
  } = {}
) {
  const DynamicComponent = dynamic(loader, {
    loading: options.loading || DefaultLoading,
    ssr: options.ssr ?? true,
  });

  return function DynamicWrapper(props: T) {
    return (
      <Suspense fallback={<DefaultLoading />}>
        <DynamicComponent {...props} />
      </Suspense>
    );
  };
}

// Pre-configured dynamic components for common use cases
export const DynamicChart = createDynamicComponent(
  () => import('@/components/charts/Chart'),
  { ssr: false }
);

export const DynamicCalculator = createDynamicComponent(
  () => import('@/components/calculators/CalculatorSuite'),
  { ssr: false }
);

export const DynamicNewsAggregator = createDynamicComponent(
  () => import('@/components/news/NewsAggregator'),
  { ssr: false }
);

export const DynamicMarketTicker = createDynamicComponent(
  () => import('@/components/market/LiveMarketTicker'),
  { ssr: false }
);

export default createDynamicComponent;