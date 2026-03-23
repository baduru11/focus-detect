import { type ReactNode, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hoverable?: boolean;
  /** Accent tint color — applies a subtle color wash to the glass surface */
  tint?: string;
  /** Enable pointer-tracking specular highlight (Liquid Glass effect) */
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [specular, setSpecular] = useState({ x: 50, y: 0, opacity: 0 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setSpecular({ x, y, opacity: 1 });
    },
    [interactive]
  );

  const handlePointerLeave = useCallback(() => {
    if (!interactive) return;
    setSpecular((prev) => ({ ...prev, opacity: 0 }));
  }, [interactive]);

  return (
    <motion.div
      ref={cardRef}
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
        hoverable &&
          "cursor-pointer hover:bg-gradient-to-br hover:from-white/[0.07] hover:via-white/[0.04] hover:to-white/[0.055] hover:border-white/[0.12] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.25),0_12px_32px_rgba(0,0,0,0.15)]",
        className
      )}
      whileTap={hoverable || interactive ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.1 }}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
    >
      {/* Specular highlight — pointer-tracking or static */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 transition-opacity duration-300"
        style={
          interactive
            ? {
                background: `radial-gradient(600px circle at ${specular.x}% ${specular.y}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 30%, transparent 70%)`,
                opacity: specular.opacity,
              }
            : {
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.01) 100%)",
              }
        }
      />
      {/* Accent tint overlay */}
      {tint && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 opacity-[0.06]"
          style={{ background: tint }}
        />
      )}
      {/* Static specular for interactive cards (visible when pointer is not over) */}
      {interactive && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 25%, transparent 50%, rgba(255,255,255,0.01) 100%)",
            opacity: specular.opacity === 0 ? 1 : 0,
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
}
