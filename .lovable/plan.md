

## Reorganize Buyer Dashboard Sidebar -- Group Items Under "Insights" and "Activity"

### What Changes

The flat list of 11 nav items will be reorganized into core items at the top plus **two collapsible dropdown groups**, matching the seller sidebar pattern.

### Current Layout (flat)
```text
Home
Marketplace
My Orders
Wishlist
Prompts
Analytics
Billing
Wallet
Recently Viewed
My Reviews
My Services
---
Notifications
Support
Settings
```

### New Layout (grouped)
```text
Home
Marketplace
My Orders
Wishlist
Prompts
---
Insights (dropdown)
  - Analytics
  - My Reviews
  - Recently Viewed
  - Billing
---
Activity (dropdown)
  - Wallet
  - My Services
  - Notifications
---
Support
Settings
```

### Technical Details (File: `src/components/dashboard/DashboardSidebar.tsx`)

**1. Split `navItems` into three parts:**
- `coreNavItems`: Home, Marketplace, My Orders, Wishlist, Prompts (stay as flat items)
- `insightsSubItems`: Analytics, My Reviews, Recently Viewed, Billing
- `activitySubItems`: Wallet, My Services, Notifications

**2. Add collapsible state:**
- `insightsOpen` and `activityOpen` state variables (with `useState`)

**3. Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`** from `@/components/ui/collapsible`

**4. Render two collapsible sections** after the core items using the same pattern as the seller sidebar -- collapsed mode shows tooltip icons, expanded mode shows chevron header with indented sub-items.

**5. Update `bottomNavItems`** to only contain Support and Settings (Notifications moves into the Activity group).

**6. Keep Support as standalone** in the bottom section alongside Settings.

This is a single-file change to `src/components/dashboard/DashboardSidebar.tsx` only. No route or component changes needed.

