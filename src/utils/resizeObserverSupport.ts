/**
 * Enhanced ResizeObserver error handling utility
 * Provides comprehensive suppression and batching for ResizeObserver loop errors
 */

import React from 'react';

// Debounce function for batching ResizeObserver updates
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Batch DOM updates to prevent ResizeObserver loops
export const batchDOMUpdates = (callback: () => void): void => {
  requestAnimationFrame(() => {
    callback();
  });
};

// Safe ResizeObserver wrapper that suppresses loop errors
export class SafeResizeObserver {
  private observer: ResizeObserver;
  private isObserving = false;
  private entries: ResizeObserverEntry[] = [];
  private callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = debounce((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
      try {
        callback(entries, observer);
      } catch (error) {
        // Suppress ResizeObserver loop errors
        if (error instanceof Error && error.message.includes('ResizeObserver loop')) {
          return;
        }
        throw error;
      }
    }, 16); // ~60fps debouncing
    
    this.observer = new ResizeObserver((entries) => {
      this.entries = entries;
      this.callback(entries, this.observer);
    });
  }
  
  observe(target: Element, options?: ResizeObserverOptions): void {
    if (!this.isObserving) {
      this.observer.observe(target, options);
      this.isObserving = true;
    }
  }
  
  unobserve(target: Element): void {
    this.observer.unobserve(target);
    this.isObserving = false;
  }
  
  disconnect(): void {
    this.observer.disconnect();
    this.isObserving = false;
  }
}

// Hook for safe ResizeObserver usage in React components
export const useSafeResizeObserver = (
  callback: ResizeObserverCallback,
  deps: React.DependencyList = []
): SafeResizeObserver => {
  const observerRef = React.useRef<SafeResizeObserver | null>(null);
  
  React.useEffect(() => {
    observerRef.current = new SafeResizeObserver(callback);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, deps);
  
  return observerRef.current!;
};

// Global error handler for ResizeObserver loops
export const setupGlobalResizeObserverErrorHandling = (): void => {
  // Enhanced error suppression patterns
  const isResizeObserverError = (error: any): boolean => {
    if (!error) return false;
    
    const message = typeof error === 'string' ? error : 
                   error.message || error.reason?.message || '';
                   
    return message.toLowerCase().includes('resizeobserver') ||
           message.includes('loop completed with undelivered notifications') ||
           message.includes('ResizeObserver loop limit exceeded');
  };
  
  // Suppress console errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args.some(isResizeObserverError)) {
      return;
    }
    originalError.apply(console, args);
  };
  
  // Suppress window errors
  window.addEventListener('error', (event) => {
    if (isResizeObserverError(event.message) || isResizeObserverError(event.error)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    }
  });
  
  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (isResizeObserverError(event.reason)) {
      event.preventDefault();
      return false;
    }
  });
};

// React hook for batched state updates that prevent ResizeObserver loops
export const useBatchedStateUpdate = <T>(
  initialState: T
): [T, (newState: T | ((prev: T) => T)) => void] => {
  const [state, setState] = React.useState(initialState);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const batchedSetState = React.useCallback((newState: T | ((prev: T) => T)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      batchDOMUpdates(() => {
        setState(newState);
      });
    }, 16);
  }, []);
  
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, batchedSetState];
};