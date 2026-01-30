/**
 * SEO-friendly URL utilities for product links
 * 
 * URL Format: /store/{store-slug}/product/{slug}
 * Example: /store/prozesy/product/netflix-premium
 * 
 * Slugs are stored in the database and auto-generated from product names.
 * For backward compatibility, legacy URLs with UUID suffixes are still supported.
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
 * Generate product URL path using clean slug from database
 * @param storeSlug - The store's URL slug
 * @param productSlug - The product's clean slug (from database or generated)
 */
export function generateProductUrl(
  storeSlug: string, 
  productSlug: string
): string {
  return `/store/${storeSlug}/product/${productSlug}`;
}

/**
 * Generate product URL with fallback for products without database slug
 * Used during transition period or for client-side generation
 */
export function generateProductUrlWithFallback(
  storeSlug: string, 
  productSlug: string | null | undefined,
  productName: string,
  productId: string
): string {
  // Use database slug if available, otherwise generate legacy format
  const slug = productSlug || generateLegacySlug(productName, productId);
  return `/store/${storeSlug}/product/${slug}`;
}

/**
 * Generate legacy slug format (name-slug-uuid-prefix) for backward compatibility
 * This is used when database slug is not yet available
 */
export function generateLegacySlug(productName: string, productId: string): string {
  const nameSlug = slugify(productName);
  const idPrefix = productId.slice(0, 8);
  return `${nameSlug}-${idPrefix}`;
}

/**
 * Generate full shareable URL
 */
export function getProductShareUrl(
  storeSlug: string, 
  productSlug: string
): string {
  return `${window.location.origin}${generateProductUrl(storeSlug, productSlug)}`;
}

/**
 * Extract ID prefix from legacy SEO slug (last 8 hex characters after final hyphen)
 * Used for backward compatibility with old URLs
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
 * @deprecated Use generateLegacySlug instead
 */
export function generateClientSlug(productName: string, productId: string): string {
  return generateLegacySlug(productName, productId);
}
