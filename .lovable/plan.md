
# Wallet Sections Design Standardization to Match Billing Section

## Overview

Update **BuyerWallet.tsx** and **SellerWallet.tsx** to match the exact Gumroad design pattern already implemented in **BillingSection.tsx**. This includes standardizing tabs, transaction borders, account sections, and the Add Account step design.

## Reference Design (from BillingSection.tsx)

```text
TAB NAVIGATION:
┌────────────────────────────────────────────────────────────────┐
│ bg-white border rounded p-2 mb-8                               │
│                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Active   │ │ Inactive │ │ Inactive │ │ Inactive │           │
│ │ #FF90E8  │ │ slate-600│ │ slate-600│ │ slate-600│           │
│ │ + black  │ │          │ │          │ │          │           │
│ │ border   │ │          │ │          │ │          │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────────────────────────────────────────┘

TRANSACTION/WITHDRAWAL ITEMS:
┌────────────────────────────────────────────────────────────────┐
│ p-4 bg-white border rounded                                    │
│ hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]                   │
│                                                                │
│ [Icon] Transaction Description              $Amount            │
│        Date • via Gateway                   [Status Badge]     │
└────────────────────────────────────────────────────────────────┘

METHOD/ACCOUNT CARDS:
┌────────────────────────────────────────────────────────────────┐
│ p-4 bg-white border rounded text-center                        │
│ hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]                   │
│                                                                │
│ [Logo/Icon]                                                    │
│ Method Name                                                    │
│ Type Label                                                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Current Issues in Wallet Files

### BuyerWallet.tsx

| Section | Current Styling | Target Styling |
|---------|-----------------|----------------|
| Tab Navigation (line 768) | `rounded-xl shadow-md border-gray-200` + `bg-gray-900` active | `border rounded` + `bg-[#FF90E8] border-black` active |
| Withdrawal Methods (line 871) | `rounded-xl bg-gray-50 hover:bg-gray-100` | `bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Withdrawal Items (line 1121) | `bg-gray-50 rounded-xl border-gray-100 hover:bg-gray-100` | `bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Add Account Card (line 963) | `border-dashed border-violet-200` | `border-dashed border-black` + Gumroad styling |
| Modals | Gradient headers `bg-gradient-to-r from-violet-600 to-purple-600` | Clean white with simple borders |

### SellerWallet.tsx

| Section | Current Styling | Target Styling |
|---------|-----------------|----------------|
| Tab Navigation (line 769) | `rounded-lg shadow-sm` + `bg-gray-900` active | `border rounded` + `bg-[#FF90E8] border-black` active |
| Withdrawal Methods (line 872) | `rounded-lg shadow-sm hover:shadow-md` | `bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Withdrawal Items (line 993) | `rounded-lg shadow-sm hover:shadow-md` | `bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Add Account Card (line 965) | `border-dashed border-gray-300` | `border-dashed border-black` + Gumroad styling |
| Modals | Gradient headers | Clean white with simple borders |

---

## Changes Required

### File 1: `src/components/dashboard/BuyerWallet.tsx`

#### 1. Tab Navigation (Lines 768-794)

**Before:**
```tsx
<div className="bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 lg:p-2 mb-3 sm:mb-4 lg:mb-8 border border-gray-200 shadow-md">
  ...
  className={`... ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'}`}
```

**After:**
```tsx
<div className="bg-white border rounded p-2 mb-8">
  ...
  className={`flex-1 px-4 py-3 rounded font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
    activeTab === tab.id
      ? 'bg-[#FF90E8] text-black border border-black'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
  }`}
```

#### 2. Withdrawal Methods Grid (Lines 868-896)

**Before:**
```tsx
className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center hover:bg-gray-100 transition-all"
```

**After:**
```tsx
className="p-4 bg-white border rounded text-center transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-default"
```

#### 3. Account Cards in Accounts Tab (Lines 906-970)

**Before:**
```tsx
className="p-4 border rounded bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all relative"
```

This is already correct. Keep as is.

#### 4. Add Account Card Button (Lines 960-969)

**Before:**
```tsx
className="p-6 rounded-xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
```

**After:**
```tsx
className="p-6 border-2 border-dashed border-black rounded transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFF5FB]"
```
- Icon background: `bg-[#FF90E8]` instead of `bg-violet-100`
- Icon color: `text-black` instead of `text-violet-600`
- Text: `text-black font-semibold`

#### 5. Withdrawal Items (Lines 1114-1150)

**Before:**
```tsx
className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
```

**After:**
```tsx
className="p-4 bg-white border rounded transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
```

#### 6. Withdraw Modal (Lines 1157-1265)

**Before:**
```tsx
<DialogTitle className="flex items-center gap-2">
  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
    <Wallet className="text-white" size={20} />
  </div>
```

**After:**
```tsx
<DialogTitle className="text-xl font-semibold text-slate-900">
  Withdraw Funds
</DialogTitle>
```

- Quick amount buttons: Replace gradient with Gumroad style
- Primary button: Replace gradient with `bg-[#FF90E8] border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`

#### 7. OTP Modal (Lines 1267-1324)

**Before:** Gradient header `bg-gradient-to-r from-violet-600 to-purple-600`

**After:** Clean white with simple border, icon in `bg-[#FF90E8]`

#### 8. Add Account Modal (Lines 1326-end)

**Before:** Gradient header `bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white`

**After:**
```tsx
<div className="bg-white border-b p-6">
  <div className="flex items-center gap-3">
    {/* Back button */}
    <div className="p-3 bg-[#FF90E8] border border-black rounded">
      <CreditCard className="w-6 h-6 text-black" />
    </div>
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Add Payment Account</h2>
      <p className="text-slate-600 text-sm">{...}</p>
    </div>
  </div>
</div>
```

- Step indicators: Replace violet with Gumroad pink `bg-[#FF90E8]`
- Country/Type/Wallet selection buttons: `border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Submit button: Gumroad pink styling

---

### File 2: `src/components/seller/SellerWallet.tsx`

Apply identical changes as BuyerWallet.tsx:

#### 1. Tab Navigation (Lines 769-795)
Same changes as BuyerWallet

#### 2. Withdrawal Methods Grid (Lines 869-897)
Same changes as BuyerWallet

#### 3. Add Account Card Button (Lines 962-971)
Same changes as BuyerWallet

#### 4. Withdrawal Items (Lines 986-1024)
Same changes as BuyerWallet

#### 5. Withdraw Modal (Lines 1029-1137)
Same changes as BuyerWallet

#### 6. Add Account Modal (Lines 1139-end)
Same changes as BuyerWallet

---

## Summary of Styling Changes

| Element | Before | After |
|---------|--------|-------|
| Tab container | `rounded-xl/2xl shadow-md border-gray-200` | `border rounded` |
| Tab active | `bg-gray-900 text-white` | `bg-[#FF90E8] text-black border border-black` |
| Tab inactive | `text-gray-500 hover:bg-gray-100` | `text-slate-600 hover:bg-slate-50` |
| Method cards | `rounded-xl bg-gray-50 hover:bg-gray-100` | `bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Transaction items | `bg-gray-50 rounded-xl hover:bg-gray-100` | `bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Add Account btn | `border-violet-200 hover:bg-violet-50` | `border-black hover:shadow-[...]` |
| Modal headers | Violet gradient | Clean white + pink icon |
| Primary buttons | Violet gradient | `bg-[#FF90E8] border border-black` |
| Step indicators | `bg-violet-100 text-violet-600` | `bg-[#FF90E8] text-black` |

---

## Typography (Inter Font)

All text already inherits Inter from dashboard layout. Key typography:

| Element | Style |
|---------|-------|
| Section Headers | `text-xl font-semibold text-slate-900` |
| Card Labels | `text-base text-slate-700` |
| Card Values | `text-4xl font-semibold text-slate-900` |
| Body Text | `text-slate-600` |

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/dashboard/BuyerWallet.tsx` | Tabs, methods grid, withdrawal items, add account button, all modals |
| `src/components/seller/SellerWallet.tsx` | Tabs, methods grid, withdrawal items, add account button, all modals |

---

## Visual Before/After

**Tab Navigation Before:**
```text
┌────────────────────────────────────────────┐
│ [Wallet]  [History]  [Accounts]            │
│  (dark)   (gray)     (gray)                │
│  shadow-md rounded-2xl                     │
└────────────────────────────────────────────┘
```

**Tab Navigation After:**
```text
┌────────────────────────────────────────────┐
│ [Wallet]  [History]  [Accounts]            │
│  (pink)   (slate)    (slate)               │
│  + border  clean      clean                │
│  border rounded                            │
└────────────────────────────────────────────┘
```

**Transaction Item Before:**
```text
┌────────────────────────────────────────────┐
│ bg-gray-50 rounded-xl                      │
│ [💜] $25.00              [Pending]         │
│      Jan 15, 2025         badge            │
│ hover:bg-gray-100                          │
└────────────────────────────────────────────┘
```

**Transaction Item After:**
```text
┌────────────────────────────────────────────┐
│ bg-white border rounded                    │
│ $25.00                   [Pending]         │
│ Jan 15, 2025 • via bKash  badge            │
│ hover:shadow-[4px_4px_0px_0px_...]         │
└────────────────────────────────────────────┘
```
