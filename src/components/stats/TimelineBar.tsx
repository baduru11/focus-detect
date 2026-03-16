import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineSegment {
  startMinute: number;
  endMinute: number;
  type: "focus" | "alarm" | "break";
}

interface TimelineBarProps {
  sessions: TimelineSegment[];
  className?: string;
}

const typeStyles: Record<string, { color: string; label: string }> = {
  focus: { color: "rgba(99, 102, 241, 0.55)", label: "Focus" },
  alarm: { color: "rgba(239, 68, 68, 0.5)", label: "Alarm" },
  break: { color: "rgba(34, 197, 94, 0.4)", label: "Break" },
};

const legendColors: Record<string, string> = {
  focus: "bg-accent/50",
  alarm: "bg-danger/45",
  break: "bg-success/35",
};

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function TimelineBar({ sessions, className }: TimelineBarProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (sessions.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="h-6 rounded-lg bg-white/[0.025] flex items-center justify-center border border-white/[0.04]">
          <span className="text-[11px] text-text-muted">No sessions today</span>
        </div>
      </div>
    );
  }

  const minStart = Math.min(...sessions.map((s) => s.startMinute));
  const maxEnd = Math.max(...sessions.map((s) => s.endMinute));
  const totalSpan = maxEnd - minStart || 1;

  return (
    <div className={cn("w-full", className)}>
      {/* Time labels */}
      <div className="flex justify-between mb-2.5">
        <span className="text-[10px] font-mono text-text-muted tabular-nums">
          {formatTime(minStart)}
        </span>
        <span className="text-[10px] font-mono text-text-muted tabular-nums">
          {formatTime(maxEnd)}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-[4px] rounded-full bg-white/[0.04] overflow-hidden">
        {sessions.map((seg, i) => {
          const left = ((seg.startMinute - minStart) / totalSpan) * 100;
          const width = ((seg.endMinute - seg.startMinute) / totalSpan) * 100;
          const style = typeStyles[seg.type];
          const isAlarm = seg.type === "alarm";

          return (
            <motion.div
              key={`${seg.type}-${seg.startMinute}-${i}`}
              className={cn(
                "absolute top-0 h-full rounded-full cursor-pointer",
                isAlarm && "z-10"
              )}
              style={{
                left: `${left}%`,
                minWidth: isAlarm ? "3px" : "2px",
                backgroundColor: style.color,
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: `${Math.max(width, isAlarm ? 0.5 : 0.3)}%`,
                opacity: 1,
              }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <motion.div
            className="absolute -top-10 z-20 px-2.5 py-1.5 rounded-lg bg-surface-solid border border-white/[0.1] text-[10px] text-text-primary whitespace-nowrap pointer-events-none shadow-lg"
            style={{
              left: `${((sessions[hoveredIdx].startMinute - minStart) / totalSpan) * 100}%`,
              transform: "translateX(-25%)",
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {typeStyles[sessions[hoveredIdx].type].label}:{" "}
            {formatTime(sessions[hoveredIdx].startMinute)} -{" "}
            {formatTime(sessions[hoveredIdx].endMinute)}
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-3.5">
        {(["focus", "break", "alarm"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                legendColors[t]
              )}
            />
            <span className="text-[10px] text-text-muted capitalize font-medium">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
