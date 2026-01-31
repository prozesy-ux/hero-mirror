

# Marketplace Search & Logo Enhancement Plan

## Overview

This plan addresses 5 improvements across the marketplace and store search experience:

1. **New Logo**: Replace the current logo with the uploaded transparent-background version
2. **Logo Sizing**: Increase logo size for better visibility
3. **Search Bar Full Width**: Expand search bar to take more horizontal space
4. **Voice Search Fix**: Address microphone not working
5. **Search Box Design**: Unified, premium search design across all locations

## Files to Modify

| File | Changes |
|------|---------|
| `src/assets/uptoza-logo-new.png` | Copy uploaded logo to project |
| `src/components/marketplace/GumroadHeader.tsx` | New logo, bigger size, full-width search, improved design |
| `src/pages/Store.tsx` | Improved search bar design matching marketplace |
| `src/components/dashboard/AIAccountsSection.tsx` | Improved search bar design |
| `src/components/marketplace/VoiceSearchButton.tsx` | Better visibility and click area |

## Visual Design Target

```text
BEFORE (Current Header):
┌─────────────────────────────────────────────────────────────────────────┐
│ [Small Logo]  [──────── Search (max-w-2xl) ────────]  [EN] [$] [Login] │
└─────────────────────────────────────────────────────────────────────────┘

AFTER (New Header):
┌─────────────────────────────────────────────────────────────────────────┐
│ [BIGGER LOGO]   [─────────────── Full Width Search ───────────────────] │
│    h-12          Voice/Image icons more prominent, better styling       │
│                 [EN] [$] [Login] [Sell] (compact right section)         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Copy New Logo to Project

Copy the uploaded transparent logo to `src/assets/uptoza-logo-new.png` and use ES6 import for proper bundling.

### 2. GumroadHeader.tsx - Major Updates

**Logo Changes:**
```tsx
// Import the new transparent logo
import uptozaLogo from '@/assets/uptoza-logo-new.png';

// Increase size from h-10 to h-12
<img 
  src={uptozaLogo} 
  alt="Uptoza" 
  className="h-12 w-auto"
/>
```

**Search Bar Full Width:**
```tsx
// Change from max-w-2xl to max-w-4xl for more width
<form className="hidden md:flex flex-1 max-w-4xl items-stretch relative">
```

**Improved Search Container Styling:**
```tsx
<div className="flex-1 flex items-stretch bg-white rounded-xl border-2 border-black/15 overflow-hidden focus-within:border-black/40 focus-within:ring-2 focus-within:ring-black/10 focus-within:shadow-lg transition-all">
  ...
</div>
```

**Voice Search Button - More Visible:**
```tsx
<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
  <VoiceSearchButton
    isListening={isListening}
    isSupported={voiceSupported}
    error={null}
    onStart={startListening}
    onStop={stopListening}
    className="h-8 w-8 opacity-70 hover:opacity-100"  // Larger, more visible
  />
  <ImageSearchButton
    onSearchResult={(result) => onSearchChange(result)}
    className="h-8 w-8 opacity-70 hover:opacity-100"
  />
</div>
```

### 3. Voice Search Fix

The voice search hook is correctly implemented. The issue is likely:
1. Browser permissions not granted
2. Not on HTTPS (required for microphone)
3. Button too small/invisible

**VoiceSearchButton.tsx Updates:**
- Increase default size from tiny icon to visible button
- Add clear visual feedback when listening
- Show error state more prominently
- Make button more accessible with larger click area

```tsx
// Make button larger and more visible
<Button
  type="button"
  variant={isListening ? 'default' : 'ghost'}
  size={size}
  onClick={isListening ? onStop : onStart}
  className={cn(
    'transition-all duration-200 min-w-[32px] min-h-[32px]',
    isListening && 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
    !isListening && 'text-black/50 hover:text-black hover:bg-black/5',
    error && 'text-red-500',
    className
  )}
>
```

### 4. Store.tsx - Search Bar Enhancement

Match the marketplace design:
```tsx
// Update search container styling
<div className="flex items-stretch bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 focus-within:shadow-md transition-all">
  ...
</div>

// Make voice button more visible
<VoiceSearchButton
  isListening={isListening}
  isSupported={voiceSupported}
  error={voiceError}
  onStart={startListening}
  onStop={stopListening}
  className="h-9 w-9 text-slate-500 hover:text-slate-700"
/>
```

### 5. AIAccountsSection.tsx - Dashboard Marketplace Search

Same improvements:
```tsx
// Improved search container
<div className="flex-1 flex items-stretch bg-white rounded-xl border-2 border-gray-200 overflow-hidden focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 focus-within:shadow-md transition-all">
  ...
</div>

// Larger, more visible voice/image buttons
<VoiceSearchButton
  isListening={isListening}
  isSupported={voiceSupported}
  error={voiceError}
  onStart={startListening}
  onStop={stopListening}
  className="h-9 w-9"
/>
```

## Unified Search Design Specs

| Element | Style |
|---------|-------|
| Container | `rounded-xl border-2 border-black/15` |
| Focus State | `focus-within:border-black/40 focus-within:shadow-lg` |
| Input Padding | `pl-12 pr-28 py-3.5` (room for icons) |
| Voice Button | `h-9 w-9 min-w-[36px]` (larger click area) |
| Image Button | `h-9 w-9 min-w-[36px]` |
| Search Icon | `absolute left-4 w-5 h-5` |
| Submit Button | `bg-black text-white px-6 font-semibold` |

## Voice Search Troubleshooting

The current implementation is correct, but users may experience issues because:

1. **HTTPS Required**: Voice API only works over secure connections (your preview URLs are HTTPS, so this should be fine)
2. **Browser Permissions**: User must grant microphone access when prompted
3. **Browser Support**: Works in Chrome, Edge, Safari - may not work in Firefox

The fix focuses on making the button:
- More visible (larger size)
- Better feedback when active (red pulsing)
- Clear error state display

## Summary

| Change | Description |
|--------|-------------|
| New Logo | Transparent background, ES6 import |
| Logo Size | `h-10` → `h-12` |
| Search Width | `max-w-2xl` → `max-w-4xl` |
| Search Style | `rounded-xl`, thicker border, shadow on focus |
| Voice Button | Larger (h-9 w-9), better visibility, clear states |
| Image Button | Same size increase |
| Consistency | Same design across GumroadHeader, Store, AIAccountsSection |

