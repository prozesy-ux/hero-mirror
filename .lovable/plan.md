
# BuyerOrders Section Design Standardization to Match Billing Section

## Overview

Update **BuyerOrders.tsx** to match the Gumroad/Neo-brutalism design pattern already implemented in **BillingSection.tsx**. This includes standardizing filter containers, status tabs, order cards, date picker, modals, and all interactive elements.

## Reference Design (from BillingSection.tsx)

```text
TAB NAVIGATION (Status Filter):
+----------------------------------------------------------------+
| bg-white border rounded p-2                                    |
|                                                                |
| [All]     [Pending]   [Delivered]   [Approved]   [Completed]   |
| #FF90E8   slate-600   slate-600     slate-600    slate-600     |
| + black   clean       clean         clean        clean         |
| border                                                         |
+----------------------------------------------------------------+

ORDER CARDS:
+----------------------------------------------------------------+
| p-4 bg-white border rounded                                    |
| hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]                   |
|                                                                |
| [Image] Product Name                      [Status Badge]       |
|         Seller Name                                            |
|         $50.00 . Jan 15, 2025 . #ORDER123                      |
|                                    [View Details] Gumroad pink |
+----------------------------------------------------------------+
```

---

## Current Issues Found

### 1. Filter Container (Line 423)
**Current:**
```tsx
<div className="bg-white border rounded p-4 space-y-4">
```
**Issue:** Good base but needs consistent spacing

### 2. Search Input (Lines 428-433)
**Current:**
```tsx
className="pl-10 rounded-xl border-slate-200"
```
**Issue:** Uses `rounded-xl` (should be simple `rounded`)

### 3. Date Filter Button (Lines 437-443)
**Current:**
```tsx
<Button variant="outline" className="w-full sm:w-auto gap-2 rounded-xl border-slate-200">
```
**Issue:** Uses `rounded-xl` (should be `rounded border-black`)

### 4. Date Preset Buttons (Lines 446-468)
**Current:**
```tsx
className={cn(
  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
  datePreset === preset ? "bg-violet-100 text-violet-700" : "hover:bg-slate-100"
)}
```
**Issue:** Uses violet colors (should be Gumroad pink `#FF90E8`)

### 5. Sort Dropdown (Lines 488-503)
**Current:**
```tsx
<SelectTrigger className="w-full sm:w-[160px] rounded-xl border-slate-200">
```
**Issue:** Uses `rounded-xl` (should be `rounded border-black`)

### 6. Status Tabs (Lines 507-538)
**Current:**
```tsx
className={cn(
  "px-4 py-2 rounded-full text-sm font-medium transition-all",
  statusFilter === tab.value
    ? "bg-violet-600 text-white shadow-sm"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
)}
```
**Issue:** Uses violet and `rounded-full` (should be Gumroad pink with `rounded` and black border)

