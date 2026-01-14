import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glow" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const variantClasses = {
      default: "bg-white/5 backdrop-blur-xl border border-white/10",
      glow: "bg-white/5 backdrop-blur-xl border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]",
      gradient: "bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/20",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
