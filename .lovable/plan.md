
# Prompts Section Tab Redesign - Match Marketplace Design

## Overview

Redesign the Prompts section (`/dashboard/prompts`) tab navigation to match the clean, premium Gumroad-style tabs used in the Marketplace section (`/dashboard/marketplace`).

## Current State vs Target State

| Element | Prompts (Current) | Marketplace (Target) |
|---------|-------------------|----------------------|
| Tab Container | White card with border, rounded-2xl, p-1.5, shadow-md | Simple border-b divider, no container box |
| Active Tab | bg-gray-900 text-white, rounded-xl, shadow-lg (pill style) | text-black, border-b-2 border-black (underline style) |
| Inactive Tab | text-gray-500 hover:bg-gray-100 | text-black/50 hover:text-black |
| Search Position | Inside tab bar container | Separate from tabs (below tabs in browse view) |
| Tab Spacing | gap-1 lg:gap-2 | gap-6 |

## Visual Comparison

### Current Prompts Tabs:
```text
┌──────────────────────────────────────────────────────────────┐
│ ┌────────────┐ ┌──────────┐ ┌───────┐ ┌────────────┐ [🔍]    │
│ │█ Prompts   │ │ Trending │ │ Saved │ │ Categories │         │
│ └────────────┘ └──────────┘ └───────┘ └────────────┘         │
└──────────────────────────────────────────────────────────────┘
  ↑ Pill-style tabs inside boxed container
```

### Target (Marketplace Style):
```text
  Browse         Purchases         Stats
    ▔▔▔▔▔▔                                    
─────────────────────────────────────────────
  ↑ Clean underline tabs with border-b divider
```

## What Will Be Done

### 1. Tab Navigation Redesign (PromptsGrid.tsx)

**Replace the boxed pill-style tabs with Gumroad-style underline tabs:**

Current (lines 401-484):
```tsx
<div className="bg-white rounded-2xl p-1.5 lg:p-2 mb-4 lg:mb-8 border border-gray-200 shadow-md">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
    <div className="flex gap-1 lg:gap-2 overflow-x-auto hide-scrollbar">
      <button className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm ${
        activeTab === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}>
```

New design:
```tsx
<div className="mb-6 border-b border-black/10">
  <div className="flex gap-6 overflow-x-auto hide-scrollbar">
    <button className={`pb-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
      activeTab === 'all' ? 'text-black border-b-2 border-black' : 'text-black/50 hover:text-black'
    }`}>
```

### 2. Updated Tab Buttons

**Browse Prompts Tab:**
```tsx
<button 
  onClick={() => setActiveTab('all')} 
  className={`pb-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
    activeTab === 'all' 
      ? 'text-black border-b-2 border-black' 
      : 'text-black/50 hover:text-black'
  }`}
>
  <Layers size={16} />
  <span>Prompts</span>
</button>
```

**Trending Tab:**
```tsx
<button 
  onClick={() => setActiveTab('trending')} 
  className={`pb-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
    activeTab === 'trending' 
      ? 'text-black border-b-2 border-black' 
      : 'text-black/50 hover:text-black'
  }`}
>
  <TrendingUp size={16} />
  <span>Trending</span>
  {trendingPrompts.length > 0 && (
    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
      activeTab === 'trending' ? 'bg-black text-white' : 'bg-black/10 text-black/70'
    }`}>
      {trendingPrompts.length}
    </span>
  )}
</button>
```

**Saved Tab:**
```tsx
<button 
  onClick={() => setActiveTab('saved')} 
  className={`pb-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
    activeTab === 'saved' 
      ? 'text-black border-b-2 border-black' 
      : 'text-black/50 hover:text-black'
  }`}
>
  <Bookmark size={16} />
  <span>Saved</span>
  {favoritePrompts.length > 0 && (
    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
      activeTab === 'saved' ? 'bg-black text-white' : 'bg-black/10 text-black/70'
    }`}>
      {favoritePrompts.length}
    </span>
  )}
</button>
```

**Categories Tab:**
```tsx
<button 
  onClick={() => setActiveTab('categories')} 
  className={`pb-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
    activeTab === 'categories' 
      ? 'text-black border-b-2 border-black' 
      : 'text-black/50 hover:text-black'
  }`}
>
  <FolderOpen size={16} />
  <span>Categories</span>
</button>
```

### 3. Move Search Bar

Move search from inside tab container to a separate search section (like marketplace):
- Add a premium search bar below tabs for the "all" tab view
- Style matching marketplace: `border-2 border-black/15 rounded-xl`

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/PromptsGrid.tsx` | Redesign tab navigation to match marketplace underline style |

## Technical Implementation

### PromptsGrid.tsx Changes (lines 401-485):

1. **Remove boxed container** - Replace `bg-white rounded-2xl p-1.5 border shadow-md` with `mb-6 border-b border-black/10`

2. **Update tab button styling**:
   - Remove: `px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold`
   - Add: `pb-3 font-medium text-sm transition-colors`
   - Active: `text-black border-b-2 border-black`
   - Inactive: `text-black/50 hover:text-black`

3. **Update icon sizes** - Change from `size={14}` to `size={16}` for consistency

4. **Update badge styling** - Match marketplace badge colors (black/white instead of gray)

5. **Move search box** - From inside tab container to dedicated search section below tabs

6. **Update spacing** - Change `gap-1 lg:gap-2` to `gap-6` for cleaner separation

## Summary

- **Tab style**: Clean underline tabs matching marketplace (border-b-2 border-black)
- **Container**: Simple border-bottom divider (no boxed container)
- **Colors**: Black text active, black/50 inactive (high contrast)
- **Search**: Moved to separate section below tabs
- **Badges**: Black/white theme matching marketplace
- **Result**: Consistent Gumroad-style design across dashboard sections
