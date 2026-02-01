
Goal
- Prevent the centered hover preview from closing while the user is moving the mouse from the product card (trigger) to the centered preview (content), even if they move a bit slowly.
- Keep the “move away to close” behavior (no need to click) once the user is not in that travel window.

What’s happening now (root cause)
- After the preview opens, the screen has a backdrop overlay.
- When the user leaves the trigger card to move toward the centered preview, their mouse necessarily passes over the backdrop first.
- Our current logic starts the close timer as soon as the mouse enters the backdrop.
- If the user takes longer than closeDelay (300ms) to reach the centered content, the preview closes “too fast”.
- This matches your report: first 1–2 hovers feel OK, then later hovers you notice the premature closing (usually because the mouse movement timing varies).

Design approach (best UX compromise)
Add a short “travel grace period” after the preview opens (or after leaving the trigger), during which the backdrop will NOT start the close timer. This gives users time to move from the trigger card to the centered content without the preview closing.

After the grace period:
- Backdrop hover will start close timer as it does now (so moving away closes naturally).
- Content hover will cancel close timer.

Implementation details

1) Update `src/components/ui/CenteredHoverPreview.tsx` to track a travel grace window
- Add a ref like:
  - `const lastOpenAtRef = useRef<number>(0);`
  - (Optionally also `lastTriggerLeaveAtRef`, but “lastOpenAt” is often enough.)
- When opening (`handleOpen`), set `lastOpenAtRef.current = Date.now()`.

2) Add a prop (optional) or constant for the grace duration
- Add a new optional prop:
  - `travelGraceMs?: number` (default: 450–600ms)
- Keep existing defaults:
  - `openDelay = 400`
  - `closeDelay = 300` (or slightly higher if needed)
- Recommended defaults:
  - `travelGraceMs = 600`
  - `closeDelay = 350` (small bump for forgiveness)

3) Modify backdrop mouse-enter close behavior
Current behavior:
- Backdrop `onMouseEnter` immediately starts the close timer.

New behavior:
- In `handleBackdropMouseEnter`, check if we’re inside the grace window:
  - `if (Date.now() - lastOpenAtRef.current < travelGraceMs) return;`
- Only start the close timer if we’re outside the grace window.

This preserves:
- “Move away closes” once the preview has been open for a moment.
This fixes:
- “Closes too fast” while traveling to the centered preview.

4) Keep content handlers as-is
- `handleContentMouseEnter` cancels timers
- `handleContentMouseLeave` starts close timer

5) Verify callers don’t override with too-aggressive delays
- `ProductHoverCard` and `StoreProductHoverCard` already removed `closeDelay={150}` (good).
- We’ll avoid adding any new overrides unless you want different behavior per page.

Acceptance tests (what you should test end-to-end)
1) Marketplace (/marketplace/chatgpt):
   - Hover product card, then move slowly to the centered preview.
   - Expected: preview stays open and does not close while traveling.
2) After preview is open for >0.6s:
   - Move mouse off the preview onto the dark backdrop and wait.
   - Expected: preview closes after closeDelay.
3) Repeat hover on 5–10 products:
   - Expected: no “after 1–2 hovers it breaks” behavior.
4) Store page:
   - Same behavior as marketplace.
5) Confirm clicks still work:
   - Clicking backdrop closes immediately.
   - Escape closes immediately.

Files to change
- src/components/ui/CenteredHoverPreview.tsx
  - Add `travelGraceMs` (optional prop)
  - Track open timestamp
  - Gate backdrop close-timer start by grace window

Notes / edge cases considered
- This solution avoids making the overlay “sticky” again (still closes when you move away after the grace window).
- It directly targets the travel gap problem without reintroducing flicker.
- If you still see “too fast” after this, we can increase `travelGraceMs` to ~800ms or raise `closeDelay` slightly (but grace window is the key).

