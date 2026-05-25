"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type LabelProps = {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export function Field({ label, hint, error, children }: LabelProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-fg-muted">
          {label}
        </span>
      )}
      {children}
      {(hint || error) && (
        <span className={cn("mt-1 block text-xs", error ? "text-danger" : "text-fg-dim")}>
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "block w-full rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-[15px] text-fg placeholder:text-fg-dim",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block w-full rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-[15px] text-fg placeholder:text-fg-dim",
          "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none",
          className
        )}
        {...props}
      />
    );
  }
);
