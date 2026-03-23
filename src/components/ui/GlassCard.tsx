import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hoverable?: boolean;
  /** Accent tint color — applies a subtle color wash to the glass surface */
  tint?: string;
  /** Enable Liquid Glass interaction — subtle surface shift on hover + press scale */
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  glow = false,
  hoverable = false,
  tint,
  interactive = false,
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl p-5",
        // Glass background with gradient for liquid depth
        "bg-gradient-to-br from-white/[0.09] via-white/[0.05] to-white/[0.07]",
        "backdrop-blur-[40px] backdrop-saturate-[1.8]",
        // Border with inner light edge
        "border border-white/[0.12]",
        // Layered shadow for depth
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_3px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2)]",
        // Smooth transition
        "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        glow &&
          "border-accent/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(99,102,241,0.12),0_0_12px_rgba(99,102,241,0.06)]",
        (hoverable || interactive) &&
          "cursor-pointer hover:from-white/[0.11] hover:via-white/[0.06] hover:to-white/[0.08] hover:border-white/[0.15] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_2px_6px_rgba(0,0,0,0.25),0_12px_32px_rgba(0,0,0,0.15)]",
        className
      )}
      whileTap={hoverable || interactive ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.1 }}
    >
      {/* Specular highlight — top-left light refraction */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.01) 100%)",
        }}
      />
      {/* Accent tint overlay */}
      {tint && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 opacity-[0.06]"
          style={{ background: tint }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
