
# Mobile Navigation Fix - Buyer Dashboard

## Summary of Changes

This plan addresses two issues in the buyer dashboard mobile experience:

1. **Bottom Navigation Bar**: Replace "Wallet" with "Billing" in the mobile bottom nav
2. **Sidebar "Become a Seller"**: Convert from button to simple text link on mobile

---

## Current State

### Bottom Navigation (4 items)
| Position | Current | Icon |
|----------|---------|------|
| 1 | Prompt | Sparkles |
| 2 | Market | ShoppingBag |
| 3 | **Wallet** | Wallet |
| 4 | Chat | MessageSquare |

### Sidebar "Become a Seller"
- Currently: Emerald green button with shadow
- Problem: Takes too much space on mobile, looks like a CTA ad

---

## Proposed Changes

### 1. Bottom Navigation Update

**Before:**
```
[Prompt] [Market] [Wallet] [Chat] [Alerts]
```

**After:**
```
[Prompt] [Market] [Billing] [Chat] [Alerts]
```

**File:** `src/components/dashboard/MobileNavigation.tsx`

**Change:** Line 136
```typescript
// Before
{ to: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },

// After  
{ to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
```

Also add `CreditCard` to imports from lucide-react.

---

### 2. "Become a Seller" Text Link

**Before (Button Style):**
```text
┌────────────────────────────┐
│ ████ Become a Seller ████  │  ← Green button with shadow
└────────────────────────────┘
```

**After (Text Style):**
```text
Want to sell? Become a Seller →   ← Simple text link
```

**File:** `src/components/dashboard/MobileNavigation.tsx`

**Change:** Lines 203-211

```typescript
// Before - Emerald button
<button
  onClick={() => { ... }}
  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm tracking-wide rounded-xl transition-all shadow-lg shadow-emerald-500/25"
>
  Become a Seller
</button>

// After - Simple text link
<button
  onClick={() => { ... }}
  className="w-full text-center py-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
>
  <span className="text-gray-500">Want to sell?</span>{' '}
  <span className="font-medium text-emerald-600 hover:underline">
    Become a Seller →
  </span>
</button>
```

---

## Visual Comparison

### Mobile Bottom Nav

| Before | After |
|--------|-------|
| Wallet icon + "Wallet" label | CreditCard icon + "Billing" label |

### Sidebar Bottom Section

| Before | After |
|--------|-------|
| Large green button | Simple text: "Want to sell? Become a Seller →" |
| Takes visual focus | Subtle, professional |
| Shadow effects | No shadows |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/MobileNavigation.tsx` | 1. Add CreditCard import, 2. Change bottom nav item, 3. Restyle Become a Seller |

---

## Technical Details

### Import Change
```typescript
// Add CreditCard to existing imports
import { 
  Sparkles, ShoppingBag, Wallet, MessageSquare, Bell, Menu, 
  ShoppingCart, Heart, BarChart3, ExternalLink, LayoutDashboard, 
  FileText, User, CreditCard  // Add this
} from 'lucide-react';
```

### Bottom Nav Array Update
```typescript
const bottomNavItems = [
  { to: '/dashboard/prompts', icon: Sparkles, label: 'Prompt' },
  { to: '/dashboard/ai-accounts', icon: ShoppingBag, label: 'Market' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },  // Changed
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
];
```

### Become a Seller Restyle
The button will be converted to a subtle text link that:
- Uses gray/emerald text colors
- Has no background or shadow
- Includes an arrow (→) for affordance
- Maintains click functionality to navigate to `/seller`

---

## Note

The Wallet section will still be accessible from:
- The sidebar menu (hamburger menu items)
- Direct URL navigation to `/dashboard/wallet`

This change only affects the bottom navigation quick-access, replacing it with Billing which is more commonly accessed on mobile.
