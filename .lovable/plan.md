
# Full Project Popup & Modal Design Standardization

## Overview

Standardize **all dialogs, modals, sheets, popovers, and share boxes** across the entire project to match the Gumroad/Neo-brutalism design pattern used in BillingSection.tsx, BuyerOrders.tsx, and the Wallet sections.

## Reference Design System

```text
DIALOG/MODAL CONTAINER:
+----------------------------------------------------------------+
| bg-white border border-black rounded                           |
| (no gradients, no shadow-2xl, no rounded-2xl)                  |
+----------------------------------------------------------------+

MODAL HEADER:
+----------------------------------------------------------------+
| bg-white border-b p-4/p-6                                      |
| Optional: Pink accent bar at top (4px height)                  |
|                                                                |
| [Icon Box] Title                                               |
| bg-[#FF90E8]  text-xl font-semibold text-slate-900            |
+----------------------------------------------------------------+

BUTTONS IN MODALS:
Primary: bg-[#FF90E8] border border-black text-black rounded
         hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]

Secondary: bg-white border border-black text-black rounded
           hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]

Destructive: bg-red-500 border border-black text-white rounded
             hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]

INPUTS IN MODALS:
rounded border-black focus:ring-2 focus:ring-[#FF90E8]/50

SOCIAL SHARE BUTTONS:
border border-black text-black rounded
hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
```

---

## Files to Update

### 1. Core UI Components (Global Changes)

| File | Component | Changes |
|------|-----------|---------|
| `src/components/ui/dialog.tsx` | DialogContent | Update default styles to Gumroad pattern |
| `src/components/ui/alert-dialog.tsx` | AlertDialogContent, Action, Cancel | Standardize button styles |
| `src/components/ui/sheet.tsx` | SheetContent | Update border and background styles |
| `src/components/ui/popover.tsx` | PopoverContent | Standardize popover styling |
| `src/components/ui/confirm-dialog.tsx` | ConfirmDialog | Update icon container and button styles |

### 2. Seller Components

| File | Component | Changes |
|------|-----------|---------|
| `src/components/seller/ShareStoreModal.tsx` | ShareStoreModal | Full redesign to Gumroad style |
| `src/components/seller/SellerSettings.tsx` | Sheet modals | Update sheet styling and buttons |
| `src/components/seller/SellerMarketing.tsx` | Discount dialog | Standardize dialog styling |

### 3. Marketplace Components

| File | Component | Changes |
|------|-----------|---------|
| `src/components/marketplace/QuickViewModal.tsx` | QuickViewModal | Update dialog container and buttons |
| `src/components/marketplace/GuestPaymentModal.tsx` | GuestPaymentModal | Remove gradients, update button styles |
| `src/components/marketplace/GumroadQuickViewModal.tsx` | GumroadQuickViewModal | Standardize container styling |

### 4. Dashboard Components

| File | Component | Changes |
|------|-----------|---------|
| `src/components/dashboard/SellerChatModal.tsx` | SellerChatModal | Remove emerald gradients, use pink accents |
| `src/components/dashboard/AIAccountsSection.tsx` | Detail modals | Standardize modal styling |
| `src/components/dashboard/BuyerWallet.tsx` | Withdraw & Add Account dialogs | Already Gumroad style (verify) |
| `src/components/seller/SellerWallet.tsx` | Withdraw & Add Account dialogs | Already Gumroad style (verify) |

### 5. Store Components

| File | Component | Changes |
|------|-----------|---------|
| `src/components/store/ProductDetailModal.tsx` | ProductDetailModal | Update button styles and container |
| `src/pages/Store.tsx` | Login Modal | Standardize dialog styling |

### 6. Admin Components

| File | Component | Changes |
|------|-----------|---------|
| `src/components/admin/AdminCoupons.tsx` | Create Dialog | Update from slate-900 to white bg with borders |
| `src/components/admin/ResellersManagement.tsx` | Seller Details Dialog | Standardize styling |

---

## Detailed Changes

### File 1: `src/components/ui/dialog.tsx`

**DialogContent (Lines 30-51)**

```text
BEFORE:
className="... border bg-background ... sm:rounded-lg"

AFTER:
className="... border border-black bg-white ... rounded"
```

**DialogClose Button (Line 45)**

