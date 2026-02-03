

# Billing Section Design Standardization to Gumroad Style

## Overview

Update **BillingSection.tsx** to match the same Gumroad Activity Cards pattern that was applied to BuyerWallet.tsx and SellerWallet.tsx. This includes standardizing cards, tabs, containers, and typography to use Inter font with the clean Gumroad design.

```text
TARGET DESIGN:
┌────────────────────────────────────┐
│ bg-white border rounded p-8        │
│                                    │
│ Label (text-base text-slate-700)   │
│                                    │
│ Value (text-4xl font-semibold      │
│        text-slate-900)             │
└────────────────────────────────────┘
```

---

## Current Issues Found

### 1. Tab Navigation (Line 638)
**Current:**
```tsx
<div className="bg-white rounded-2xl p-1 sm:p-1.5 lg:p-2 mb-4 lg:mb-8 border border-gray-200 shadow-md">
```
**Issues:**
- Has `rounded-2xl shadow-md` (should be `border rounded`)
- Complex padding variations

### 2. Wallet Card (Lines 665-686)
**Current:**
```tsx
<div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
    <Wallet ... />
  </div>
  <p className="text-gray-500 text-xs sm:text-sm font-medium">Wallet Balance</p>
  <h3 className="text-2xl sm:text-4xl font-bold ...">
```
**Issues:**
- Has gradient icon box (should remove)
- Has `rounded-2xl shadow-lg` (should be `border rounded`)
- Small label text (should be `text-base text-slate-700`)
- `font-bold` (should be `font-semibold`)
- Gradient button (should be Gumroad pink)

### 3. Payment Methods Container (Line 689)
**Current:**
```tsx
<div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
```
**Issues:**
- Has `rounded-2xl shadow-md` (should be `border rounded p-8`)
- Icon in header (remove)

### 4. Payment Method Cards (Lines 696-714)
**Current:** Rounded corners with extra styling

### 5. Transactions Container (Line 722)
**Current:**
```tsx
<div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-md">
```
**Issues:**
- Has `rounded-2xl shadow-md` (should be `border rounded p-8`)
- Icon in header (remove)

### 6. Transaction Items (Lines 732-829)
**Current:** Complex rounded cards with colored icon boxes

### 7. Plan Container (Line 839)
**Current:**
```tsx
<div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
```
**Issues:**
- Has `rounded-2xl shadow-md` (should be `border rounded p-8`)
- Gradient icon box (remove)

### 8. Upgrade Card (Lines 887-999)
**Current:** Complex styling with gradient headers

### 9. Purchases Container (Line 1001)
**Current:**
```tsx
<div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-md">
```

### 10. Modal Styling (Lines 1077-1248)
**Current:** Gradient icons and violet styling (update to Gumroad pink)

### 11. QR Image Border (Line 1186-1189)
**Current:**
```tsx
className="w-32 h-32 object-contain rounded-lg border border-gray-200"
```
**Fix:** Keep same border style but ensure consistency

---

## Changes Required

### File: `src/components/dashboard/BillingSection.tsx`

#### 1. Tab Navigation (Line 638)
```text
BEFORE: bg-white rounded-2xl p-1 sm:p-1.5 lg:p-2 mb-4 lg:mb-8 border border-gray-200 shadow-md
AFTER:  bg-white border rounded p-2 mb-8
```

#### 2. Tab Buttons (Lines 643-656)
Simplify to match Gumroad style with pink active state

#### 3. Wallet Card (Lines 665-686)
```text
BEFORE:
┌─────────────────────────────────────────────────────┐
│ bg-white rounded-2xl shadow-lg border-gray-100      │
│ ┌──────────┐                                        │
│ │ Gradient │  Wallet Balance (text-xs)              │
│ │ Icon Box │  $1,234 (font-bold)       [Add Funds]  │
│ └──────────┘                                        │
└─────────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────────┐
│ bg-white border rounded p-8                         │
│                                                     │
│ Wallet Balance (text-base text-slate-700)           │
│                                                     │
│ $1,234 (text-4xl font-semibold text-slate-900)      │
│                                          [Add Funds]│
│                              (Gumroad pink button)  │
└─────────────────────────────────────────────────────┘
```

