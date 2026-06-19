import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-subtle text-primary border border-primary-lighter",
        success: "bg-status-success-bg text-status-success",
        warning: "bg-status-warning-bg text-status-warning",
        error: "bg-status-error-bg text-status-error",
        info: "bg-status-info-bg text-status-info",
        muted: "bg-gray-100 text-gray-600",
        purple: "bg-partner-100 text-partner-700",
        outline: "border border-surface-border text-text-mid bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", {
            "bg-status-success": variant === "success",
            "bg-status-warning": variant === "warning",
            "bg-status-error": variant === "error",
            "bg-status-info": variant === "info",
            "bg-primary": variant === "default" || !variant,
            "bg-partner-600": variant === "purple",
          })}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
