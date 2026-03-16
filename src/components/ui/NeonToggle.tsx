import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeonToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function NeonToggle({
  checked,
  onChange,
  label,
  className,
}: NeonToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-12 h-6 rounded-full border transition-colors duration-200",
          checked
            ? "bg-neon-cyan/20 border-neon-cyan/50"
            : "bg-white/5 border-white/10"
        )}
        style={
          checked
            ? {
                boxShadow:
                  "0 0 15px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.05)",
              }
            : undefined
        }
      >
        <motion.div
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full",
            checked ? "bg-neon-cyan" : "bg-text-secondary"
          )}
          animate={{
            left: checked ? 24 : 2,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={
            checked
              ? { boxShadow: "0 0 10px rgba(0, 240, 255, 0.6)" }
              : undefined
          }
        />
      </button>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  );
}
