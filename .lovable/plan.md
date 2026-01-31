

# Sitemap Creation & Home Page SEO Fix

## Problem Analysis

### Current Issues:
1. **No sitemap.xml exists** - The `robots.txt` references `/sitemap.xml` but the file doesn't exist in the `public/` folder
2. **Home page not indexed properly** - Google is tracking marketplace/store pages but not the home page because:
   - The home page (`/`) lacks dynamic meta tags
   - No canonical URL is set
   - No structured data for the main landing page
3. **React SPA limitation** - Static sitemap won't include dynamic products/stores

### Current State:
- `robots.txt` exists and references `https://hero-mirror.lovable.app/sitemap.xml`
- Google site verification is in place (`Pj61r5QBXa8sM4UySe_FO5Hy7VmIy83Zt6nyPEKvbWE`)
- Google Indexing API is configured with service account credentials
- Products exist with slugs: `/store/{store_slug}/product/{product_slug}`
- Stores exist with slugs: `/store/{store_slug}`

## Solution Overview

We need to create:
1. **Dynamic Sitemap Edge Function** - Generates XML sitemap with all static pages + dynamic products/stores
2. **Static Sitemap Fallback** - Basic `sitemap.xml` in `public/` for immediate indexing
3. **SEO Component** - For dynamic meta tags on home page and other routes
4. **Canonical URLs** - To prevent duplicate content issues
5. **Structured Data** - JSON-LD for Organization on home page

## Implementation Plan

### Phase 1: Create Dynamic Sitemap Edge Function

**New File: `supabase/functions/sitemap-generate/index.ts`**

This edge function will:
- Return XML sitemap format
- Include all static routes (/, /marketplace, /signin)
- Fetch all active stores from `seller_profiles`
- Fetch all active products from `seller_products`
- Set proper lastmod dates from `updated_at` fields

```text
SITEMAP STRUCTURE:
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>https://hero-mirror.lovable.app/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://hero-mirror.lovable.app/marketplace</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Dynamic Store Pages -->
  <url>
    <loc>https://hero-mirror.lovable.app/store/prozesy</loc>
    <lastmod>2026-01-31</lastmod>
    <priority>0.8</priority>
  </url>
  
  <!-- Dynamic Product Pages -->
  <url>
    <loc>https://hero-mirror.lovable.app/store/prozesy/product/netflix-premium</loc>
    <lastmod>2026-01-31</lastmod>
    <priority>0.7</priority>
  </url>
</urlset>
```

### Phase 2: Create Static Fallback Sitemap

**New File: `public/sitemap.xml`**

A static file for immediate availability with core pages:
- `/` (Home - priority 1.0)
- `/marketplace` (priority 0.9)
- `/signin` (priority 0.5)

### Phase 3: Update robots.txt

**File: `public/robots.txt`**

Update to include proper directives and sitemap location:
```
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://hero-mirror.lovable.app/sitemap.xml
```

### Phase 4: Create SEO Head Component

**New File: `src/components/seo/SEOHead.tsx`**

A reusable component that uses `document.title` and injects meta tags:
- Sets page title dynamically
- Adds canonical URL
- Adds Open Graph tags
- Adds Twitter Card tags
- Adds JSON-LD structured data

### Phase 5: Update Home Page with SEO

**File: `src/pages/Index.tsx`**

Add SEO component with:
- Canonical URL: `https://hero-mirror.lovable.app/`
- Full Open Graph meta tags with image
- JSON-LD Organization schema
- Proper page title

### Phase 6: Update index.html

**File: `index.html`**

Add:
- Canonical link tag for home page
- Additional Open Graph properties (og:url, og:image)
- JSON-LD script for Organization

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/sitemap-generate/index.ts` | Create | Dynamic sitemap with products/stores |
| `public/sitemap.xml` | Create | Static fallback sitemap |
| `public/robots.txt` | Modify | Add sitemap reference properly |
| `src/components/seo/SEOHead.tsx` | Create | Reusable SEO meta tag component |
| `src/pages/Index.tsx` | Modify | Add SEO component for home page |
| `index.html` | Modify | Add canonical, og:url, og:image, JSON-LD |
| `supabase/config.toml` | Modify | Add sitemap-generate function config |

## Technical Details

### Sitemap Edge Function Logic

```typescript
// Fetch all active stores
const { data: stores } = await supabase
  .from('seller_profiles')
  .select('store_slug, updated_at')
  .eq('is_active', true)
  .eq('is_deleted', false);

// Fetch all active products with their seller's store_slug
const { data: products } = await supabase
  .from('seller_products')
  .select('slug, updated_at, seller_profiles!inner(store_slug)')
  .eq('is_available', true)
  .eq('is_approved', true);
```

### SEO Head Component Usage

```tsx
// In Index.tsx
<SEOHead 
  title="Uptoza | The Digital Commerce Platform"
  description="Uptoza powers global digital commerce..."
  canonicalUrl="https://hero-mirror.lovable.app/"
  ogImage="/og-image.png"
  type="website"
/>
```

### JSON-LD Schema for Home Page

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Uptoza",
  "url": "https://hero-mirror.lovable.app",
  "description": "Uptoza powers global digital commerce...",
  "sameAs": ["https://twitter.com/Uptoza"]
}
```

## Why Home Page Isn't Indexed

1. **No dedicated canonical URL** - Search engines may see it as duplicate content
2. **SPA rendering** - Initial HTML is minimal, Googlebot needs to render JavaScript
3. **Missing og:url** - Facebook/Twitter crawlers can't identify the page URL
4. **No sitemap entry with priority 1.0** - Google doesn't know it's the most important page
5. **No structured data** - Google can't understand what the site is about

## Priority & Frequency Settings

| Page Type | Priority | Change Frequency |
|-----------|----------|------------------|
| Home (/) | 1.0 | daily |
| Marketplace | 0.9 | hourly |
| Store pages | 0.8 | weekly |
| Product pages | 0.7 | weekly |
| Auth pages | 0.3 | monthly |

## Post-Implementation Steps

After implementing, you should:
1. Submit the sitemap to Google Search Console
2. Use the "Request Indexing" feature for the home page
3. Monitor crawl stats in Search Console
4. Verify the sitemap is accessible at `/sitemap.xml`
Why you use always your domain use our main domain always what is uptoza.com
