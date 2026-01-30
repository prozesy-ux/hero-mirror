/**
 * URL Utility Functions for SEO-friendly product URLs
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
    .slice(0, 60);                // Limit length
}

/**
 * Generate product URL with name + ID prefix for uniqueness
 * The 8-character ID prefix ensures no duplicates even with same product names
 */
export function generateProductUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  const nameSlug = slugify(productName);
  const idPrefix = productId.slice(0, 8); // First 8 chars of UUID
  return `/store/${storeSlug}/product/${nameSlug}-${idPrefix}`;
}

/**
 * Extract ID prefix from URL slug for database lookup
 * Returns the 8-character hex string at the end of the slug
 */
export function extractIdFromSlug(urlSlug: string): string | null {
  // Match last segment after final hyphen (8 char hex)
  const match = urlSlug.match(/-([a-f0-9]{8})$/i);
  return match ? match[1] : null;
}

/**
 * Check if a string is a full UUID (legacy URL format)
 */
export function isFullUUID(str: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(str);
}

/**
 * Generate full URL for sharing (includes origin)
 */
export function getProductShareUrl(
  storeSlug: string, 
  productName: string, 
  productId: string
): string {
  const path = generateProductUrl(storeSlug, productName, productId);
  return `${window.location.origin}${path}`;
}

/**
 * Generate client-side slug with ID suffix for consistency
 * Used when database slug is not available
 */
export function generateClientSlug(name: string, id: string): string {
  const nameSlug = slugify(name);
  const idPrefix = id.slice(0, 8);
  return `${nameSlug}-${idPrefix}`;
}
