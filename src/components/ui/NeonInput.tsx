import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function NeonInput({
  label,
  className,
  id,
  ...props
}: NeonInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm text-text-secondary font-light"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg",
          "bg-white/[0.04] backdrop-blur-md",
          "border border-white/[0.08]",
          "text-text-primary text-sm placeholder:text-text-muted",
          "outline-none transition-all duration-200",
          "focus:border-accent focus:bg-white/[0.06]",
          "focus:ring-1 focus:ring-accent/30"
        )}
        {...props}
      />
    </div>
  );
}
