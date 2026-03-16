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
        duration: 0.3,
        ease: "easeOut",
        delay: 0.1,
      }}
    >
      <div
        className={cn(
          "rounded-2xl p-4 border border-white/[0.08]",
          "bg-white/[0.04] backdrop-blur-[40px]",
          "transition-all duration-200",
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
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-light truncate">
              {title}
            </span>
            <span className="text-base font-semibold text-text-primary">
              {value}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
