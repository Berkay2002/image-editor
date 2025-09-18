'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/retroui/Skeleton';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  isMobile?: boolean;
}

export function ImagePreview({ 
  src, 
  alt = "Preview image", 
  width = 800, 
  height = 600, 
  className = "",
  isMobile = false
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{width: number, height: number}>({width: 0, height: 0});
  const [windowHeight, setWindowHeight] = useState(0);

  // Update container size and window height on resize and mount
  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
      if (typeof window !== 'undefined') {
        setWindowHeight(window.innerHeight);
      }
    };

    // Use a small delay to ensure the container is properly rendered
    const timeoutId = setTimeout(updateSizes, 10);
    
    window.addEventListener('resize', updateSizes);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSizes);
    };
  }, []);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Calculate optimal image size based on aspect ratio and mobile constraints
  const getImageStyle = () => {
    if (!imageDimensions || !containerSize.width || !containerSize.height) {
      return { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' };
    }

    const imageAspectRatio = imageDimensions.width / imageDimensions.height;
    
    // Check if we're in a mobile main panel (has mobile-main-image class but not isMobile)
    const isMobileMainPanel = className?.includes('mobile-main-image') && !isMobile;
    
    if (isMobile && !isMobileMainPanel) {
      // Legacy mobile behavior - for backward compatibility
      const isPortrait = imageAspectRatio < 1;
      
      if (isPortrait) {
        // Portrait images: increased to 50% of viewport height for better visibility
        // Mobile browsers provide more usable space than initially estimated
        const maxMobileHeight = windowHeight > 0 ? windowHeight * 0.5 : 350;
        return {
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: `${maxMobileHeight}px`
        };
      } else {
        // Landscape and square images: same width as mobile device
        return {
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: 'none'
        };
      }
    }
    
    // Desktop behavior (used for both desktop and mobile main panel)
    // This ensures mobile main panel behaves like desktop right panel:
    // - Portrait images cannot exceed panel height
    // - Landscape images cannot exceed panel width
    const containerAspectRatio = containerSize.width / containerSize.height;
    let finalWidth: string | number;
    let finalHeight: string | number;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider relative to container - fit to width
      finalWidth = '100%';
      finalHeight = 'auto';
    } else {
      // Image is taller relative to container - fit to height
      finalWidth = 'auto';
      finalHeight = '100%';
    }

    return {
      width: finalWidth,
      height: finalHeight,
      maxWidth: '100%',
      maxHeight: '100%'
    };
  };

  if (hasError) {
    return (
      <div className={`relative w-full max-w-none mx-auto bg-muted rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center p-6 md:p-8">
          <p className="font-sans text-sm md:text-base text-muted-foreground mb-2 font-medium">Failed to load image</p>
          <p className="font-sans text-xs md:text-sm text-muted-foreground">Please try uploading a different image</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-center justify-center w-full h-full ${className}`}
    >
      {isLoading && (
        <Skeleton className="w-full aspect-[4/3] md:aspect-[4/3] rounded-lg" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={imageDimensions?.width || width}
        height={imageDimensions?.height || height}
        className={`rounded-lg shadow-lg transition-opacity object-contain ${
          isLoading ? 'opacity-0 absolute' : 'opacity-100'
        }`}
        style={getImageStyle()}
        onLoad={handleLoad}
        onError={handleError}
        priority
        unoptimized
      />
    </div>
  );
}