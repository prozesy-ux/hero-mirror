

# Replace 404 Page Icon with Video

## Current State
The 404 page displays a UFO SVG illustration (280x280) with:
- Floating animation (`animate-float`)
- Dark background (#1a1a1a)
- Size: 224px on mobile, 288px on desktop

## What You Want
Replace the UFO icon with the uploaded panda video:
- Same position (centered, above the text)
- Same box design/size
- Video plays automatically on page load
- Looping playback for continuous effect

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/NotFound.tsx` | Replace SVG with video element, add autoplay/loop |

## Technical Implementation

### 1. Copy Video to Project
Copy the uploaded video file to the public folder for direct video access:
- From: `user-uploads://A_highly_stylized_cartoon-like_giant_panda_stands_against_a_dark_background_illuminated_by_vibrant_seed869836945.mp4`
- To: `public/videos/404-panda.mp4`

### 2. Replace SVG with Video Element

**Before (SVG):**
```jsx
<div className="relative mb-8 animate-float">
  <svg width="280" height="280" ...>
    {/* UFO illustration */}
  </svg>
</div>
```

**After (Video):**
```jsx
<div className="relative mb-8">
  <div className="w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-cover"
    >
      <source src="/videos/404-panda.mp4" type="video/mp4" />
    </video>
  </div>
</div>
```

### Video Element Properties

| Property | Purpose |
|----------|---------|
| `autoPlay` | Starts playing immediately on page load |
| `loop` | Replays continuously |
| `muted` | Required for autoplay in browsers (no sound needed) |
| `playsInline` | Prevents fullscreen on mobile devices |
| `object-cover` | Maintains aspect ratio, fills container |

### Box Design
- Same size as current icon: `w-56 h-56 md:w-72 md:h-72` (224px / 288px)
- Rounded corners: `rounded-2xl`
- Shadow for depth: `shadow-2xl`
- Overflow hidden to clip video to box

## Result
- Video loads and plays automatically when user lands on 404 page
- Same centered position above the "Looking for something?" heading
- Same box size as the current UFO illustration
- Loops continuously for engaging visual effect

