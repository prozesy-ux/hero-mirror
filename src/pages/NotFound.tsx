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
      {/* UFO Illustration with Animation */}
      <div className="relative mb-8 animate-float">
        <svg 
          width="280" 
          height="280" 
          viewBox="0 0 280 280" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-56 h-56 md:w-72 md:h-72"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="ufoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="beamGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="domeGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="beamGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Beam - Purple/Pink Gradient Cone with Pulse Animation */}
          <polygon 
            points="110,95 170,95 200,260 80,260" 
            fill="url(#beamGradient)" 
            filter="url(#beamGlow)"
            className="animate-[beam-pulse_2s_ease-in-out_infinite]"
          />
          
          {/* UFO Body - Main Saucer */}
          <ellipse 
            cx="140" 
            cy="80" 
            rx="70" 
            ry="22" 
            fill="url(#ufoGradient)"
            filter="url(#glow)"
          />
          
          {/* UFO Top Section */}
          <ellipse 
            cx="140" 
            cy="70" 
            rx="40" 
            ry="18" 
            fill="#14b8a6"
          />
          
          {/* UFO Dome */}
          <ellipse 
            cx="140" 
            cy="55" 
            rx="22" 
            ry="16" 
            fill="url(#domeGradient)"
            filter="url(#glow)"
          />
          
          {/* UFO Lights */}
          <circle cx="100" cy="82" r="5" fill="#fef08a" className="animate-pulse" />
          <circle cx="140" cy="88" r="5" fill="#fef08a" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          <circle cx="180" cy="82" r="5" fill="#fef08a" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
          
          {/* Floating Digital Product Icon (Key/Box) inside beam */}
          <g className="animate-[float-product_3s_ease-in-out_infinite]">
            {/* Product Box */}
            <rect 
              x="122" 
              y="160" 
              width="36" 
              height="44" 
              rx="4" 
              fill="white" 
              opacity="0.95"
            />
            {/* Key Icon on Box */}
            <circle cx="140" cy="175" r="8" fill="#14b8a6" />
            <rect x="138" y="180" width="4" height="16" rx="1" fill="#14b8a6" />
            <rect x="138" y="190" width="8" height="3" rx="1" fill="#14b8a6" />
          </g>
        </svg>
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
