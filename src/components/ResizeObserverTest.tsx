/**
 * Test component for verifying ResizeObserver error suppression
 * This component intentionally triggers ResizeObserver interactions
 * to validate our error handling fixes work correctly
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ResizeObserverTestProps {
  onTestResult?: (success: boolean) => void;
}

export const ResizeObserverTest: React.FC<ResizeObserverTestProps> = ({ onTestResult }) => {
  const [value, setValue] = React.useState('test1');
  const [interactionCount, setInteractionCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const errorCountRef = React.useRef(0);

  // Monitor console errors during test
  React.useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (message.includes('ResizeObserver')) {
        errorCountRef.current += 1;
        setErrorCount(errorCountRef.current);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    setInteractionCount(prev => prev + 1);
    
    // Report test result after a few interactions
    if (interactionCount >= 5) {
      const success = errorCount === 0;
      onTestResult?.(success);
    }
  };

  const triggerRapidChanges = () => {
    const values = ['test1', 'test2', 'test3', 'test4', 'test5'];
    let index = 0;
    
    const interval = setInterval(() => {
      setValue(values[index % values.length]);
      setInteractionCount(prev => prev + 1);
      index++;
      
      if (index >= 20) {
        clearInterval(interval);
        setTimeout(() => {
          const success = errorCount === 0;
          onTestResult?.(success);
        }, 1000);
      }
    }, 100);
  };

  return (
    <div className="p-4 border rounded-lg bg-slate-50">
      <h3 className="font-medium mb-4">ResizeObserver Error Test</h3>
      
      <div className="space-y-4">
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger className="hover:scale-105 transition-transform duration-200">
            <SelectValue placeholder="Select a test value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test1">🧪 Test Option 1</SelectItem>
            <SelectItem value="test2">⚗️ Test Option 2</SelectItem>
            <SelectItem value="test3">🔬 Test Option 3</SelectItem>
            <SelectItem value="test4">🧬 Test Option 4</SelectItem>
            <SelectItem value="test5">🦠 Test Option 5</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={triggerRapidChanges}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Trigger Rapid Changes Test
        </button>

        <div className="text-sm space-y-1">
          <div>Interactions: {interactionCount}</div>
          <div className={`${errorCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
            ResizeObserver Errors: {errorCount}
          </div>
          <div className={`font-medium ${errorCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
            Status: {errorCount === 0 ? '✅ No errors detected' : '❌ Errors detected'}
          </div>
        </div>
      </div>
    </div>
  );
};