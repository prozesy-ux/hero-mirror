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
  variant?: 'default' | 'accent' | 'minimal' | 'gradient';
  accentColor?: 'emerald' | 'violet' | 'blue' | 'orange' | 'pink' | 'amber';
  href?: string;
  onClick?: () => void;
  className?: string;
}

const accentColors = {
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    border: 'border-l-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    border: 'border-l-violet-500',
    gradient: 'from-violet-500 to-violet-600',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    border: 'border-l-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  orange: {
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    border: 'border-l-orange-500',
    gradient: 'from-orange-500 to-orange-600',
  },
  pink: {
    iconBg: 'bg-pink-50',
    iconText: 'text-pink-600',
    border: 'border-l-pink-500',
    gradient: 'from-pink-500 to-pink-600',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    border: 'border-l-amber-500',
    gradient: 'from-amber-500 to-amber-600',
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
}: StatCardProps) => {
  const colors = accentColors[accentColor];

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">
            {label}
          </p>
          <p className="text-[32px] font-bold text-slate-900 leading-none tracking-tight">
            {value}
          </p>
          
          {/* Trend or SubValue */}
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              {trend.isPositive !== undefined ? (
                trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )
              ) : trend.value >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  "text-[12px] font-medium",
                  (trend.isPositive ?? trend.value >= 0)
                    ? "text-emerald-600"
                    : "text-red-500"
                )}
              >
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-[12px] text-slate-400">{trend.label}</span>
              )}
            </div>
          )}
          
          {!trend && subValue && (
            <p className="text-[13px] text-slate-500 mt-2">{subValue}</p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              colors.iconBg
            )}
          >
            <div className={colors.iconText}>{icon}</div>
          </div>
        )}
      </div>
    </>
  );

  const baseStyles = cn(
    "rounded-xl p-5 transition-all duration-200",
    onClick && "cursor-pointer",
    className
  );

  const variantStyles = {
    default: cn(
      "bg-white border border-slate-100 shadow-card",
      "hover:shadow-card-hover hover:border-slate-200"
    ),
    accent: cn(
      "bg-white border border-slate-100 border-l-[3px] shadow-card",
      colors.border,
      "hover:shadow-card-hover"
    ),
    minimal: cn(
      "bg-white border border-slate-50",
      "hover:border-slate-100 hover:shadow-card"
    ),
    gradient: cn(
      "bg-gradient-to-br text-white border-0",
      colors.gradient,
      "shadow-card-elevated hover:shadow-lg"
    ),
  };

  const combinedStyles = cn(baseStyles, variantStyles[variant]);

  // For gradient variant, override text colors
  const contentWithGradientOverride = variant === 'gradient' ? (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-white/70 uppercase tracking-wide mb-1.5">
            {label}
          </p>
          <p className="text-[32px] font-bold text-white leading-none tracking-tight">
            {value}
          </p>
          
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              {(trend.isPositive ?? trend.value >= 0) ? (
                <TrendingUp className="w-3.5 h-3.5 text-white/80" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-white/80" />
              )}
              <span className="text-[12px] font-medium text-white/90">
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-[12px] text-white/60">{trend.label}</span>
              )}
            </div>
          )}
          
          {!trend && subValue && (
            <p className="text-[13px] text-white/70 mt-2">{subValue}</p>
          )}
        </div>

        {icon && (
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <div className="text-white">{icon}</div>
          </div>
        )}
      </div>
    </>
  ) : cardContent;

  if (href) {
    return (
      <Link to={href} className={combinedStyles}>
        {contentWithGradientOverride}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(combinedStyles, "text-left w-full")}>
        {contentWithGradientOverride}
      </button>
    );
  }

  return <div className={combinedStyles}>{contentWithGradientOverride}</div>;
};

export default StatCard;