### 7. Order Cards (Lines 549-632)
**Current:**
```tsx
className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
```
**Issue:** Uses `rounded-xl hover:shadow-md` (should be `rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)

### 8. View Details Button (Lines 600-608)
**Current:**
```tsx
<Button size="sm" variant="outline" className="rounded-lg text-sm h-8 px-3">
```
**Issue:** Standard outline button (should be Gumroad pink style)

### 9. Confirm Delivery Button (Lines 619-625)
**Current:**
```tsx
className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-8"
```
**Issue:** Uses blue (should be Gumroad pink with black border)

### 10. Empty State (Lines 543-548)
**Current:**
```tsx
<div className="bg-white rounded-xl p-10 text-center border border-slate-200">
```
**Issue:** Uses `rounded-xl` (should be `rounded`)

### 11. Order Detail Modal (Lines 636-730)
**Current:** Standard modal with slate backgrounds
**Issue:** Should use Gumroad styling for buttons and layout

---

## Changes Required

### 1. Search Input (Line 432)
```text
BEFORE: className="pl-10 rounded-xl border-slate-200"
AFTER:  className="pl-10 rounded border-black focus:ring-2 focus:ring-[#FF90E8]/50"
```

### 2. Date Filter Button (Line 439)
```text
BEFORE: className="w-full sm:w-auto gap-2 rounded-xl border-slate-200"
AFTER:  className="w-full sm:w-auto gap-2 rounded border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
```

### 3. Date Preset Buttons (Lines 450-453, 465-468)
```text
BEFORE: datePreset === preset ? "bg-violet-100 text-violet-700" : "hover:bg-slate-100"
AFTER:  datePreset === preset ? "bg-[#FF90E8] text-black border border-black" : "hover:bg-slate-50"
```

### 4. Sort Dropdown (Line 489)
```text
BEFORE: className="w-full sm:w-[160px] rounded-xl border-slate-200"
AFTER:  className="w-full sm:w-[160px] rounded border-black"
```

### 5. Status Tabs Container (Line 507)
Wrap in a container matching BillingSection tab style:
```tsx
<div className="bg-white border rounded p-2">
  <div className="flex flex-wrap gap-1">
```

### 6. Status Tab Buttons (Lines 520-525)
```text
BEFORE:
  statusFilter === tab.value
    ? "bg-violet-600 text-white shadow-sm"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200"

AFTER:
  statusFilter === tab.value
    ? "bg-[#FF90E8] text-black border border-black"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
```

### 7. Order Cards (Line 552)
```text
BEFORE: className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
AFTER:  className="bg-white border rounded p-4 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
```

### 8. View Details Button (Lines 600-608)
```text
BEFORE:
<Button size="sm" variant="outline" className="rounded-lg text-sm h-8 px-3">
  <Eye className="w-3.5 h-3.5 mr-1.5" />
  View Details
</Button>

AFTER:
<button className="flex items-center gap-1.5 px-4 py-2 bg-[#FF90E8] text-black font-medium text-sm rounded border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
  <Eye className="w-3.5 h-3.5" />
  View Details
</button>
```

### 9. Confirm Delivery Section (Lines 615-629)
```text
BEFORE:
<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
  <Button className="bg-blue-600 hover:bg-blue-700">

AFTER:
<div className="p-4 bg-[#FFF5FB] border border-black rounded">
  <button className="px-4 py-2 bg-[#FF90E8] text-black font-medium rounded border border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
```

### 10. Empty State (Line 544)
```text
BEFORE: className="bg-white rounded-xl p-10 text-center border border-slate-200"
AFTER:  className="bg-white border rounded p-10 text-center"
```

### 11. Order Detail Modal
- Update info grid: `bg-slate-50 rounded-lg` to `bg-white border rounded`
- Update Contact Seller button: Gumroad pink style
- Update Leave Review button: Secondary Gumroad style (white with black border)
- Update credentials section border styling

---

## Summary of Styling Changes

| Element | Before | After |
|---------|--------|-------|
| Inputs | `rounded-xl border-slate-200` | `rounded border-black` |
| Buttons (outline) | `rounded-xl/lg` | `rounded border-black` |
| Active tabs | `bg-violet-600 text-white rounded-full` | `bg-[#FF90E8] text-black border border-black rounded` |
| Inactive tabs | `bg-slate-100` | `hover:bg-slate-50` |
| Order cards | `rounded-xl hover:shadow-md` | `rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Primary buttons | `bg-blue-600` or outline | `bg-[#FF90E8] border border-black` |
| Date presets active | `bg-violet-100 text-violet-700` | `bg-[#FF90E8] text-black border border-black` |
| Containers | Various rounded-xl | Simple `border rounded` |

---

## Typography Standardization

| Element | Style |
|---------|-------|
| Section Headers | `text-xl font-semibold text-slate-900` |
| Card Labels | `text-base text-slate-700` |
| Card Values | `text-4xl font-semibold text-slate-900` |
| Body Text | `text-slate-600` |
| Product titles | `font-medium text-slate-900` |

---

## Visual Before/After

**Status Tabs Before:**
```text
+----------------------------------------+
| (All)  (Pending)  (Delivered)          |
|  dark   gray       gray                |
|  rounded-full                          |
+----------------------------------------+
```

**Status Tabs After:**
```text
+----------------------------------------+
| bg-white border rounded p-2            |
| [All]   [Pending]   [Delivered]        |
|  pink    clean       clean             |
| + black  text        text              |
+----------------------------------------+
```

**Order Card Before:**
```text
+----------------------------------------+
| bg-white rounded-xl shadow-md hover    |
| [IMG] Product Name       [Badge]       |
|       Seller                           |
|       Price . Date . ID                |
|                    [View Details]      |
+----------------------------------------+
```

**Order Card After:**
```text
+----------------------------------------+
| bg-white border rounded                |
| hover:shadow-[4px_4px_0px_0px_...]      |
| [IMG] Product Name       [Badge]       |
|       Seller                           |
|       Price . Date . ID                |
|                    [View Details]      |
|                    Gumroad pink btn    |
+----------------------------------------+
```

---

## Files to Update

| File | Sections to Change |
|------|-------------------|
| `src/components/dashboard/BuyerOrders.tsx` | Search input, Date picker, Sort dropdown, Status tabs, Order cards, Action buttons, Empty state, Detail modal |

