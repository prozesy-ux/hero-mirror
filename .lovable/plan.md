
# Unified Premium Search Bar with Wider Width + Dashboard Data Clarity

## Overview

Enhance the search bar design across both Buyer and Seller dashboards with:
1. **Wider search bar** (70% or `flex-1 max-w-3xl` instead of fixed `w-80`)
2. **Same design** as the reference image and GumroadHeader - pill-shaped with dark Search button
3. **Trending/Popular searches dropdown** on focus (already implemented)
4. **Context-aware dashboard data** - Seller sees their products/sales, Buyer sees marketplace data

---

## Part 1: Search Bar Width & Design Enhancement

### Current State
```text
DashboardSearchBar: w-80 (320px) - Fixed, small
```

### New Design (matching reference)
```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🔍 Search products, orders...                         🎤 📷 │ 🔍 Search │     │
└─────────────────────────────────────────────────────────────────────────────────┘
   70% width or flex-1 max-w-3xl (~768px)
```

### Files to Update

#### File 1: `src/components/dashboard/DashboardSearchBar.tsx`

**Changes:**
1. Increase input padding for better text visibility
2. Add taller height (`py-3` instead of `py-2.5`)
3. Ensure proper spacing for buttons inside
4. Make container responsive (`w-full` internally, width controlled by parent)

**Current (line 132):**
```tsx
className="w-full bg-transparent py-2.5 pl-11 pr-36 text-sm..."
```

**Updated:**
```tsx
className="w-full bg-transparent py-3.5 pl-12 pr-36 text-base..."
```

**Search button styling (line 162-168) - Match reference exactly:**
```tsx
// Current
className="absolute right-1 top-1 bottom-1 px-4 bg-[#151515]..."

// Updated - Taller, more prominent
className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-[#151515]..."
```

#### File 2: `src/components/dashboard/DashboardTopBar.tsx`

**Change search bar width from fixed to responsive:**

**Current (line 188-191):**
```tsx
<DashboardSearchBar 
  placeholder="Search products, prompts..." 
  className="w-80" 
/>
```

**Updated:**
```tsx
<DashboardSearchBar 
  placeholder="Search products, prompts..." 
  className="flex-1 max-w-3xl" 
/>
```

#### File 3: `src/components/seller/SellerTopBar.tsx`

**Change search bar width from fixed to responsive:**

**Current (line 161-164):**
```tsx
<DashboardSearchBar 
  placeholder="Search products, orders..." 
  className="w-80" 
/>
```

**Updated:**
```tsx
<DashboardSearchBar 
  placeholder="Search products, orders..." 
  className="flex-1 max-w-3xl" 
/>
```

---

## Part 2: Search Bar Component Height Matching Reference

### Design Specifications (matching reference image)

| Property | Current | Updated |
|----------|---------|---------|
| Input padding Y | `py-2.5` (10px) | `py-3.5` (14px) |
| Input padding left | `pl-11` | `pl-12` (48px for icon) |
| Input text size | `text-sm` | `text-base` |
| Search button padding | `px-4` | `px-6` |
| Search button radius | `rounded-full` | `rounded-full` (keep) |
| Overall height | ~40px | ~52px |

### DashboardSearchBar.tsx Changes

```tsx
// Line 112-118: Container styling
<div
  className={cn(
    "relative flex items-center bg-white rounded-full border-2 transition-all duration-200",
    isOpen 
      ? "border-black/40 shadow-lg" 
      : "border-black/15 hover:border-black/25"
  )}
>

// Line 124-132: Input styling
<input
  ref={inputRef}
  type="text"
  placeholder={placeholder}
  value={localQuery}
  onChange={(e) => setLocalQuery(e.target.value)}
  onFocus={handleFocus}
  onKeyDown={handleKeyDown}
  className="w-full bg-transparent py-3.5 pl-12 pr-40 text-base text-slate-900 placeholder-slate-500 focus:outline-none"
/>

// Line 121: Search icon - slightly larger
<Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />

// Line 146: Voice/Image buttons position
<div className="absolute right-20 flex items-center gap-1.5">

// Line 162-168: Search button
<button
  onClick={handleSearch}
  className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-[#151515] hover:bg-[#222] text-white rounded-full flex items-center gap-2 transition-all text-sm font-semibold"
>
  <Search className="h-4 w-4" />
  Search
</button>
```

