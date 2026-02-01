

# Fix Hover Preview Flickering Issue

## Problem

The hover preview is flickering (opening and closing repeatedly) because:

1. When mouse leaves the trigger card, a 150ms close timer starts
2. The preview appears in screen center (not near the trigger), so there's a gap
3. As the mouse travels from the trigger toward the centered preview, it's over the **backdrop** (not the content)
4. The backdrop doesn't cancel the close timer
5. Result: Preview closes before mouse can reach it, then re-opens when mouse hits another card

```text
Current behavior:
┌─────────────────────────────────────────────────────────────┐
│                     BACKDROP (bg-black/20)                  │
│                                                             │
│                    ┌─────────────────┐                      │
│                    │   Preview Box   │ ← only this cancels  │
│                    │                 │   close timer        │
│                    └─────────────────┘                      │
│                           ↑                                 │
│           mouse travels here (over backdrop)                │
│           close timer KEEPS RUNNING! ← Problem              │
│                           ↑                                 │
│  ┌────┐                                                     │
│  │Card│ ← mouse leaves here, close timer starts             │
│  └────┘                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Solution

Treat the entire overlay (backdrop + content) as a single hover zone. When mouse is anywhere inside the portal (backdrop OR content), cancel the close timer.

```text
Fixed behavior:
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ENTIRE OVERLAY = hover zone                 │  │
│  │                                                       │  │
│  │              ┌─────────────────┐                      │  │
│  │              │   Preview Box   │                      │  │
│  │              └─────────────────┘                      │  │
│  │                                                       │  │
│  │    Mouse anywhere here = stays open                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────┐                                                     │
│  │Card│                                                     │
│  └────┘                                                     │
└─────────────────────────────────────────────────────────────┘
```

## Technical Changes

### Update CenteredHoverPreview.tsx

1. **Wrap backdrop + content in a single container** with hover handlers
2. **Add onMouseEnter to the outer wrapper** to cancel close timer when mouse enters the overlay area
3. **Only close on explicit actions**: clicking backdrop, pressing Escape, or clicking X button
4. **Remove onMouseLeave from content** (no auto-close when leaving content)

```typescript
// Current structure (problematic):
{isOpen && createPortal(
  <>
    <div className="backdrop" onClick={handleClose} />  // No hover handling
    <div onMouseEnter={cancel} onMouseLeave={close}>    // Only this cancels
      {content}
    </div>
  </>,
  document.body
)}

// Fixed structure:
{isOpen && createPortal(
  <div 
    className="fixed inset-0 z-[9998]"
    onMouseEnter={handleOverlayMouseEnter}  // Cancel close timer
  >
    <div className="backdrop" onClick={handleClose} />
    <div className="centered-content">
      {content}
    </div>
  </div>,
  document.body
)}
```

### Key behavior changes:

| Action | Before | After |
|--------|--------|-------|
| Mouse leaves trigger | Starts 150ms close timer | Same (starts timer) |
| Mouse enters backdrop area | Timer keeps running | Timer cancelled |
| Mouse enters content | Timer cancelled | Timer cancelled |
| Mouse leaves content | Starts close timer | No effect |
| Mouse leaves overlay entirely | N/A | Starts close timer |
| Click backdrop | Closes | Closes |
| Press Escape | Closes | Closes |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/CenteredHoverPreview.tsx` | Wrap portal content in single hover container |

## Result

- No more flickering when moving mouse from card to preview
- Preview stays open while mouse is anywhere in the overlay
- Clean close behavior: click backdrop, press Escape, or move mouse completely out

