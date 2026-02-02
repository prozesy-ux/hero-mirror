import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ children, variant = 'primary', size = 'md', className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variantStyles = {
      primary: cn(
        "uptoza-gradient text-white font-semibold",
        "border-2 border-black rounded-xl",
        "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        "transition-all duration-150"
      ),
      secondary: cn(
        "bg-white text-slate-900 font-semibold",
        "border-2 border-black rounded-xl",
        "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        "transition-all duration-150"
      ),
      outline: cn(
        "bg-transparent text-violet-600 font-semibold",
        "border-2 border-violet-500 rounded-xl",
        "hover:bg-violet-50",
        "transition-all duration-150"
      ),
      ghost: cn(
        "bg-transparent text-violet-600 font-semibold",
        "rounded-xl",
        "hover:bg-violet-50",
        "transition-all duration-150"
      ),
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

BrandButton.displayName = 'BrandButton';

export default BrandButton;