---

## Part 3: Dashboard Data Clarity

### Current Issue
The user mentioned confusion about what data is shown. Let's ensure:
- **Seller Dashboard**: Shows THEIR products, sales, orders, reports
- **Buyer Dashboard**: Shows marketplace sections, their orders, wishlist

### Already Correct ✓
Looking at the code:
- `SellerDashboard.tsx`: Uses `useSellerContext()` → Shows seller's own products, orders, wallet
- `BuyerDashboardHome.tsx`: Uses `bffApi.getBuyerDashboard()` → Shows buyer's orders, wishlist, wallet

**No changes needed for data separation** - it's already correctly implemented.

---

## Summary of Changes

| File | Change |
|------|--------|
| `DashboardSearchBar.tsx` | Increase height, padding, icon size, button prominence |
| `DashboardTopBar.tsx` | Change width from `w-80` to `flex-1 max-w-3xl` |
| `SellerTopBar.tsx` | Change width from `w-80` to `flex-1 max-w-3xl` |

---

## Visual Comparison

### Before
```text
┌─────────────────────────────────────────────┐
│ [Logo]  [w-80 search bar]  |  Actions...   │
└─────────────────────────────────────────────┘
         ↑ Small, fixed width
```

### After
```text
┌────────────────────────────────────────────────────────────────────┐
│ [Logo]  [─────────── 70% width search bar ───────────]  | Actions │
└────────────────────────────────────────────────────────────────────┘
                    ↑ Wider, responsive, taller
```

---

## Technical Details

### DashboardSearchBar.tsx Full Changes

**Lines 112-169 (main container and controls):**

```tsx
{/* Search Bar Container - Pill shaped, TALLER */}
<div
  className={cn(
    "relative flex items-center bg-white rounded-full border-2 transition-all duration-200",
    isOpen 
      ? "border-black/40 shadow-lg" 
      : "border-black/15 hover:border-black/25"
  )}
>
  {/* Search Icon - Larger */}
  <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />

  {/* Input - Taller with more padding */}
  <input
    ref={inputRef}
    type="text"
    placeholder={placeholder}
    value={localQuery}
    onChange={(e) => setLocalQuery(e.target.value)}
    onFocus={handleFocus}
    onKeyDown={handleKeyDown}
    className="w-full bg-transparent py-3.5 pl-12 pr-40 text-base text-slate-900 placeholder-slate-500 focus:outline-none"
  />

  {/* Clear button - Adjusted position */}
  {localQuery && (
    <button
      onClick={clearSearch}
      className="absolute right-[140px] p-1 rounded-full hover:bg-slate-100 transition-colors"
    >
      <X className="h-4 w-4 text-slate-400" />
    </button>
  )}

  {/* Voice & Image Search Buttons - Adjusted position */}
  <div className="absolute right-20 flex items-center gap-1.5">
    <VoiceSearchButton
      isListening={isListening}
      isSupported={voiceSupported}
      error={voiceError}
      onStart={startListening}
      onStop={stopListening}
      className="h-9 w-9"
    />
    <ImageSearchButton
      onSearchResult={handleImageSearchResult}
      className="h-9 w-9"
    />
  </div>

  {/* Search Button - More prominent */}
  <button
    onClick={handleSearch}
    className="absolute right-1.5 top-1.5 bottom-1.5 px-6 bg-[#151515] hover:bg-[#222] text-white rounded-full flex items-center gap-2 transition-all text-sm font-semibold"
  >
    <Search className="h-4 w-4" />
    Search
  </button>
</div>
```