```text
BEFORE:
className="absolute right-4 top-4 rounded-sm opacity-70..."

AFTER:
className="absolute right-4 top-4 rounded p-1 border border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

### File 2: `src/components/ui/alert-dialog.tsx`

**AlertDialogContent (Lines 28-43)**

```text
BEFORE:
className="... border bg-background ... sm:rounded-lg"

AFTER:
className="... border border-black bg-white ... rounded"
```

**AlertDialogAction (Lines 72-77)**

```text
BEFORE:
className={cn(buttonVariants(), className)}

AFTER:
className={cn(
  "bg-[#FF90E8] border border-black text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  className
)}
```

**AlertDialogCancel (Lines 80-89)**

```text
BEFORE:
className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}

AFTER:
className={cn(
  "border border-black bg-white text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  "mt-2 sm:mt-0",
  className
)}
```

### File 3: `src/components/ui/sheet.tsx`

**SheetContent (Lines 31-48)**

```text
BEFORE:
"fixed z-50 gap-4 bg-background p-6 shadow-lg transition..."

AFTER:
"fixed z-50 gap-4 bg-white p-6 border-black transition..."
```

**sheetVariants sides:**

```text
BEFORE:
- left: "... border-r ..."
- right: "... border-l ..."
- top: "... border-b ..."
- bottom: "... border-t ..."

AFTER:
- left: "... border-r border-black ..."
- right: "... border-l border-black ..."
- top: "... border-b border-black ..."
- bottom: "... border-t border-black ..."
```

**SheetClose Button (Line 60)**

```text
BEFORE:
className="absolute right-4 top-4 rounded-sm opacity-70..."

AFTER:
className="absolute right-4 top-4 rounded p-1 border border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

### File 4: `src/components/ui/popover.tsx`

**PopoverContent (Lines 10-26)**

```text
BEFORE:
className="z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md..."

AFTER:
className="z-50 w-72 rounded border border-black bg-white p-4 text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]..."
```

### File 5: `src/components/ui/confirm-dialog.tsx`

**Icon Container (Lines 48-55)**

```text
BEFORE:
className={cn(
  "w-14 h-14 rounded-full flex items-center justify-center",
  variant === "destructive"
    ? "bg-red-100 dark:bg-red-500/20"
    : "bg-blue-100 dark:bg-blue-500/20"
)}

AFTER:
className={cn(
  "w-14 h-14 rounded border border-black flex items-center justify-center",
  variant === "destructive"
    ? "bg-red-100"
    : "bg-[#FF90E8]"
)}
```

**AlertDialogAction (Lines 83-90)**

```text
BEFORE:
className={cn(
  "flex-1",
  variant === "destructive" &&
    "bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
)}

AFTER:
className={cn(
  "flex-1 border border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  variant === "destructive"
    ? "bg-red-500 text-white"
    : "bg-[#FF90E8] text-black"
)}
```

### File 6: `src/components/seller/ShareStoreModal.tsx`

**DialogContent (Lines 91, 119)**

```text
BEFORE:
className="max-w-md"

AFTER:
className="max-w-md p-0 overflow-hidden border border-black"
```

**Header with Pink Accent Bar (Lines 92-99, 120-127)**

```text
BEFORE:
<DialogHeader>
  <DialogTitle className="flex items-center gap-2">
    <Share2 className="w-5 h-5 text-violet-600" />

AFTER:
{/* Pink accent bar */}
<div className="h-1 bg-[#FF90E8]" />
<DialogHeader className="p-6 pb-0">
  <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
    <div className="w-8 h-8 rounded border border-black bg-[#FF90E8] flex items-center justify-center">
      <Share2 className="w-4 h-4 text-black" />
    </div>
```

**Empty State Icon (Lines 102-104)**

```text
BEFORE:
<div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
  <Sparkles className="w-8 h-8 text-amber-500" />

AFTER:
<div className="w-16 h-16 rounded border border-black bg-[#FF90E8] flex items-center justify-center mx-auto mb-4">
  <Sparkles className="w-8 h-8 text-black" />
```

**Got it Button (Line 108)**

```text
BEFORE:
<Button onClick={() => onOpenChange(false)} variant="outline">

AFTER:
<button 
  onClick={() => onOpenChange(false)} 
  className="px-4 py-2 border border-black rounded text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
>
```

**Store URL Input (Lines 135-151)**

