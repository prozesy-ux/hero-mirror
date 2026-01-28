
# Marketplace Search Box - Complete Redesign Plan

## Current Issues Identified

### 1. Data Loading Problems (CRITICAL)
The marketplace sections load slowly because of inefficient data fetching:

**Problem 1: N+1 Query in CategoryBrowser**
```
CategoryBrowser.tsx (lines 65-85):
- For each category, makes 2 separate count queries
- If 10 categories → 20 database calls!
- Causes slow "Browse by Category" section loading
```

**Problem 2: No Server-Side Data Aggregation**
- `HotProductsSection`, `TopRatedSection`, `NewArrivalsSection`, `CategoryBrowser` each fetch independently
- User sees sections appearing at different times
- Multiple network round-trips

**Problem 3: No Data Prefetching**
- Marketplace homepage data not prefetched
- Each section waits for mount → fetch → render

### 2. Missing Search Features
| Feature | Status | Issue |
|---------|--------|-------|
| Voice Search | ✅ Exists | Working |
| Image Upload | ✅ Exists | Working |
| Image URL Search | ❌ Missing | Can't paste URL |
| Price Filter UI | ❌ Missing | Only text-based ("under $20") |
| Rating Filter | ❌ Missing | No 4+ stars filter |
| Semantic AI Search | ❌ Missing | Not understanding intent |

### 3. UI/UX Issues
- Price filter not visible in sidebar
- No clear filter indicators
- Category selection slow to respond

---

## Solution Architecture

### Phase 1: Unified Data Loading (Fixes "Late Load" Issue)

**Create a BFF endpoint that aggregates ALL marketplace homepage data in ONE call:**

```text
GET /functions/v1/bff-marketplace-home

Response:
{
  "categories": [...],      // with product counts (pre-computed)
  "hotProducts": [...],     // top 10 trending
  "topRated": [...],        // highest rated
  "newArrivals": [...],     // last 7 days
  "featuredSellers": [...]  // verified sellers
}
```

**Benefits:**
- Single network request vs 8+ current requests
- Server-side parallel queries (faster)
- Browser caching with Cache-Control headers
- Instant UI with skeleton states

### Phase 2: Enhanced Search Box Design

**New Search Box Layout:**
```text
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌─────────────────────────────────────────┐ ┌─────┐ │
│ │ All   ▼ │ │ 🔍 Search products, sellers...         │ │🎤 📷│ │
│ └─────────┘ └─────────────────────────────────────────┘ └─────┘ │
│                                                                  │
│ Quick Filters:                                                   │
│ ┌─────────┐ ┌───────────────┐ ┌────────────┐ ┌─────────────────┐│
│ │Price  ▼ │ │ Rating: 4+★ ▼│ │ Verified ☑ │ │ Free Shipping ☑ ││
│ └─────────┘ └───────────────┘ └────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Image Search with URL Support

**Enhanced Image Search Modal:**
```text
┌────────────────────────────────────────────┐
│ 📷 Visual Search                     [X]   │
├────────────────────────────────────────────┤
│                                            │
│   ┌─────────────────────────────────┐      │
│   │     Drop image here             │      │
│   │     or click to upload          │      │
│   └─────────────────────────────────┘      │
│                                            │
│   ─────────── OR ───────────              │
│                                            │
│   ┌─────────────────────────────────┐      │
│   │ Paste image URL here...          │     │
│   └─────────────────────────────────┘      │
│                                            │
│   [Upload Image]  [Search by URL]          │
│                                            │
└────────────────────────────────────────────┘
```

### Phase 4: Left Sidebar Price Filter

**Add visual price filter to MarketplaceSidebar:**
```text
┌──────────────────────┐
│ 💰 Price Range       │
│ ┌─────────────────┐  │
│ │ ●───────────○   │  │ (Slider)
│ └─────────────────┘  │
│ $0  ─────────  $100+ │
│                      │
│ Quick:               │
│ [Under $5] [Under $10]│
│ [Under $20] [$20-$50] │
│ [Over $50]            │
└──────────────────────┘

