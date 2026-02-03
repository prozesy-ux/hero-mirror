
# Profile Section & Mobile Navigation Design Standardization

## Overview

Update **ProfileSection.tsx**, **MobileNavigation.tsx**, and related profile components to match the Gumroad/Neo-brutalism design pattern used in BillingSection.tsx, BuyerOrders.tsx, and Wallet sections. This includes standardizing borders, typography, hover effects, icons, and the mobile navigation to match the buyer dashboard sidebar style.

## Reference Design (from BillingSection/Wallet/Orders)

```text
SECTION CONTAINERS:
+----------------------------------------------------------------+
| bg-white border rounded                                        |
| hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] (on items)        |
+----------------------------------------------------------------+

MENU LIST ITEMS:
+----------------------------------------------------------------+
| p-4 bg-white border-b border-black/10                          |
| hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]                   |
|                                                                |
| [Icon Box]  Label                           [Value] [Chevron]  |
| bg-[#FF90E8] Description                                       |
+----------------------------------------------------------------+

BUTTONS:
bg-[#FF90E8] border border-black text-black
hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
```

---

## Current Issues Found

### 1. ProfileHeader.tsx (Lines 42-128)
**Current:**
```tsx
className="bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 rounded-2xl"
```
**Issues:**
- Uses gradient background (should be clean white with border)
- Uses `rounded-2xl` (should be simple `rounded`)
- Text colors need update for light background

### 2. ProfileSection - Section Containers (Lines 523, 556, 615)
**Current:**
```tsx
className="bg-white rounded-xl border border-gray-200 overflow-hidden"
```
**Issues:**
- Uses `rounded-xl` (should be `rounded`)
- Uses `border-gray-200` (should be `border` for black border)

### 3. SectionHeader.tsx (Lines 8-15)
**Current:**
```tsx
className="px-4 py-3 bg-gray-50"
className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
```
**Issues:**
- Uses `bg-gray-50` (should match Gumroad style)
- Typography needs update

### 4. MenuListItem.tsx (Lines 29-78)
**Current:**
```tsx
className="w-9 h-9 rounded-lg bg-gray-100"
className="border-b border-gray-100"
className="hover:bg-gray-50 active:bg-gray-100"
```
**Issues:**
- Icon box uses `bg-gray-100` (should use `bg-[#FF90E8]`)
- Uses subtle borders (should be more prominent)
- Uses background hover (should use neo-brutalism shadow)

### 5. StatusToggleCard.tsx (Lines 10-45)
**Current:**
```tsx
className="bg-white rounded-xl border border-gray-200 overflow-hidden"
```
**Issues:**
- Uses `rounded-xl` (should be `rounded`)
- Header style needs update

### 6. MobileNavigation - Bottom Bar (Line 163)
**Current:**
```tsx
className="bg-black border-t border-white/20"
```
This is already Gumroad style - **Keep as is**

### 7. MobileNavigation - Notification Dropdown (Lines 291-358)
**Current:**
```tsx
className="text-violet-600" // Mark all read button
className="bg-violet-50/50" // Unread notification
className="bg-violet-500" // Unread dot
```
**Issues:**
- Uses violet colors (should be Gumroad pink `#FF90E8`)

### 8. Sheet/Modal Styling in ProfileSection (Lines 678-1100)
**Current:**
- Uses `rounded-t-2xl` for bottom sheets
- Uses standard button styling
- Uses `bg-gray-50` backgrounds

**Issues:**
- Should use Gumroad pink buttons
- Container styling needs update

---

## Changes Required

### File 1: `src/components/profile/ProfileHeader.tsx`

**Before:**
```tsx
<div className="bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 rounded-2xl">
```

**After:**
```tsx
<div className="bg-white border rounded overflow-hidden">
  {/* Pink accent bar at top */}
  <div className="h-2 bg-[#FF90E8]" />
```

- Replace gradient with clean white + pink accent bar
- Update text colors: `text-white` → `text-slate-900`, `text-white/70` → `text-slate-600`
- Avatar ring: `border-white/90` → `border-black`
- Online badge: Keep `bg-emerald-400`
- PRO badge: `bg-white/20 text-white` → `bg-[#FF90E8] text-black border border-black`
- Remove `rounded-2xl`, use `rounded`

