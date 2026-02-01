
# Make Video Perfectly Blend & Prevent Download

## Goals

1. **Perfect Background Blend** - Make the video look like a native code animation, completely seamless with the dark background
2. **Prevent Download/Scraping** - Block right-click, disable download tools, prevent scrapers from grabbing the video

## Technical Approach

### 1. Enhanced Visual Blending

**Current Issue**: The video still has visible edges and doesn't fully integrate with the background.

**Solution**: Use multiple layered techniques:

| Technique | Purpose |
|-----------|---------|
| Canvas rendering | Render video frames to canvas (hides video element from DOM) |
| Stronger edge fading | More aggressive gradient masks on all sides |
| Color matching | Match video blacks to exact background color `#1a1a1a` |
| Blend modes | Use `luminosity` or `screen` blend for seamless integration |
| CSS filters | Apply brightness/contrast to match ambient lighting |

### 2. Download Prevention Methods

| Method | Blocks |
|--------|--------|
| `onContextMenu={e => e.preventDefault()}` | Right-click menu |
| `controlsList="nodownload"` | Browser download button |
| `disablePictureInPicture` | PiP mode extraction |
| Canvas rendering (blob URL) | Direct video URL access |
| Invisible overlay div | Prevents drag/drop and inspection |
| Dynamic source loading | No static URL in source code |

### 3. Implementation Details

**Render Video to Canvas** (Best Protection):
- Load video via JavaScript Blob URL (not direct path)
- Draw frames to `<canvas>` element instead of showing `<video>`
- Canvas cannot be downloaded like video
- Source URL not visible in DOM inspector

**Seamless Blend Design**:
```text
+------------------------------------------+
|           Background #1a1a1a             |
|   +----------------------------------+   |
|   | Outer glow (purple/teal pulse)   |   |
|   |   +------------------------+     |   |
|   |   | Edge gradient masks    |     |   |
|   |   |   +----------------+   |     |   |
|   |   |   | CANVAS element |   |     |   |
|   |   |   | (video frames) |   |     |   |
|   |   |   +----------------+   |     |   |
|   |   | (all edges fade out)   |     |   |
|   |   +------------------------+     |   |
|   +----------------------------------+   |
+------------------------------------------+
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/NotFound.tsx` | Replace video with canvas, add download protection, enhance blend effects |

## Result

- Video appears as native animated element (like CSS/JS animation)
- No visible borders or container edges
- Right-click disabled, download tools blocked
- Video URL not exposed in DOM
- Scrapers cannot find or download the video file
- Perfect seamless integration with `#1a1a1a` background
