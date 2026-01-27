import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoWithFallbackProps {
  src: string;
  alt: string;
  color?: string;
  className?: string;
  fallbackClassName?: string;
}

export const LogoWithFallback = ({ 
  src, 
  alt, 
  color = '#6366f1',
  className = 'w-10 h-10',
  fallbackClassName
}: LogoWithFallbackProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  if (error || !src) {
    return (
      <div 
        className={cn(
          "rounded-lg flex items-center justify-center text-white font-bold text-lg",
          className,
          fallbackClassName
        )}
        style={{ backgroundColor: color }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  
  return (
    <div className={cn("relative", className)}>
      {loading && (
        <div 
          className={cn(
            "absolute inset-0 rounded-lg animate-pulse",
            className
          )}
          style={{ backgroundColor: `${color}20` }}
        />
      )}
      <img 
        src={src} 
        alt={alt} 
        className={cn(
          "w-full h-full object-contain rounded-lg",
          loading && "opacity-0"
        )}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default LogoWithFallback;
