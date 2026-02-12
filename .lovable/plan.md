

## Fix Monthly Target Gauge -- Remove Orange Blob Artifacts

### Problem
The orange progress arc has visible "blob" artifacts at both endpoints because the background track (grey) and progress arc (orange) use different stroke cap styles, causing visual mismatch. Even with `butt` caps, the thick stroke creates harsh endpoints that look wrong.

### Solution (File: `src/components/dashboard/EzMartDashboardGrid.tsx`)

**1. Match stroke caps on both arcs**
- Set `strokeLinecap="round"` on BOTH the grey background path AND the orange progress path
- This ensures both arcs have identical visual endpoints -- no mismatch, no blobs

**2. Reduce stroke width from 8 to 6**
- A thinner stroke produces cleaner, more proportional arcs relative to the viewBox
- Reduces the visual prominence of the round cap extensions

**3. Keep existing geometry and viewBox**
- The arc path (`M 12 50 A 38 38 0 0 1 88 50`) and `viewBox="0 0 100 60"` remain unchanged -- they work correctly

### Changes (lines 357-365)

```tsx
// Before
<path d="M 12 50 A 38 38 0 0 1 88 50" stroke="#F3F4F6" strokeWidth="8" fill="none" />
<path ... stroke="#FF7F00" strokeWidth="8" strokeLinecap="butt" />

// After
<path d="M 12 50 A 38 38 0 0 1 88 50" stroke="#F3F4F6" strokeWidth="6" fill="none" strokeLinecap="round" />
<path ... stroke="#FF7F00" strokeWidth="6" strokeLinecap="round" />
```

Both Buyer and Seller dashboards share this component, so both are fixed automatically.