│ ⭐ Rating Filter      │
│ ○ All Ratings        │
│ ● 4+ Stars ⭐⭐⭐⭐     │
│ ○ 3+ Stars ⭐⭐⭐      │
└──────────────────────┘
```

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/bff-marketplace-home/index.ts` | Unified homepage data endpoint |
| `src/hooks/useMarketplaceData.ts` | React Query hook for homepage data |
| `src/components/marketplace/PriceFilterSidebar.tsx` | Visual price slider |
| `src/components/marketplace/RatingFilter.tsx` | Star rating filter |
| `src/components/marketplace/SearchFiltersBar.tsx` | Horizontal filter chips |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AIAccountsSection.tsx` | Use unified data hook, add filter bar |
| `src/components/marketplace/ImageSearchButton.tsx` | Add URL input field |
| `src/components/marketplace/MobileSearchOverlay.tsx` | Add filter chips |
| `src/components/dashboard/MarketplaceSidebar.tsx` | Add price/rating filters |
| `src/hooks/useSearchSuggestions.ts` | Add rating filter support |
| `supabase/functions/bff-marketplace-search/index.ts` | Add rating filter param |

### Database Changes
```sql
-- Add product_analytics table for faster hot products query
CREATE INDEX IF NOT EXISTS idx_seller_orders_product_recent 
ON seller_orders(product_id, created_at) 
WHERE status = 'completed';

-- Materialized view for category counts (updated hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS category_product_counts AS
SELECT 
  c.id,
  c.name,
  c.icon,
  c.color,
  c.display_order,
  (
    SELECT COUNT(*) FROM seller_products sp 
    WHERE sp.category_id = c.id AND sp.is_available AND sp.is_approved
  ) + (
    SELECT COUNT(*) FROM ai_accounts aa 
    WHERE aa.category_id = c.id AND aa.is_available
  ) as product_count
FROM categories c
WHERE c.is_active = true;

CREATE UNIQUE INDEX ON category_product_counts(id);
```

---

## Implementation Order

### Day 1: Fix Data Loading (Highest Priority)
1. Create `bff-marketplace-home` edge function
2. Create `useMarketplaceData` hook with caching
3. Update `AIAccountsSection.tsx` to use unified hook
4. Remove individual fetch calls from section components

### Day 2: Enhanced Search Box
5. Add URL input to `ImageSearchButton.tsx`
6. Create `SearchFiltersBar.tsx` with price/rating chips
7. Update `bff-marketplace-search` for rating filter

### Day 3: Sidebar Filters
8. Create `PriceFilterSidebar.tsx` with slider
9. Create `RatingFilter.tsx` component
10. Integrate into `MarketplaceSidebar.tsx`

### Day 4: Mobile Optimization
11. Update `MobileSearchOverlay.tsx` with filter chips
12. Add bottom sheet for filters on mobile
13. Performance testing and optimization

---

## Expected Performance Improvements

| Metric | Current | After |
|--------|---------|-------|
| Homepage data requests | 8+ requests | 1 request |
| Category load time | 2-3 seconds | <200ms |
| Initial render time | 3-5 seconds | <1 second |
| Time to interactive | 5+ seconds | <2 seconds |

---

## Technical Details

### BFF Marketplace Home Response Structure
```typescript
interface MarketplaceHomeData {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    productCount: number;
  }>;
  hotProducts: Array<ProductSummary>;
  topRated: Array<ProductSummary>;
  newArrivals: Array<ProductSummary>;
  featuredSellers: Array<SellerSummary>;
  // Cached for 60 seconds
}
```

### Price Filter State
```typescript
interface FilterState {
  priceRange: { min?: number; max?: number };
  minRating: number | null; // 3, 4, or null
  verifiedOnly: boolean;
  freeShippingOnly: boolean;
}
```

### URL-Based Image Search Flow
```text
User pastes URL → Fetch image → Convert to base64 → Send to image-search function
```

This plan will fix all data loading issues and add the missing enterprise-level search features to create a world-class marketplace experience.
