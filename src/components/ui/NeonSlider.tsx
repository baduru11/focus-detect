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
          <span className="text-sm font-mono text-accent-light">
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
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/[0.08]" />

        {/* Filled track — indigo gradient */}
        <div
          className="absolute left-0 h-1.5 rounded-full"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
          }}
        />

        {/* Thumb — small white circle */}
        <motion.div
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-accent shadow-sm"
          style={{
            left: `calc(${percent}% - 7px)`,
          }}
          animate={{ scale: dragging ? 1.2 : 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              className="absolute -top-9 px-2 py-1 rounded-md bg-surface-solid border border-white/[0.1] text-xs font-mono text-text-primary whitespace-nowrap pointer-events-none"
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
