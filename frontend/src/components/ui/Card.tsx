"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  className,
  glass = true,
  hover = false,
  padding = "md",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        glass
          ? "bg-white/70 backdrop-blur-md border-white/60 shadow-glass"
          : "bg-white border-outline-variant/30 shadow-card",
        hover && "hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-300 cursor-default",
        padding === "none" && "p-0",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display font-semibold text-lg text-on-surface leading-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-on-surface-variant", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/20", className)}
      {...props}
    >
      {children}
    </div>
  );
}
