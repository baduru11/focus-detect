import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

interface AchievementCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  glowColor?: "cyan" | "purple" | "red" | "green";
  className?: string;
}

const borderColorMap: Record<string, string> = {
  cyan: "border-neon-cyan/40",
  purple: "border-neon-purple/40",
  red: "border-neon-red/40",
  green: "border-neon-green/40",
};

const iconColorMap: Record<string, string> = {
  cyan: "#00f0ff",
  purple: "#bf00ff",
  red: "#ff003c",
  green: "#00ff88",
};

export function AchievementCard({
  icon,
  title,
  value,
  glowColor = "cyan",
  className,
}: AchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      }}
    >
      <GlassCard
        glow={glowColor}
        className={cn("border", borderColorMap[glowColor], className)}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white/5"
            style={{
              color: iconColorMap[glowColor],
              boxShadow: `0 0 12px ${iconColorMap[glowColor]}33`,
            }}
          >
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-text-muted uppercase tracking-wider truncate">
              {title}
            </span>
            <span className="text-lg font-bold font-mono text-text-primary">
              {value}
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
