import { type ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden rounded-xl px-6 py-3 font-semibold text-sm tracking-wide transition-colors duration-200 cursor-pointer border backdrop-blur-md select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/20",
        danger:
          "bg-neon-red/10 border-neon-red/40 text-neon-red hover:bg-neon-red/20",
        success:
          "bg-neon-green/10 border-neon-green/40 text-neon-green hover:bg-neon-green/20",
        ghost:
          "bg-transparent border-border-glow text-text-primary hover:bg-white/5",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const glowMap = {
  primary: "0 0 20px rgba(0, 240, 255, 0.5), inset 0 0 20px rgba(0, 240, 255, 0.08)",
  danger: "0 0 20px rgba(255, 0, 60, 0.5), inset 0 0 20px rgba(255, 0, 60, 0.08)",
  success: "0 0 20px rgba(0, 255, 136, 0.5), inset 0 0 20px rgba(0, 255, 136, 0.08)",
  ghost: "0 0 15px rgba(0, 240, 255, 0.2)",
};

const rippleColorMap = {
  primary: "rgba(0, 240, 255, 0.3)",
  danger: "rgba(255, 0, 60, 0.3)",
  success: "rgba(0, 255, 136, 0.3)",
  ghost: "rgba(255, 255, 255, 0.15)",
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
      whileTap={{ scale: 0.95 }}
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
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
