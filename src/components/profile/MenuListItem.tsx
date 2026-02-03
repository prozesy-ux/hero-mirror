import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuListItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  value?: React.ReactNode;
  hasChevron?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  iconColor?: string;
}

const MenuListItem = ({
  icon: Icon,
  label,
  description,
  value,
  hasChevron = true,
  onClick,
  variant = 'default',
  disabled = false,
  iconColor
}: MenuListItemProps) => {
  const isClickable = !!onClick && !disabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all",
        "border-b last:border-b-0",
        isClickable && "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        disabled && "opacity-50 cursor-not-allowed",
        !isClickable && "cursor-default"
      )}
    >
      {/* Icon - Gumroad pink style */}
      <div className={cn(
        "w-9 h-9 rounded border border-black flex items-center justify-center flex-shrink-0",
        variant === 'danger' ? "bg-red-100" : "bg-[#FF90E8]"
      )}>
        <Icon className={cn(
          "w-4 h-4",
          variant === 'danger' ? "text-red-600" : "text-black"
        )} />
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          variant === 'danger' ? "text-red-600" : "text-slate-900"
        )}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-600 mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Value or chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {value && (
          <span className="text-sm text-slate-600">
            {value}
          </span>
        )}
        {hasChevron && isClickable && (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </div>
    </button>
  );
};

export default MenuListItem;