```text
BEFORE:
<Input
  value={storeUrl || ''}
  readOnly
  className="text-sm bg-slate-50"
/>
<Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">

AFTER:
<input
  value={storeUrl || ''}
  readOnly
  className="flex-1 px-3 py-2 text-sm border border-black rounded bg-white"
/>
<button 
  onClick={handleCopy}
  className="shrink-0 p-2 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
>
```

**Preview Button (Lines 156-163)**

```text
BEFORE:
<Button variant="outline" className="w-full" onClick={...}>

AFTER:
<button
  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-black rounded text-black font-medium hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
  onClick={...}
>
```

**Social Share Buttons (Lines 169-193)**

```text
BEFORE:
<Button
  variant="outline"
  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-sky-50 hover:border-sky-200"
>

AFTER:
<button
  onClick={() => handleShare('twitter')}
  className="flex flex-col items-center gap-2 h-auto py-4 border border-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
>
```

**QR Code Container (Lines 210-217)**

```text
BEFORE:
<div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">

AFTER:
<div className="flex justify-center p-4 bg-white rounded border border-black">
```

**Native Share Button (Lines 223-229)**

```text
BEFORE:
<Button
  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"

AFTER:
<button
  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF90E8] border border-black rounded text-black font-semibold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

### File 7: `src/components/marketplace/GuestPaymentModal.tsx`

**DialogContent (Lines 334-335)**

```text
BEFORE:
className="sm:max-w-lg bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden..."

AFTER:
className="sm:max-w-lg bg-white border border-black rounded p-0 overflow-hidden..."
```

**Header (Lines 336-346)**

```text
BEFORE:
<div className="bg-gradient-to-br from-pink-50 to-purple-50 p-5 border-b border-black/5">
  ...
  <div className="p-2 bg-pink-500 rounded-lg">
    <ShoppingBag className="w-5 h-5 text-white" />
  </div>

AFTER:
<div className="h-1 bg-[#FF90E8]" />
<div className="bg-white p-5 border-b">
  ...
  <div className="p-2 bg-[#FF90E8] border border-black rounded">
    <ShoppingBag className="w-5 h-5 text-black" />
  </div>
```

**Payment Method Buttons (Lines 377-404)**

```text
BEFORE:
className={`p-3 rounded-xl border-2 transition-all text-center ${
  selectedMethod === method.code
    ? 'border-pink-500 bg-pink-50'
    : 'border-black/10 hover:border-black/20'
}`}

AFTER:
className={`p-3 rounded border-2 transition-all text-center ${
  selectedMethod === method.code
    ? 'border-black bg-[#FF90E8]'
    : 'border-black/30 hover:border-black'
}`}
```

**Email Input (Lines 426-436)**

```text
BEFORE:
className={`w-full px-4 py-3 border-2 rounded-xl ... ${
  emailError
    ? 'border-red-300 focus:border-red-500'
    : 'border-black/10 focus:border-pink-500'
}`}

AFTER:
className={`w-full px-4 py-3 border rounded ... ${
  emailError
    ? 'border-red-500'
    : 'border-black focus:ring-2 focus:ring-[#FF90E8]/50'
}`}
```

**Submit Button (end of file)**

```text
BEFORE:
className="w-full py-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold"

AFTER:
className="w-full py-4 rounded bg-[#FF90E8] border border-black text-black font-semibold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

### File 8: `src/components/dashboard/SellerChatModal.tsx`

**DialogContent (Line 131)**

```text
BEFORE:
className="bg-white border-gray-200 max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden"

AFTER:
className="bg-white border border-black rounded max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden"
```

**Header (Lines 133-145)**

```text
BEFORE:
<div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">

AFTER:
<div className="h-1 bg-[#FF90E8]" />
<div className="p-4 border-b bg-white">
  <div className="w-10 h-10 rounded border border-black bg-[#FF90E8] flex items-center justify-center">
```

**Send Button (Lines 197-206)**

```text
BEFORE:
className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl..."

AFTER:
className="px-4 py-3 bg-[#FF90E8] border border-black disabled:bg-gray-200 disabled:border-gray-300 text-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all..."
```

**Message Bubbles (Lines 166-179)**

