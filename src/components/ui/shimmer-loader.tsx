import { cn } from "@/lib/utils";

interface ShimmerLoaderProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "button";
}

const ShimmerLoader = ({ className, variant = "card" }: ShimmerLoaderProps) => {
  const baseClasses = "relative overflow-hidden bg-white/5 rounded-lg";
  
  const shimmerClasses = `
    before:absolute before:inset-0 
    before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent 
    before:animate-[shimmer_2s_infinite]
  `;

  const variantClasses = {
    card: "h-48 w-full rounded-2xl",
    text: "h-4 w-3/4 rounded",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-lg",
  };

  return (
    <div
      className={cn(baseClasses, shimmerClasses, variantClasses[variant], className)}
    />
  );
};

export { ShimmerLoader };
