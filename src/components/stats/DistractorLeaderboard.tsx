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
        <h3 className="text-[11px] font-semibold text-text-muted mb-4 uppercase tracking-[0.1em]">
          Top Distractors
        </h3>
        <p className="text-[13px] text-text-muted text-center py-5">
          No distractions recorded yet
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={className}>
      <h3 className="text-[11px] font-semibold text-text-muted mb-5 uppercase tracking-[0.1em]">
        Top Distractors
      </h3>
      <div className="flex flex-col gap-3.5">
        {items.map((item, i) => {
          const proportion = (item.count / maxCount) * 100;

          return (
            <motion.div
              key={item.name}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              {/* Rank */}
              <span
                className={cn(
                  "w-5 text-right text-[11px] font-mono font-medium flex-shrink-0 tabular-nums",
                  "text-text-muted"
                )}
              >
                {i + 1}
              </span>

              {/* Name + count */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium truncate text-text-primary">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-mono text-text-muted ml-2 flex-shrink-0 tabular-nums">
                    {item.count}
                  </span>
                </div>
                <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, rgba(99,102,241,0.5), rgba(99,102,241,0.15))",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${proportion}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.15 + i * 0.08,
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
