

# Redesign: Seller Products Section -- Gumroad-Style, Text/Icon-Based, No Images

## Overview
Remove the 2 decorative images (`gumroad-banner.png`, `gumroad-comic.png`) and replace everything with a clean, premium Gumroad-style design using only icons, text, and black-based typography. Redesign left and right panels with richer card layouts and more functional labels.

---

## Changes

### 1. Remove Images, Replace with Icon/Text Design

**Remove:**
- `gumroad-banner.png` (line 518) -- replace with a styled text banner card: black background, white bold heading "Your Products", subtitle with product count, and a decorative icon pattern
- `gumroad-comic.png` (line 792) -- replace with an icon-based "Store Health" card using large stat numbers and premium typography

**New Banner (replaces image):**
- Black card with white text: "Your Products" (24px bold), "{count} products in your store" subtitle
- Right side: decorative Package icon cluster (semi-transparent)
- Small action pills: "X Live", "X Pending" inline

**New Default Right Panel (replaces comic image):**
- Icon-based welcome card with ShoppingBag icon, "Select a product" text, and quick-tip bullets

### 2. Black-Base Typography System

Apply across ALL text in the section:
- Headings: `text-black font-bold` (not slate-500/900)
- Labels: `text-black/60` (semi-transparent black instead of slate-400/500)
- Values/Numbers: `text-black font-extrabold`
- Accents: Keep pink-500 for active states and CTAs only
- Card borders: `border-black/10` (Gumroad style)
- Section headers: `text-black/40 uppercase tracking-widest text-[10px] font-bold`

### 3. Left Panel -- Gumroad Card Design

Redesign each section as distinct Gumroad-style cards:

**Quick Stats Card:**
- White card, `border-black/10`, no shadow
- Stats in a single column list (not 2x2 grid) with icon + label on left, bold number on right
- Each row separated by thin `border-black/5` divider
- Revenue row highlighted with black background pill

**Status Filters Card:**
- Each filter as a full-width row with dot indicator (colored circle) + label + count
- Active state: black background, white text (Gumroad toggle style)
- Inactive: transparent with `text-black/60`

**Category Card:**
- Minimal list, each category as `text-black/50` with count badge
- Active: underline style, `text-black font-bold`

**Sort Card:**
- Dropdown with black border, `text-black` values
- Bulk select button: black outline, `text-black`

**Recently Edited Card:**
- Product mini-rows with small square thumbnail placeholder (black/5 bg if no image), name in `text-black text-xs font-medium`, and a small arrow icon

### 4. Product Grid Cards -- Gumroad Label System

**Bottom Info Bar redesign:**
- Remove gradient overlay, use a clean white bar at bottom
- Status: small dot (green/amber/red) + label in `text-black/50 text-[10px]`
- Price: `text-black font-extrabold text-sm` on right side
- Sales count: `text-black/40 text-[10px]` inline

**Product Type Badge:**
- Top-left: black pill with white icon + white text (e.g., black bg "Course" pill)
- Replaces the colored type badges

**Hover Overlay:**
- Keep dark overlay but use Gumroad pink accent for primary action (Edit)
- Other actions: white/transparent buttons with black text

**Category Tags below card:**
- `text-black/30` with no background, just plain text separated by " / "

### 5. Right Panel -- Command Center Gumroad Style

**When product selected:**

**Preview Card:**
- White card, `border-black/10`
- "Buyer Preview" label in `text-black/30 uppercase text-[10px]`
- Product card renderer below

**Actions List:**
- Vertical list, each action as a full-width row:
  - Icon (black) + Label (`text-black font-medium text-sm`) + description (`text-black/40 text-xs`)
  - Separated by `border-black/5`
  - Hover: `bg-black/5`
- Actions: Edit, Duplicate, Copy Link, View Store, Analytics, Share

**Stats Card:**
- Clean rows: label in `text-black/50`, value in `text-black font-bold`
- Sparkline chart with black bars (not colored)
- Conversion rate with black text

**Danger Zone:**
- `border-red-500/20` card
- Buttons: red text, no fill, hover red background

**When no product selected:**

**Store Summary Card:**
- Large stat numbers in `text-black font-extrabold text-2xl`
- Labels below in `text-black/40 text-xs`
- Layout: 2-column mini stat grid

**Top Performing Card:**
- Black left-border accent card
- Product name in `text-black font-bold`, sales in `text-black/50`

**Needs Attention Card:**
- Amber left-border accent card
- Issue label as pill: "Low Stock" or "0 Sales" in `text-black/50`

**Placeholder (no products):**
- Clean icon + text, no dashed border, just centered `text-black/30`

### 6. Edit Sheet -- Black Typography

- All labels: `text-black font-semibold`
- Sub-labels: `text-black/40`
- Input borders: `border-black/10`
- Section headers (SEO, Delivery, Card Appearance): `text-black font-bold`
- Collapsible icons: `text-black/40`
- Save button: keep pink gradient
- Draft button: `border-black/10 text-black`

---

## Technical Details

### File Modified
- **`src/components/seller/SellerProducts.tsx`** -- Full styling overhaul

### Key Changes
1. Remove `import gumroadBanner` and `import gumroadComic` (lines 2-3)
2. Replace banner image (line 517-519) with text/icon banner component
3. Replace comic image (line 791-793) with icon-based stats card
4. Update all `text-slate-*` classes to `text-black` / `text-black/XX` opacity variants
5. Update all `border-slate-*` to `border-black/10`
6. Update all `bg-slate-50` to `bg-black/[0.02]` (very subtle Gumroad style)
7. Change type badges from colored to black pill style
8. Change status dots from colored badges to minimal dot + text
9. Update hover states to use `bg-black/5` instead of `bg-slate-50`

### No New Dependencies
All changes are CSS/styling only within the existing component structure.

