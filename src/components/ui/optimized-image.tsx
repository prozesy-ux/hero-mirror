import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Package, ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt: string;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: 'square' | 'video' | '4/3' | '3/2' | 'auto';
  priority?: boolean;
  showSkeleton?: boolean;
  onLoadComplete?: () => void;
}

/**
 * Optimized Image Component
 * - Lazy loading with intersection observer
 * - Skeleton placeholder while loading
 * - Error fallback with icon
 * - Proper loading and decoding attributes
 * - High-quality image rendering
 */
const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      className,
      fallbackIcon,
      aspectRatio = 'auto',
      priority = false,
      showSkeleton = true,
      onLoadComplete,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection observer for lazy loading
    useEffect(() => {
      if (priority || !containerRef.current) {
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px',
          threshold: 0.01,
        }
      );

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, [priority]);

    // Reset states when src changes
    useEffect(() => {
      setIsLoading(true);
      setHasError(false);
    }, [src]);

    const handleLoad = () => {
      setIsLoading(false);
      onLoadComplete?.();
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    const aspectRatioClass = {
      square: 'aspect-square',
      video: 'aspect-video',
      '4/3': 'aspect-[4/3]',
      '3/2': 'aspect-[3/2]',
      auto: '',
    }[aspectRatio];

    const FallbackIcon = fallbackIcon || <Package className="w-1/4 h-1/4 min-w-8 min-h-8 text-slate-300" />;

    // No valid src
    if (!src) {
      return (
        <div
          ref={containerRef}
          className={cn(
            'relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center',
            aspectRatioClass,
            className
          )}
        >
          {FallbackIcon}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden bg-slate-100', aspectRatioClass, className)}
      >
        {/* Skeleton while loading */}
        {showSkeleton && isLoading && !hasError && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            <ImageOff className="w-1/4 h-1/4 min-w-8 min-h-8 text-slate-300" />
          </div>
        )}

        {/* Actual image */}
        {isInView && !hasError && (
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            style={{ imageRendering: 'auto' }}
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };
export default OptimizedImage;
