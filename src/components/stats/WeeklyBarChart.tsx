import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BarData {
  day: string;
  hours: number;
}

interface WeeklyBarChartProps {
  data: BarData[];
  className?: string;
}

export function WeeklyBarChart({ data, className }: WeeklyBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxHours = Math.max(...data.map((d) => d.hours), 0.5);
  const chartHeight = 180;
  const todayIdx = data.length - 1;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-3" style={{ height: chartHeight }}>
        {data.map((bar, i) => {
          const barHeight = maxHours > 0 ? (bar.hours / maxHours) * (chartHeight - 32) : 0;
          const isToday = i === todayIdx;
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={bar.day}
              className="flex flex-col items-center flex-1 h-full justify-end"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Hours label on hover */}
              <motion.span
                className={cn(
                  "text-[10px] font-mono mb-1.5 transition-opacity",
                  isHovered || isToday ? "text-text-secondary" : "text-transparent"
                )}
                animate={{ opacity: isHovered || isToday ? 1 : 0 }}
              >
                {bar.hours}h
              </motion.span>

              {/* Bar — thin with rounded tops */}
              <div className="relative w-full flex justify-center">
                <motion.div
                  className={cn(
                    "w-full max-w-[24px] rounded-t-md cursor-pointer relative"
                  )}
                  style={{
                    background: isToday
                      ? "linear-gradient(to top, rgba(0,240,255,0.5), rgba(191,0,255,0.4))"
                      : "linear-gradient(to top, rgba(0,240,255,0.25), rgba(191,0,255,0.15))",
                    boxShadow: isToday
                      ? "0 0 8px rgba(0,240,255,0.15)"
                      : isHovered
                      ? "0 0 6px rgba(0,240,255,0.1)"
                      : "none",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(barHeight, 3) }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>

              {/* Day label */}
              <span
                className={cn(
                  "text-[10px] mt-2 font-medium",
                  isToday ? "text-neon-cyan/70" : "text-text-muted"
                )}
              >
                {bar.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
