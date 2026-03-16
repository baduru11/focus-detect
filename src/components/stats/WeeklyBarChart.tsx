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
      {/* SVG definitions for gradients */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#bf00ff" />
          </linearGradient>
          <linearGradient id="barGradientToday" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#bf00ff" />
            <stop offset="100%" stopColor="#ff003c" />
          </linearGradient>
          <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="flex items-end justify-between gap-2" style={{ height: chartHeight }}>
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
                  "text-[10px] font-mono mb-1 transition-opacity",
                  isHovered || isToday ? "text-text-primary" : "text-transparent"
                )}
                animate={{ opacity: isHovered || isToday ? 1 : 0 }}
              >
                {bar.hours}h
              </motion.span>

              {/* Bar */}
              <div className="relative w-full flex justify-center">
                <motion.div
                  className={cn(
                    "w-full max-w-[36px] rounded-t-lg cursor-pointer relative",
                    isToday ? "opacity-100" : "opacity-80"
                  )}
                  style={{
                    background: isToday
                      ? "linear-gradient(to top, #00f0ff, #bf00ff, #ff003c)"
                      : "linear-gradient(to top, #00f0ff, #bf00ff)",
                    boxShadow: isToday
                      ? "0 0 16px rgba(0,240,255,0.5), 0 0 32px rgba(191,0,255,0.3)"
                      : isHovered
                      ? "0 0 12px rgba(0,240,255,0.4)"
                      : "none",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: Math.max(barHeight, 4) }}
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
                  "text-[11px] mt-2 font-medium",
                  isToday ? "text-neon-cyan" : "text-text-muted"
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
