
# Remove Hover Effects from All Dashboard Cards

## Overview

Remove the neo-brutalist hover effects (`hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`, `shadow-neobrutalism`, `hover:shadow-none hover:translate-x-1 hover:translate-y-1`) from static display cards across the Seller Dashboard and Buyer Dashboard to match the clean Gumroad minimal style already applied to SellerProducts section.

## Design Principle

**Static display cards** (stats, charts, lists, containers) should have NO hover effects - clean `bg-white border rounded` style.

**Interactive cards** (Getting Started checklist items that need action) can keep the neo-brutalism hover effect since they are explicit CTAs.

---

## Files Requiring Updates

### Seller Dashboard

| File | Cards to Update |
|------|-----------------|
| `src/components/seller/SellerDashboard.tsx` | Quick Actions (Lines 329, 344, 359, 376) - Remove hover shadow, keep clickable styling |

### Buyer Dashboard

| File | Cards to Update |
|------|-----------------|
| `src/components/dashboard/BuyerDashboardHome.tsx` | Quick Actions (Lines 324, 340, 356), Recent Orders container (Line 372), Quick Stats Summary (Lines 455, 467, 479, 492) |
| `src/components/dashboard/BuyerAnalytics.tsx` | Spending Charts (Lines 287, 336, 367) |
| `src/components/dashboard/GumroadSections.tsx` | Getting Started cards (Line 141) - These are interactive so keep hover |
| `src/components/dashboard/BuyerWallet.tsx` | Payment methods cards, account cards, withdrawal cards, buttons (Lines 811, 871, 912, 963, 1121, 1255, 1301, 1684) |

---

## Detailed Changes

### 1. SellerDashboard.tsx (Lines 329-388)

**Quick Action Cards - Keep functional but simplify:**

Change from:
```tsx
<div className="bg-white rounded-lg p-4 border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer group">
```

Change to:
```tsx
<div className="bg-white rounded-lg p-4 border transition-colors hover:bg-slate-50 cursor-pointer group">
```

Apply to:
- Pending Orders card (Line 329)
- Flash Sales card (Line 344)
- Messages card (Line 359)
- Export Report button (Line 376)

### 2. BuyerDashboardHome.tsx (Lines 324-503)

**Quick Actions - Update all 3 cards:**

Change from:
```tsx
<div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
```

Change to:
```tsx
<div className="bg-white rounded-lg p-5 border transition-colors hover:bg-slate-50 cursor-pointer group">
```

**Recent Orders Container:**

Change from:
```tsx
<div className="bg-white rounded-lg border-2 border-black shadow-neobrutalism">
```

Change to:
```tsx
<div className="bg-white rounded-lg border">
```

**Quick Stats Summary - Update all 4 cards:**

Change from:
```tsx
<div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
```

Change to:
```tsx
<div className="bg-white rounded-lg p-4 border">
```

### 3. BuyerAnalytics.tsx (Lines 287-384)

**Chart Containers - Update all 3:**

Change from:
```tsx
<div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
```

Change to:
```tsx
<div className="bg-white rounded-lg p-6 border">
```

Apply to:
- Spending Details Chart (Line 287)
- Category Breakdown (Line 336)
- Monthly Trend (Line 367)

### 4. BuyerWallet.tsx (Lines 809-1684)

**Interactive Buttons - Keep hover for CTAs:**
- Withdraw button, Verify OTP, Add Account - These are true buttons, hover is appropriate

**Card containers - Remove heavy hover:**

Change from:
```tsx
<div className="p-4 bg-white border rounded text-center transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
```

Change to:
```tsx
<div className="p-4 bg-white border rounded text-center transition-colors hover:bg-slate-50">
```

Apply to:
- Payment methods cards (Line 871)
- Saved accounts cards (Line 912)
- Withdrawal history cards (Line 1121)
- Add account card (Line 963)

### 5. GumroadSections.tsx (Line 141) - KEEP AS-IS

The Getting Started checklist items ARE interactive action items - keep the neo-brutalism hover effect:
```tsx
className="relative bg-white border rounded p-4 text-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer"
```

---

## Summary of Changes

| Component | Change Type | Count |
|-----------|-------------|-------|
| SellerDashboard.tsx | Remove `hover:shadow-[4px...]` from Quick Actions | 4 cards |
| BuyerDashboardHome.tsx | Remove `shadow-neobrutalism` and hover effects | 8 cards |
| BuyerAnalytics.tsx | Remove `border-2 border-black shadow-neobrutalism` | 3 containers |
| BuyerWallet.tsx | Simplify hover effects on non-button cards | ~6 cards |

**Total: ~21 elements to update**

This will create visual consistency with the SellerProducts section where hover effects were removed from static display cards.
