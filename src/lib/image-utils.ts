/**
 * Image Quality Utilities
 * Provides functions for ensuring high-quality image rendering
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
 * Get image with cache-busting for updated images
 */
export const getCacheBustedUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const timestamp = Date.now();
  return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
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
};

/**
 * Image loading attributes for performance
 */
export const imageLoadingAttrs = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
};
