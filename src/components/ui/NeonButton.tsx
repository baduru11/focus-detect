import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative font-medium",
    "transition-colors duration-150",
    "cursor-pointer select-none",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
    "inline-flex items-center justify-center gap-2",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-light active:bg-[#5558e8] rounded-lg",
        ghost:
          "bg-transparent text-text-secondary hover:bg-white/[0.06] hover:text-text-primary active:bg-white/[0.04] rounded-lg",
        danger:
          "bg-danger text-white hover:bg-[#fca5a5] active:bg-[#dc2626] rounded-lg",
        success:
          "bg-success text-white hover:bg-[#6ee7b7] active:bg-[#16a34a] rounded-lg",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-9 px-5 text-[13px]",
        lg: "h-10 px-6 text-sm",
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
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
