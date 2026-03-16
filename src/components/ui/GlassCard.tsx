import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hoverable?: boolean;
}

export function GlassCard({
  children,
  className,
  glow = false,
  hoverable = false,
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl p-5",
        // Glass background with gradient for liquid depth
        "bg-gradient-to-br from-white/[0.055] via-white/[0.03] to-white/[0.045]",
        "backdrop-blur-[32px] backdrop-saturate-[1.6]",
        // Border with inner light edge
        "border border-white/[0.08]",
        // Layered shadow for depth
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.12)]",
        // Smooth transition
        "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        glow && "border-accent/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(99,102,241,0.12),0_0_12px_rgba(99,102,241,0.06)]",
        hoverable && "cursor-pointer hover:bg-gradient-to-br hover:from-white/[0.07] hover:via-white/[0.04] hover:to-white/[0.055] hover:border-white/[0.12] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.25),0_12px_32px_rgba(0,0,0,0.15)]",
        className
      )}
    >
      {/* Specular highlight — top-left light refraction */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.01) 100%)",
        }}
      />
      <div className="relative z-[1]">
        {children}
      </div>
    </motion.div>
  );
}
