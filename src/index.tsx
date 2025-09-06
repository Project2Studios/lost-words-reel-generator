import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { setupGlobalResizeObserverErrorHandling } from './utils/resizeObserverSupport';

// Enhanced ResizeObserver error suppression using centralized utility
// These errors are benign and occur during GUI interactions and PIXI canvas updates
setupGlobalResizeObserverErrorHandling();

// Legacy suppression for additional coverage

// Additional legacy suppression patterns for edge cases
const additionalSuppressionPatterns = [
  'loop completed with undelivered notifications',
  'ResizeObserver loop limit exceeded',
  'Maximum call stack size exceeded' // Sometimes related to ResizeObserver loops
];

// Enhanced console error filtering
const originalConsoleError = window.console.error;
window.console.error = (...args: any[]) => {
  const firstArg = args[0];
  const message = typeof firstArg === 'string' ? firstArg : 
                 firstArg?.message || firstArg?.stack || '';
  
  if (additionalSuppressionPatterns.some(pattern => message.includes(pattern))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// 4. Override React's error handling in development
if (process.env.NODE_ENV === 'development') {
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      return true; // Prevents default error handling
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


