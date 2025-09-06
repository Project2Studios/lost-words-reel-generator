import React from 'react';
import { cn } from "../../lib/utils";

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Loading: React.FC<LoadingProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn(
      'border-2 border-current border-t-transparent rounded-full animate-spin',
      sizeClasses[size],
      className
    )} />
  );
};

export default Loading;