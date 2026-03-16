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
          className="text-sm text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl",
          "bg-white/[0.03] backdrop-blur-md",
          "border border-transparent border-b-border-glow",
          "text-text-primary text-sm placeholder:text-text-muted",
          "outline-none transition-all duration-200",
          "focus:border-b-neon-cyan focus:bg-white/[0.06]",
          "focus:shadow-[0_2px_15px_rgba(0,240,255,0.15)]"
        )}
        {...props}
      />
    </div>
  );
}
