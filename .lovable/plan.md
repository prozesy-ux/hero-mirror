
## Goal
Make the product hover preview always appear perfectly centered on the screen (and not get cut off) no matter where the product card is on the page (top/middle/bottom).

## Why it’s still not working (root cause)
Even though we set `position: fixed` on `HoverCardContent`, Radix HoverCard uses an internal Popper wrapper:

- Radix creates an outer wrapper `<div data-radix-popper-content-wrapper ... style="transform: translate(...)" />`
- That wrapper has a `transform`, and **any parent with `transform` changes how `position: fixed` behaves** (it can behave like it’s fixed relative to that transformed wrapper, not the viewport).
- Result: the preview can be **offset from center** and can get **cut off**, especially when you are near the bottom or after scroll.

So: the issue is not only `side/align` props. It’s the Popper wrapper transform.

## Solution approach (guaranteed center)
Stop using Radix HoverCard/Popper for these “centered preview” product hovers, and replace it with a simple custom hover system that:

- Opens on mouse hover (desktop only)
- Renders the preview using a Portal directly to `document.body`
- Uses a single fixed-position container centered with:
  - `position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);`
- Adds safe sizing so it never gets cut off:
  - `max-width: 95vw`
  - `max-height: 90vh`
  - `overflow: auto`

This avoids all Popper transforms entirely.

## Implementation steps (what I will change)

### 1) Create a reusable “centered hover preview” component
Create a new component (recommended location):
- `src/components/ui/CenteredHoverPreview.tsx`

Behavior:
- Props:
  - `children` (the product card)
  - `content` (the preview UI to show)
  - `openDelay` (default 350–400ms)
  - `closeDelay` (default 150ms)
  - `disabled` (true on mobile)
- Desktop interactions:
  - `onMouseEnter` → start open timer
  - `onMouseLeave` → start close timer
  - Keep open when hovering over the preview itself
  - `Escape` closes
  - Optional: click outside closes (recommended)
- Render:
  - Use `createPortal(content, document.body)`
  - Wrapper: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`
  - Sizing: `w-[700px] max-w-[95vw] max-h-[90vh] overflow-auto`
  - Very high z-index: `z-[9999]`
  - Background must be solid (not transparent): `bg-white`

Why this fixes your complaint:
- No Popper wrapper
- No transform-based offset
- Always centered, always constrained to viewport

### 2) Replace Radix HoverCard usage in marketplace product hover
Update:
- `src/components/marketplace/ProductHoverCard.tsx`

Changes:
- Remove:
  - `HoverCard`, `HoverCardTrigger`, `HoverCardContent` usage
- Wrap the existing `children` and the existing `HoverContent` inside `CenteredHoverPreview`
- Keep the current behavior:
  - Mobile: tap navigates, no hover preview
  - Desktop: hover opens centered preview
  - Clicking the card still navigates (if `navigateOnClick` is true)
  - Buttons inside preview (Buy/Chat) keep working (still use `stopPropagation()`)

### 3) Replace Radix HoverCard usage in store product hover
Update:
- `src/components/store/StoreProductHoverCard.tsx`

Same replacement as marketplace:
- Use `CenteredHoverPreview` for desktop
- Keep mobile behavior unchanged

### 4) Keep `src/components/ui/hover-card.tsx` as-is (or simplify later)
After the above change, the product preview feature will no longer depend on Radix HoverCard positioning.
We can leave `hover-card.tsx` intact for other small hover tooltips in the app.

(Optionally later: we can remove the `fixed-center` hacks because they won’t be used anymore.)

## Acceptance checks (what you should see)
1) Scroll to the very bottom and hover any product card:
   - Preview opens in the exact center (same spot every time)
2) Hover cards at top/middle/bottom:
   - Always same centered position
3) On smaller screens (desktop resized):
   - Preview stays within viewport (no cut off); scroll appears inside the preview if needed
4) Clicking Buy/Chat:
   - Preview does not jump/move
5) Mobile:
   - No hover preview; tap navigates as before

## Files involved
- NEW: `src/components/ui/CenteredHoverPreview.tsx`
- UPDATE: `src/components/marketplace/ProductHoverCard.tsx`
- UPDATE: `src/components/store/StoreProductHoverCard.tsx`

## Risk / trade-offs
- Slightly more custom code, but far more predictable than Popper for a forced-centered preview.
- This change is limited only to the product preview hover system, so it won’t affect other dropdowns/menus/tooltips.

