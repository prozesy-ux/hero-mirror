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

  // Render video frames to canvas
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const renderFrame = () => {
      if (video.paused || video.ended) return;
      
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      animationId = requestAnimationFrame(renderFrame);
    };

    const handlePlay = () => {
      setIsLoaded(true);
      renderFrame();
    };

    const handleCanPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('canplay', handleCanPlay);
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
      className="min-h-screen flex flex-col items-center justify-center px-4 select-none" 
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

      {/* Animated Canvas Element - Seamlessly Blended */}
      <div 
        className="relative mb-8 group"
        onContextMenu={preventInteraction}
        onDragStart={preventInteraction}
      >
        {/* Outer glow effect */}
        <div className="absolute inset-0 w-80 h-80 md:w-96 md:h-96 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl animate-pulse pointer-events-none" />
        
        {/* Secondary glow */}
        <div className="absolute inset-0 w-64 h-64 md:w-80 md:h-80 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-gradient-radial from-teal-400/15 via-transparent to-transparent blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
        
        {/* Canvas container with seamless blend */}
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          {/* Multi-layer gradient masks for seamless edges */}
          
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-24 z-20 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, #1a1a1a 0%, #1a1a1a 20%, transparent 100%)'
          }} />
          
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 z-20 pointer-events-none" style={{
            background: 'linear-gradient(to top, #1a1a1a 0%, #1a1a1a 20%, transparent 100%)'
          }} />
          
          {/* Left fade */}
          <div className="absolute inset-y-0 left-0 w-24 z-20 pointer-events-none" style={{
            background: 'linear-gradient(to right, #1a1a1a 0%, #1a1a1a 20%, transparent 100%)'
          }} />
          
          {/* Right fade */}
          <div className="absolute inset-y-0 right-0 w-24 z-20 pointer-events-none" style={{
            background: 'linear-gradient(to left, #1a1a1a 0%, #1a1a1a 20%, transparent 100%)'
          }} />
          
          {/* Corner vignettes */}
          <div className="absolute inset-0 z-20 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, #1a1a1a 85%)'
          }} />
          
          {/* Outer soft edge */}
          <div className="absolute -inset-8 z-10 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, #1a1a1a 70%)'
          }} />
          
          {/* The canvas - renders video frames */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover pointer-events-none"
            style={{ 
              mixBlendMode: 'screen',
              filter: 'contrast(1.15) saturate(1.3) brightness(1.05)',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out'
            }}
            onContextMenu={preventInteraction}
            onDragStart={preventInteraction}
          />
          
          {/* Invisible protection overlay */}
          <div 
            className="absolute inset-0 z-30" 
            style={{ backgroundColor: 'transparent' }}
            onContextMenu={preventInteraction}
            onDragStart={preventInteraction}
            onMouseDown={preventInteraction}
          />
        </div>
        
        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-0 w-2 h-2 rounded-full bg-purple-400/40 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-teal-400/40 animate-ping pointer-events-none" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-1 h-1 rounded-full bg-pink-400/40 animate-ping pointer-events-none" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="text-center max-w-lg animate-fade-up">
        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Looking for something?
        </h1>
        
        {/* Subtext with Links */}
        <p className="text-gray-400 text-base md:text-lg mb-8 leading-relaxed">
          We can't find this page. But we can help you find:{" "}
          <Link 
            to="/dashboard/marketplace" 
            className="text-green-500 hover:text-green-400 underline underline-offset-2 transition-colors"
          >
            browse products
          </Link>
          ,{" "}
          <Link 
            to="/seller" 
            className="text-green-500 hover:text-green-400 underline underline-offset-2 transition-colors"
          >
            become a seller
          </Link>
          {" "}or{" "}
          <Link 
            to="/dashboard/chat" 
            className="text-green-500 hover:text-green-400 underline underline-offset-2 transition-colors"
          >
            get help
          </Link>
          .
        </p>
        
        {/* Go to Homepage Button - Upwork Green */}
        <Link to="/">
          <Button 
            className="px-8 py-3 text-base font-semibold rounded-full transition-all duration-200 hover:scale-105"
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
      <div className="absolute bottom-8 text-center text-gray-500 text-sm">
        <p className="mb-1">
          Error 404 (N) • Route: <span className="font-mono">{location.pathname}</span>
        </p>
        <p>© 2024 - 2025 Uptoza</p>
      </div>
    </div>
  );
};

export default NotFound;
