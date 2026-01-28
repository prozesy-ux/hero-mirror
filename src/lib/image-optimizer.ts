/**
 * Client-Side Image Optimization Utility
 * Compresses and converts images to WebP format during upload
 * for maximum performance with Cloudflare CDN
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

export interface ImageVariants {
  thumbnail: Blob;
  card: Blob;
  full: Blob;
}

// Preset configurations for different use cases
export const imagePresets = {
  thumbnail: { maxWidth: 200, maxHeight: 200, quality: 70 },
  card: { maxWidth: 600, maxHeight: 450, quality: 80 },
  product: { maxWidth: 800, maxHeight: 600, quality: 85 },
  full: { maxWidth: 1200, maxHeight: 900, quality: 85 },
  hero: { maxWidth: 1920, maxHeight: 1080, quality: 85 },
  avatar: { maxWidth: 200, maxHeight: 200, quality: 80 },
} as const;

/**
 * Check if browser supports WebP encoding
 */
export const supportsWebP = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

/**
 * Load an image file into an HTMLImageElement
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // Only resize if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

/**
 * Compress and optionally resize an image
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = supportsWebP() ? 'webp' : 'jpeg'
  } = options;

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Enable high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image with anti-aliasing
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob
  return new Promise((resolve, reject) => {
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality / 100
    );
  });
};

/**
 * Create multiple size variants of an image
 */
export const createImageVariants = async (
  file: File
): Promise<ImageVariants> => {
  const [thumbnail, card, full] = await Promise.all([
    compressImage(file, imagePresets.thumbnail),
    compressImage(file, imagePresets.card),
    compressImage(file, imagePresets.full),
  ]);

  return { thumbnail, card, full };
};

/**
 * Get file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Calculate compression savings
 */
export const calculateSavings = (
  originalSize: number,
  compressedSize: number
): { savedBytes: number; percentage: number } => {
  const savedBytes = originalSize - compressedSize;
  const percentage = Math.round((savedBytes / originalSize) * 100);
  return { savedBytes, percentage };
};

/**
 * Create a File object from a Blob with proper naming
 */
export const blobToFile = (
  blob: Blob,
  originalName: string,
  format: 'webp' | 'jpeg' = 'webp'
): File => {
  const extension = format === 'webp' ? '.webp' : '.jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const newName = `${baseName}${extension}`;
  
  return new File([blob], newName, {
    type: format === 'webp' ? 'image/webp' : 'image/jpeg',
    lastModified: Date.now(),
  });
};

/**
 * Optimized image upload preparation
 * Compresses image and returns ready-to-upload File
 */
export const prepareImageForUpload = async (
  file: File,
  preset: keyof typeof imagePresets = 'full'
): Promise<{ file: File; originalSize: number; compressedSize: number }> => {
  const originalSize = file.size;
  const options = imagePresets[preset];
  const format = supportsWebP() ? 'webp' : 'jpeg';
  
  const compressedBlob = await compressImage(file, { ...options, format });
  const compressedFile = blobToFile(compressedBlob, file.name, format);
  
  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
  };
};
