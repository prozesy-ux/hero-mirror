
# Amazon-Style Search Box Redesign Plan

## Current Issues

1. **Search box has too many elements** - Voice, image, clear buttons all inside input
2. **Filters bar scattered** - Price/rating chips mixed with search
3. **Color inconsistency** - Green gradients for price, yellow for rating, violet for tags
4. **Scope selector styling** - Doesn't match Amazon's clean look
5. **No clear visual hierarchy** - Everything looks the same importance

## Design Reference: Amazon Search Bar

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ██ BLACK/DARK HEADER BAR ██████████████████████████████████████████████│
│ ┌─────────────┬────────────────────────────────────────────┬──────────┐│
│ │ All      ▼  │  Search products...                        │ 🔍 Search││
│ └─────────────┴────────────────────────────────────────────┴──────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

## New Design

### Search Box (Amazon-Style)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌────────────┐┌─────────────────────────────────────────────┐┌────────┐ │
│ │ All      ▼ ││ 🔍 Search products, sellers, categories...  ││ Search │ │
│ │ [gray bg]  ││                               [🎤] [📷] [X] ││[black] │ │
│ └────────────┘└─────────────────────────────────────────────┘└────────┘ │
│ bg-white with shadow, rounded-xl border                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Filters Bar (Below Search - Clean Chips)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Filter by:   [Price ▼]   [Rating ▼]   [✓ Verified]   [Clear All]       │
│               [black outline buttons - minimal style]                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Price Filter Sidebar (Black/White Theme)

```text
┌──────────────────────────┐
│ 💰 Price                 │  ← Simple black text header
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │ ●═══════════════○  │  │  ← Black slider track
│  └────────────────────┘  │
│  $0 ────────────── $100+ │
│                          │
│  ┌─────┐ - ┌─────┐       │  ← Min/Max inputs
│  │ Min │   │ Max │       │
│  └─────┘   └─────┘       │
│                          │
│  Quick:                  │
│  ┌─────────┐ ┌──────────┐│
│  │Under $5 │ │Under $10 ││  ← Black outlined chips
│  └─────────┘ └──────────┘│
│  ┌──────────┐ ┌─────────┐│
│  │Under $20 │ │ $20-$50 ││
│  └──────────┘ └─────────┘│
│                          │
│ [Clear]     [Apply]      │  ← Black buttons
└──────────────────────────┘
```

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `AIAccountsSection.tsx` | Restructure search bar layout with Amazon styling |
| `SearchScopeSelector.tsx` | Gray background, cleaner dropdown styling |
| `SearchFiltersBar.tsx` | Black/white theme, minimal chip buttons |
| `PriceFilterSidebar.tsx` | Black/white styling, remove green gradients |
| `RatingFilter.tsx` | Black/white theme, simple star icons |
| `MarketplaceSidebar.tsx` | Clean headers without colored gradients |

### Color Scheme

| Element | Current | New |
|---------|---------|-----|
| Search bar bg | `bg-background` | `bg-white` with `shadow-md` |
| Scope selector | `bg-muted/50` | `bg-gray-100` |
| Search button | None (just icon) | `bg-gray-900 text-white` |
| Filter chips | Multi-colored | `border-gray-300 hover:border-gray-900` |
| Active filter | Green/yellow/blue | `bg-gray-900 text-white` |
| Price header | `from-green-50 to-emerald-50` | `bg-gray-50` |
| Quick filter active | `bg-green-500` | `bg-gray-900` |

### New Search Box Structure

```tsx
{/* Search Container - Amazon Style */}
<div className="flex items-center bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
  {/* Category Dropdown - Left */}
  <div className="px-3 py-2 bg-gray-100 border-r border-gray-200">
    <SearchScopeSelector value={scope} onChange={setScope} />
  </div>
  
  {/* Search Input - Center */}
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input 
      className="w-full pl-10 pr-24 py-3 border-0 focus:ring-0" 
      placeholder="Search products..."
    />
    {/* Action icons inside input */}
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
      <VoiceSearchButton />
      <ImageSearchButton />
      {query && <button onClick={clear}><X /></button>}
    </div>
  </div>
  
  {/* Search Button - Right */}
  <button className="px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800">
    Search
  </button>
</div>
```

### Updated SearchFiltersBar

```tsx
<div className="flex items-center gap-3 mt-3">
  <span className="text-sm text-gray-500">Filter by:</span>
  
  {/* Price Popover */}
  <Button variant="outline" className="border-gray-300 hover:border-gray-900">
    Price {priceActive && '•'}
  </Button>
  
  {/* Rating Popover */}
  <Button variant="outline" className="border-gray-300 hover:border-gray-900">
    Rating {ratingActive && '•'}
  </Button>
  
  {/* Verified Toggle */}
  <Button variant={verified ? 'default' : 'outline'} 
          className={verified ? 'bg-gray-900' : 'border-gray-300'}>
    ✓ Verified
  </Button>
  
  {/* Clear */}
  {hasFilters && (
    <Button variant="ghost" className="text-gray-500">
      Clear All
    </Button>
  )}
</div>
```

### Updated PriceFilterSidebar

```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  {/* Header - Simple */}
  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
      <DollarSign className="w-4 h-4" />
      Price
    </h3>
  </div>
  
  <div className="p-4 space-y-4">
    {/* Slider with black track */}
    <Slider className="[&_[role=slider]]:bg-gray-900 [&_[role=slider]]:border-gray-900" />
    
    {/* Quick filters - black outline chips */}
    <div className="flex flex-wrap gap-2">
      {filters.map((f, i) => (
        <button className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
          active === i 
            ? "bg-gray-900 text-white border-gray-900" 
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
        )}>
          {f.label}
        </button>
      ))}
    </div>
    
    {/* Actions */}
    <div className="flex gap-2 pt-2">
      <Button variant="outline" className="flex-1 border-gray-300">Clear</Button>
      <Button className="flex-1 bg-gray-900 hover:bg-gray-800">Apply</Button>
    </div>
  </div>
</div>
```

## Visual Comparison

### Before (Current)
- Colorful gradients (green, yellow, violet)
- Scope selector attached to input with border
- Filter chips with different colored backgrounds
- Voice/image buttons scattered

### After (Amazon-Style)
- Clean black and white only
- Unified search container with clear sections
- All filter chips use same black/white styling
- Professional e-commerce appearance

## Implementation Steps

1. Update `SearchScopeSelector.tsx` with gray background styling
2. Update `AIAccountsSection.tsx` search bar structure
3. Update `SearchFiltersBar.tsx` with black/white theme
4. Update `PriceFilterSidebar.tsx` removing green gradients
5. Update `RatingFilter.tsx` with minimal styling
6. Update `MarketplaceSidebar.tsx` section headers

## Expected Result

A clean, professional search experience that matches Amazon, Flipkart, and other top e-commerce sites with:
- Instant recognition as a search bar
- Clear visual hierarchy
- Consistent black/white color scheme
- All features (voice, image, filters) properly organized
