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
      {/* Panda Video Animation */}
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
