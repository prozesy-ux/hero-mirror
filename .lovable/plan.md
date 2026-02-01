

# Dashboard Marketplace Quick View Modal Redesign

## Overview

Replace the old inline Quick View Modal in `AIAccountsSection.tsx` with a new design that matches the store's `ProductDetailModal.tsx` - featuring black/monochrome aesthetic, mobile drawer layout, and trust badges.

## Current State (Old Design)

The inline modal in `AIAccountsSection.tsx` (lines 2025-2133) has:
- Green emerald store badges
- Green checkmark price badges (`bg-emerald-100 text-emerald-700`)
- Yellow "Buy" button (`bg-yellow-400`)
- 3-column button layout (Chat, View, Buy)
- No mobile drawer experience
- No trust badges

## Target Design (Store Modal Style)

Match the `ProductDetailModal.tsx` design:
- Black/white monochrome aesthetic
- Black price badge with white text
- Black action buttons
- Mobile-first vertical stack with sticky bottom actions
- Desktop: horizontal split layout
- Trust badges (Secure, Instant, 24/7)
- Image gallery with dot navigation

## Visual Comparison

### Current (Old):
```text
+------------------+
| [Green Badge]  X |
| Product Image    |
+------------------+
| Title            |
| [Green Price]    |
| Description...   |
+------------------+
| [Chat][View][Buy]| <- Yellow Buy
+------------------+
```

### After (New - Mobile):
```text
+--------------------+
| Image (280px)      |
| < dots >           |
+--------------------+
| [Avatar] Seller    |
|         100 orders |
+--------------------+
| Title              |
| [$25] ★★★★★ (12)  | <- Black price badge
+--------------------+
| [Tag1] [Tag2]      |
+--------------------+
| Description...     |
| Stats bar          |
+--------------------+
| [Chat] [Buy Now]   | <- Sticky black buttons
+--------------------+
```

### After (New - Desktop):
```text
+--------------------------------------+
| +------------------+ +--------------+|
| | Image Gallery    | | [$25]        ||
| |   (65%)          | | [Buy Now]    || <- Black buttons
| |                  | | [Chat]       ||
| +------------------+ | Trust Badges ||
|                      +--------------+|
| Title + Seller + Description         |
+--------------------------------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AIAccountsSection.tsx` | Replace inline Quick View Modal with new store-matching design |

## Implementation Details

### 1. Add New Imports
```typescript
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BadgeCheck, ShieldCheck, Zap, Clock, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import StarRating from '@/components/reviews/StarRating';
import { useIsMobile } from '@/hooks/use-mobile';
```

### 2. Add Review Stats Fetching
Add `averageRating` and `reviewCount` state with fetch logic similar to `ProductDetailModal`.

### 3. Replace Modal Content

**Mobile Layout (Drawer-based):**
- 280px image container with dot navigation
- Seller info in `bg-black/5` rounded box
- Black price badge: `bg-black text-white`
- Sticky bottom action bar with Chat + Buy Now

**Desktop Layout (Dialog):**
- 65/35 horizontal split
- Left: Image gallery with thumbnails
- Right: Sticky purchase box with black buttons
- Trust badges: Secure, Instant, 24/7
- View Full Details button

### 4. Styling Changes

| Element | Old | New |
|---------|-----|-----|
| Store Badge | `bg-emerald-500` | `bg-black/80 text-white` |
| Price Badge | `bg-emerald-100 text-emerald-700` | `bg-black text-white rounded` |
| Buy Button | `bg-yellow-400` | `bg-black text-white` |
| Chat Button | `bg-emerald-100`/`bg-violet-100` | `border-2 border-black` outline |
| View Button | `bg-gray-100` | Move to View Full Details |

### 5. Key UI Components

**Image Gallery Navigation:**
```typescript
// Dot indicators
<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
  {images.map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentImageIndex(i)}
      className={`w-2 h-2 rounded-full ${
        i === currentImageIndex ? 'bg-black' : 'bg-white border border-black/20'
      }`}
    />
  ))}
</div>
```

**Trust Badges:**
```typescript
<div className="flex flex-wrap gap-1.5">
  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
    <ShieldCheck size={10} />
    <span>Secure</span>
  </div>
  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
    <Zap size={10} />
    <span>Instant</span>
  </div>
  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
    <Clock size={10} />
    <span>24/7</span>
  </div>
</div>
```

**Sticky Mobile Actions:**
```typescript
<div className="flex gap-2 px-4 pb-4 sticky bottom-0 bg-white pt-2 border-t border-black/10 safe-area-bottom">
  <Button
    variant="outline"
    onClick={handleChat}
    className="flex-1 rounded-xl border-2 border-black text-black hover:bg-black hover:text-white h-11"
  >
    <MessageCircle className="w-4 h-4 mr-1.5" />
    Chat
  </Button>
  <Button
    onClick={handleBuy}
    className="flex-1 rounded-xl bg-black hover:bg-black/90 text-white h-11"
  >
    <ShoppingCart className="w-4 h-4 mr-1.5" />
    Buy Now
  </Button>
</div>
```

## Summary

- Replace old green/yellow Quick View Modal with black/white monochrome design
- Add mobile drawer experience with sticky bottom actions
- Desktop uses 65/35 horizontal split like store modal
- Add trust badges (Secure, Instant, 24/7)
- Add image gallery with dot navigation
- Add seller info box with avatar
- Add star ratings display
- Consistent 44px touch targets for mobile

