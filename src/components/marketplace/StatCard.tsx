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
  variant?: 'default' | 'gradient' | 'bordered' | 'minimal' | 'neobrutalism';
  accentColor?: 'emerald' | 'violet' | 'blue' | 'orange' | 'pink' | 'amber';
  href?: string;
  onClick?: () => void;
  className?: string;
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
}: StatCardProps) => {
  const colors = accentColors[accentColor];

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-[28px] font-bold text-slate-900 leading-none tracking-tight">
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
                <span className="text-[11px] text-slate-400">{trend.label}</span>
              )}
            </div>
          )}
          
          {!trend && subValue && (
            <p className="text-xs text-slate-500 mt-1">{subValue}</p>
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
      "bg-white border border-slate-100 shadow-stat",
      "hover:shadow-stat-hover",
      colors.hover
    ),
    gradient: cn(
      "bg-gradient-to-br border",
      colors.gradient,
      `border-${accentColor}-500/20`
    ),
    bordered: cn(
      "bg-white border-l-4 shadow-stat",
      colors.border,
      "hover:shadow-stat-hover"
    ),
    minimal: cn(
      "bg-slate-50/80 hover:bg-slate-100/80"
    ),
    neobrutalism: cn(
      "bg-white border-2 border-black rounded-lg shadow-neobrutalism",
      "hover:shadow-none hover:translate-x-1 hover:translate-y-1",
      "transition-all cursor-pointer"
    ),
  };

  const combinedStyles = cn(baseStyles, variantStyles[variant]);

  if (href) {
    return (
      <Link to={href} className={combinedStyles}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(combinedStyles, "text-left w-full")}>
        {cardContent}
      </button>
    );
  }

  return <div className={combinedStyles}>{cardContent}</div>;
};

export default StatCard;