#### 4. Payment Methods Container (Line 689)
```text
BEFORE: bg-white rounded-2xl p-6 border border-gray-200 shadow-md
AFTER:  bg-white border rounded p-8
```
- Remove header icon
- Update header: `text-lg font-bold` → `text-xl font-semibold text-slate-900`

#### 5. Payment Method Cards (Lines 696-714)
```text
BEFORE: p-4 rounded-xl bg-gray-50 border border-gray-200
AFTER:  p-4 bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
```

#### 6. Transactions Container (Line 722)
```text
BEFORE: bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-md
AFTER:  bg-white border rounded p-8
```
- Remove header icon
- Update header typography

#### 7. Transaction Items (Lines 732-829)
```text
BEFORE: p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100
AFTER:  p-4 bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
```
- Remove colored icon boxes
- Simplify layout

#### 8. Plan Container (Line 839)
```text
BEFORE: bg-white rounded-2xl p-6 border border-gray-200 shadow-md
AFTER:  bg-white border rounded p-8
```
- Remove gradient icon box for plan status
- Simplify typography

#### 9. Upgrade Card (Lines 887-999)
Simplify to clean Gumroad style:
- Remove gradient headers
- Use simple `border rounded`
- Button: Gumroad pink `bg-[#FF90E8] border border-black`

#### 10. Purchases Container (Line 1001)
```text
BEFORE: bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-md
AFTER:  bg-white border rounded p-8
```

#### 11. Purchase Items (Lines 1015-1069)
```text
BEFORE: p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100
AFTER:  p-4 bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
```

#### 12. Topup Modal (Lines 1077-1248)
- Modal container: Keep `rounded-2xl` for modals (exception for focus)
- Remove gradient icon header
- Quick amount buttons: Simplify styling
- Button: Use Gumroad pink `bg-[#FF90E8] border border-black`

---

## Typography Standardization

| Element | Before | After |
|---------|--------|-------|
| Section Header | `text-lg font-bold text-gray-900` | `text-xl font-semibold text-slate-900` |
| Card Label | `text-xs sm:text-sm font-medium text-gray-500` | `text-base text-slate-700` |
| Card Value | `text-2xl sm:text-4xl font-bold text-gray-900` | `text-4xl font-semibold text-slate-900` |
| Body Text | `text-gray-500` | `text-slate-600` |

---

## Button Standardization

| Button Type | Before | After |
|-------------|--------|-------|
| Primary Action | `bg-gradient-to-r from-violet-600 to-purple-600` | `bg-[#FF90E8] border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Secondary | `bg-gray-100 hover:bg-gray-200` | `bg-white border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |

---

## Summary of Styling Changes

| Element | Before | After |
|---------|--------|-------|
| Main containers | `rounded-xl/2xl shadow-md/lg` | `border rounded` |
| Padding | `p-4 sm:p-6` variations | `p-8` |
| Icon boxes | Gradient backgrounds | **Remove entirely** |
| Item cards | `bg-gray-50 rounded-xl` | `bg-white border rounded` |
| Hover effects | `hover:bg-gray-100` | `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Primary buttons | Violet gradient | Gumroad pink with black border |

---

## Visual Before/After

**Before (Current):**
```text
┌────────────────────────────────────────────┐
│  ┌─────┐                                   │
│  │ 💜  │  Wallet Balance                   │
│  │     │  $1,234.00          [Add Funds]   │
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
│  $1,234                      [Add Funds]   │
│                                            │
│  bg-white border rounded p-8               │
└────────────────────────────────────────────┘
```

---

## Font Consistency

Ensure Inter font is applied (already set in project via `@fontsource/inter`). All text in BillingSection will inherit the Inter font from the dashboard layout.

