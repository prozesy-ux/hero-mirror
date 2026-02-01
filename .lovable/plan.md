

# Apply Gumroad Neo-Brutalist Card Design to Buyer Dashboard

## Overview

Update all Buyer Dashboard pages to match the same neo-brutalist design system from the Seller Products page (`/seller`). This includes bold black borders, offset shadows, interactive hover effects, and the warm cream background.

## Design System Reference

From the Seller Products implementation:
- **Border**: `border-2 border-black` (solid black, not translucent)
- **Shadow**: `shadow-neobrutalism` (4px 4px 0px black offset)
- **Hover**: `hover:shadow-none hover:translate-x-1 hover:translate-y-1` (shifts into shadow)
- **Background**: `bg-[#FBF8F3]` (warm cream color)

## Files to Update

### 1. `src/components/marketplace/StatCard.tsx`
Update the shared StatCard component to support neo-brutalist variant

**Changes:**
- Add new `variant="neobrutalism"` option
- Solid black border (`border-2 border-black`)
- Add `shadow-neobrutalism` class
- Interactive hover effect

### 2. `src/components/dashboard/BuyerDashboardHome.tsx`
Main buyer dashboard home page

**Changes:**
- Page background: `bg-[#FBF8F3]` instead of `bg-slate-50/50`
- Stats row cards: Use neo-brutalist StatCard variant
- Quick action cards: Apply `border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1`
- Recent orders section: Neo-brutalist container
- Quick stats section: Neo-brutalist cards

### 3. `src/components/dashboard/BuyerOrders.tsx`
Orders listing page

**Changes:**
- Stats cards (lines 384-442): Apply `border-2 border-black rounded-lg shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1`
- Filters container: Neo-brutalist styling
- Order cards: Neo-brutalist borders and hover

### 4. `src/components/dashboard/BuyerWallet.tsx`
Wallet management page

**Changes:**
- Apply neo-brutalist cards to wallet sections
- Stats cards and method cards with black borders and offset shadow

### 5. `src/components/dashboard/BuyerAnalytics.tsx`
Analytics page

**Changes:**
- Page background: `bg-[#FBF8F3]`
- Stats cards (lines 248-311): Apply neo-brutalist styling
- Chart containers: Neo-brutalist cards

### 6. `src/components/dashboard/BuyerNotifications.tsx`
Notifications page

**Changes:**
- Empty state card: Neo-brutalist styling
- Notification items: Neo-brutalist borders and hover

## Implementation Details

### Card Styling Pattern

**Current (Soft/Minimal):**
```tsx
<div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
```

**New (Neo-Brutalist):**
```tsx
<div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
```

### Page Background Pattern

**Current:**
```tsx
<div className="space-y-6 p-4 lg:p-6 bg-slate-50/50 min-h-screen">
```

**New:**
```tsx
<div className="space-y-6 p-4 lg:p-6 bg-[#FBF8F3] min-h-screen">
```

### StatCard Component Enhancement

Add neo-brutalist variant to the shared StatCard component:

```tsx
neobrutalism: cn(
  "bg-white border-2 border-black rounded-lg shadow-neobrutalism",
  "hover:shadow-none hover:translate-x-1 hover:translate-y-1",
  "transition-all cursor-pointer"
),
```

## Visual Changes Summary

| Element | Before | After |
|---------|--------|-------|
| Page Background | `bg-slate-50/50` | `bg-[#FBF8F3]` (cream) |
| Card Border | `border border-slate-100` | `border-2 border-black` |
| Card Shadow | `shadow-sm` | `shadow-neobrutalism` |
| Card Corners | `rounded-2xl` | `rounded-lg` |
| Card Hover | Subtle color change | Translates into shadow |
| Interactive | Static | Cards shift on hover |

## Result

- Consistent neo-brutalist Gumroad aesthetic across both Seller and Buyer dashboards
- Bold, high-contrast cards with solid black borders
- Interactive hover effects that feel tactile
- Warm cream background matching Gumroad's design language
- Unified design system throughout the platform

