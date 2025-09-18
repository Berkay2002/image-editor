'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/retroui/Skeleton';
import { Loader } from '@/components/retroui/loader';
import { optimizeForDisplay } from '@/lib/imageUtils';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  isMobile?: boolean;
  isLoading?: boolean;
  optimizeForContainer?: boolean; // New prop to enable container-aware optimization
}

export function ImagePreview({
  src,
  alt = "Preview image",
  width = 800,
  height = 600,
  className = "",
  isMobile = false,
  isLoading: externalLoading = false,
  optimizeForContainer = false
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{width: number, height: number}>({width: 0, height: 0});
  const [windowHeight, setWindowHeight] = useState(0);
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [isOptimizing, setIsOptimizing] = useState(false);

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

  // Optimize image for display when container size changes (if enabled)
  useEffect(() => {
    if (!optimizeForContainer || !containerSize.width || !containerSize.height || isOptimizing) {
      return;
    }

    // Only optimize if the image is a blob URL or data URL (user uploaded image)
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      const optimizeImage = async () => {
        try {
          setIsOptimizing(true);

          // Convert src to File object
          const response = await fetch(src);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });

          // Optimize for current container size
          const optimized = await optimizeForDisplay(
            file,
            containerSize.width,
            containerSize.height,
            0.9
          );

          // Create new blob URL for optimized image
          const optimizedUrl = URL.createObjectURL(optimized);
          setOptimizedSrc(optimizedUrl);

          // Clean up old blob URL if it's different
          if (src.startsWith('blob:') && src !== optimizedUrl) {
            URL.revokeObjectURL(src);
          }
        } catch (error) {
          console.warn('Failed to optimize image for display:', error);
          // Fall back to original src
          setOptimizedSrc(src);
        } finally {
          setIsOptimizing(false);
        }
      };

      // Debounce optimization to avoid excessive calls
      const timeoutId = setTimeout(optimizeImage, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // For non-blob URLs, use original src
      setOptimizedSrc(src);
    }
  }, [src, containerSize.width, containerSize.height, optimizeForContainer, isOptimizing]);

  // Reset optimized src when src changes
  useEffect(() => {
    setOptimizedSrc(src);
    setIsOptimizing(false);
  }, [src]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (optimizedSrc.startsWith('blob:') && optimizedSrc !== src) {
        URL.revokeObjectURL(optimizedSrc);
      }
    };
  }, [optimizedSrc, src]);

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
        src={optimizedSrc}
        alt={alt}
        width={imageDimensions?.width || width}
        height={imageDimensions?.height || height}
        className={`rounded-lg shadow-lg transition-opacity object-contain ${
          isLoading || isOptimizing ? 'opacity-0 absolute' : 'opacity-100'
        }`}
        style={getImageStyle()}
        onLoad={handleLoad}
        onError={handleError}
        priority
        unoptimized
      />
      
      {/* External Loading Overlay - Only covers the image */}
      {externalLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader variant="default" size="lg" count={5} duration={0.8} delayStep={150} className="justify-center" />
            <div className="space-y-3">
              <p className="font-head text-lg md:text-xl font-black text-white">
                AI is generating your image...
              </p>
              <p className="font-sans text-sm text-white/80">
                This may take a few moments
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}