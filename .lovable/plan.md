
# Gumroad Icons Implementation for Seller and Buyer Dashboard Sidebars

## Overview

Replace all Lucide React icons in both dashboard sidebars with your custom Gumroad SVG icons hosted on Supabase storage.

## Your Uploaded Icons (11 SVG Files)

| File Number | URL |
|-------------|-----|
| 5 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952887708-5.svg` |
| 6 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952888337-6.svg` |
| 7 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952888975-7.svg` |
| 8 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952889656-8.svg` |
| 9 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952890290-9.svg` |
| 10 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952890922-10.svg` |
| 11 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952891544-11.svg` |
| 12 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952892170-12.svg` |
| 13 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952892822-13.svg` |
| 14 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952893447-14.svg` |
| 15 | `https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad/1769952894054-15.svg` |

## Current Menu Items Requiring Icons

### Seller Sidebar (13 main + 2 bottom = 15 items)

| # | Menu Item | Current Lucide Icon | Needs Icon |
|---|-----------|---------------------|------------|
| 1 | Home | `Home` | Yes |
| 2 | Products | `Package` | Yes |
| 3 | Sales | `ShoppingCart` | Yes |
| 4 | Customers | `Users` | Yes |
| 5 | Flash Sales | `Zap` | Yes |
| 6 | Analytics | `BarChart2` | Yes |
| 7 | Insights | `TrendingUp` | Yes |
| 8 | Payouts | `CreditCard` | Yes |
| 9 | Emails | `Mail` | Yes |
| 10 | Inventory | `Warehouse` | Yes |
| 11 | Reports | `FileText` | Yes |
| 12 | Performance | `Activity` | Yes |
| 13 | Chat | `MessageSquare` | Yes |
| 14 | Settings | `Settings` | Yes |
| 15 | Help | `HelpCircle` | Yes |
| + | Collapse | `ChevronLeft/Right` | Keep Lucide |
| + | Dropdown | `ChevronDown` | Keep Lucide |

### Buyer Dashboard Sidebar (8 main + 3 bottom = 11 items)

| # | Menu Item | Current Lucide Icon | Needs Icon |
|---|-----------|---------------------|------------|
| 1 | Home | `Home` | Yes |
| 2 | Marketplace | `Store` | Yes |
| 3 | My Orders | `ShoppingCart` | Yes |
| 4 | Wishlist | `Heart` | Yes |
| 5 | Prompts | `Sparkles` | Yes |
| 6 | Analytics | `BarChart2` | Yes |
| 7 | Reports | `FileText` | Yes |
| 8 | Wallet | `CreditCard` | Yes |
| 9 | Notifications | `Bell` | Yes |
| 10 | Support | `MessageSquare` | Yes |
| 11 | Settings | `Settings` | Yes |
| + | Collapse | `ChevronLeft/Right` | Keep Lucide |
| + | Dropdown | `ChevronDown` | Keep Lucide |

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/icons/GumroadIcons.tsx` | **Create** | Constants file with all SVG icon URLs |
| `src/components/seller/SellerSidebar.tsx` | **Modify** | Replace Lucide icons with img tags |
| `src/components/dashboard/DashboardSidebar.tsx` | **Modify** | Replace Lucide icons with img tags |

## Implementation Approach

### Step 1: Create Icon Constants File

Create a central file that maps icon names to their Supabase storage URLs:

```typescript
// src/components/icons/GumroadIcons.tsx

const GUMROAD_ICON_BASE = 'https://anpeyqpnsavhykstwwbq.supabase.co/storage/v1/object/public/images/gumroad';

export const GUMROAD_ICONS = {
  home: `${GUMROAD_ICON_BASE}/1769952887708-5.svg`,
  products: `${GUMROAD_ICON_BASE}/1769952888337-6.svg`,
  sales: `${GUMROAD_ICON_BASE}/1769952888975-7.svg`,
  customers: `${GUMROAD_ICON_BASE}/1769952889656-8.svg`,
  flashSales: `${GUMROAD_ICON_BASE}/1769952890290-9.svg`,
  analytics: `${GUMROAD_ICON_BASE}/1769952890922-10.svg`,
  insights: `${GUMROAD_ICON_BASE}/1769952891544-11.svg`,
  payouts: `${GUMROAD_ICON_BASE}/1769952892170-12.svg`,
  emails: `${GUMROAD_ICON_BASE}/1769952892822-13.svg`,
  inventory: `${GUMROAD_ICON_BASE}/1769952893447-14.svg`,
  reports: `${GUMROAD_ICON_BASE}/1769952894054-15.svg`,
  // If more icons needed, we'll map them
};

// Reusable icon component
interface GumroadIconProps {
  src: string;
  size?: number;
  className?: string;
  alt?: string;
}

export const GumroadIcon: React.FC<GumroadIconProps> = ({ 
  src, 
  size = 20, 
  className = '',
  alt = 'icon' 
}) => (
  <img 
    src={src} 
    alt={alt}
    width={size} 
    height={size} 
    className={`${className} flex-shrink-0`}
    style={{ filter: 'var(--icon-filter, none)' }}
  />
);
```

### Step 2: Update Seller Sidebar

Modify `SellerSidebar.tsx` to use the Gumroad icons:

```typescript
// Before
import { Home, Package, ShoppingCart, ... } from 'lucide-react';

const navItems = [
  { to: '/seller', icon: Home, label: 'Home', exact: true },
  ...
];

// After
import { GUMROAD_ICONS, GumroadIcon } from '@/components/icons/GumroadIcons';

const navItems = [
  { to: '/seller', iconSrc: GUMROAD_ICONS.home, label: 'Home', exact: true },
  { to: '/seller/products', iconSrc: GUMROAD_ICONS.products, label: 'Products' },
  ...
];

// Render
<GumroadIcon 
  src={item.iconSrc} 
  size={20} 
  className={active ? 'brightness-0 invert' : 'opacity-80'} 
/>
```

### Step 3: Update Buyer Dashboard Sidebar

Apply the same changes to `DashboardSidebar.tsx` with buyer-appropriate icons.

## Icon Color Handling

Since SVG files loaded via `<img>` cannot have their fill/stroke changed with CSS, we'll use CSS filters:

```text
Seller Sidebar (dark theme):
- Normal state: white/gray icons -> filter: brightness(0) invert(1) opacity(0.8)
- Active state: pink icons -> filter: brightness(0) saturate(100%) invert(75%) sepia(50%) saturate(1000%) hue-rotate(300deg)

Buyer Sidebar (light theme):
- Normal state: gray icons -> filter: brightness(0) opacity(0.6)
- Active state: violet icons -> filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(240deg)
```

## Clarification Needed

Before implementation, please confirm which icon file maps to which menu item:

```text
Icon File 5  -> ?
Icon File 6  -> ?
Icon File 7  -> ?
Icon File 8  -> ?
Icon File 9  -> ?
Icon File 10 -> ?
Icon File 11 -> ?
Icon File 12 -> ?
Icon File 13 -> ?
Icon File 14 -> ?
Icon File 15 -> ?
```

You can either:
1. Tell me the mapping (e.g., "5 = Home, 6 = Products, 7 = Sales...")
2. Or I can use logical ordering and you can adjust after seeing the result

## Summary

- Create central icon constants file with all Supabase storage URLs
- Replace Lucide icon imports in both sidebars with GumroadIcon component
- Use CSS filters to handle active/inactive color states
- Keep Lucide for chevron arrows (collapse/dropdown) as they work well
- Both sidebars will have consistent Gumroad aesthetic icons
