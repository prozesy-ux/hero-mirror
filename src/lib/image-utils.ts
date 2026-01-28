/**
 * Image Quality & CDN Utilities
 * Provides functions for image optimization with Cloudflare CDN
 */

/**
 * Get a high-quality version of an image URL
 * Appends quality parameters to supported image services
 */
export const getHighQualityUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  // For Supabase storage URLs, add quality parameter
  if (url.includes('supabase.co/storage')) {
    return url.includes('?') ? `${url}&quality=100` : `${url}?quality=100`;
  }
  
  // For Clearbit logos
  if (url.includes('clearbit.com')) {
    return url.includes('?') ? `${url}&size=200` : `${url}?size=200`;
  }
  
  // For other URLs, return as-is
  return url;
};

/**
 * Get CDN-optimized URL with cache control
 * Adds version parameter for cache busting when needed
 */
export const getCDNUrl = (url: string | null | undefined, version?: string): string => {
  if (!url) return '';
  
  // Already has cache-busting parameter
  if (url.includes('v=') || url.includes('t=')) {
    return url;
  }
  
  // Add version for cache control if provided
  if (version) {
    return url.includes('?') ? `${url}&v=${version}` : `${url}?v=${version}`;
  }
  
  return url;
};

/**
 * Get image with cache-busting for updated images
 */
export const getCacheBustedUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const timestamp = Date.now();
  return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
};

/**
 * Generate responsive srcset for different viewport sizes
 * @param url - Base image URL
 * @param sizes - Array of widths to generate srcset entries for
 */
export const getResponsiveSrcSet = (
  url: string | null | undefined,
  sizes: number[] = [200, 400, 800, 1200]
): string => {
  if (!url) return '';
  
  // For images that support responsive variants (future enhancement)
  // Currently returns the base URL for all sizes
  return sizes
    .map((size) => `${url} ${size}w`)
    .join(', ');
};

/**
 * Get optimized sizes attribute for responsive images
 */
export const getResponsiveSizes = (
  defaultSize: string = '100vw',
  breakpoints?: { [key: string]: string }
): string => {
  if (!breakpoints) {
    return defaultSize;
  }
  
  const entries = Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
  
  return entries ? `${entries}, ${defaultSize}` : defaultSize;
};

/**
 * Props for optimized images
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

/**
 * Standard image styling classes for high-quality rendering
 */
export const imageClasses = {
  avatar: 'w-full h-full object-cover rounded-full',
  product: 'w-full h-full object-cover',
  thumbnail: 'w-full h-full object-cover rounded-lg',
  logo: 'w-full h-full object-contain',
  card: 'w-full h-full object-cover rounded-xl',
};

/**
 * Image loading attributes for performance
 */
export const imageLoadingAttrs = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
};

/**
 * Standard image props for optimized loading
 */
export const getOptimizedImageProps = (priority: boolean = false) => ({
  loading: priority ? ('eager' as const) : ('lazy' as const),
  decoding: 'async' as const,
  style: { imageRendering: 'auto' as const },
});
