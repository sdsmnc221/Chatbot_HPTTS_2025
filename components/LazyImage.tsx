
import React, { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  fallbackSrc: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, fallbackSrc, className }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setImageSrc(fallbackSrc);
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" role="status" aria-label="Đang tải hình ảnh"></div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden={isLoading}
      />
    </div>
  );
};