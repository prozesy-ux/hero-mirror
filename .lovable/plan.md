

## Fix Dashboard to Match HTML Source Exactly

After line-by-line comparison of the HTML source vs the current code, here are all the mismatches found and the fixes needed.

### Differences Found

**1. Font Family -- WRONG**
- HTML: `font-family: "Inter", system-ui, sans-serif` (set on the entire app via CSS variable `--font-family`)
- Current: No font-family set on the grid -- inherits "DM Sans" from the page
- Fix: Add `fontFamily: '"Inter", system-ui, sans-serif'` to the grid wrapper div

**2. Stat Card Label -- WRONG**
- HTML line 859: `Total Visitors` (with S)
- Current line 478: `Total Visitor` (no S)
- Fix: Change to "Total Visitors"

**3. Content Padding -- WRONG**
- HTML: `.main-content { padding: 32px; }` (32px all sides)
- Current Buyer: `p-4 lg:p-6` (16px / 24px) 
- Current Seller: `p-4 lg:p-6` (16px / 24px)
- Fix: Change both to `padding: 32px`

**4. Seller totalCategorySales -- WRONG**
- HTML: Static `$3.4M`
- Current Seller line 199: Dynamic ``$${(metrics.totalRevenue / 1000000).toFixed(1)}M``
- Fix: Hardcode `$3.4M`

### Files to Change

**File 1: `src/components/dashboard/EzMartDashboardGrid.tsx`**
- Line 456: Add `fontFamily: '"Inter", system-ui, sans-serif'` to the grid wrapper style
- Line 478: Change `"Total Visitor"` to `"Total Visitors"`

**File 2: `src/components/dashboard/BuyerDashboardHome.tsx`**
- Line 271: Change wrapper padding from `className="space-y-5 p-4 lg:p-6"` to inline `style={{ padding: '32px' }}` (remove p-4 lg:p-6)
- Line 240 (loading state): Same padding fix

**File 3: `src/components/seller/SellerDashboard.tsx`**
- Line 199: Change `totalCategorySales` from dynamic to static `'$3.4M'`
- Line 242: Change wrapper padding to 32px
- Line 226 (loading state): Same padding fix

### What Does NOT Change
- All card styles, colors, SVG charts, donut, gauge, funnel -- already match HTML
- Sidebar, Header components -- untouched
- All data fetching, caching, session logic -- untouched
- All static data values (stat cards, categories, traffic sources, conversion funnel, active users) -- already match HTML

