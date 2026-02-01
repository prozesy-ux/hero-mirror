
# Fix Hover Preview Close Behavior

## Problem

Currently:
- Entire screen overlay keeps the preview open
- Mouse can never "leave" the overlay (it covers the whole screen)
- Users must **click** to close the preview - no way to close by moving mouse away

```text
Current (broken):
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           ENTIRE SCREEN = keeps preview open                │
│                                                             │
│                    ┌─────────────────┐                      │
│                    │   Preview Box   │                      │
│                    └─────────────────┘                      │
│                                                             │
│   Mouse anywhere on screen = stays open forever             │
│   Only click closes it ← Bad UX                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Solution

Only the **preview content box** should keep it open. The backdrop should **start the close timer** when mouse is over it.

```text
Fixed behavior:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│        BACKDROP = starts close timer (after delay)         │
│                                                             │
│                    ┌─────────────────┐                      │
│                    │   Preview Box   │ ← only this keeps    │
│                    │                 │   preview open       │
│                    └─────────────────┘                      │
│                                                             │
│   Move mouse away from preview → closes after 300ms         │
│   Move mouse to preview → stays open                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical Changes

### Update CenteredHoverPreview.tsx

1. **Remove hover handlers from outer wrapper** - The full-screen overlay should not control open/close state
2. **Add hover handlers to the content box only** - Only the preview itself keeps it open
3. **Add hover handler to backdrop** - Entering backdrop starts close timer
4. **Increase close delay to 300ms** - Give user time to move mouse back to preview if they accidentally leave

```typescript
// Before (entire overlay keeps it open):
<div 
  className="fixed inset-0 z-[9998]"
  onMouseEnter={handleOverlayMouseEnter}  // Problem: keeps open
  onMouseLeave={handleOverlayMouseLeave}
>
  <div className="backdrop" onClick={handleClose} />
  <div ref={contentRef}>{content}</div>
</div>

// After (only content keeps it open):
<div className="fixed inset-0 z-[9998]">
  <div 
    className="backdrop" 
    onClick={handleClose}
    onMouseEnter={handleBackdropMouseEnter}  // Starts close timer
  />
  <div 
    ref={contentRef}
    onMouseEnter={handleContentMouseEnter}   // Cancels close timer
    onMouseLeave={handleContentMouseLeave}   // Starts close timer
  >
    {content}
  </div>
</div>
```

### Behavior Flow

| Action | Result |
|--------|--------|
| Hover product card | Preview opens after 400ms |
| Move mouse to preview content | Stays open (timer cancelled) |
| Move mouse from preview to backdrop | Close timer starts (300ms) |
| Move mouse back to preview before 300ms | Stays open (timer cancelled) |
| Stay on backdrop for 300ms+ | Preview closes |
| Click backdrop | Closes immediately |
| Press Escape | Closes immediately |

### Additional Improvement

Increase `closeDelay` from 150ms to 300ms to give users more time to move their mouse around without accidentally closing the preview.

## File to Modify

| File | Changes |
|------|---------|
| `src/components/ui/CenteredHoverPreview.tsx` | Move hover handlers from overlay to content/backdrop separately |

## Result

- Move mouse to preview → stays open
- Move mouse away from preview (to backdrop or cards) → closes after short delay
- No more "stuck" preview that requires clicking
- Smooth, natural hover experience
