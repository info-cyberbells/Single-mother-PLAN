import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-xl border-[1.5px] border-surface-border bg-primary-subtle px-3.5 py-2.5 text-sm text-text-dark placeholder:text-text-soft",
          "transition-all duration-200 outline-none resize-vertical leading-relaxed",
          "focus:border-primary-500 focus:bg-white focus:shadow-focus",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-status-error focus:border-status-error",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
