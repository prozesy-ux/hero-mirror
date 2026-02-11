

## Fix 404 Page Video Not Visible in Production

### Root Cause
The Content Security Policy (CSP) in `index.html` has `default-src 'self'` with no `media-src` directive. Since `media-src` falls back to `default-src`, only same-origin media is allowed -- but the video is loaded via a `blob:` URL which gets **blocked by CSP** in production. The preview works because CSP enforcement differs there.

### Solution
Remove the blob URL approach entirely and use the video file directly. This keeps the video same-origin (`/videos/404-panda.mp4`) which CSP already allows, making it work everywhere.

### Changes

**File: `src/pages/NotFound.tsx`**

1. Remove the blob-loading `useEffect` (lines 16-39) -- the one that fetches the video, creates a blob URL, and sets it as src
2. Add the video src directly on the `<video>` element: `src="/videos/404-panda.mp4"`
3. Keep the canvas-based rendering and all download protection (right-click disabled, overlay, etc.) -- those still work fine without blob URLs

### What Stays the Same
- Canvas rendering approach (video plays hidden, frames drawn to canvas)
- All visual effects (glow, particles, gradient masks, blend modes)
- Download protection (context menu disabled, overlay, pointer-events blocked)
- The seamless dark background blending

### Why This Works
- `/videos/404-panda.mp4` is same-origin, so `default-src 'self'` allows it
- No CSP changes needed in `index.html`
- Works on both `uptoza.com` and `help.uptoza.com` since the video is bundled with the app
