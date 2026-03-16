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
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] text-text-secondary font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full h-10 px-3.5 rounded-[10px]",
          "bg-white/[0.04]",
          "border border-white/[0.08]",
          "text-text-primary text-[13px] placeholder:text-text-muted",
          "outline-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "focus:border-accent/50 focus:bg-white/[0.06]",
          "focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
        )}
        {...props}
      />
    </div>
  );
}
