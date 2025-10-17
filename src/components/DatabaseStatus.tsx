'use client';

import { useState, useEffect } from 'react';
import { SafeErrorDisplay } from './SafeErrorDisplay';

interface DatabaseStatusProps {
  showStatus?: boolean;
}

export function DatabaseStatus({ showStatus = false }: DatabaseStatusProps) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (response.ok && data.status === 'ok') {
          setStatus('connected');
        } else {
          setStatus('error');
          setError(data);
        }
      } catch (err) {
        setStatus('error');
        setError(err);
      }
    };

    checkDatabaseStatus();
  }, []);

  if (!showStatus) {
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-800">Checking database...</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm">
        <SafeErrorDisplay
          error={error}
          title="Database Connection Error"
          showDetails={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-800">Database connected</span>
      </div>
    </div>
  );
}

export default DatabaseStatus;