import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative overflow-hidden font-medium text-[13px] leading-none",
    "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
    "cursor-pointer select-none",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
    "inline-flex items-center justify-center",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-b from-[#717bff] to-[#5b5ef0] text-white",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(99,102,241,0.25)]",
          "hover:from-[#7c85ff] hover:to-[#6366f1]",
          "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_2px_8px_rgba(99,102,241,0.2),0_0_0_1px_rgba(99,102,241,0.35)]",
          "active:from-[#5b5ef0] active:to-[#4f46e5]",
        ].join(" "),
        ghost: [
          "bg-white/[0.04] text-text-secondary",
          "border border-white/[0.08]",
          "hover:bg-white/[0.07] hover:text-text-primary hover:border-white/[0.12]",
          "active:bg-white/[0.05]",
        ].join(" "),
        danger: [
          "bg-gradient-to-b from-[#f87171] to-[#ef4444] text-white",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.3)]",
          "hover:from-[#fca5a5] hover:to-[#f87171]",
          "active:from-[#ef4444] active:to-[#dc2626]",
        ].join(" "),
        success: [
          "bg-gradient-to-b from-[#4ade80] to-[#22c55e] text-white",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.3)]",
          "hover:from-[#86efac] hover:to-[#4ade80]",
          "active:from-[#22c55e] active:to-[#16a34a]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        md: "h-9 px-4 text-[13px] rounded-[10px] gap-2",
        lg: "h-10 px-5 text-sm rounded-[10px] gap-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface NeonButtonProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function NeonButton({
  children,
  className,
  variant = "primary",
  size,
  onClick,
  disabled,
  type = "button",
}: NeonButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      whileHover={{ y: -0.5 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
