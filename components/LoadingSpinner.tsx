
import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ size = 'md', color = 'border-blue-500' }) => {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} border-4 ${color} border-t-transparent rounded-full animate-spin`} role="status" aria-label="Đang tải"></div>
    </div>
  );
};