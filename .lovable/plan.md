
# Seller Dashboard Neo-Brutalist Card Design - Complete Update

## Overview

Multiple Seller Dashboard sections still have the light/modern card design (`border border-slate-100/200`, `shadow-sm`) instead of the **neo-brutalist style** that matches the Buyer Dashboard.

The target design uses:
- `border-2 border-black`
- `shadow-neobrutalism`
- `hover:shadow-none hover:translate-x-1 hover:translate-y-1`
- `rounded-lg`

---

## Files Requiring Updates

### 1. SellerPerformance.tsx

**Current**: All metric cards use `border border-slate-100 shadow-sm`

| Line | Component | Current | Update To |
|------|-----------|---------|-----------|
| 128-136 | Skeleton states | `rounded-2xl` | `rounded-lg border-2 border-black` |
| 186-198 | Trust Score card | `border border-slate-100 shadow-sm rounded-2xl` | `border-2 border-black shadow-neobrutalism rounded-lg hover:shadow-none hover:translate-x-1 hover:translate-y-1` |
| 201-211 | Fulfillment Rate card | Same pattern | Same update |
| 214-224 | Avg Response card | Same pattern | Same update |
| 227-237 | Avg Delivery card | Same pattern | Same update |
| 243-270 | Order Distribution card | `border border-slate-100 shadow-sm rounded-2xl` | `border-2 border-black shadow-neobrutalism rounded-lg` |
| 273-298 | Performance Checklist card | Same pattern | Same update |
| 302-323 | Stats Summary card | `bg-slate-50 border border-slate-100 rounded-2xl` | `bg-white border-2 border-black shadow-neobrutalism rounded-lg` |

### 2. SellerFlashSales.tsx

| Line | Component | Current | Update To |
|------|-----------|---------|-----------|
| 268-272 | Empty state | `bg-slate-50 border border-dashed border-slate-200 rounded-xl` | `bg-white border-2 border-dashed border-black rounded-lg` |
| 280-286 | Flash sale cards | Custom gradient borders | `border-2 border-black shadow-neobrutalism rounded-lg` + keep gradient bg |

### 3. SellerReports.tsx

| Line | Component | Current | Update To |
|------|-----------|---------|-----------|
| 257-263 | Skeleton states | `rounded-2xl` | `rounded-lg border-2 border-black` |
| 322-339 | Report type cards | `border-2` with `border-slate-100` or `border-emerald-500` | `border-2 border-black shadow-neobrutalism rounded-lg` (selected: add `ring-2 ring-emerald-500`) |
| 343 | Report preview container | `border border-slate-100 shadow-sm rounded-2xl` | `border-2 border-black shadow-neobrutalism rounded-lg` |

### 4. SellerProductAnalytics.tsx

| Line | Component | Current | Update To |
|------|-----------|---------|-----------|
| 109-114 | Empty state | `bg-slate-50 border border-dashed border-slate-200 rounded-xl` | `bg-white border-2 border-dashed border-black rounded-lg` |
| 129-135 | Total Views stat | `bg-blue-50 rounded-xl border border-blue-100` | `bg-white rounded-lg border-2 border-black shadow-neobrutalism` + keep blue icon bg |
| 136-142 | Total Clicks stat | Same pattern (purple) | Same update |
| 143-149 | Total Purchases stat | Same pattern (emerald) | Same update |
| 150-158 | Conversion Rate stat | Same pattern (amber) | Same update |
| 162 | Chart container | `bg-white rounded-xl border border-slate-200` | `bg-white rounded-lg border-2 border-black shadow-neobrutalism` |
| 221 | Product Performance table | `bg-white rounded-xl border border-slate-200` | `bg-white rounded-lg border-2 border-black shadow-neobrutalism` |

### 5. SellerSupport.tsx

| Line | Component | Current | Update To |
|------|-----------|---------|-----------|
| 423-425 | Skeleton states | `border-2 border-black` | Already correct |
| 457 | Chat card container | `border border-slate-100 shadow-sm rounded-xl` | `border-2 border-black shadow-neobrutalism rounded-lg` |

### 6. SellerFeatureRequests.tsx

| Line | Component | Current | Update To |
|------|-----------|---------|-----------|
| 153-226 | New Request Card | `Card` with `border-slate-200 shadow-sm` | Add `className="border-2 border-black shadow-neobrutalism rounded-lg"` |
| 231-312 | Requests List Card | Same pattern | Same update |

### 7. SellerWallet.tsx

Need to check all card containers and update to neo-brutalist style.

---

## Visual Reference

**Before (Incorrect - Light Style):**
```text
+------------------------------------+
| Light slate border (1px)           |
| Subtle shadow-sm                   |
| rounded-xl or rounded-2xl          |
+------------------------------------+
```

**After (Correct - Neo-Brutalist):**
```text
+====================================+ #
| Thick black border (2px)           | #
| 4px offset shadow                  | #
| rounded-lg                         | #
| Shifts into shadow on hover        | #
+====================================+
  ####################################
```

---

## Implementation Approach

1. **SellerPerformance.tsx** - Update all 7+ card containers
2. **SellerFlashSales.tsx** - Update empty state and sale cards
3. **SellerReports.tsx** - Update skeletons, report type cards, and preview container
4. **SellerProductAnalytics.tsx** - Update all stat cards, chart, and table containers
5. **SellerSupport.tsx** - Update chat card container
6. **SellerFeatureRequests.tsx** - Update both Card components
7. **SellerWallet.tsx** - Update all card containers

All cards will then match the Buyer Dashboard's neo-brutalist design for visual consistency.
