'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Skeleton } from '@/components/retroui/Skeleton';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ImagePreview({ 
  src, 
  alt = "Preview image", 
  width = 800, 
  height = 600, 
  className = "" 
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`relative w-full max-w-2xl mx-auto bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <p className="font-sans text-muted-foreground mb-2 font-medium">Failed to load image</p>
          <p className="font-sans text-sm text-muted-foreground">Please try uploading a different image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      {isLoading && (
        <Skeleton className="w-full aspect-[4/3] rounded-lg" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-auto rounded-lg shadow-lg transition-opacity ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        priority
      />
    </div>
  );
}