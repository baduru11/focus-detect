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
          "relative w-10 h-[22px] rounded-full transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]",
          checked
            ? "bg-accent shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_0_8px_rgba(99,102,241,0.15)]"
            : "bg-white/[0.08]"
        )}
      >
        <motion.div
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
          animate={{
            left: checked ? 21 : 3,
          }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        />
      </button>
      {label && (
        <span className="text-[13px] text-text-secondary font-medium">{label}</span>
      )}
    </label>
  );
}
