import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BrandCardProps {
  children: ReactNode;
  variant?: 'default' | 'featured' | 'gradient' | 'subtle';
  interactive?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const BrandCard = ({
  children,
  variant = 'default',
  interactive = false,
  href,
  onClick,
  className,
  padding = 'md',
}: BrandCardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const variantStyles = {
    default: cn(
      "bg-[hsl(30,20%,98%)] border-2 border-black rounded-[20px] shadow-neobrutalism",
      (interactive || onClick || href) && "hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200"
    ),
    featured: cn(
      "uptoza-card-featured",
      (interactive || onClick || href) && "hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
    ),
    gradient: cn(
      "uptoza-gradient rounded-[20px] border-2 border-black shadow-neobrutalism text-white",
      (interactive || onClick || href) && "hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200"
    ),
    subtle: cn(
      "uptoza-gradient-subtle rounded-[20px] border border-violet-200/50",
      (interactive || onClick || href) && "hover:border-violet-300 transition-all duration-200"
    ),
  };

  const baseStyles = cn(
    variantStyles[variant],
    paddingStyles[padding],
    (onClick || href) && "cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link to={href} className={baseStyles}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cn(baseStyles, "text-left w-full")}>
        {children}
      </button>
    );
  }

  return <div className={baseStyles}>{children}</div>;
};

export default BrandCard;
