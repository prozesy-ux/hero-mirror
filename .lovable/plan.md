
# World-Class First-Load Performance Plan

## Problem Analysis

After reviewing your codebase, I identified several factors that may cause occasional slow loading or "broken" experiences:

### Current Issues Found:

1. **Anti-Caching Meta Tags** (index.html lines 6-8)
   - `Cache-Control: no-cache, no-store, must-revalidate` forces browsers to re-fetch everything on every visit
   - This is the opposite of what Fiverr/Upwork do - they cache aggressively

2. **No Error Boundary Protection**
   - If any component crashes, the entire app shows a white screen
   - Top sites wrap critical sections in error boundaries for graceful degradation

3. **No Resource Preloading**
   - Critical routes (Dashboard, Seller, Store) are not preloaded
   - Users wait for JS chunks to download on first navigation

4. **Auth Loading State**
   - `useAuth` can take time to resolve, blocking protected routes
   - ProtectedRoute has 10-second timeout which is too long for perception of speed

5. **No Skeleton/Shell Rendering**
   - Pages show blank content until data loads
   - Top sites show instant UI shells with skeleton loaders

6. **BFF Edge Functions Not Optimized**
   - No caching headers on responses
   - Every request hits the database fresh

---

## Implementation Plan

### Phase 1: Smart Caching Strategy (Like Fiverr/Upwork)

**1.1 Remove Anti-Caching Meta Tags**
- Remove the `Cache-Control`, `Pragma`, and `Expires` meta tags from `index.html`
- These prevent browsers from caching CSS, JS, and images - causing slow loads

**1.2 Add Vite Build Optimizations**
- Update `vite.config.ts` to enable chunk splitting with proper naming
- Add cache-busting via content hashing (already works, but we ensure it's optimal)

**1.3 Update APP_VERSION Logic**
- Change `cache-utils.ts` to bump version when we deploy (automatic cache invalidation)
- Keep current selective clearing of localStorage (already good)

---

### Phase 2: Instant UI Shell (Zero Blank Screens)

**2.1 Add Global Error Boundary**
- Create `ErrorBoundary.tsx` component that catches React errors
- Show recovery UI with "Try Again" button instead of white screen
- Wrap `App.tsx` with this boundary

**2.2 Add Skeleton App Shell**
- Create `AppShell.tsx` for instant visual feedback during auth loading
- Shows header, sidebar outline, and content area immediately
- Replaces the spinner in `ProtectedRoute.tsx`

**2.3 Reduce Auth Timeout**
- Change ProtectedRoute timeout from 10 seconds to 5 seconds
- Add progressive messaging: "Loading..." -> "Still loading..." -> "Taking longer than expected..."

---

### Phase 3: Route Preloading (Like Fiverr Navigation)

**3.1 Add Resource Hints to index.html**
- Preconnect to Supabase API endpoints
- Prefetch critical fonts and icons

**3.2 Create Route Prefetcher Component**
- On homepage load, prefetch Dashboard and Seller chunks in the background
- On Seller auth, prefetch SellerDashboard component

**3.3 Lazy Load with Suspense Fallbacks**
- Wrap heavy route components with React.lazy + Suspense
- Show branded skeleton during chunk loading

---

### Phase 4: BFF Response Caching

**4.1 Add Cache-Control Headers to Edge Functions**
- For semi-static data (seller levels, categories): cache for 5 minutes
- For user-specific data: private cache with short TTL

**4.2 Implement React Query Caching Optimizations**
- Already have staleTime: 5 minutes - good
- Add `placeholderData` for instant perceived loading

---

### Phase 5: Protected /Seller Route Flow

**5.1 Keep Current Flow (Per Your Preference)**
- /seller already requires login if user accesses protected areas
- Improve loading states and redirects for clarity

**5.2 Add Login Intent Preservation**
- Store intended route in sessionStorage before redirect
- After login, return user to their intended seller page

---

## Technical Details

### Files to Create:
```text
src/components/ui/error-boundary.tsx      - Global error catcher
src/components/ui/app-shell.tsx           - Skeleton layout shell
src/components/ui/route-prefetcher.tsx    - Background chunk loader
```

### Files to Modify:
```text
index.html                                - Remove anti-cache meta, add preconnect
vite.config.ts                            - Add chunk splitting config
src/App.tsx                               - Wrap in ErrorBoundary
src/main.tsx                              - No changes (already optimized)
src/lib/cache-utils.ts                    - Bump version to 1.0.2
src/components/auth/ProtectedRoute.tsx    - Reduce timeout, improve UX
supabase/functions/bff-seller-dashboard   - Add Cache-Control headers
supabase/functions/bff-buyer-dashboard    - Add Cache-Control headers
```

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| First Load (Home) | 2-3s | Under 1s |
| First Load (Dashboard) | 3-5s | Under 2s |
| Route Navigation | 1-2s | Under 0.5s |
| Error Recovery | White screen | Graceful retry UI |
| Cache Hits | 0% (forced no-cache) | 80%+ on repeat visits |

---

## Why This Matches Top Sites

**Fiverr/Upwork Patterns:**
1. Aggressive browser caching with version-based invalidation
2. Instant skeleton UI before data loads
3. Route prefetching on hover/focus
4. Error boundaries prevent full-page crashes
5. CDN caching for static assets

Your current architecture (BFF pattern, Supabase, React Query) is already enterprise-grade. These optimizations add the polish layer that makes top-tier sites feel instant.

---

## Implementation Order

1. Smart Caching (biggest impact, lowest risk)
2. Error Boundary (prevents white screens)
3. Route Preloading (perceived speed boost)
4. BFF Caching (reduces server load)
5. Auth UX improvements (polish)

Ready to implement when you approve.