### File 2: `src/components/profile/SectionHeader.tsx`

**Before:**
```tsx
<div className="px-4 py-3 bg-gray-50">
  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
```

**After:**
```tsx
<div className="px-4 py-3 border-b">
  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
```

- Remove `bg-gray-50` (keep white background)
- Add `border-b` for separation
- Update text: `text-xs text-gray-500` → `text-sm text-slate-900`

### File 3: `src/components/profile/MenuListItem.tsx`

**Before:**
```tsx
// Icon box
<div className="w-9 h-9 rounded-lg bg-gray-100">
  <Icon className="w-4 h-4 text-gray-600" />
</div>

// Hover
className="hover:bg-gray-50 active:bg-gray-100"
```

**After:**
```tsx
// Icon box - Gumroad pink
<div className="w-9 h-9 rounded border border-black bg-[#FF90E8] flex items-center justify-center">
  <Icon className="w-4 h-4 text-black" />
</div>

// Hover - Neo-brutalism shadow
className="transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
```

- Icon box: `bg-gray-100 rounded-lg` → `bg-[#FF90E8] rounded border border-black`
- Remove `iconColor` prop logic (all icons now black)
- Hover: `hover:bg-gray-50` → `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- Border: `border-b border-gray-100` → `border-b`

### File 4: `src/components/profile/StatusToggleCard.tsx`

**Before:**
```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
```

**After:**
```tsx
<div className="bg-white border rounded overflow-hidden">
```

- Update container: `rounded-xl border-gray-200` → `rounded`
- Update header to match SectionHeader style

### File 5: `src/components/dashboard/ProfileSection.tsx`

#### Section Containers (Lines 523, 556, 615)
```text
BEFORE: bg-white rounded-xl border border-gray-200 overflow-hidden
AFTER:  bg-white border rounded overflow-hidden
```

#### Sheet Content Buttons (multiple locations)
```text
BEFORE:
<Button onClick={...} className="w-full">
  Save Changes
</Button>

AFTER:
<button 
  onClick={...}
  className="w-full px-4 py-3 bg-[#FF90E8] text-black font-semibold rounded border border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
>
  Save Changes
