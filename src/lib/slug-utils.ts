/**
 * SEO-friendly slug utilities for product URLs
 */

/**
 * Generate SEO-friendly slug from product name
 */
export function generateSlug(name: string): string {
  if (!name) return 'product';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars (including emojis)
    .replace(/\s+/g, '-')          // Replace spaces with dashes
    .replace(/-+/g, '-')           // Remove duplicate dashes
    .replace(/^-|-$/g, '')         // Trim dashes from ends
    .substring(0, 80) || 'product'; // Limit length, fallback if empty
}

/**
 * Generate unique slug by appending counter if needed
 */
export function generateUniqueSlug(
  name: string, 
  existingSlugs: string[]
): string {
  let slug = generateSlug(name);
  let counter = 0;
  let finalSlug = slug;
  
  while (existingSlugs.includes(finalSlug)) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
}

/**
 * Check if a string looks like a UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate a client-side slug from product name with ID suffix for uniqueness
 * Format: "product-name-{first-8-chars-of-id}"
 */
export function generateClientSlug(name: string, id: string): string {
  const baseSlug = generateSlug(name);
  const idPrefix = id.substring(0, 8);
  
  // If base slug is empty (all emojis/special chars), use product-{id}
  if (!baseSlug || baseSlug === 'product') {
    return `product-${idPrefix}`;
  }
  
  return `${baseSlug}-${idPrefix}`;
}

/**
 * Extract the ID prefix from the end of a slug
 * Returns null if no valid ID prefix found
 */
export function extractIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  
  // Check if it's a full UUID first
  if (isUUID(slug)) {
    return slug;
  }
  
  // Extract last segment after the final dash
  const lastDashIndex = slug.lastIndexOf('-');
  if (lastDashIndex === -1) return null;
  
  const potentialId = slug.substring(lastDashIndex + 1);
  
  // Validate it looks like a UUID prefix (8 hex characters)
  const isHexPrefix = /^[0-9a-f]{8}$/i.test(potentialId);
  if (isHexPrefix) {
    return potentialId;
  }
  
  return null;
}

/**
 * Build a product URL for SEO-friendly navigation
 * Uses database slug if available, otherwise generates client-side slug
 */
export function buildProductUrl(
  product: { id: string; name: string; slug?: string | null },
  storeSlug: string
): string {
  // Prefer database slug if it exists
  if (product.slug) {
    return `/store/${storeSlug}/product/${product.slug}`;
  }
  
  // Generate client-side slug with ID prefix for uniqueness
  const clientSlug = generateClientSlug(product.name, product.id);
  return `/store/${storeSlug}/product/${clientSlug}`;
}
