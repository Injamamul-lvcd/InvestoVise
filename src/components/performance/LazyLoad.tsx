'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { createIntersectionObserver } from '@/lib/performance';

interface LazyLoadProps {
  children: ReactNode;
  height?: number;
  offset?: number;
  placeholder?: ReactNode;
  className?: string;
  onLoad?: () => void;
}

export function LazyLoad({
  children,
  height = 200,
  offset = 100,
  placeholder,
  className = '',
  onLoad,
}: LazyLoadProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer?.unobserve(element);
          }
        });
      },
      {
        rootMargin: `${offset}px`,
        threshold: 0.1,
      }
    );

    if (observer) {
      observer.observe(element);
      return () => observer.disconnect();
    } else {
      // Fallback for browsers without IntersectionObserver
      setIsInView(true);
    }
  }, [offset]);

  useEffect(() => {
    if (isInView && !isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [isInView, isLoaded, onLoad]);

  const defaultPlaceholder = (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      style={{ height: `${height}px` }}
    />
  );

  return (
    <div ref={elementRef} className={className}>
      {isLoaded ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
}

export default LazyLoad;