</button>
```

#### Input Styling in Sheets
```text
BEFORE: className="mt-2"
AFTER:  className="mt-2 rounded border-black focus:ring-2 focus:ring-[#FF90E8]/50"
```

#### Session Cards (Line 967)
```text
BEFORE: bg-emerald-50 border border-emerald-100 / bg-gray-50
AFTER:  bg-white border rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
```

#### 2FA Toggle Cards (Lines 1024, 1056, 1068, 1081)
```text
BEFORE: rounded-xl bg-gray-50 border / bg-emerald-50 border-emerald-100
AFTER:  rounded bg-white border / bg-[#FFF5FB] border border-black (for active)
```

### File 6: `src/components/dashboard/MobileNavigation.tsx`

#### Notification Dropdown Colors (Lines 302-333)
```text
BEFORE:
- "text-violet-600" (Mark all read button)
- "bg-violet-50/50" (unread notification bg)
- "bg-violet-500" (unread dot)
- "text-violet-600" (View all link)

AFTER:
- "text-[#FF90E8]" (Mark all read button)
- "bg-[#FFF5FB]" (unread notification bg)
- "bg-[#FF90E8]" (unread dot)
- "text-black font-medium" (View all link)
```

#### Mobile Navigation already uses Gumroad icons from DashboardSidebar
The icons in lines 141-156 use Lucide icons. Update to use GumroadIcons for consistency:

```text
BEFORE: import { ... LayoutDashboard, ShoppingBag, ... } from 'lucide-react';

AFTER: import {
  GumroadHomeIcon,
  GumroadDiscoverIcon,
  GumroadCheckoutIcon,
  GumroadLibraryIcon,
  GumroadProductsIcon,
  GumroadAnalyticsIcon,
  GumroadPayoutsIcon,
  GumroadSettingsIcon,
  GumroadHelpIcon,
} from './GumroadIcons';
```

Update sidebarNavItems to use Gumroad icons (matching DashboardSidebar):
```tsx
const sidebarNavItems = [
  { to: '/dashboard/home', icon: GumroadHomeIcon, label: 'Home' },
  { to: '/dashboard/marketplace', icon: GumroadDiscoverIcon, label: 'Marketplace' },
  { to: '/dashboard/orders', icon: GumroadCheckoutIcon, label: 'My Orders' },
  { to: '/dashboard/wishlist', icon: GumroadLibraryIcon, label: 'Wishlist' },
  { to: '/dashboard/prompts', icon: GumroadProductsIcon, label: 'Prompts' },
  { to: '/dashboard/analytics', icon: GumroadAnalyticsIcon, label: 'Analytics' },
  { to: '/dashboard/reports', icon: GumroadAnalyticsIcon, label: 'Reports' },
  { to: '/dashboard/wallet', icon: GumroadPayoutsIcon, label: 'Wallet' },
];

const bottomSidebarItems = [
  { to: '/dashboard/notifications', icon: GumroadSettingsIcon, label: 'Notifications' },
  { to: '/dashboard/chat', icon: GumroadHelpIcon, label: 'Support' },
  { to: '/dashboard/profile', icon: GumroadSettingsIcon, label: 'Settings' },
];
```

---

## Summary of Styling Changes

| Element | Before | After |
|---------|--------|-------|
| Profile Header | Gradient `rounded-2xl` | White + pink bar `rounded` |
| Section containers | `rounded-xl border-gray-200` | `border rounded` |
| Section headers | `bg-gray-50 text-gray-500` | `border-b text-slate-900` |
| Menu icon boxes | `bg-gray-100 rounded-lg` | `bg-[#FF90E8] rounded border-black` |
| Menu item hover | `hover:bg-gray-50` | `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| Primary buttons | Default Button | `bg-[#FF90E8] border-black` |
| Inputs | Default | `rounded border-black` |
| Notification colors | Violet | Gumroad pink `#FF90E8` |
| Mobile sidebar icons | Lucide icons | Gumroad SVG icons |

---

## Typography Standardization (Inter Font)

| Element | Style |
|---------|-------|
| Section Headers | `text-sm font-semibold text-slate-900 uppercase` |
| Menu Labels | `text-sm font-medium text-slate-900` |
| Menu Descriptions | `text-xs text-slate-600` |
| Menu Values | `text-sm text-slate-600` |
| Profile Name | `text-xl font-bold text-slate-900` |
| Profile Subtitle | `text-xs text-slate-600` |

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/profile/ProfileHeader.tsx` | Replace gradient with white + pink bar, update text colors |
| `src/components/profile/SectionHeader.tsx` | Remove bg-gray-50, add border-b, update typography |
| `src/components/profile/MenuListItem.tsx` | Pink icon boxes, neo-brutalism hover, remove iconColor |
| `src/components/profile/StatusToggleCard.tsx` | Update container border styling |
| `src/components/dashboard/ProfileSection.tsx` | Update section containers, buttons, inputs, session cards |
| `src/components/dashboard/MobileNavigation.tsx` | Replace violet with pink, use Gumroad icons |

---

## Visual Before/After

**Profile Header Before:**
```text
+----------------------------------------+
| ████████████████████████████████████   |
| █ Gradient violet-purple background █   |
| █ [Avatar] Name           [Pro]    █   |
| █          Member since...         █   |
| ████████████████████████████████████   |
+----------------------------------------+
```

**Profile Header After:**
```text
+----------------------------------------+
| ████████ Pink Bar ██████████████████   |
+----------------------------------------+
| bg-white border rounded                |
| [Avatar]  Name                  [PRO]  |
|  + border  Member since...      pink   |
|                                 badge  |
+----------------------------------------+
```

**Menu Item Before:**
```text
+----------------------------------------+
| [Gray Icon] Label              [>]     |
|    Box     Description                 |
| hover:bg-gray-50                       |
+----------------------------------------+
```

**Menu Item After:**
```text
+----------------------------------------+
| [Pink Icon] Label              [>]     |
|  + border   Description                |
| hover:shadow-[4px_4px_0px_0px_...]      |
+----------------------------------------+
```
