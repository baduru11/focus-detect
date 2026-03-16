import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeonSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  className?: string;
}

export function NeonSlider({
  min,
  max,
  value,
  onChange,
  label,
  unit = "",
  className,
}: NeonSliderProps) {
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percent = ((value - min) / (max - min)) * 100;
  const showTooltip = hovering || dragging;

  const updateValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = Math.round(min + ratio * (max - min));
      onChange(newValue);
    },
    [min, max, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging) {
      updateValue(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-sm font-mono text-neon-cyan">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/5" />

        {/* Filled track with glow */}
        <div
          className="absolute left-0 h-1.5 rounded-full bg-neon-cyan"
          style={{
            width: `${percent}%`,
            boxShadow: "0 0 10px rgba(0, 240, 255, 0.5), 0 0 4px rgba(0, 240, 255, 0.8)",
          }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-neon-cyan border-2 border-void"
          style={{
            left: `calc(${percent}% - 8px)`,
            boxShadow: "0 0 12px rgba(0, 240, 255, 0.6)",
          }}
          animate={{ scale: dragging ? 1.3 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className="absolute -top-9 px-2 py-1 rounded-md bg-surface-solid border border-border-glow text-xs font-mono text-neon-cyan whitespace-nowrap pointer-events-none"
              style={{ left: `calc(${percent}% - 20px)` }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {value}
              {unit}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
