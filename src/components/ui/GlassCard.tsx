import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const glowColors = {
  cyan: "shadow-[0_0_8px_rgba(0,240,255,0.1)]",
  purple: "shadow-[0_0_8px_rgba(191,0,255,0.1)]",
  red: "shadow-[0_0_8px_rgba(255,0,60,0.1)]",
  green: "shadow-[0_0_8px_rgba(0,255,136,0.1)]",
} as const;

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: keyof typeof glowColors;
  hoverable?: boolean;
}

export function GlassCard({
  children,
  className,
  glow,
  hoverable = false,
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-xl p-5 border border-white/[0.06] backdrop-blur-2xl",
        "bg-[rgba(14,14,26,0.55)]",
        "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2),inset_0_0_0_0.5px_rgba(255,255,255,0.04)]",
        glow && glowColors[glow],
        hoverable && "cursor-pointer transition-all duration-200",
        className
      )}
      whileHover={
        hoverable
          ? {
              y: -2,
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
