import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md":
              variant === "primary",
            "bg-white text-text-primary border border-border hover:bg-surface-hover":
              variant === "secondary",
            "border-2 border-primary text-primary-darker hover:bg-primary-lighter":
              variant === "outline",
            "text-text-secondary hover:bg-surface-hover hover:text-text-primary":
              variant === "ghost",
          },
          {
            "text-sm px-4 py-2 gap-1.5": size === "sm",
            "text-base px-6 py-3 gap-2": size === "md",
            "text-lg px-8 py-4 gap-2.5": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps };
