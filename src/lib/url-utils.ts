/**
 * SEO-friendly URL utilities for product links
 * 
 * URL Format: /store/{store-slug}/product/{name-slug}-{id-prefix}
 * Example: /store/prozesy/product/netflix-premium-2375cd90
 */

/**
 * Generate SEO-friendly slug from product name
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special chars
    .replace(/[\s_-]+/g, '-')     // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')      // Trim hyphens from ends
    .slice(0, 50);                // Limit length
}

/**
 * Generate product URL path with SEO-friendly slug
 */
export function generateProductUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  const nameSlug = slugify(productName);
  const idPrefix = productId.slice(0, 8);
  return `/store/${storeSlug}/product/${nameSlug}-${idPrefix}`;
}

/**
 * Generate full shareable URL
 */
export function getProductShareUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  return `${window.location.origin}${generateProductUrl(storeSlug, productName, productId)}`;
}

/**
 * Extract ID prefix from SEO slug (last 8 hex characters after final hyphen)
 */
export function extractIdFromSlug(urlSlug: string): string | null {
  const match = urlSlug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1] : null;
}

/**
 * Check if param is a full UUID
 */
export function isFullUUID(str: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(str);
}

/**
 * Normalize product name for comparison (removes all non-alphanumeric)
 */
export function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generate client-side slug from product name and ID
 * Used when database doesn't have a pre-stored slug
 */
export function generateClientSlug(productName: string, productId: string): string {
  const nameSlug = slugify(productName);
  const idPrefix = productId.slice(0, 8);
  return `${nameSlug}-${idPrefix}`;
}
