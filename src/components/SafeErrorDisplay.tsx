'use client';

import React from 'react';
import { formatError } from '@/lib/utils';

interface SafeErrorDisplayProps {
  error: any;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function SafeErrorDisplay({
  error,
  title = 'Something went wrong',
  showDetails = false,
  onRetry,
  className = '',
}: SafeErrorDisplayProps) {
  const errorMessage = formatError(error);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
          </div>
          
          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-sm font-medium text-red-800 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                {typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error)}
              </pre>
            </details>
          )}
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SafeErrorDisplay;