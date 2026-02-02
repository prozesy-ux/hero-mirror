import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'gradient' | 'bordered' | 'minimal' | 'neobrutalism' | 'uptoza';
  accentColor?: 'emerald' | 'violet' | 'blue' | 'orange' | 'pink' | 'amber';
  href?: string;
  onClick?: () => void;
  className?: string;
  featured?: boolean;
}

const accentColors = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-l-emerald-500',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    hover: 'hover:border-emerald-200',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-l-violet-500',
    gradient: 'from-violet-500/10 to-violet-600/5',
    hover: 'hover:border-violet-200',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-l-blue-500',
    gradient: 'from-blue-500/10 to-blue-600/5',
    hover: 'hover:border-blue-200',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-l-orange-500',
    gradient: 'from-orange-500/10 to-orange-600/5',
    hover: 'hover:border-orange-200',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-l-pink-500',
    gradient: 'from-pink-500/10 to-pink-600/5',
    hover: 'hover:border-pink-200',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-l-amber-500',
    gradient: 'from-amber-500/10 to-amber-600/5',
    hover: 'hover:border-amber-200',
  },
};

const StatCard = ({
  label,
  value,
  subValue,
  icon,
  trend,
  variant = 'default',
  accentColor = 'emerald',
  href,
  onClick,
  className,
  featured = false,
}: StatCardProps) => {
  const colors = accentColors[accentColor];

  // UPTOZA variant has special content layout
  const isUptozaVariant = variant === 'uptoza';

  const uptozaContent = (
    <>
      {/* Brand Accent Line */}
      <div className="absolute left-0 top-0 w-1 h-full rounded-l-[18px] bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500" />
      
      <div className="flex items-start justify-between pl-4">
        <div className="flex-1 min-w-0">
          {/* Label with UPTOZA styling */}
          <p className="uptoza-label text-muted-foreground mb-2">
            {label}
          </p>
          
          {/* Value with brand styling */}
          <p className={cn(
            "uptoza-stat text-[28px] text-foreground leading-none",
            featured && "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent"
          )}>
            {value}
          </p>
          
          {/* Trend or SubValue */}
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              {(trend.isPositive ?? trend.value >= 0) ? (
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
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
          
          {!trend && subValue && (
            <p className="text-xs text-muted-foreground mt-2">{subValue}</p>
          )}
        </div>

        {/* Icon with brand glow */}
        {icon && (
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
            featured 
              ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-uptoza-glow" 
              : "bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-600 border border-violet-100"
          )}>
            {icon}
          </div>
        )}
      </div>
    </>
  );

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-[28px] font-bold text-foreground leading-none tracking-tight">
            {value}
          </p>
          
          {/* Trend or SubValue */}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive !== undefined ? (
                trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )
              ) : trend.value >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span
                className={cn(
                  "text-[11px] font-medium",
                  (trend.isPositive ?? trend.value >= 0)
                    ? "text-emerald-600"
                    : "text-red-600"
                )}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-[11px] text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
          
          {!trend && subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              colors.bg
            )}
          >
            <div className={colors.text}>{icon}</div>
          </div>
        )}
      </div>
    </>
  );

  const baseStyles = cn(
    "rounded-xl p-5 transition-all duration-300",
    onClick && "cursor-pointer",
    className
  );

  const variantStyles = {
    default: cn(
      "bg-card border border-border shadow-stat",
      "hover:shadow-stat-hover",
      colors.hover
    ),
    gradient: cn(
      "bg-gradient-to-br border",
      colors.gradient,
      `border-${accentColor}-500/20`
    ),
    bordered: cn(
      "bg-card border-l-4 shadow-stat",
      colors.border,
      "hover:shadow-stat-hover"
    ),
    minimal: cn(
      "bg-muted/80 hover:bg-muted"
    ),
    neobrutalism: cn(
      "bg-card border-2 border-black rounded-lg shadow-neobrutalism",
      "hover:shadow-none hover:translate-x-1 hover:translate-y-1",
      "transition-all cursor-pointer"
    ),
    uptoza: cn(
      "relative bg-[hsl(30,20%,98%)] border-2 border-black rounded-[20px] shadow-neobrutalism",
      "hover:shadow-none hover:translate-x-1 hover:translate-y-1",
      "transition-all cursor-pointer",
      featured && "shadow-uptoza-glow"
    ),
  };

  const combinedStyles = cn(baseStyles, variantStyles[variant]);
  const contentToRender = isUptozaVariant ? uptozaContent : cardContent;

  if (href) {
    return (
      <Link to={href} className={combinedStyles}>
        {contentToRender}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(combinedStyles, "text-left w-full")}>
        {contentToRender}
      </button>
    );
  }

  return <div className={combinedStyles}>{contentToRender}</div>;
};

export default StatCard;