```text
BEFORE:
msg.sender_type === 'buyer'
  ? 'bg-emerald-500 text-white rounded-br-md'
  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'

AFTER:
msg.sender_type === 'buyer'
  ? 'bg-[#FF90E8] border border-black text-black rounded-br-none'
  : 'bg-white border border-black text-black rounded-bl-none'
```

### File 9: `src/components/marketplace/QuickViewModal.tsx`

**DialogContent (Line 476)**

```text
BEFORE:
className="max-w-2xl p-4 overflow-hidden bg-white border-black/10"

AFTER:
className="max-w-2xl p-4 overflow-hidden bg-white border border-black rounded"
```

**Buy Button (Lines 298-309, 413-424)**

```text
BEFORE:
className="flex-1 rounded-xl bg-black hover:bg-black/90 text-white text-xs h-11"

AFTER:
className="flex-1 rounded bg-[#FF90E8] border border-black text-black font-medium text-xs h-11 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

**Chat Button (Lines 289-296, 428-436)**

```text
BEFORE:
className="flex-1 rounded-xl border-2 border-black text-black hover:bg-black hover:text-white text-xs h-11"

AFTER:
className="flex-1 rounded border border-black bg-white text-black font-medium text-xs h-11 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

### File 10: `src/components/store/ProductDetailModal.tsx`

**DialogContent (around Line 550)**

```text
BEFORE:
className="max-w-3xl p-4 overflow-hidden bg-white border-black/10"

AFTER:
className="max-w-3xl p-4 overflow-hidden bg-white border border-black rounded"
```

**Buy Button (Lines 455-466)**

```text
BEFORE:
className="w-full h-11 bg-black hover:bg-black/90 text-white font-semibold rounded-lg mb-3"

AFTER:
className="w-full h-11 bg-[#FF90E8] border border-black text-black font-semibold rounded mb-3 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

**Chat Button (Lines 470-477)**

```text
BEFORE:
className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-3"

AFTER:
className="w-full h-10 rounded border border-black bg-white text-black font-medium mb-3 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
```

---

## Summary of Unified Styling

| Element | Unified Style |
|---------|---------------|
| Dialog container | `bg-white border border-black rounded` |
| Dialog header | `bg-white border-b` + optional pink accent bar |
| Icon boxes in headers | `bg-[#FF90E8] border border-black rounded` |
| Primary buttons | `bg-[#FF90E8] border border-black text-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` |
| Secondary buttons | `bg-white border border-black text-black rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` |
| Destructive buttons | `bg-red-500 border border-black text-white rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` |
| Inputs in modals | `border border-black rounded focus:ring-2 focus:ring-[#FF90E8]/50` |
| Close buttons | `border border-transparent hover:border-black hover:shadow-[2px_2px_0px]` |
| Sheet borders | `border-black` (all sides) |
| Popovers | `border border-black bg-white rounded` |

---

## Color Palette (Consistent Across All Modals)

| Color | Usage |
|-------|-------|
| `#FF90E8` | Primary accent, icon boxes, primary buttons, hover states |
| `#FFF5FB` | Light pink tint for backgrounds |
| `black` | Borders, text |
| `white` | Modal backgrounds |
| `slate-900` | Heading text |
| `slate-600` | Body text |
| `red-500` | Destructive actions |

---

## Typography (Inter Font)

| Element | Style |
|---------|-------|
| Modal Title | `text-xl font-semibold text-slate-900` |
| Modal Description | `text-sm text-slate-600` |
| Labels | `text-sm font-medium text-slate-700` |
| Button Text | `font-medium` or `font-semibold` |

---

## Files Count: 10 Core Files

1. `src/components/ui/dialog.tsx`
2. `src/components/ui/alert-dialog.tsx`
3. `src/components/ui/sheet.tsx`
4. `src/components/ui/popover.tsx`
5. `src/components/ui/confirm-dialog.tsx`
6. `src/components/seller/ShareStoreModal.tsx`
7. `src/components/marketplace/GuestPaymentModal.tsx`
8. `src/components/dashboard/SellerChatModal.tsx`
9. `src/components/marketplace/QuickViewModal.tsx`
10. `src/components/store/ProductDetailModal.tsx`

Additional files with minor updates:
- `src/components/marketplace/GumroadQuickViewModal.tsx`
- `src/components/seller/SellerSettings.tsx`
- `src/components/admin/AdminCoupons.tsx`
- `src/pages/Store.tsx`
