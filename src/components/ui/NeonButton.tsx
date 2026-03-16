import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(99,102,241,0.3)] hover:shadow-[0_2px_8px_rgba(99,102,241,0.25),0_0_0_1px_rgba(99,102,241,0.4)] hover:brightness-110",
        ghost:
          "bg-transparent text-text-secondary border border-white/[0.08] hover:bg-white/[0.05] hover:text-text-primary hover:border-white/[0.12]",
        danger:
          "bg-[#ef4444] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110",
        success:
          "bg-[#22c55e] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:brightness-110",
      },
      size: {
        sm: "px-3 py-1.5 text-xs rounded-lg",
        md: "px-4 py-2 text-sm rounded-lg",
        lg: "px-6 py-2.5 text-sm rounded-lg",
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
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
