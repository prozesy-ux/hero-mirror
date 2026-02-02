

# Redesign Order Cards - Cleaner, Modern Layout

## Current Issues

The order cards currently use a heavy neo-brutalist style with:
- Thick black borders (`border-2 border-black`)
- Offset shadow (`shadow-neobrutalism`)
- Separate header row that adds visual clutter
- Too many distinct sections within each card

## New Design Approach

Switch to a clean, minimal card design similar to the existing `OrderCard` component:
- Subtle border (`border border-slate-200`)
- Soft shadow on hover (`hover:shadow-md`)
- Single-row layout with all info together
- No separate header - inline metadata
- Clean rounded corners (`rounded-xl`)

---

## Visual Comparison

**Before (Current):**
```text
┌────────────────────────────────────────────────────────┐
│ Seller: Store | Date: 02 Feb, 2026    Order ID: #XXX   │  <- Heavy black border header
├────────────────────────────────────────────────────────┤
│ [IMG]  Product Name                   ৳12,100          │
│        @StoreName                     12:22 AM         │
│        Quantity: 1                    [Pending] [View] │
└────────────────────────────────────────────────────────┘
```

**After (Clean):**
```text
┌────────────────────────────────────────────────────────┐
│ [IMG]  Product Name                         [Pending]  │
│        Seller: StoreName                               │
│        ৳12,100 • Feb 2, 2026 • #ABC123                 │
│                                                        │
│        [View Details]   [Contact Seller]               │
└────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/dashboard/BuyerOrders.tsx`

**Lines 578-662 - Replace order card structure:**

| Element | Current | New |
|---------|---------|-----|
| Card wrapper | `border-2 border-black shadow-neobrutalism` | `border border-slate-200 hover:shadow-md hover:border-slate-300` |
| Header row | Separate `bg-slate-50 border-b-2` section | Remove entirely |
| Layout | Stacked with header | Single flex container |
| Status badge | Inline with actions | Top-right corner |
| Order ID | In header | Small text under price |
| Date | In header | Inline with price |

**New Card Structure:**
```tsx
<div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
  <div className="flex items-start gap-4">
    {/* Product Image */}
    <img src={...} className="w-14 h-14 rounded-lg object-cover" />
    
    {/* Content */}
    <div className="flex-1 min-w-0">
      {/* Title + Status Row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-900 truncate">{name}</h3>
        {statusBadge}
      </div>
      
      {/* Seller */}
      <p className="text-sm text-slate-500 mt-0.5">Seller: {storeName}</p>
      
      {/* Price, Date, Order ID */}
      <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
        <span className="font-semibold text-slate-900">{price}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">{date}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-400 text-xs">#{orderId}</span>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm">View Details</Button>
      </div>
    </div>
  </div>
</div>
```

**Empty State - Line 572:**
```tsx
// Change from:
className="border-2 border-black shadow-neobrutalism"
// To:
className="border border-slate-200"
```

**Delivery Confirmation Box - Lines 647-660:**
```tsx
// Change from:
className="p-3 bg-blue-50 rounded-xl border border-blue-100"
// To:
className="p-3 bg-blue-50 rounded-lg border border-blue-200"
```

---

## Summary

| Element | Before | After |
|---------|--------|-------|
| Card border | `border-2 border-black` | `border border-slate-200` |
| Shadow | `shadow-neobrutalism` | `hover:shadow-md` |
| Header row | Separate section | Removed |
| Layout | 2-row structure | Single compact row |
| Corner radius | `rounded-lg` | `rounded-xl` |
| Information | Split across header/body | All inline |

This creates a cleaner, more modern card design that's easier to scan and less visually heavy.

