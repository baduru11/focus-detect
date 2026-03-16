import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const glowColors = {
  cyan: "shadow-[0_0_20px_rgba(0,240,255,0.4),inset_0_0_20px_rgba(0,240,255,0.06)]",
  purple: "shadow-[0_0_20px_rgba(191,0,255,0.4),inset_0_0_20px_rgba(191,0,255,0.06)]",
  red: "shadow-[0_0_20px_rgba(255,0,60,0.4),inset_0_0_20px_rgba(255,0,60,0.06)]",
  green: "shadow-[0_0_20px_rgba(0,255,136,0.4),inset_0_0_20px_rgba(0,255,136,0.06)]",
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
        "glass-panel rounded-2xl p-6",
        glow && glowColors[glow],
        hoverable && "cursor-pointer",
        className
      )}
      style={{ perspective: 800 }}
      whileHover={
        hoverable
          ? {
              scale: 1.02,
              rotateX: 2,
              rotateY: -2,
              boxShadow: glow
                ? undefined
                : "0 0 25px rgba(0, 240, 255, 0.3), inset 0 0 25px rgba(0, 240, 255, 0.05)",
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
