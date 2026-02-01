import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Load video as blob and render to canvas
  useEffect(() => {
    const loadVideoAsBlob = async () => {
      try {
        const response = await fetch('/videos/404-panda.mp4');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        if (videoRef.current) {
          videoRef.current.src = blobUrl;
          videoRef.current.load();
        }
      } catch (error) {
        console.error('Video load error:', error);
      }
    };

    loadVideoAsBlob();

    return () => {
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, []);

  // Render video frames to canvas - full screen
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const renderFrame = () => {
      if (video.paused || video.ended) return;
      
      // Set canvas to window size for full-screen rendering
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Calculate dimensions to cover the canvas while maintaining aspect ratio
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (canvasAspect > videoAspect) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / videoAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * videoAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      }
      
      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
      animationId = requestAnimationFrame(renderFrame);
    };

    const handlePlay = () => {
      setIsLoaded(true);
      renderFrame();
    };

    const handleCanPlay = () => {
      video.play().catch(() => {});
    };

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('canplay', handleCanPlay);
    window.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('canplay', handleCanPlay);
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // Prevent all download attempts
  const preventInteraction = (e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4 select-none relative overflow-hidden" 
      style={{ backgroundColor: '#1a1a1a' }}
      onContextMenu={preventInteraction}
    >
      {/* Hidden video source - never visible in DOM */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        autoPlay
        className="hidden"
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={preventInteraction}
      />

      {/* LAYER 1: Full-screen video canvas background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ 
            mixBlendMode: 'luminosity',
            filter: 'brightness(0.45) contrast(1.25) saturate(0.7) blur(0.5px)',
            opacity: isLoaded ? 0.55 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
          onContextMenu={preventInteraction}
          onDragStart={preventInteraction}
        />
      </div>

      {/* LAYER 2: Radial vignette overlay - spotlight effect */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse 80% 70% at 50% 45%,
            transparent 0%,
            transparent 15%,
            rgba(26, 26, 26, 0.4) 35%,
            rgba(26, 26, 26, 0.75) 55%,
            #1a1a1a 80%
          )`
        }}
      />

      {/* LAYER 3: Edge fade overlays for perfect blend */}
      <div 
        className="fixed inset-0 z-[2] pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, #1a1a1a 0%, transparent 15%, transparent 85%, #1a1a1a 100%),
            linear-gradient(to right, #1a1a1a 0%, transparent 10%, transparent 90%, #1a1a1a 100%)
          `
        }}
      />

      {/* LAYER 4: Subtle animated glow effects */}
      <div className="fixed inset-0 z-[3] pointer-events-none overflow-hidden">
        {/* Center glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            animationDuration: '4s'
          }}
        />
        {/* Secondary glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.06) 0%, transparent 70%)',
            animationDuration: '3s',
            animationDelay: '1.5s'
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-purple-400/30 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-teal-400/25 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-pink-400/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-cyan-400/20 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/5 w-0.5 h-0.5 rounded-full bg-violet-300/25 animate-ping" style={{ animationDuration: '5s', animationDelay: '0.8s' }} />
        <div className="absolute bottom-1/4 right-1/5 w-1 h-1 rounded-full bg-emerald-400/15 animate-ping" style={{ animationDuration: '4.5s', animationDelay: '1.2s' }} />
      </div>

      {/* LAYER 5: Full-page protection overlay */}
      <div 
        className="fixed inset-0 z-[4]" 
        style={{ backgroundColor: 'transparent' }}
        onContextMenu={preventInteraction}
        onDragStart={preventInteraction}
        onMouseDown={preventInteraction}
      />

      {/* LAYER 6: Content - above all overlays */}
      <div className="relative z-10 text-center max-w-lg animate-fade-up">
        {/* Heading */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          Looking for something?
        </h1>
        
        {/* Subtext with Links */}
        <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed drop-shadow-md">
          We can't find this page. But we can help you find:{" "}
          <Link 
            to="/dashboard/marketplace" 
            className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
          >
            browse products
          </Link>
          ,{" "}
          <Link 
            to="/seller" 
            className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
          >
            become a seller
          </Link>
          {" "}or{" "}
          <Link 
            to="/dashboard/chat" 
            className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
          >
            get help
          </Link>
          .
        </p>
        
        {/* Go to Homepage Button */}
        <Link to="/">
          <Button 
            className="px-8 py-3 text-base font-semibold rounded-full transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: '#14a800', 
              color: 'white',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d7a00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#14a800'}
          >
            Go to Homepage
          </Button>
        </Link>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 text-center text-gray-500 text-sm z-10">
        <p className="mb-1">
          Error 404 (N) • Route: <span className="font-mono text-gray-400">{location.pathname}</span>
        </p>
        <p>© 2024 - 2025 Uptoza</p>
      </div>
    </div>
  );
};

export default NotFound;
