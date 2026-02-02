

# Fix Seller Dashboard Issues - Dropdown, Layering, and Navigation

## Issues to Fix

Based on analyzing the code, here are the problems identified:

| Issue | Cause | Fix |
|-------|-------|-----|
| Discount dropdown not auto-open | Collapsible state not initialized properly based on active route | Auto-expand if any discount item is active |
| Dropdown appearing under content | z-index conflicts with sidebar (both z-50) | Increase dropdown z-index to z-[100] |
| Inventory appears under wrong section | Visual confusion when Discount section is collapsed | Ensure Discount always defaults open |
| Sidebar not visible | `hidden lg:flex` is correct for desktop-only | No change needed (working as designed) |
| Scrollbar issues | `overflow-y-auto` without custom styling | Add cleaner scrollbar or hide it |

---

## File Changes

### 1. `src/components/seller/SellerSidebar.tsx`

**Fix Discount dropdown auto-expand based on active route:**

```tsx
// Line 72: Change initial state logic
const isDiscountActive = discountItems.some(item => isActive(item.to));
const [discountOpen, setDiscountOpen] = useState(true);

// Use useEffect to keep it open when a discount page is active
useEffect(() => {
  if (isDiscountActive) {
    setDiscountOpen(true);
  }
}, [location.pathname]);
```

**Add higher z-index to prevent layering issues:**

```tsx
// Line 126: Increase z-index from z-50 to z-[60]
className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-[60] bg-black...`}
```

**Improve scrollbar styling:**

```tsx
// Line 142: Add custom scrollbar classes
<nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
```

---

### 2. `src/components/seller/SellerTopBar.tsx`

**Ensure TopBar has lower z-index than sidebar:**

```tsx
// Line 171: Keep z-40 (lower than sidebar z-60)
className={`fixed top-0 right-0 h-16 bg-[#FBF8F3] border-b border-black/10 z-40...`}
```

---

### 3. `src/components/ui/dropdown-menu.tsx`

**Increase z-index for all dropdowns to appear above everything:**

```tsx
// Line 63-64: Change z-50 to z-[100]
className={cn(
  "z-[100] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md...",
  className,
)}
```

---

### 4. `src/components/ui/collapsible.tsx` (if needed)

Verify the Collapsible component is working correctly with `open` and `onOpenChange` props.

---

## Visual Fix Explanation

**Before (Current Issue):**
```text
┌──────────────┐
│ Analytics    │  <- z-50
├──────────────┤
│ [Dropdown]   │  <- z-50 (same level, appears behind)
└──────────────┘
```

**After (Fixed):**
```text
┌──────────────┐
│ Analytics    │  <- z-40 (TopBar)
├──────────────┤
│ Sidebar      │  <- z-60 (higher)
├──────────────┤
│ [Dropdown]   │  <- z-100 (highest, always visible)
└──────────────┘
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `SellerSidebar.tsx` | Add useEffect to auto-expand Discount when active, increase z-index to z-[60], improve scrollbar styling |
| `SellerTopBar.tsx` | Confirm z-40 (no change needed) |
| `dropdown-menu.tsx` | Increase z-index from z-50 to z-[100] |

---

## Technical Notes

- The Discount section uses Radix UI's `Collapsible` component which works with controlled state (`open`/`onOpenChange`)
- The `useLocation` hook already tracks the current path, so we add a `useEffect` to keep Discount expanded when on a discount page
- Increasing z-index hierarchy ensures proper layering: Content (base) < TopBar (z-40) < Sidebar (z-60) < Dropdowns (z-100)
- Scrollbar styling uses Tailwind's scrollbar utilities for a cleaner look

