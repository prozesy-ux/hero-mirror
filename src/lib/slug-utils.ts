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
