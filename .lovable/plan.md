

## Fix Monthly Target Gauge -- Root Cause

### The Real Problem
The SVG `large-arc-flag` is incorrectly set. The gauge is a **semicircle** (180 degrees total). At 67% progress, the arc spans ~121 degrees, which is less than 180 degrees. But the code uses:

```
largeArc = percentage > 50 ? 1 : 0
```

This tells SVG to draw the **longer** path around the full circle when progress exceeds 50%, causing the arc to wrap around incorrectly and overlap itself. The `large-arc-flag` should **always be 0** for a semicircular gauge because no progress arc can ever exceed 180 degrees.

### Fix (Single line change in `EzMartDashboardGrid.tsx`)

**Line 337**: Change `const largeArc = percentage > 50 ? 1 : 0;` to `const largeArc = 0;`

Since the maximum arc is a semicircle (180 degrees), even at 100% the arc is exactly 180 degrees (not "large"), so the large-arc-flag must always be 0.

This single fix resolves the overlay/overlap issue in both Buyer and Seller dashboards. No other changes needed -- the geometry, stroke width, and caps are all correct now.

