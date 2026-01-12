// =============================
// src/components/ui/card.tsx
// =============================
import * as React from "react";
import { cn } from "../../lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        `
        rounded-2xl
        border
        border-[var(--border-subtle)]
        bg-[var(--bg-panel)]
        text-[var(--text-primary)]
        shadow-none
        `,
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-4", className)}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";