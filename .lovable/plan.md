

# Full Page Video Background - Seamless "Code Animation" Design

## Goal

Make the panda video fill the **entire page background**, perfectly blended with the dark theme so it looks like a native animated background - not a video at all.

## Current vs. New Design

| Current | New |
|---------|-----|
| Small box (280px) centered | Full-screen background |
| Gradient masks on edges | Video blends into entire page |
| Video visible as element | Video invisible as "animation layer" |

## Visual Concept

```text
+--------------------------------------------------+
|                FULL SCREEN VIDEO                  |
|     (blended with background, very subtle)        |
|                                                  |
|           ┌─────────────────────┐                |
|           │   Panda Animation   │                |
|           │   (center focus)    │                |
|           └─────────────────────┘                |
|                                                  |
|           "Looking for something?"               |
|           [Browse] [Seller] [Help]               |
|              [Go to Homepage]                    |
|                                                  |
|   (Background: #1a1a1a with subtle video blend)  |
+--------------------------------------------------+
```

## Technical Implementation

### 1. Full-Page Video Layer

| Property | Value | Purpose |
|----------|-------|---------|
| Position | `fixed inset-0` | Cover entire viewport |
| Size | `w-full h-full object-cover` | Fill without distortion |
| Z-index | `-10` | Behind all content |
| Opacity | `0.4-0.6` | Subtle, not overwhelming |
| Blend | `mix-blend-mode: luminosity` | Merge with background color |

### 2. Enhanced Blending Layers

**Layer Stack (bottom to top):**
1. **Base background** - Solid `#1a1a1a`
2. **Video canvas** - Full screen, low opacity, luminosity blend
3. **Gradient overlay** - Radial vignette to darken edges
4. **Content layer** - Text, buttons (fully visible)
5. **Protection overlay** - Invisible, blocks all interactions

### 3. Video Processing for Perfect Blend

Apply CSS filters to the canvas to match the dark theme:

```css
filter: 
  brightness(0.5)      /* Darken video */
  contrast(1.2)        /* Enhance panda details */
  saturate(0.8)        /* Reduce color intensity */
  blur(0.5px);         /* Slight soften */

mix-blend-mode: luminosity;  /* Blend with bg color */
opacity: 0.5;                /* Subtle presence */
```

### 4. Vignette Overlay Design

Add a radial gradient overlay to fade video toward edges:

```css
background: radial-gradient(
  ellipse at center,
  transparent 20%,
  rgba(26, 26, 26, 0.7) 50%,
  #1a1a1a 80%
);
```

This creates a "spotlight" effect on the panda in the center while edges fade to solid background.

### 5. Download Protection (Enhanced)

| Layer | Protection |
|-------|------------|
| Canvas rendering | No video URL in DOM |
| Full-page overlay | Blocks all mouse events |
| `user-select: none` | No selection possible |
| `pointer-events: none` on canvas | Can't target it |
| `onContextMenu` disabled | No right-click |

## File to Modify

| File | Changes |
|------|---------|
| `src/pages/NotFound.tsx` | Convert to full-page video background with layered blending |

## Result

- Video fills entire page as subtle animated background
- Panda animation visible in center with vignette fade
- Looks like built-in CSS/JS animation, not a video
- Completely protected from download/scraping
- Text and buttons remain fully visible and interactive
- Professional, polished 404 experience

