

## Reorganize Seller Sidebar -- Group Items Under "Insights" and "Performance"

### What Changes

The flat list of items after Sales/Customers/Analytics/Payouts will be reorganized into **two collapsible dropdown groups**, matching the existing "Products" dropdown pattern.

### Current Layout (flat)
```text
Home
Products (dropdown)
Sales
Customers
Analytics
Payouts
---
Insights        (flat)
Reviews         (flat)
Refunds         (flat)
Reports         (flat)
Performance     (flat)
Notifications   (flat)
Chat            (flat)
Security        (flat)
Services        (flat)
```

### New Layout (grouped)
```text
Home
Products (dropdown)
Sales
Customers
Analytics
Payouts
---
Insights (dropdown)
  - Product Analytics
  - Reviews
  - Refunds
  - Notifications
  - Reports
---
Performance (dropdown)
  - Performance
  - Security
  - Services
---
Chat
---
Settings
Help
```

### Technical Details (File: `src/components/seller/SellerSidebar.tsx`)

**1. Replace the flat `navItemsAfterDiscount` array with two new grouped arrays:**

- `insightsSubItems`: Insights (product-analytics), Reviews, Refunds, Notifications, Reports
- `performanceSubItems`: Performance, Security, Services

**2. Add two new collapsible state variables:**
- `insightsOpen` (like `productsOpen`)
- `performanceOpen`

**3. Render two new `<Collapsible>` sections** using the exact same pattern as the existing Products dropdown (collapsed = tooltip icons, expanded = collapsible with chevron and indented sub-items).

**4. Keep Chat as a standalone item** between the two groups and the bottom section.

**5. Remove `navItemsAfterDiscount`** -- its items are now distributed into the two groups plus standalone Chat.

This is a single-file change to `src/components/seller/SellerSidebar.tsx` only. No route or component changes needed.
