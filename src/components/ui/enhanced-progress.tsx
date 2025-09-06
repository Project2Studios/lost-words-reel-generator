import React from 'react';
import { Progress } from './progress';

interface EnhancedProgressProps {
  value: number;
  className?: string;
  showSparkles?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedProgress: React.FC<EnhancedProgressProps> = ({ 
  value, 
  className = '', 
  showSparkles = false,
  size = 'md' 
}) => {
  const getHeightClass = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'md': return 'h-3';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };

  const getSparkleSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'md': return 'w-4 h-4';
      case 'lg': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  return (
    <div className="relative">
      <Progress 
        value={value} 
        className={`${getHeightClass()} progress-magical ${className}`}
      />
      
      {/* Sparkle effects for progress milestones */}
      {showSparkles && value > 0 && (
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden rounded-full">
          {/* Sparkles at 25%, 50%, 75%, 100% */}
          {[25, 50, 75, 100].map(milestone => {
            if (value >= milestone) {
              return (
                <div
                  key={milestone}
                  className={`absolute top-1/2 transform -translate-y-1/2 ${getSparkleSize()} text-yellow-400 animate-twinkle`}
                  style={{ left: `${milestone}%` }}
                >
                  ✨
                </div>
              );
            }
            return null;
          })}
          
          {/* Moving sparkle that follows progress */}
          {value > 5 && (
            <div
              className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 ${getSparkleSize()} text-white animate-gentle-bounce`}
              style={{ left: `${Math.min(value, 95)}%` }}
            >
              ⭐
            </div>
          )}
        </div>
      )}
      
      {/* Progress percentage display */}
      {value >= 100 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white animate-bounce">
            Complete! 🎉
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedProgress;