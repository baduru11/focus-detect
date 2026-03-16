import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

interface DistractorItem {
  name: string;
  count: number;
}

interface DistractorLeaderboardProps {
  items: DistractorItem[];
  className?: string;
}

export function DistractorLeaderboard({
  items,
  className,
}: DistractorLeaderboardProps) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  if (items.length === 0) {
    return (
      <GlassCard className={className}>
        <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
          Top Distractors
        </h3>
        <p className="text-xs text-text-muted text-center py-4">
          No distractions recorded yet
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={className}>
      <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
        Top Distractors
      </h3>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const proportion = (item.count / maxCount) * 100;
          const isWorst = i === 0;

          return (
            <motion.div
              key={item.name}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              {/* Rank */}
              <span
                className={cn(
                  "w-5 text-right text-xs font-mono font-bold flex-shrink-0",
                  isWorst ? "text-neon-red" : "text-text-muted"
                )}
              >
                {i + 1}
              </span>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium truncate",
                      isWorst ? "text-neon-red" : "text-text-primary"
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted ml-2 flex-shrink-0">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isWorst ? "bg-neon-red" : "bg-neon-cyan/60"
                    )}
                    style={
                      isWorst
                        ? {
                            boxShadow:
                              "0 0 8px rgba(255,0,60,0.5)",
                          }
                        : undefined
                    }
                    initial={{ width: 0 }}
                    animate={{ width: `${proportion}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2 + i * 0.1,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
