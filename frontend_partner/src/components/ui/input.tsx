import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-[1.5px] border-surface-border bg-primary-subtle px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-soft",
          "transition-all duration-200 outline-none",
          "focus:border-primary-500 focus:bg-white focus:shadow-focus",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          error && "border-status-error focus:border-status-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
