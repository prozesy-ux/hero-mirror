

# Wallet Section Card Design Standardization

## Overview

Update both **BuyerWallet.tsx** and **SellerWallet.tsx** to match the Gumroad Activity Cards design pattern from `GumroadSections.tsx`:

```text
TARGET DESIGN (from GumroadSections.tsx line 199-204):
┌────────────────────────────────────┐
│ bg-white border rounded p-8        │
│                                    │
│ Balance                            │
│ (text-base text-slate-700)         │
│                                    │
│ $1,234                             │
│ (text-4xl font-semibold            │
│  text-slate-900)                   │
└────────────────────────────────────┘
```

---

## Current Issues Found

### BuyerWallet.tsx (lines 800-822)

**Current styling:**
```tsx
<div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
  <!-- Gradient icon box -->
  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
    <Wallet size={24} className="sm:w-7 sm:h-7 text-white" />
  </div>
  <!-- Double-line text -->
  <p className="text-gray-500 text-xs sm:text-sm font-medium">Wallet Balance</p>
  <h3 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
```

**Issues:**
- Has `rounded-2xl shadow-lg` (should be simple `border rounded`)
- Has gradient icon box (should remove)
- Has extra small label text (should be `text-base text-slate-700`)
- Has `font-bold` (should be `font-semibold`)

### SellerWallet.tsx (lines 801-823)

**Same issues as BuyerWallet:**
- Gradient icon boxes
- Complex border/shadow styling
- Double-line card text with small labels

---

## Changes Required

### File 1: `src/components/dashboard/BuyerWallet.tsx`

**Update Wallet Balance Card (lines 800-822):**

```text
BEFORE:
┌─────────────────────────────────────────────────────┐
│ bg-white rounded-xl shadow-lg border-gray-100       │
│ ┌──────────┐                                        │
│ │ Gradient │  Wallet Balance (text-xs)              │
│ │ Icon Box │  $1,234 (text-2xl font-bold)          │
│ └──────────┘                            [Withdraw]  │
└─────────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────────┐
│ bg-white border rounded p-8                         │
│                                                     │
│ Wallet Balance (text-base text-slate-700)           │
│                                                     │
│ $1,234 (text-4xl font-semibold text-slate-900)      │
│                                          [Withdraw] │
└─────────────────────────────────────────────────────┘
```

**Update Available Methods container (line 843):**
- Change from `rounded-2xl p-6 border border-gray-200 shadow-md` to `border rounded p-8`

**Update Accounts container card styling (lines 916-963):**
- Simplify card borders

**Update Withdrawals container (line 982):**
- Change from `rounded-2xl p-6 border border-gray-200 shadow-md` to `border rounded p-8`

---

### File 2: `src/components/seller/SellerWallet.tsx`

**Update Wallet Balance Card (lines 801-823):**

Same changes as BuyerWallet - remove gradient icon box, simplify styling.

**Update Available Methods container (line 844):**
- Change from `rounded-lg p-6 border border-gray-200 shadow-sm` to `border rounded p-8`

**Update Accounts section cards**

**Update Withdrawals section containers**

---

## Summary of Styling Changes

| Element | Before | After |
|---------|--------|-------|
| Main container | `rounded-xl shadow-lg border-gray-100` | `border rounded` |
| Padding | `p-4 sm:p-6` | `p-8` |
| Icon box | Gradient `bg-gradient-to-br from-violet-500 to-purple-600` | **Remove entirely** |
| Label | `text-xs sm:text-sm font-medium text-gray-500` | `text-base text-slate-700` |
| Value | `text-2xl sm:text-4xl font-bold text-gray-900` | `text-4xl font-semibold text-slate-900` |
| Section containers | `rounded-2xl shadow-md` | `border rounded` |

---

## Files to Update

| File | Sections |
|------|----------|
| `src/components/dashboard/BuyerWallet.tsx` | Wallet card, Methods container, Accounts cards, Withdrawals container |
| `src/components/seller/SellerWallet.tsx` | Wallet card, Methods container, Accounts cards, Withdrawals container |

---

## Visual Before/After

**Before (Current):**
```text
┌────────────────────────────────────────────┐
│  ┌─────┐                                   │
│  │ 💜  │  Wallet Balance                   │
│  │     │  $1,234.00          [Withdraw]    │
│  └─────┘                                   │
│  shadow-lg rounded-2xl                     │
└────────────────────────────────────────────┘
```

**After (Gumroad Style):**
```text
┌────────────────────────────────────────────┐
│                                            │
│  Wallet Balance                            │
│                                            │
│  $1,234                      [Withdraw]    │
│                                            │
│  bg-white border rounded p-8               │
└────────────────────────────────────────────┘
```

