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
          "relative w-9 h-5 rounded-full transition-colors duration-200",
          checked
            ? "bg-accent"
            : "bg-white/[0.1]"
        )}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{
            left: checked ? 18 : 2,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </button>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  );
}
