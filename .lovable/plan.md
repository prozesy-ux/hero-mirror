

# Fix Buyer Dashboard Design Consistency with Seller Dashboard

## Issues Identified

After analyzing the codebase, I found several design inconsistencies between the Buyer Dashboard sections and the well-styled Seller Dashboard. The neo-brutalist design system is not uniformly applied.

---

## 1. BuyerDashboardHome.tsx - Quick Stats Section (Lines 457-506)

**Problem**: The bottom 4 cards (Completed, Delivered, Pending, Wishlist) use inconsistent styling:
- First card has `border-2 border-black shadow-neobrutalism` (correct)
- Other 3 cards use old `border border-slate-100 shadow-stat` (wrong)

**Fix**: Apply neo-brutalist styling to all 4 cards:

| Card | Current | Should Be |
|------|---------|-----------|
| Completed | `border-2 border-black shadow-neobrutalism` | Keep as-is |
| Delivered | `border border-slate-100 shadow-stat` | `border-2 border-black shadow-neobrutalism + hover effect` |
| Pending | `border border-slate-100 shadow-stat` | `border-2 border-black shadow-neobrutalism + hover effect` |
| Wishlist | `border border-slate-100 shadow-stat` | `border-2 border-black shadow-neobrutalism + hover effect` |

---

## 2. BuyerOrders.tsx - Order Cards & Dialog (Lines 562-730)

**Problem A**: Order cards use old soft styling:
- Current: `rounded-xl border border-slate-100 shadow-sm`
- Should be: `rounded-lg border-2 border-black shadow-neobrutalism`

**Problem B**: Order header row uses:
- Current: `bg-slate-50 border-b border-slate-100`
- Should be: Neobrutalist style with bold borders

**Problem C**: Empty state container:
- Current: `rounded-2xl p-10 border border-slate-100`
- Should be: `rounded-lg border-2 border-black shadow-neobrutalism`

**Problem D**: Order Detail Modal (Dialog):
- Current: Uses default dialog styling with soft `bg-slate-50 rounded-xl`
- Should be: Add black borders and neobrutalist styling to modal content sections

---

## 3. BuyerReports.tsx - Stats Cards & Chart Containers (Lines 219-335)

**Problem A**: All 4 stats cards use old styling:
- Current: `rounded-2xl p-5 border border-slate-100 shadow-sm`
- Should be: `rounded-lg p-5 border-2 border-black shadow-neobrutalism` + hover effect

**Problem B**: Chart containers use old styling:
- Current: `rounded-2xl p-6 border border-slate-100 shadow-sm`
- Should be: `rounded-lg border-2 border-black shadow-neobrutalism`

**Problem C**: Inconsistent card corner radius:
- Some use `rounded-2xl`, some `rounded-lg`
- Should standardize to `rounded-lg`

---

## Implementation Details

### File 1: `src/components/dashboard/BuyerDashboardHome.tsx`

**Lines 470-505**: Update Quick Stats cards to use neobrutalist styling

```tsx
// BEFORE (Line 470)
<div className="bg-white rounded-xl p-4 border border-slate-100 shadow-stat">

// AFTER
<div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
```

Apply this pattern to all 3 remaining cards (Delivered, Pending, Wishlist).

---

### File 2: `src/components/dashboard/BuyerOrders.tsx`

**Lines 571-655**: Update order cards

```tsx
// BEFORE (Line 571)
<div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">

// AFTER
<div className="bg-white rounded-lg border-2 border-black shadow-neobrutalism overflow-hidden">
```

**Lines 573**: Update order header

```tsx
// BEFORE
<div className="px-4 py-3 bg-slate-50 border-b border-slate-100 ...">

// AFTER
<div className="px-4 py-3 bg-slate-50 border-b-2 border-black ...">
```

**Lines 565**: Update empty state

```tsx
// BEFORE
<div className="bg-white rounded-2xl p-10 text-center border border-slate-100">

// AFTER
<div className="bg-white rounded-lg p-10 text-center border-2 border-black shadow-neobrutalism">
```

**Lines 662, 688, 708**: Update dialog content sections

```tsx
// BEFORE (Line 688)
<div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">

// AFTER
<div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border-2 border-black">

// BEFORE (Line 708)
<div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">

// AFTER
<div className="p-4 bg-emerald-50 rounded-lg border-2 border-black">
```

---

### File 3: `src/components/dashboard/BuyerReports.tsx`

**Lines 221-267**: Update all 4 stats cards

```tsx
// BEFORE (Line 221)
<div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">

// AFTER
<div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
```

Apply to all 4 cards (Total Spent, Total Orders, Avg Order Value, Completed).

**Lines 273-305, 308-334**: Update chart containers

```tsx
// BEFORE (Line 273)
<div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">

// AFTER
<div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
```

Apply to both "Monthly Spending" and "Spending by Product" chart containers.

---

## Summary of Changes

| File | Element | Change |
|------|---------|--------|
| `BuyerDashboardHome.tsx` | Quick Stats (3 cards) | Add `border-2 border-black shadow-neobrutalism` + hover |
| `BuyerOrders.tsx` | Order cards | Add `border-2 border-black shadow-neobrutalism` |
| `BuyerOrders.tsx` | Order header row | Change to `border-b-2 border-black` |
| `BuyerOrders.tsx` | Empty state | Add neobrutalist border |
| `BuyerOrders.tsx` | Order detail modal sections | Add black borders |
| `BuyerReports.tsx` | 4 stats cards | Add neobrutalist styling + hover |
| `BuyerReports.tsx` | 2 chart containers | Add neobrutalist borders |

---

## Design Pattern Reference (from SellerAnalytics.tsx)

```tsx
// Standard neobrutalist card:
className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer"

// Chart container:
className="bg-white rounded-lg border-2 border-black shadow-neobrutalism p-5"
```

