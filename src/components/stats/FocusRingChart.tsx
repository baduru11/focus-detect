import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FocusRingChartProps {
  focusPercent: number;
  className?: string;
}

export function FocusRingChart({ focusPercent, className }: FocusRingChartProps) {
  const size = 160;
  const strokeWidth = 5;
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
        <defs>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="focusGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Distraction arc */}
        {focusPercent < 100 && (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(239,68,68,0.2)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${distractionArc} ${circumference}`}
            strokeDashoffset={-focusArc}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${distractionArc} ${circumference}` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
        )}

        {/* Focus arc */}
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
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-semibold text-text-primary tabular-nums"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {focusPercent}%
        </motion.span>
        <motion.span
          className="text-[10px] text-text-muted uppercase tracking-[0.15em] mt-1 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Focus
        </motion.span>
      </div>
    </div>
  );
}
