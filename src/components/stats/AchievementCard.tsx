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
  cyan: "#6366f1",
  purple: "#a855f7",
  red: "#ef4444",
  green: "#22c55e",
};

const iconBgMap: Record<string, string> = {
  cyan: "rgba(99, 102, 241, 0.1)",
  purple: "rgba(168, 85, 247, 0.1)",
  red: "rgba(239, 68, 68, 0.1)",
  green: "rgba(34, 197, 94, 0.1)",
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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
        delay: 0.08,
      }}
    >
      <div
        className={cn(
          "rounded-2xl p-4 border border-white/[0.07]",
          "bg-gradient-to-br from-white/[0.04] to-white/[0.02]",
          "backdrop-blur-[24px]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
          "transition-all duration-200",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              color: iconColorMap[glowColor],
              backgroundColor: iconBgMap[glowColor],
            }}
          >
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-text-muted uppercase tracking-[0.1em] font-medium truncate">
              {title}
            </span>
            <span className="text-base font-semibold text-text-primary tabular-nums mt-0.5">
              {value}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
