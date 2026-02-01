
## What’s happening (why you still see the “150ms timer” problem)
Even though `CenteredHoverPreview` now defaults to `closeDelay = 300`, your **two callers override it back to 150ms**:

- `src/components/marketplace/ProductHoverCard.tsx` → `closeDelay={150}`
- `src/components/store/StoreProductHoverCard.tsx` → `closeDelay={150}`

Also, right now **the close timer starts immediately when the mouse leaves the trigger card** (`handleTriggerMouseLeave`). That can still cause “auto close” if the user’s cursor takes longer than the delay to reach the centered preview.

## Target behavior (best UX)
- Hover card → preview opens
- Move mouse from card toward the centered preview:
  - Preview should NOT start closing just because you left the card
  - Preview should only start closing when you’re on the backdrop (not on preview content), or when you leave the preview content
- Moving around quickly shouldn’t cause open/close flicker loops

## Changes I will make

### 1) Stop overriding `closeDelay` with 150ms in the two product hover components
Update both files to either:
- Remove the `closeDelay` prop entirely (use the component default), or
- Set it to `300` (or slightly higher like `350`)

Files:
- `src/components/marketplace/ProductHoverCard.tsx`
- `src/components/store/StoreProductHoverCard.tsx`

### 2) Change `CenteredHoverPreview` so leaving the trigger card does NOT start the close timer when the preview is already open
This is the core fix for “mouse auto move → it closes too fast”.

Update `handleTriggerMouseLeave` logic:

- Always clear timers
- If preview is NOT open yet (still in openDelay phase):
  - Cancel the pending open (so it doesn’t open after you left)
- If preview IS already open:
  - Do NOT start a close timer here
  - Let the overlay logic control closing:
    - backdrop `onMouseEnter` starts close timer
    - content `onMouseLeave` starts close timer
    - Escape / click backdrop closes immediately

Why this works:
- When the portal is open, the user’s next mouse area is almost always the backdrop or the content; those are the correct places to decide closing behavior.
- This removes the “gap travel penalty” entirely.

File:
- `src/components/ui/CenteredHoverPreview.tsx`

### 3) Optional small polish (if needed after the above)
If you still feel it closes too quickly for some users:
- Increase default `closeDelay` slightly (e.g. `350–450ms`)
- Keep `openDelay` at `350–450ms` so it doesn’t feel “too sensitive”

## Acceptance checks (what you should test)
1) Go to `/marketplace/chatgpt` and hover a product card:
   - Preview opens in center
2) Move mouse from the card to the preview (slowly):
   - Preview should stay open (no auto close)
3) Move mouse away from the preview onto the dark backdrop:
   - Preview closes after the delay (no click required)
4) Move quickly across many cards:
   - No “on/off/on/off” flicker loop
5) Verify same behavior in Store pages (where `StoreProductHoverCard` is used)

## Files involved
- `src/components/ui/CenteredHoverPreview.tsx` (logic update)
- `src/components/marketplace/ProductHoverCard.tsx` (remove/adjust closeDelay prop)
- `src/components/store/StoreProductHoverCard.tsx` (remove/adjust closeDelay prop)

## Risk / tradeoffs
- Very low risk: change is isolated to hover-preview behavior only.
- Expected improvement: removes premature auto-close when cursor travels from trigger to centered preview.
