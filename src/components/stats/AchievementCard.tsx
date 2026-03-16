import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  glowColor?: "cyan" | "purple" | "red" | "green";
  className?: string;
}

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      }}
    >
      <div
        className={cn(
          "rounded-xl p-4 border border-white/[0.06] backdrop-blur-2xl",
          "bg-[rgba(14,14,26,0.55)]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04]"
            style={{
              color: iconColorMap[glowColor],
            }}
          >
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-text-muted uppercase tracking-wider truncate">
              {title}
            </span>
            <span className="text-base font-bold font-mono text-text-primary">
              {value}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
