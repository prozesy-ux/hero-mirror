import { useState, useRef, useEffect, useCallback } from 'react';
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

  const handleDismiss = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  }, [onComplete]);

  const handleVideoEnd = useCallback(() => {
    handleDismiss();
  }, [handleDismiss]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedData = () => setVideoLoaded(true);
    const onEnded = () => handleVideoEnd();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('ended', onEnded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [handleVideoEnd]);

  // Prevent body scroll when overlay is visible
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Background - Deep gradient with animated dots */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-black to-slate-950">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        />
        {/* Subtle glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto text-center">
        
        {/* Sparkle Icon */}
        <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/30 animate-pulse-glow">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {/* Welcome Text */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Welcome back, {storeName}!
        </h1>
        <p className="text-base sm:text-lg text-white/70 mb-8">
          Here's a quick hello from our mascot 🐼
        </p>

        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 w-full max-w-[280px] sm:max-w-xs aspect-[9/16]">
          {/* Video Loading State */}
          {!videoLoaded && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end p-4 sm:p-6">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" />
                )}
              </button>

              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
