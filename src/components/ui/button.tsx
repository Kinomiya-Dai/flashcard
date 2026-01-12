// =============================
// src/components/ui/button.tsx
// =============================
import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "simple" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      ...props
    },
    ref
  ) => {
    const base = `
      inline-flex items-center justify-center gap-2
      rounded-xl font-medium
      transition-colors transition-shadow
      disabled:opacity-40 disabled:pointer-events-none
    `;

    const variants = {
      primary: `
        bg-[var(--accent-primary)]
        text-[var(--text-primary)]
        hover:bg-[var(--accent-hover)]
        shadow-sm
      `,
      simple: `
        bg-transparent
        text-[var(--text-primary)]
        hover:bg-[var(--bg-panel)]
      `,
      outline: `
        border border-[var(--border-subtle)]
        bg-transparent
        text-[var(--text-primary)]
        hover:bg-[var(--bg-panel)]
      `,
      ghost: `
        bg-transparent
        text-[var(--text-muted)]
        hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-panel)]
      `,
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";