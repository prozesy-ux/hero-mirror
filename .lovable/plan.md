
# Seller Dashboard Card Design - Match Buyer Dashboard (Neo-Brutalist)

## Problem

The Seller Dashboard cards were incorrectly changed to a lighter design (`border-slate-200`, `shadow-sm`), but they should match the **Buyer Dashboard's neo-brutalist style** which uses:
- `border-2 border-black`
- `shadow-neobrutalism` (4px offset shadow)
- `hover:shadow-none hover:translate-x-1 hover:translate-y-1`
- `rounded-lg`

---

## Target Style (From Buyer Dashboard)

```tsx
// Stats Cards
<div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">

// Container Cards
<div className="bg-white rounded-lg border-2 border-black shadow-neobrutalism p-4">

// Skeleton Loading States
<Skeleton className="h-28 rounded-2xl border-2 border-black" />
```

---

## Files Requiring Updates

### 1. SellerDashboard.tsx

| Line | Current Style | Change To |
|------|--------------|-----------|
| 217-220 | `border border-slate-200` | `border-2 border-black` |
| 337-348 | `border border-slate-200 shadow-sm hover:shadow-md` | `border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1` |
| 366-378 | `border border-slate-200 shadow-sm` | `border-2 border-black shadow-neobrutalism` |
| 381-395 | `border border-slate-200 shadow-sm` | `border-2 border-black shadow-neobrutalism` |
| 401-416 | `border border-slate-200 shadow-sm` | `border-2 border-black shadow-neobrutalism` |
| 419-443 | `border border-slate-200 shadow-sm` | `border-2 border-black shadow-neobrutalism` |
| 446-458 | Similar pattern | `border-2 border-black shadow-neobrutalism` |
| All remaining cards | Clean style | Neo-brutalist style |

### 2. SellerAnalytics.tsx

| Component | Current Style | Change To |
|-----------|--------------|-----------|
| Skeleton states (line 238-241) | `border border-slate-200` | `border-2 border-black` |
| StatCard (line 257) | `border border-slate-200 shadow-sm hover:shadow-md` | `border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1` |
| QuickStatItem (line 301) | `border border-slate-200` | `border-2 border-black shadow-neobrutalism` |
| Date picker button (line 319-321) | `shadow-sm hover:shadow-md` | `shadow-neobrutalism` |
| Select trigger (line 353) | `shadow-sm hover:shadow-md` | `shadow-neobrutalism` |
| Export button (line 367) | `shadow-sm` | `shadow-neobrutalism` |
| Sales chart (line 403) | `border border-slate-200` | `border-2 border-black shadow-neobrutalism` |
| All chart cards | Clean style | `border-2 border-black shadow-neobrutalism` |

### 3. SellerOrders.tsx

| Line | Current Style | Change To |
|------|--------------|-----------|
| 346-361 | `border border-slate-100 shadow-sm` | `border-2 border-black shadow-neobrutalism` |
| 365 | `border border-slate-100 shadow-sm` | `border-2 border-black shadow-neobrutalism` |

### 4. SellerMarketing.tsx (Skeleton States)

| Line | Current | New |
|------|---------|-----|
| Loading skeletons | `border border-slate-200` | `border-2 border-black` |

### 5. SellerCustomers.tsx (Skeleton States)

| Line | Current | New |
|------|---------|-----|
| Loading skeletons | `border border-slate-200` | `border-2 border-black` |

### 6. SellerSettings.tsx (Skeleton States)

| Line | Current | New |
|------|---------|-----|
| Loading skeletons | `border border-slate-200` | `border-2 border-black` |

### 7. SellerInventory.tsx (Skeleton States)

| Line | Current | New |
|------|---------|-----|
| Loading skeletons | `border border-slate-200` | `border-2 border-black` |

### 8. SellerChat.tsx (Skeleton States)

| Line | Current | New |
|------|---------|-----|
| Loading skeletons | `border border-slate-200` | `border-2 border-black` |

---

## Visual Comparison

### Current (Incorrect - Light Style)
```
┌────────────────────────────────────┐
│ ░░ Subtle slate border             │
│    Soft shadows                     │
│    No offset effect                 │
└────────────────────────────────────┘
```

### Target (Correct - Neo-Brutalist)
```
╔════════════════════════════════════╗ ▄
║ ██ Thick black border              ║ ▄
║    4px offset shadow               ║
║    Shift-into-shadow on hover      ║
╚════════════════════════════════════╝
```

---

## Implementation Summary

1. **SellerDashboard.tsx** - Update all card containers, quick actions, charts
2. **SellerAnalytics.tsx** - Update StatCard, QuickStatItem, all chart containers, buttons, selects
3. **SellerOrders.tsx** - Update stats cards and filter container
4. **SellerMarketing.tsx** - Fix skeleton loading states
5. **SellerCustomers.tsx** - Fix skeleton loading states
6. **SellerSettings.tsx** - Fix skeleton loading states
7. **SellerInventory.tsx** - Fix skeleton loading states
8. **SellerChat.tsx** - Fix skeleton loading states

All seller dashboard sections will then have the same neo-brutalist design as the buyer dashboard for visual consistency across the platform.
