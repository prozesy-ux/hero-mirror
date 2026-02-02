

# Remove Redundant Tabs from Marketplace Section & Enhance Orders with Approval Status

## Summary

The user wants to:
1. **Remove** "Browse", "Purchases", and "Stats" tabs from the AIAccountsSection (dashboard marketplace)
2. **Remove** the purchases feature since it's already handled in `/dashboard/orders`
3. **Add** Approved/Unapproved status filter to the BuyerOrders section

---

## Current State Analysis

### AIAccountsSection.tsx (Dashboard Marketplace)
Currently has 4 tabs:
- **Browse** - Product browsing with sidebar and filters
- **Purchases** - Shows purchased items (lines 1648-1845)
- **Stats** - Shows purchase statistics (lines 1847-1887)
- **Chat** - Support chat (lines 1889-1931)

### BuyerOrders.tsx
- Already has status tabs: All, Pending, Delivered, Completed, Cancelled
- Has `buyer_approved` field in the Order interface
- Missing: "Approved" and "Unapproved" filter tabs

---

## Implementation Plan

### Part 1: Clean Up AIAccountsSection.tsx

**Remove tabs and simplify to just "Browse" functionality:**

| Line Range | Change |
|------------|--------|
| Line 154 | Change `TabType = 'browse' | 'purchases' | 'stats' | 'chat'` to just `'browse'` |
| Lines 1097-1114 | Remove the entire tab navigation section (no tabs needed if only Browse exists) |
| Lines 1648-1845 | Remove entire "My Purchases Tab" section |
| Lines 1847-1887 | Remove entire "Stats Tab" section |
| Lines 1889-1931 | Keep or move Chat functionality (already exists separately) |

**After cleanup:** The AIAccountsSection becomes purely a product browsing section without duplicate purchase/stats features.

---

### Part 2: Enhance BuyerOrders.tsx with Approval Status

**Add "Approved" and "Unapproved" filter tabs:**

```text
Before: All | Pending | Delivered | Completed | Cancelled
After:  All | Pending | Delivered | Approved | Unapproved | Completed | Cancelled
```

#### Changes Required:

**1. Add new stats calculations (around line 216):**
```tsx
const stats = useMemo(() => ({
  total: orders.length,
  pending: orders.filter(o => o.status === 'pending').length,
  delivered: orders.filter(o => o.status === 'delivered').length,
  completed: orders.filter(o => o.status === 'completed').length,
  approved: orders.filter(o => o.buyer_approved === true).length,      // NEW
  unapproved: orders.filter(o => o.buyer_approved === false && o.status !== 'pending').length, // NEW
  totalSpent: orders.reduce((sum, o) => sum + o.amount, 0)
}), [orders]);
```

**2. Add new status filter values (around line 247):**
```tsx
// Add approval filter logic
const matchesStatus = statusFilter === 'all' || 
  order.status === statusFilter ||
  (statusFilter === 'approved' && order.buyer_approved === true) ||
  (statusFilter === 'unapproved' && order.buyer_approved === false && order.status !== 'pending');
```

**3. Add new tabs to the Status Tabs section (lines 529-559):**
```tsx
{ value: 'approved', label: 'Approved', count: stats.approved },
{ value: 'unapproved', label: 'Unapproved', count: stats.unapproved },
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/dashboard/AIAccountsSection.tsx` | Remove Purchases tab, Stats tab, and tab navigation UI |
| `src/components/dashboard/BuyerOrders.tsx` | Add Approved/Unapproved filter tabs with counts |

---

## Visual Result

### AIAccountsSection (After)
- No tabs visible
- Just the product browsing grid with sidebar filters
- Clean, single-purpose component

### BuyerOrders (After)
```text
┌──────────────────────────────────────────────────────────────────┐
│ Status Tabs:                                                     │
│ ┌─────┐ ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐   │
│ │ All │ │ Pending │ │ Delivered │ │ Approved │ │ Unapproved │   │
│ └─────┘ └─────────┘ └───────────┘ └──────────┘ └────────────┘   │
│ ┌───────────┐ ┌───────────┐                                      │
│ │ Completed │ │ Cancelled │                                      │
│ └───────────┘ └───────────┘                                      │
└──────────────────────────────────────────────────────────────────┘
```

Users can now:
- Filter orders by approval status
- See count badges for approved/unapproved orders
- Quick access to orders that need approval action

---

## Technical Details

### Approval Logic
- **Approved**: `buyer_approved === true` (buyer confirmed delivery)
- **Unapproved**: `buyer_approved === false` AND `status !== 'pending'` (delivered but not yet confirmed)

This excludes pending orders from "unapproved" since they haven't been delivered yet.

