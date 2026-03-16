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

const typeStyles: Record<string, { bg: string; label: string }> = {
  focus: { bg: "bg-neon-green", label: "Focus" },
  alarm: { bg: "bg-neon-red", label: "Alarm" },
  break: { bg: "bg-neon-purple/60", label: "Break" },
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
        <div className="h-8 rounded-full bg-white/5 flex items-center justify-center">
          <span className="text-xs text-text-muted">No sessions today</span>
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
      <div className="flex justify-between mb-2">
        <span className="text-[10px] font-mono text-text-muted">
          {formatTime(minStart)}
        </span>
        <span className="text-[10px] font-mono text-text-muted">
          {formatTime(maxEnd)}
        </span>
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 rounded-full bg-white/5 overflow-hidden">
        {sessions.map((seg, i) => {
          const left = ((seg.startMinute - minStart) / totalSpan) * 100;
          const width = ((seg.endMinute - seg.startMinute) / totalSpan) * 100;
          const style = typeStyles[seg.type];
          const isAlarm = seg.type === "alarm";

          return (
            <motion.div
              key={`${seg.type}-${seg.startMinute}-${i}`}
              className={cn(
                "absolute top-0 h-full rounded-sm cursor-pointer",
                style.bg,
                isAlarm && "z-10"
              )}
              style={{
                left: `${left}%`,
                minWidth: isAlarm ? "4px" : "2px",
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: `${Math.max(width, isAlarm ? 0.5 : 0.3)}%`,
                opacity: seg.type === "focus" ? 0.8 : seg.type === "alarm" ? 1 : 0.5,
              }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <motion.div
            className="absolute -top-10 z-20 px-2 py-1 rounded-md glass-panel border border-border-glow text-[10px] text-text-primary whitespace-nowrap pointer-events-none"
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
      <div className="flex gap-4 mt-2">
        {(["focus", "break", "alarm"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                typeStyles[t].bg,
                t === "break" && "opacity-60"
              )}
            />
            <span className="text-[10px] text-text-muted capitalize">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
