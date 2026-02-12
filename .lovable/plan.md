

## Fix: Dashboard Orange Overlay Bug + Monthly Target Layout

### Root Cause
The giant orange rectangle covering the dashboard is a **bar height overflow bug** in the Conversion Rate funnel. When the denominator (Product Views or Wishlist Items) is 0 or very small, the bar height percentage calculation produces absurdly large values (e.g., `20500%`), and because there's no `overflow: hidden` on the parent container, the bar renders across the entire page.

### Changes

#### 1. `src/components/seller/SellerDashboard.tsx` -- Cap bar heights
- Line 206: The formula `(totalOrders / Math.max(totalViews, 1)) * 100 * 5` can produce `20500%` when totalViews=0. Cap ALL bar heights to a maximum of `100%` using `Math.min(..., 100)`.
- Apply same cap to pending, completed, and cancelled bar calculations.

#### 2. `src/components/dashboard/BuyerDashboardHome.tsx` -- Cap bar heights  
- Lines 300-303: Same issue. Cap all `barHeight` values to `100%` max.

#### 3. `src/components/dashboard/EzMartDashboardGrid.tsx` -- Add overflow safety
- Line 499: Add `overflow: hidden` to the bar container (`height: '100px'`) as a safety net so even if a percentage escapes the cap, bars cannot overflow their container.
- Monthly Target gauge: ensure the SVG and text don't clip by keeping the existing `110px` height fix and verifying bottom spacing.

### Technical Detail

**Before (broken):**
```tsx
barHeight: `${Math.max((totalOrders / Math.max(totalViews, 1)) * 100 * 5, 15)}%`
// When totalViews=0, totalOrders=41: result = 20500%
```

**After (fixed):**
```tsx
barHeight: `${Math.min(Math.max((totalOrders / Math.max(totalViews, 1)) * 100 * 5, 15), 100)}%`
// Capped at 100% maximum
```

**Safety net in EzMartDashboardGrid.tsx:**
```tsx
<div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '12px', marginTop: '24px', overflow: 'hidden' }}>
```

