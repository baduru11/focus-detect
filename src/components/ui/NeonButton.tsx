import { type ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden rounded-lg px-5 py-2.5 font-semibold text-sm tracking-wide transition-all duration-200 cursor-pointer border backdrop-blur-md select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-neon-cyan/15 to-neon-cyan/5 border-neon-cyan/20 text-neon-cyan hover:from-neon-cyan/20 hover:to-neon-cyan/10 hover:border-neon-cyan/30",
        danger:
          "bg-gradient-to-r from-neon-red/15 to-neon-red/5 border-neon-red/20 text-neon-red hover:from-neon-red/20 hover:to-neon-red/10 hover:border-neon-red/30",
        success:
          "bg-gradient-to-r from-neon-green/15 to-neon-green/5 border-neon-green/20 text-neon-green hover:from-neon-green/20 hover:to-neon-green/10 hover:border-neon-green/30",
        ghost:
          "bg-transparent border-white/[0.06] text-text-primary hover:bg-white/[0.04] hover:border-white/[0.1]",
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs rounded-lg",
        md: "px-5 py-2.5 text-sm rounded-lg",
        lg: "px-7 py-3 text-sm rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const glowMap = {
  primary: "0 0 12px rgba(0, 240, 255, 0.2), 0 0 2px rgba(0, 240, 255, 0.3)",
  danger: "0 0 12px rgba(255, 0, 60, 0.2), 0 0 2px rgba(255, 0, 60, 0.3)",
  success: "0 0 12px rgba(0, 255, 136, 0.2), 0 0 2px rgba(0, 255, 136, 0.3)",
  ghost: "0 0 8px rgba(255, 255, 255, 0.05)",
};

const rippleColorMap = {
  primary: "rgba(0, 240, 255, 0.2)",
  danger: "rgba(255, 0, 60, 0.2)",
  success: "rgba(0, 255, 136, 0.2)",
  ghost: "rgba(255, 255, 255, 0.1)",
};

interface Ripple {
  id: number;
  x: number;
  y: number;
}

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
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    onClick?.(e);
  };

  const v = variant ?? "primary";

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      whileHover={{
        boxShadow: glowMap[v],
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: rippleColorMap[v],
            transform: "translate(-50%, -50%)",
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
