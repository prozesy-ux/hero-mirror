
# Remove Border Design from Seller Wallet Section

## Overview

This plan will remove the neo-brutalist border design (`border-2 border-black`, `shadow-neobrutalism`, and hover effects) from the `/seller/wallet` section, giving it a cleaner, borderless appearance.

---

## Current Design Elements to Remove

The following styling will be removed across all cards and containers:
- `border-2 border-black` (thick black borders)
- `shadow-neobrutalism` (4px offset shadow)
- `hover:shadow-none hover:translate-x-1 hover:translate-y-1` (hover effects)

---

## Components to Update

### 1. Tab Navigation (Line 769)
**Current:** `border-2 border-black shadow-neobrutalism`
**New:** No border, subtle background only

### 2. Wallet Card (Line 801)
**Current:** `border-2 border-black shadow-neobrutalism`
**New:** Clean card without borders

### 3. Add Account First Warning (Line 826)
**Current:** `border-2 border-black`
**New:** Simple warning box without thick border

### 4. Available Withdrawal Methods Card (Line 844)
**Current:** `border-2 border-black shadow-neobrutalism`
**New:** Clean container

### 5. Withdrawal Method Items (Line 878)
**Current:** `border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1`
**New:** Simple cards with light styling

### 6. Saved Account Cards (Lines 920, 1000)
**Current:** `border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1`
**New:** Clean cards without neo-brutalist styling

### 7. Add New Account Button (Line 975)
**Current:** `border-2 border-dashed border-black`
**New:** Subtle dashed border

---

## Style Replacement Pattern

| Current Style | New Style |
|--------------|-----------|
| `border-2 border-black` | `border border-gray-200` or none |
| `shadow-neobrutalism` | `shadow-sm` or none |
| `hover:shadow-none hover:translate-x-1 hover:translate-y-1` | `hover:shadow-md` or remove |

---

## File to Modify

- `src/components/seller/SellerWallet.tsx`

---

## Visual Result

The wallet section will have a cleaner, modern appearance without the bold black borders and offset shadows, while maintaining proper visual hierarchy through subtle shadows and light borders.
