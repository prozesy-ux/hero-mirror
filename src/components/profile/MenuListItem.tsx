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
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
        "border-b border-gray-100 last:border-b-0",
        isClickable && "hover:bg-gray-50 active:bg-gray-100",
        disabled && "opacity-50 cursor-not-allowed",
        !isClickable && "cursor-default"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
        variant === 'danger' ? "bg-red-50" : "bg-gray-100"
      )}>
        <Icon className={cn(
          "w-4 h-4",
          variant === 'danger' ? "text-red-500" : iconColor || "text-gray-600"
        )} />
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          variant === 'danger' ? "text-red-600" : "text-gray-900"
        )}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Value or chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {value && (
          <span className="text-sm text-gray-500">
            {value}
          </span>
        )}
        {hasChevron && isClickable && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </button>
  );
};

export default MenuListItem;
