
# Unified Search Bar with Trending Searches for Both Dashboards

## Overview

Implement a modern, premium search bar design (inspired by the reference image - dark rounded pill with search button) across both Buyer and Seller dashboard headers. When clicked, the search bar will display a dropdown showing trending/popular searches, using the existing `useSearchSuggestions` hook infrastructure.

## Design Reference

The reference image shows a clean search bar with:
- White/light background pill-shaped container
- Placeholder text: "Search by role, skills, or keywords"
- Right-aligned dark "Search" button with search icon
- Optional: Green/lime accent color

## Current State

| Component | Current Search Design |
|-----------|----------------------|
| `DashboardTopBar.tsx` | Simple input with `border-black`, expands on focus, no suggestions |
| `SellerTopBar.tsx` | Simple input with `border-black`, no suggestions |
| `GumroadHeader.tsx` | Full implementation with scope selector, voice/image search, and `MarketplaceSearchSuggestions` |

## Proposed Design

A unified premium search bar matching the reference image style:

```text
+---------------------------------------------------------------+
|  [Search icon] Search products, orders...     [Mic] [Cam] Search  |
+---------------------------------------------------------------+
                           |
                           v (on focus)
+---------------------------------------------------------------+
| Popular Searches                                              |
| ─────────────────────────────────────────────────────────────|
| [TrendingUp] AI chatbot developer for support automation      |
| [TrendingUp] Creative director for a brand identity refresh   |
| [TrendingUp] Data analyst for churn modeling                  |
| [TrendingUp] Video and motion editor for promo content        |
+---------------------------------------------------------------+
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardTopBar.tsx` | Replace simple search with premium search bar + suggestions |
| `src/components/seller/SellerTopBar.tsx` | Replace simple search with premium search bar + suggestions |
| `src/components/dashboard/DashboardSearchBar.tsx` | **NEW** - Shared search bar component for both dashboards |

---

## Technical Implementation

### Step 1: Create Shared Dashboard Search Bar Component

Create a new reusable component that both dashboards will use:

**File: `src/components/dashboard/DashboardSearchBar.tsx`**

Features:
- Pill-shaped container with white background and subtle border
- Left-aligned search icon
- Placeholder text: "Search products, orders..."
- Right-aligned voice/image search buttons (h-9 w-9)
- Dark "Search" button on the right
- Integration with `useSearchSuggestions` hook for trending data
- Dropdown panel showing:
  - "Popular Searches" header
  - Trending items with TrendingUp icons
  - Recent searches (if user has search history)
  - Products/sellers matches (when typing)

```typescript
// Component structure
interface DashboardSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

// Uses existing hooks:
// - useSearchSuggestions() for suggestions data
// - useVoiceSearch() for voice input
// - SearchContext for global state sync
```

### Step 2: Update DashboardTopBar.tsx

Replace lines 194-213 (current search bar) with the new `DashboardSearchBar` component:

**Before (current):**
```tsx
<div className={`relative w-64 transition-all duration-300 ${isSearchFocused ? 'w-80' : ''}`}>
  <div className={`relative flex items-center bg-white rounded border border-black ...`}>
    <Search size={16} className="absolute left-3 text-slate-400" />
    <input ... />
  </div>
</div>
```

**After:**
```tsx
<DashboardSearchBar 
  placeholder="Search products, prompts..." 
  className="w-80" 
/>
```

### Step 3: Update SellerTopBar.tsx

Replace lines 162-174 (current search bar) with the new `DashboardSearchBar` component:

**Before (current):**
```tsx
<div className={`relative transition-all duration-200 ${searchFocused ? 'w-80' : 'w-64'}`}>
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <input ... placeholder="Search products, orders..." ... />
</div>
```

**After:**
```tsx
<DashboardSearchBar 
  placeholder="Search products, orders..." 
  className="w-80" 
/>
```

---

## Component Design Specifications

### Search Bar Container
- Background: `bg-white`
- Border: `border border-black/15` (subtle, not harsh black)
- Border radius: `rounded-full` (pill shape)
- Hover/Focus: `focus-within:border-black/40 focus-within:shadow-md`
- Width: `w-80` (fixed, cleaner than expanding)

### Search Button (Right side)
- Background: `bg-[#151515]` (dark, matching reference)
- Hover: `hover:bg-[#222]`
- Text: White, font-semibold
- Icon + "Search" text
- Border radius: `rounded-full` (right side of pill)

### Voice & Image Buttons
- Size: `h-8 w-8`
- Style: Ghost, subtle hover
- Positioned inside input area, before Search button
- Use existing `VoiceSearchButton` and `ImageSearchButton` components

### Suggestions Dropdown
- Position: Below search bar, full width match
- Background: `bg-white`
- Border: `border border-black/10`
- Shadow: `shadow-lg`
- Sections:
  - "Popular Searches" with TrendingUp icons
  - Recent searches with Clock icons
  - Products/sellers when typing

---

## Import Updates

### DashboardTopBar.tsx
```typescript
// Remove these (no longer needed for simple search):
// - isSearchFocused state
// - X icon for clear button

// Add:
import { DashboardSearchBar } from './DashboardSearchBar';
```

### SellerTopBar.tsx
```typescript
// Remove:
// - searchFocused state
// - searchQuery state
// - X icon import

// Add:
import { DashboardSearchBar } from '../dashboard/DashboardSearchBar';
```

---

## Visual Comparison

### Current Design
```text
┌──────────────────────────────────────┐
│ 🔍 Search...                      ✕  │  <- Simple, black border
└──────────────────────────────────────┘
```

### New Design (Reference-Inspired)
```text
┌───────────────────────────────────────────────────────────────┐
│  🔍 Search products, orders...          🎤 📷 │ 🔍 Search │  │
└───────────────────────────────────────────────────────────────┘
                            ↓ (on click)
┌───────────────────────────────────────────────────────────────┐
│  Popular Searches                                             │
│  ──────────────────────────────────────────────────────────── │
│  📈 AI chatbot developer for support automation               │
│  📈 Creative director for brand identity                      │
│  📈 Data analyst for churn modeling                          │
│  📈 Video editor for promo content                           │
└───────────────────────────────────────────────────────────────┘
```

---

## Existing Components to Reuse

| Component | Usage |
|-----------|-------|
| `useSearchSuggestions` | Fetch trending/recent/product suggestions |
| `useVoiceSearch` | Voice input functionality |
| `VoiceSearchButton` | Voice search UI |
| `ImageSearchButton` | Image search UI |
| `MarketplaceSearchSuggestions` | Dropdown UI (may adapt for dashboard context) |
| `SearchContext` | Global search state sync |

---

## Summary of Changes

1. **Create** `DashboardSearchBar.tsx` - New shared component with premium design
2. **Update** `DashboardTopBar.tsx` - Replace simple search, remove redundant state
3. **Update** `SellerTopBar.tsx` - Replace simple search, remove redundant state
4. **Reuse** existing search suggestion infrastructure from marketplace

This approach ensures both dashboards have identical, modern search UX with trending searches visible on focus, maintaining consistency with the design system while leveraging existing hooks.
