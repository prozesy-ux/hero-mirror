

# Redis Integration Plan - Upstash for Edge Function Caching

## Overview

Integrate **Upstash Redis** as a distributed caching layer for your Edge Functions to dramatically reduce database load and improve response times. Upstash is the recommended Redis provider for Supabase Edge Functions (Deno runtime).

## Why Upstash Redis?

| Feature | Benefit |
|---------|---------|
| **Serverless** | No always-on servers, pay-per-request pricing |
| **Global Edge** | ~50ms latency worldwide via edge replication |
| **REST API** | Works natively with Deno/Edge Functions (no TCP needed) |
| **Free Tier** | 10,000 commands/day free |

## What Will Be Cached

### High-Impact Caching Targets

| Data | Current TTL | Database Calls Saved | Priority |
|------|-------------|---------------------|----------|
| **Marketplace Home** (categories, hot products, trending) | CDN: 5 min | ~4 parallel queries/request | 🔴 High |
| **Trending/Popular Searches** | None | 1 query per search keystroke | 🔴 High |
| **Categories List** | None | 1 query per page load | 🟡 Medium |
| **Seller Store Data** | CDN: 5 min | 3-5 queries/store visit | 🟡 Medium |
| **Session/Rate Limit Data** | None | Multiple queries | 🟢 Low |

### Estimated Performance Improvement

```text
Current (DB Direct):
  bff-marketplace-home → 4 parallel DB queries → ~150-300ms
  bff-marketplace-search → 5-8 queries → ~200-400ms

With Redis Cache:
  Cache HIT → 5-15ms response time
  Cache MISS → DB query + cache write → ~170-320ms (first request only)
  
Overall: 80-95% of requests served from cache = 10-20x faster
```

## Architecture

```text
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │ Request
         ▼
┌─────────────────┐
│  Edge Function  │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Redis  │ ← Check cache first (5-15ms)
    │ (Upstash)│
    └────┬────┘
         │ Cache MISS only
         ▼
┌─────────────────┐
│   PostgreSQL    │ ← Full query (150-300ms)
│   (Supabase)    │
└─────────────────┘
```

## Implementation

### Step 1: Set Up Upstash Account & Get Credentials

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a new Redis database (select region closest to your users)
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Add these as secrets in Lovable Cloud

### Step 2: Create Shared Redis Helper

Create a reusable Redis cache utility for all Edge Functions:

**File: `supabase/functions/_shared/redis-cache.ts`**

```typescript
import { Redis } from 'https://deno.land/x/upstash_redis@v1.19.3/mod.ts';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  
  if (!url || !token) {
    console.warn('[Redis] Not configured, falling back to DB');
    return null;
  }
  
  if (!redis) {
    redis = new Redis({ url, token });
  }
  return redis;
}

// Cache wrapper with automatic serialization
export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  
  try {
    const cached = await r.get(key);
    return cached ? JSON.parse(cached as string) : null;
  } catch (e) {
    console.error('[Redis] Get error:', e);
    return null;
  }
}

export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  
  try {
    await r.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch (e) {
    console.error('[Redis] Set error:', e);
  }
}

export async function cacheDelete(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  
  try {
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch (e) {
    console.error('[Redis] Delete error:', e);
  }
}
```

### Step 3: Update bff-marketplace-home with Redis

**File: `supabase/functions/bff-marketplace-home/index.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cacheGet, cacheSet } from '../_shared/redis-cache.ts';

const CACHE_KEY = 'marketplace:home';
const CACHE_TTL = 300; // 5 minutes

Deno.serve(async (req) => {
  // ... CORS handling ...

  try {
    // 1. Try Redis cache first
    const cached = await cacheGet<MarketplaceHomeData>(CACHE_KEY);
    if (cached) {
      console.log('[BFF-MarketplaceHome] Cache HIT');
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[BFF-MarketplaceHome] Cache MISS, fetching from DB');
    
    // 2. Cache miss - fetch from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // ... existing parallel queries ...
    
    // 3. Store in Redis for next request
    await cacheSet(CACHE_KEY, response, CACHE_TTL);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

### Step 4: Update bff-marketplace-search with Redis

Cache trending searches and popular data (not personalized user data):

```typescript
import { cacheGet, cacheSet } from '../_shared/redis-cache.ts';

// Cache trending searches (shared across all users)
const TRENDING_CACHE_KEY = 'search:trending';
const TRENDING_TTL = 120; // 2 minutes

// In the trending fetch:
let trendingData = await cacheGet<TrendingSuggestion[]>(TRENDING_CACHE_KEY);
if (!trendingData) {
  const { data } = await serviceClient
    .from("popular_searches")
    .select("id, query, search_count")
    .order("search_count", { ascending: false })
    .limit(5);
  trendingData = data;
  await cacheSet(TRENDING_CACHE_KEY, trendingData, TRENDING_TTL);
}
```

### Step 5: Cache Invalidation Strategy

When products/categories are updated, invalidate related cache:

```typescript
// In admin mutation functions or after product updates:
import { cacheDelete } from '../_shared/redis-cache.ts';

// Invalidate marketplace home cache
await cacheDelete('marketplace:*');

// Invalidate search cache
await cacheDelete('search:*');

// Invalidate specific store
await cacheDelete(`store:${storeSlug}:*`);
```

## Cache Key Strategy

| Key Pattern | Data | TTL |
|-------------|------|-----|
| `marketplace:home` | Full marketplace homepage data | 5 min |
| `marketplace:categories` | Categories with counts | 10 min |
| `search:trending` | Popular/trending searches | 2 min |
| `store:{slug}:home` | Store homepage data | 5 min |
| `store:{slug}:products` | Store product list | 3 min |
| `flash:active` | Active flash sales | 1 min |
| `rate:{ip}:{endpoint}` | Rate limit counters | 1 min |

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/_shared/redis-cache.ts` | **CREATE** - Shared Redis utility |
| `supabase/functions/bff-marketplace-home/index.ts` | **MODIFY** - Add cache layer |
| `supabase/functions/bff-marketplace-search/index.ts` | **MODIFY** - Cache trending data |
| `supabase/functions/bff-store-public/index.ts` | **MODIFY** - Cache store data |
| `supabase/functions/bff-flash-sales/index.ts` | **MODIFY** - Cache flash sale data |

## Required Secrets

Two new secrets need to be configured:

1. **UPSTASH_REDIS_REST_URL** - Your Upstash Redis REST endpoint
2. **UPSTASH_REDIS_REST_TOKEN** - Your Upstash REST token

## Performance Expectations

| Metric | Before Redis | After Redis |
|--------|--------------|-------------|
| Marketplace Home | 150-300ms | 5-15ms (cache hit) |
| Search Suggestions | 200-400ms | 10-20ms (trending cached) |
| Store Page | 100-250ms | 5-15ms (cache hit) |
| DB Connections/min | ~1000+ | ~100-200 (90% reduction) |
| Cold Start Impact | Every request | Only cache misses |

## Graceful Degradation

The implementation includes fallback logic - if Redis is unavailable or not configured:
- Edge functions continue to work with direct database queries
- No errors thrown, just console warnings
- Ensures zero downtime during Redis issues

## Summary

- **Add Upstash Redis** as distributed cache layer
- **Cache hot data**: Marketplace home, trending searches, store data
- **5-15ms response times** for cached requests (vs 150-300ms DB)
- **90% database load reduction** for read-heavy endpoints
- **Graceful fallback** - Works without Redis if needed
- **Simple integration** - Just 2 secrets and shared helper module

