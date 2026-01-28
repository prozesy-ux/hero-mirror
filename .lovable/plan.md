
# Enhanced Cache-Control Headers for Cloudflare Edge Caching

## Overview

This plan optimizes all BFF edge functions with proper cache headers to maximize Cloudflare edge caching while protecting private user data.

## Key Principle: Public vs Private Caching

```text
PUBLIC endpoints (marketplace, store):
├── Cloudflare caches at edge (300+ PoPs)
├── Same response served to all users
└── Use: Cache-Control: public, max-age=X

PRIVATE endpoints (dashboard, wallet):
├── Browser caches only
├── Contains user-specific data
└── Use: Cache-Control: private, max-age=X
```

---

## Changes by File

### 1. `supabase/functions/_shared/auth-verify.ts`

**Add Cloudflare-optimized cache header helpers:**

```typescript
// Add to shared utilities
export const cacheHeaders = {
  // Public data - Cloudflare edge cacheable
  public: (maxAge = 60, swr = 120) => ({
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${swr}`,
    'Vary': 'Accept-Encoding',
    'CDN-Cache-Control': `max-age=${maxAge * 2}`, // Cloudflare-specific longer cache
  }),
  
  // Private user data - browser only
  private: (maxAge = 30, swr = 60) => ({
    'Cache-Control': `private, max-age=${maxAge}, stale-while-revalidate=${swr}`,
  }),
  
  // No cache for mutations/sensitive data
  noCache: () => ({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }),
};

// Update successResponse to accept cache options
export function cachedResponse(data: any, cacheType: 'public' | 'private' | 'none' = 'private', maxAge = 60): Response {
  const cacheDirective = cacheType === 'public' 
    ? cacheHeaders.public(maxAge, maxAge * 2)
    : cacheType === 'private'
    ? cacheHeaders.private(maxAge, maxAge * 2)
    : cacheHeaders.noCache();
    
  return new Response(
    JSON.stringify(data),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        ...cacheDirective,
      } 
    }
  );
}
```

---

### 2. `supabase/functions/bff-marketplace-home/index.ts`

**Increase cache for public marketplace data:**

| Before | After | Reason |
|--------|-------|--------|
| `max-age=60` | `max-age=300` | Categories/hot products don't change often |
| `stale-while-revalidate=120` | `stale-while-revalidate=600` | Allow stale data while refreshing |
| - | `CDN-Cache-Control: max-age=600` | Cloudflare-specific longer edge cache |
| - | `Vary: Accept-Encoding` | Proper Cloudflare cache key |

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '...',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=600',  // Cloudflare caches longer
  'Vary': 'Accept-Encoding',
};
```

---

### 3. `supabase/functions/bff-store-public/index.ts`

**Already well-optimized. Add Cloudflare-specific header:**

```typescript
const corsHeaders = {
  // ... existing headers
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=600',  // ADD: Cloudflare caches 10 min
  'Vary': 'Accept-Encoding',
};
```

---

### 4. `supabase/functions/bff-marketplace-search/index.ts`

**Optimize based on query type:**

```typescript
// Non-personalized queries (no user) can be public
const isPersonalized = !!userId;
const cacheMaxAge = query.length < 2 ? 60 : 30;

return new Response(JSON.stringify(response), {
  headers: { 
    ...corsHeaders, 
    'Content-Type': 'application/json',
    'Cache-Control': isPersonalized 
      ? `private, max-age=${cacheMaxAge}, stale-while-revalidate=120`
      : `public, max-age=${cacheMaxAge}, stale-while-revalidate=120`,
    'Vary': 'Accept-Encoding, Authorization',  // Cache varies by auth state
  },
});
```

---

### 5. `supabase/functions/bff-buyer-dashboard/index.ts`

**Keep private, add proper headers for error responses:**

```typescript
// Success response (already good)
'Cache-Control': `private, max-age=30, stale-while-revalidate=60`

// Error response (ADD - prevent caching errors)
return new Response(
  JSON.stringify({ error: 'Unauthorized' }),
  { 
    status: 401, 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',  // Don't cache errors
    } 
  }
);
```

---

### 6. `supabase/functions/bff-seller-dashboard/index.ts`

**Same pattern as buyer dashboard:**

```typescript
// Success: private, max-age=60, stale-while-revalidate=120 (already good)
// Error: Add 'Cache-Control': 'no-store'
```

---

### 7. `supabase/functions/bff-buyer-wallet/index.ts`

**Keep private, shorter cache for financial data:**

```typescript
// Financial data should have shorter cache
'Cache-Control': `private, max-age=15, stale-while-revalidate=30`
```

---

## Summary of Optimized Headers

| Endpoint | Type | Cache-Control | CDN-Cache-Control |
|----------|------|---------------|-------------------|
| `bff-marketplace-home` | Public | `public, max-age=300, swr=600` | `max-age=600` |
| `bff-store-public` | Public | `public, max-age=300, swr=600` | `max-age=600` |
| `bff-marketplace-search` | Mixed | Public if no user, Private if logged in | - |
| `bff-buyer-dashboard` | Private | `private, max-age=30, swr=60` | - |
| `bff-seller-dashboard` | Private | `private, max-age=60, swr=120` | - |
| `bff-buyer-wallet` | Private | `private, max-age=15, swr=30` | - |
| All error responses | None | `no-store` | - |

---

## Cloudflare-Specific Headers

Adding these headers maximizes Cloudflare caching:

| Header | Purpose |
|--------|---------|
| `Cache-Control` | Standard browser/proxy caching |
| `CDN-Cache-Control` | Cloudflare-specific, can be longer than browser cache |
| `Vary: Accept-Encoding` | Tells Cloudflare to cache gzip/brotli variants |
| `Vary: Authorization` | Different cache per auth state (for search) |

---

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Marketplace home cache | 60s | 300s (5x longer) |
| Store page cache | 300s | 600s at edge |
| Search (anonymous) | Private | Public (edge cacheable) |
| Error caching | Possible | Prevented |

---

## Files to Modify

1. `supabase/functions/_shared/auth-verify.ts` - Add cache header helpers
2. `supabase/functions/bff-marketplace-home/index.ts` - Increase public cache
3. `supabase/functions/bff-store-public/index.ts` - Add CDN-Cache-Control
4. `supabase/functions/bff-marketplace-search/index.ts` - Smart public/private
5. `supabase/functions/bff-buyer-dashboard/index.ts` - No-store for errors
6. `supabase/functions/bff-seller-dashboard/index.ts` - No-store for errors
7. `supabase/functions/bff-buyer-wallet/index.ts` - Shorter cache for financial data
