

# Advanced Marketplace Search Suggestions System

## Overview

Implement an intelligent search suggestion system inspired by Fiverr, Upwork, and Google that provides real-time, contextual search suggestions as users type in the marketplace.

---

## Feature Comparison: Industry Leaders vs Our Implementation

| Feature | Google | Fiverr | Upwork | Our System |
|---------|--------|--------|--------|------------|
| Autocomplete as-you-type | Yes | Yes | Yes | Yes |
| Recent searches | Yes | Yes | Yes | Yes |
| Popular/Trending searches | Yes | Yes | Yes | Yes |
| Category suggestions | - | Yes | Yes | Yes |
| Product name matching | - | Yes | Yes | Yes |
| Tag-based suggestions | - | Yes | Yes | Yes |
| "More like this" | Yes | Yes | Yes | Yes |
| Seller name search | - | - | Yes | Yes |
| Price range hints | - | - | - | Yes (Bonus) |

---

## System Architecture

```text
User Types "chat"
      |
      v
+---------------------+
| SearchSuggestions   |  Debounced input (300ms)
| Component           |
+---------------------+
      |
      v (query length >= 2)
+---------------------------+
| bff-marketplace-search    |  Server-side Edge Function
+---------------------------+
      |
      v
+---------------------------------+
| Parallel Queries (optimized)    |
+---------------------------------+
  |         |         |         |
  v         v         v         v
Products  Tags     Categories  Sellers
 match    match     match      match
      |
      v
+---------------------------+
| Ranked & Grouped Results  |
+---------------------------+
  - Recent Searches (user-specific)
  - Popular Searches (global trending)
  - Products matching query
  - Categories matching query
  - Tags matching query
  - Sellers matching query
```

---

## Database Schema Changes

### New Table: `search_history`

Tracks user search queries for personalized suggestions.

```sql
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user-specific queries
CREATE INDEX idx_search_history_user_id ON search_history(user_id, created_at DESC);

-- Index for popular searches (anonymous aggregation)
CREATE INDEX idx_search_history_query ON search_history(query, created_at DESC);
```

### New Table: `popular_searches`

Pre-aggregated popular search terms (updated via cron or trigger).

```sql
CREATE TABLE public.popular_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  last_searched_at TIMESTAMPTZ DEFAULT now(),
  is_trending BOOLEAN DEFAULT false
);

-- Index for trending queries
CREATE INDEX idx_popular_searches_trending ON popular_searches(is_trending, search_count DESC);
```

---

## Implementation Components

### Part 1: Search Suggestions Component

Create a new dropdown component that appears below the search input:

**File: `src/components/marketplace/SearchSuggestions.tsx`**

Features:
- Debounced input handling (300ms delay)
- Keyboard navigation (up/down arrows, Enter to select, Escape to close)
- Grouped results display (Recent, Trending, Products, Categories, Tags, Sellers)
- Click to search with selected suggestion
- Highlight matching text in suggestions

```text
+------------------------------------------+
| Search: "chat"                          |
+------------------------------------------+
| RECENT SEARCHES                          |
|   chatgpt account                        |
|   cheap chatgpt plus                     |
+------------------------------------------+
| TRENDING NOW                             |
|   Netflix accounts  (156 results)        |
|   AI subscriptions  (89 results)         |
+------------------------------------------+
| PRODUCTS                                 |
|   ChatGPT Plus Account - $12.99          |
|   ChatGPT Team Subscription - $25.00     |
+------------------------------------------+
| CATEGORIES                               |
|   Social Media  (45 products)            |
|   Productivity  (32 products)            |
+------------------------------------------+
| TAGS                                     |
|   #AI  #Subscription  #Instant Delivery  |
+------------------------------------------+
```

### Part 2: BFF Endpoint for Search Suggestions

**File: `supabase/functions/bff-marketplace-search/index.ts`**

Server-side aggregation for fast, secure search:

```typescript
// Parallel queries for speed
const [
  recentSearches,      // User's last 5 searches
  popularSearches,     // Global trending (top 5)
  productMatches,      // Products matching query (top 8)
  categoryMatches,     // Categories matching query
  tagMatches,          // Unique tags matching query
  sellerMatches        // Seller stores matching query
] = await Promise.all([...]);

return {
  recent: recentSearches,
  trending: popularSearches,
  products: productMatches,
  categories: categoryMatches,
  tags: tagMatches,
  sellers: sellerMatches
};
```

### Part 3: "More Like This" Feature

When viewing a product, show related products based on:
1. Same category
2. Overlapping tags
3. Same seller
4. Similar price range

**File: `src/components/marketplace/RelatedProducts.tsx`**

```text
+------------------------------------------+
| MORE LIKE THIS                           |
+------------------------------------------+
| [Product 1] [Product 2] [Product 3]      |
| Same category: Social Media              |
+------------------------------------------+
| [Product 4] [Product 5]                  |
| Matching tags: #AI #Subscription         |
+------------------------------------------+
```

### Part 4: Search History Tracking

Log searches when user presses Enter or clicks a suggestion:

```typescript
// In AIAccountsSection or SearchSuggestions
const logSearch = async (query: string, resultCount: number) => {
  if (!user || query.length < 2) return;
  
  await supabase.from('search_history').insert({
    user_id: user.id,
    query: query.trim().toLowerCase(),
    result_count: resultCount,
    category_id: categoryFilter !== 'all' ? categoryFilter : null
  });
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/marketplace/SearchSuggestions.tsx` | Main suggestions dropdown component |
| `src/components/marketplace/RelatedProducts.tsx` | "More like this" horizontal scroll |
| `src/hooks/useSearchSuggestions.ts` | Hook for debounced search and API calls |
| `supabase/functions/bff-marketplace-search/index.ts` | Server-side search aggregation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AIAccountsSection.tsx` | Integrate SearchSuggestions component with search input |
| `src/lib/api-fetch.ts` | Add `getSearchSuggestions()` and `logSearch()` methods |

---

## User Experience Flow

```text
1. User focuses on search input
   |
   v
2. Show "Recent Searches" immediately (if available)
   |
   v
3. User types 2+ characters
   |
   v
4. Debounce 300ms
   |
   v
5. Call bff-marketplace-search endpoint
   |
   v
6. Display grouped suggestions dropdown
   |
   v
7. User navigates with keyboard or clicks
   |
   v
8. On selection: Fill search input + filter products
   |
   v
9. Log search to search_history (background)
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Down | Move to next suggestion |
| Arrow Up | Move to previous suggestion |
| Enter | Select highlighted suggestion |
| Escape | Close suggestions dropdown |
| Tab | Close dropdown and move to next element |

---

## Performance Optimizations

1. **Debouncing**: 300ms delay before API call
2. **Server-side aggregation**: Single BFF call instead of multiple client queries
3. **Caching**: Store popular searches for 5 minutes
4. **Parallel queries**: All database queries run simultaneously
5. **Result limits**: Max 5-8 items per category to reduce payload
6. **Index optimization**: Database indexes on search columns

---

## Mobile Considerations

- Full-screen suggestions overlay on mobile
- Touch-friendly tap targets (44px minimum)
- Swipe to dismiss suggestions
- Recent searches shown by default on focus
- Clear history button

---

## Bonus Features (Phase 2)

1. **Voice Search**: Microphone icon for voice input
2. **Search Analytics Dashboard**: For admin to see popular searches
3. **Personalized Ranking**: ML-based ranking based on user behavior
4. **Typo Correction**: "Did you mean: ChatGPT?" suggestions
5. **Search Filters in Suggestions**: Price range chips, rating filters

---

## Security Considerations

1. Rate limiting on search endpoint (10 requests/second per user)
2. Input sanitization to prevent SQL injection
3. User-specific data only accessible to authenticated users
4. Popular searches aggregated anonymously
5. RLS policies on search_history table

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Time to find product | Manual scrolling | 1-2 keystrokes |
| Search abandonment | Unknown | Tracked |
| User engagement | Basic search | Interactive suggestions |
| Mobile UX | Text input only | Full-screen suggestions |
| Personalization | None | Recent searches, preferences |

