
# Fix Buyer Dashboard Header Overlap

## Problem

The buyer dashboard content is overlapping with the fixed top header. The main content starts at `pt-0` (no top padding), but the header is fixed at the top with `h-16` (64px height). This causes the first section of content to be hidden behind the header.

## Root Cause

In `src/pages/Dashboard.tsx`, the `DashboardContent` component has:
```tsx
<main className={`pb-24 lg:pb-0 pt-0 lg:pt-0 ...`}>
```

The `pt-0 lg:pt-0` removes all top padding, but the `DashboardTopBar` is a fixed element with `h-16` (64px) that sits on top of the page. The content needs top padding equal to the header height to prevent overlap.

## Layout Structure

```text
┌────────────────────────────────────────────────────────┐
│  Sidebar (fixed)  │  TopBar (fixed, h-16 = 64px)       │
│  w-240px          │  top-0, z-50                       │
│                   ├────────────────────────────────────┤
│                   │  Main Content                      │
│                   │  ❌ Currently: pt-0 (overlaps!)     │
│                   │  ✅ Should be: pt-16 (64px padding) │
│                   │                                    │
└───────────────────┴────────────────────────────────────┘
```

## Solution

Add `lg:pt-16` to the main content area so it starts below the fixed header on desktop. Mobile doesn't need this padding since the header is hidden on mobile (`hidden lg:flex`).

### Change in `src/pages/Dashboard.tsx`

**Before (line 40):**
```tsx
<main className={`pb-24 lg:pb-0 pt-0 lg:pt-0 min-h-screen ...`}>
```

**After:**
```tsx
<main className={`pb-24 lg:pb-0 pt-0 lg:pt-16 min-h-screen ...`}>
```

This adds 64px (`pt-16`) top padding on desktop (`lg:` breakpoint) to account for the fixed header height.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Change `lg:pt-0` to `lg:pt-16` in DashboardContent |

## Visual Result

- Desktop: Content will start 64px below the top, exactly where the header ends
- Mobile: No change needed (header is hidden, bottom nav is used instead)
- All dashboard pages (Home, Orders, Wallet, etc.) will be correctly positioned
