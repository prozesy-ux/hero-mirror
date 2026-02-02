import { ReactNode, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BrandStatProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  featured?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

const BrandStat = ({
  label,
  value,
  subValue,
  icon,
  trend,
  featured = false,
  href,
  onClick,
  className,
  animate = true,
}: BrandStatProps) => {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  
  // Animated counter for numbers
  useEffect(() => {
    if (!animate || typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value, animate]);

  const content = (
    <>
      {/* Brand Accent Line */}
      <div className="absolute left-0 top-0 w-1 h-full rounded-l-[18px] uptoza-gradient" />
      
      <div className="flex items-start justify-between pl-4">
        <div className="flex-1 min-w-0">
          {/* Label with UPTOZA styling */}
          <p className="uptoza-label text-slate-500 mb-2">
            {label}
          </p>
          
          {/* Value with brand styling */}
          <p className={cn(
            "uptoza-stat text-3xl text-slate-900 leading-none",
            featured && "uptoza-gradient-text"
          )}>
            {displayValue}
          </p>
          
          {/* Trend or SubValue */}
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              {trend.value >= 0 ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">
                    +{trend.value.toFixed(1)}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">
                    {trend.value.toFixed(1)}%
                  </span>
                </div>
              )}
              {trend.label && (
                <span className="text-xs text-slate-400">{trend.label}</span>
              )}
            </div>
          )}
          
          {!trend && subValue && (
            <p className="text-xs text-slate-500 mt-2">{subValue}</p>
          )}
        </div>

        {/* Icon with brand glow */}
        {icon && (
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
            featured 
              ? "uptoza-gradient text-white shadow-uptoza-glow" 
              : "bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-600 border border-violet-100"
          )}>
            {icon}
          </div>
        )}
      </div>
    </>
  );

  const baseStyles = cn(
    "relative rounded-[20px] p-5 transition-all duration-200",
    "bg-[hsl(30,20%,98%)] border-2 border-black shadow-neobrutalism",
    "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
    featured && "uptoza-glow-pulse",
    (onClick || href) && "cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link to={href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(baseStyles, "text-left w-full")}>
        {content}
      </button>
    );
  }

  return <div className={baseStyles}>{content}</div>;
};

export default BrandStat;
