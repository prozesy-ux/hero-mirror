

# Seller Dashboard - Welcome Video Overlay Implementation

## Overview

Create a premium "Welcome Back" video overlay that displays when sellers first load the dashboard. The video features a friendly panda mascot and uses a beautiful color-based background design. After the video plays or is dismissed, the welcome section fades away gracefully, revealing the dashboard beneath.

---

## Design Concept

### User Flow
```text
1. Seller loads dashboard
2. Full-screen overlay appears with gradient background + video
3. Video auto-plays (muted initially, with play button)
4. User can skip anytime via "Skip" button
5. After video ends OR skip, overlay fades out smoothly
6. Dashboard revealed - no overlap issues
```

### Visual Design
- **Overlay**: Fixed position, `z-50`, covers entire viewport (above header/sidebar)
- **Background**: Gradient from deep purple to black with subtle animated dots
- **Video**: Centered, rounded corners, soft shadow glow
- **Welcome Text**: Above video - personalized greeting
- **Skip Button**: Bottom right - always visible
- **Play/Replay Controls**: Over video

---

## Technical Implementation

### File Structure
```text
1. Copy video to project assets
2. Create new component: WelcomeVideoOverlay.tsx
3. Integrate into SellerDashboard.tsx
4. Handle localStorage persistence (don't show again for session)
```

---

## File 1: Copy Video Asset

Copy the uploaded video to the public folder for direct access:
```text
Source: user-uploads://A_full-body_panda_mascot_...mp4
Target: public/videos/welcome-panda.mp4
```

---

## File 2: Create `src/components/seller/WelcomeVideoOverlay.tsx`

### Component Structure

```tsx
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface WelcomeVideoOverlayProps {
  storeName: string;
  onComplete: () => void;
}

const WelcomeVideoOverlay = ({ storeName, onComplete }: WelcomeVideoOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Handle video load
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', () => setVideoLoaded(true));
      video.addEventListener('ended', handleVideoEnd);
    }
    return () => {
      if (video) {
        video.removeEventListener('loadeddata', () => setVideoLoaded(true));
        video.removeEventListener('ended', handleVideoEnd);
      }
    };
  }, []);

  const handleVideoEnd = () => {
    handleDismiss();
  };

  const handleDismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background - Deep gradient with animated dots */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-black to-slate-950">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto text-center">
        
        {/* Sparkle Icon */}
        <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {/* Welcome Text */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Welcome back, {storeName}!
        </h1>
        <p className="text-lg text-white/70 mb-8">
          Here's a quick hello from our mascot 🐼
        </p>

        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 max-w-md w-full aspect-[9/16]">
          {/* Video Loading State */}
          {!videoLoaded && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          <video
            ref={videoRef}
            src="/videos/welcome-panda.mp4"
            className="w-full h-full object-cover"
            playsInline
            muted={isMuted}
            preload="auto"
          />

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end p-6">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>

              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white/70" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Skip Button */}
        <Button
          variant="ghost"
          onClick={handleDismiss}
          className="mt-8 text-white/60 hover:text-white hover:bg-white/10 gap-2"
        >
          <SkipForward className="w-4 h-4" />
          Skip to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default WelcomeVideoOverlay;
```

---

## File 3: Update `src/components/seller/SellerDashboard.tsx`

### Changes Required

**1. Import the new component:**
```tsx
import WelcomeVideoOverlay from './WelcomeVideoOverlay';
```

**2. Add state for welcome overlay (around line 60):**
```tsx
const [showWelcome, setShowWelcome] = useState(false);

// Check if we should show welcome (once per session)
useEffect(() => {
  const hasSeenWelcome = sessionStorage.getItem('seller_welcome_seen');
  if (!hasSeenWelcome && !loading) {
    setShowWelcome(true);
  }
}, [loading]);

const handleWelcomeComplete = () => {
  sessionStorage.setItem('seller_welcome_seen', 'true');
  setShowWelcome(false);
};
```

**3. Render the overlay conditionally (at the beginning of return):**
```tsx
return (
  <>
    {/* Welcome Video Overlay - Portal to body */}
    {showWelcome && (
      <WelcomeVideoOverlay
        storeName={profile?.store_name || 'Seller'}
        onComplete={handleWelcomeComplete}
      />
    )}

    <div className="space-y-6">
      {/* ... existing dashboard content ... */}
    </div>
  </>
);
```

---

## Why This Approach Prevents Overlap Issues

| Issue | Solution |
|-------|----------|
| **Header overlap** | Overlay uses `z-[100]` (higher than header's `z-40` and `z-50`) |
| **Sidebar overlap** | `fixed inset-0` covers entire viewport, not affected by sidebar margin |
| **Content behind** | Dashboard renders but is hidden by opaque overlay |
| **Scroll issues** | `overflow: hidden` on body during overlay (optional) |
| **Mobile safe** | Responsive design with mobile-first approach |

---

## Video Loading Strategy

1. **Preload**: `preload="auto"` starts loading immediately
2. **Loading State**: Show spinner until `loadeddata` event fires
3. **Graceful Fallback**: If video fails, skip button still works
4. **Session Storage**: Video overlay only shows once per browser session

---

## Animation Timeline

```text
0ms     - Overlay appears (instant)
100ms   - Video starts loading
~500ms  - Video loaded, spinner hidden
User    - Clicks play or video auto-plays (optional)
~5-10s  - Video ends naturally
0ms     - fadeOut state set to true
500ms   - Opacity transitions to 0
500ms   - onComplete called, overlay removed from DOM
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `public/videos/welcome-panda.mp4` | Copy user's uploaded panda video |
| `src/components/seller/WelcomeVideoOverlay.tsx` | New premium welcome overlay component |
| `src/components/seller/SellerDashboard.tsx` | Import overlay, add state management, render conditionally |

---

## Design Features

- **Premium gradient background**: Deep violet to black with dot pattern
- **Centered vertical video**: Proper 9:16 aspect ratio for the panda animation
- **Glassmorphic controls**: Play/pause with backdrop blur
- **Personalized greeting**: Uses seller's store name
- **Smooth fade out**: 500ms opacity transition
- **Skip anytime**: Users never feel trapped
- **Session-based**: Only shows once per visit (not annoying)
- **No z-index conflicts**: `z-[100]` ensures overlay is always on top

