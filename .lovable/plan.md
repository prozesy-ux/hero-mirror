

## Unify Analytics and Reports Card Styles Across Both Dashboards

### Problem
The Seller Analytics section uses a **neobrutalism style** (thick black borders, shadow effects, hover translations) while the Buyer Analytics, Buyer Reports, and Seller Reports use a **clean minimal style** (thin borders, rounded corners, p-8 padding). The user wants all analytics/reports sections to use the **same consistent card design** matching the dashboard home style.

### Target Style (Clean Dashboard Cards)
All cards and chart containers will use this consistent pattern:
- `bg-white border rounded p-8` for stat cards
- `bg-white border rounded p-6` for chart containers
- No neobrutalism borders or shadows
- Font: Inter, text-4xl font-semibold for values, text-base text-slate-700 for labels

### Files to Update

**1. `src/components/seller/SellerAnalytics.tsx` (Major Changes)**
- Lines 296-348: Remove neobrutalism styling from date picker, period dropdown, and export button. Use clean `bg-white border-slate-200 rounded-xl` style instead
- Line 380: Sales Details chart container - change `border-2 border-black shadow-neobrutalism` to `border rounded`
- Line 465: Quick Stats rating card - remove `border-2 border-black shadow-neobrutalism` styling
- Line 486: Order Status chart - change to `border rounded`
- Line 537: Top Products chart - change to `border rounded`
- Line 562: Revenue by Day chart - change to `border rounded`

**2. `src/components/dashboard/BuyerAnalytics.tsx` (Minor Tweaks)**
- Lines 190-193: Loading skeletons - remove `border-2 border-black` from skeleton placeholders
- Line 287: Spending Details chart - already uses `border rounded-lg`, keep consistent
- Line 336: Category Breakdown chart - already consistent
- Line 367: Monthly Trend chart - already consistent

**3. `src/components/dashboard/BuyerReports.tsx` (Already Clean)**
- No changes needed - already uses `bg-white border rounded p-8` style

**4. `src/components/seller/SellerReports.tsx` (Already Clean)**  
- No changes needed - already uses consistent styling

**5. `src/components/seller/SellerProductAnalytics.tsx` (Minor Tweaks)**
- Lines 129-154: Stat cards - remove `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` hover effects
- Line 158: Chart container - remove hover shadow effect
- Line 217: Table container - remove hover shadow effect

### Summary
- **5 files** reviewed, **2 files** need significant updates
- All neobrutalism borders (`border-2 border-black shadow-neobrutalism`) replaced with clean borders (`border rounded`)
- All hover shadow effects removed for consistency
- Stat cards unified to `bg-white border rounded p-8` with text-4xl values
- Chart containers unified to `bg-white border rounded p-6`
- Filter controls unified to `bg-white border-slate-200 rounded-xl` style
- Export buttons unified to `bg-emerald-500 hover:bg-emerald-600 rounded-xl`

