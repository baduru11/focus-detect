import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FocusRingChartProps {
  focusPercent: number;
  className?: string;
}

export function FocusRingChart({ focusPercent, className }: FocusRingChartProps) {
  const size = 160;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const focusArc = (focusPercent / 100) * circumference;
  const distractionArc = circumference - focusArc;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* SVG filter for subtle glow */}
        <defs>
          <filter id="focusGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
        />

        {/* Distraction arc */}
        {focusPercent < 100 && (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,0,60,0.3)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${distractionArc} ${circumference}`}
            strokeDashoffset={-focusArc}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${distractionArc} ${circumference}` }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          />
        )}

        {/* Focus arc with subtle glow */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#focusGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${focusArc} ${circumference}`}
          filter="url(#focusGlow)"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${focusArc} ${circumference}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ opacity: 0.85 }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold font-mono text-text-primary"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {focusPercent}%
        </motion.span>
        <motion.span
          className="text-[10px] text-text-muted uppercase tracking-widest mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Focus
        </motion.span>
      </div>
    </div>
  );
}
