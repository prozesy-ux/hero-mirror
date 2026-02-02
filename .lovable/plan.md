
# Seller Dashboard Card Redesign & Navigation Restructuring

## Summary

This plan covers two major changes:
1. **Card Design Update**: Replace heavy neo-brutalist card styling (`border-2 border-black shadow-neobrutalism`) with a cleaner, modern design (`border border-slate-200 rounded-xl hover:shadow-md`) across all Seller Dashboard sections
2. **Navigation Restructuring**: Rename "Emails" to "Discount" and reorganize with Flash Sales and a new Coupons section underneath

---

## Part 1: Navigation Changes

### Sidebar Updates (`SellerSidebar.tsx`)

**Current Structure:**
```
Home
Products
Sales
Customers
Flash Sales  ← Move under Discount
Analytics
Insights
Payouts
Emails       ← Rename to "Discount"
Inventory
Reports
Performance
Chat
```

**New Structure:**
```
Home
Products
Sales
Customers
Analytics
Insights
Payouts
Discount     ← Renamed (was Emails), with sub-items
├── Coupons  ← NEW
└── Flash Sales ← Moved here
Inventory
Reports
Performance
Chat
```

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/seller/SellerSidebar.tsx` | Rename "Emails" → "Discount", add Coupons route, move Flash Sales under Discount group |
| `src/components/seller/SellerMobileNavigation.tsx` | Same navigation structure changes |
| `src/pages/Seller.tsx` | Add route for `/seller/coupons` component |

**New Navigation Item:**
```tsx
{ to: '/seller/coupons', icon: Tag, label: 'Coupons' }
```

**Discount section with collapsible sub-menu:**
- Parent: "Discount" with Percent icon
- Children: "Coupons", "Flash Sales"

---

## Part 2: Card Design Changes

### Current Style (Neo-Brutalist)
```css
border-2 border-black
shadow-neobrutalism
hover:shadow-none hover:translate-x-1 hover:translate-y-1
rounded-lg
```

### New Style (Modern Clean)
```css
border border-slate-200
rounded-xl
shadow-sm
hover:shadow-md hover:border-slate-300
transition-all duration-200
```

---

### Files & Card Updates

#### 1. `SellerDashboard.tsx`

| Line | Current | New |
|------|---------|-----|
| 217-221 | Skeleton `border-2 border-black` | `border border-slate-200` |
| 337-348 | Quick action cards `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm hover:shadow-md` |
| 366-378 | Messages card `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm hover:shadow-md` |
| 381-395 | Export button `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm hover:shadow-md` |
| 401-416 | Completion Rate card `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm` |
| 419-443 | Order Status card `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm` |
| 446-458 | Monthly Comparison `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm` |
| 462-513 | Revenue Chart `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm` |
| 518-545 | Top Products `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm` |
| 548-596 | Recent Orders `border-2 border-black shadow-neobrutalism` | `border border-slate-200 shadow-sm` |

#### 2. `SellerOrders.tsx`

| Line | Element | Change |
|------|---------|--------|
| 310-312 | Loading skeleton | `border border-slate-200` |
| 346-361 | Stats cards | Already clean (`border border-slate-100`) ✓ |
| 495 | Order cards | Already clean (`border border-slate-100`) ✓ |

#### 3. `SellerFlashSales.tsx`

| Line | Element | Change |
|------|---------|--------|
| 268 | Empty state | Already clean (`border-dashed border-slate-200`) ✓ |
| 280-286 | Flash sale cards | Already clean (`rounded-xl border`) ✓ |

#### 4. `SellerMarketing.tsx` (will become Coupons content)

- Rename to `SellerCoupons.tsx` or keep and add redirect
- Ensure card styles use clean design

---

## Part 3: New Coupons Section

Create `src/components/seller/SellerCoupons.tsx`:
- Copy coupon functionality from existing `SellerMarketing.tsx`
- This file already contains discount codes/coupons management
- Rename component to `SellerCoupons`

The existing SellerMarketing.tsx content is already coupon-focused, so we'll:
1. Rename the route from `/seller/marketing` to `/seller/coupons`
2. Update the component name for clarity

---

## Visual Summary

### Before (Neo-Brutalist Cards)
```
┌────────────────────────────────────────┐
│ ██ Heavy black border                  │
│    Offset shadow                       │
│    Shift-on-hover effect               │
└────────────────────────────────────────┘
```

### After (Modern Clean Cards)
```
┌────────────────────────────────────────┐
│ ░░ Subtle slate border                 │
│    Soft shadow on hover                │
│    Smooth transitions                  │
└────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/seller/SellerSidebar.tsx` | Update navItems, add Discount group with Coupons + Flash Sales |
| `src/components/seller/SellerMobileNavigation.tsx` | Mirror sidebar navigation changes |
| `src/components/seller/SellerDashboard.tsx` | Replace all `border-2 border-black shadow-neobrutalism` styles |
| `src/pages/Seller.tsx` | Add `/seller/coupons` route |

---

## Implementation Order

1. **Navigation First**: Update sidebar and mobile nav with new structure
2. **Routes**: Add coupons route pointing to existing SellerMarketing (or renamed component)
3. **Card Styles**: Update SellerDashboard.tsx card designs
4. **Verification**: Ensure all sections load correctly with new styles
