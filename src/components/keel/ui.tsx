import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Button({
  variant = "solid",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "line" | "ghost" | "ink" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-semibold transition-colors duration-150 disabled:opacity-50",
        variant === "solid" && "bg-copper text-ink hover:bg-copper/90",
        variant === "ink" && "bg-ink text-paper hover:bg-ink/90",
        variant === "line" && "bg-surface text-fg shadow-line hover:shadow-line-strong",
        variant === "ghost" && "bg-transparent text-fg hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm font-semibold tracking-wide text-muted uppercase", className)}>{children}</p>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-muted">
      {children}
    </label>
  );
}
