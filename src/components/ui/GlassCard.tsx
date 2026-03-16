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
        "bg-white/[0.04] backdrop-blur-[40px]",
        "border border-white/[0.08]",
        "transition-all duration-200 ease-out",
        glow && "border-accent/20 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]",
        hoverable && "cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.12]",
        className
      )}
    >
      {/* Inner light gradient for glass depth */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02]" />
      <div className="relative z-[1]">
        {children}
      </div>
    </motion.div>
  );
}
