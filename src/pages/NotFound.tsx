import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Animated Panda Element - Seamlessly Blended */}
      <div className="relative mb-8 group">
        {/* Outer glow effect */}
        <div className="absolute inset-0 w-64 h-64 md:w-80 md:h-80 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl animate-pulse" />
        
        {/* Secondary glow */}
        <div className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-gradient-radial from-teal-400/15 via-transparent to-transparent blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Video container with seamless blend */}
        <div className="relative w-56 h-56 md:w-72 md:h-72">
          {/* Gradient mask overlay - top and bottom fade */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, #1a1a1a 0%, transparent 15%, transparent 85%, #1a1a1a 100%)'
          }} />
          
          {/* Gradient mask overlay - left and right fade */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            background: 'linear-gradient(to right, #1a1a1a 0%, transparent 15%, transparent 85%, #1a1a1a 100%)'
          }} />
          
          {/* Corner vignette for smooth blend */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, #1a1a1a 100%)'
          }} />
          
          {/* The video itself */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ 
              mixBlendMode: 'screen',
              filter: 'contrast(1.1) saturate(1.2)'
            }}
          >
            <source src="/videos/404-panda.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-0 w-2 h-2 rounded-full bg-purple-400/40 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-teal-400/40 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-1 h-1 rounded-full bg-pink-400/40 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
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
