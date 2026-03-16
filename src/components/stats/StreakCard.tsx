import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

interface StreakCardProps {
  current: number;
  best: number;
  className?: string;
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

export function StreakCard({ current, best, className }: StreakCardProps) {
  const displayCount = useCountUp(current);
  const hasStreak = current > 0;

  return (
    <GlassCard
      className={cn("relative overflow-hidden", className)}
    >
      <div className="flex flex-col items-center text-center gap-2">
        {/* Fire animation */}
        <motion.div
          className="text-3xl"
          animate={
            hasStreak
              ? {
                  scale: [1, 1.1, 1],
                  filter: [
                    "brightness(1)",
                    "brightness(1.2)",
                    "brightness(1)",
                  ],
                }
              : {}
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {hasStreak ? "\uD83D\uDD25" : "\u2744\uFE0F"}
        </motion.div>

        {/* Current streak number */}
        <motion.span
          className={cn(
            "text-4xl font-bold font-mono",
            hasStreak ? "text-neon-green/80" : "text-text-muted"
          )}
          style={
            hasStreak
              ? {
                  textShadow:
                    "0 0 12px rgba(0,255,136,0.3)",
                }
              : undefined
          }
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {displayCount}
        </motion.span>

        <span className="text-xs text-text-muted uppercase tracking-wider">
          Day Streak
        </span>

        {/* Best streak */}
        <div className="mt-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
          <span className="text-[10px] text-text-muted">
            Best: <span className="text-text-primary font-mono">{best}</span>
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
