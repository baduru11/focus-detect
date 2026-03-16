import { motion, AnimatePresence } from "framer-motion";
import type { TimerPhase, TimerStatus } from "@/types/pomodoro";
import { cn } from "@/lib/utils";

interface PomodoroRingProps {
  secondsRemaining: number;
  totalSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  currentCycle: number;
  cyclesBeforeLong: number;
}

const phaseColors: Record<TimerPhase, { glow: string; label: string; gradient: [string, string] }> = {
  work: {
    glow: "drop-shadow(0 0 12px rgba(0, 240, 255, 0.6)) drop-shadow(0 0 24px rgba(0, 240, 255, 0.3))",
    label: "FOCUS",
    gradient: ["#00f0ff", "#bf00ff"],
  },
  shortBreak: {
    glow: "drop-shadow(0 0 12px rgba(0, 255, 136, 0.6)) drop-shadow(0 0 24px rgba(0, 255, 136, 0.3))",
    label: "SHORT BREAK",
    gradient: ["#00ff88", "#00f0ff"],
  },
  longBreak: {
    glow: "drop-shadow(0 0 12px rgba(0, 255, 136, 0.6)) drop-shadow(0 0 24px rgba(0, 255, 136, 0.3))",
    label: "LONG BREAK",
    gradient: ["#00ff88", "#bf00ff"],
  },
};

const phaseLabelColor: Record<TimerPhase, string> = {
  work: "text-neon-cyan",
  shortBreak: "text-neon-green",
  longBreak: "text-neon-green",
};

export function PomodoroRing({
  secondsRemaining,
  totalSeconds,
  phase,
  status,
  currentCycle,
  cyclesBeforeLong,
}: PomodoroRingProps) {
  const radius = 120;
  const strokeWidth = 8;
  const svgSize = (radius + strokeWidth) * 2;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const colors = phaseColors[phase];
  const gradientId = `ring-gradient-${phase}`;
  const isRunning = status === "running";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: svgSize + 40,
          height: svgSize + 40,
          background: `radial-gradient(circle, ${colors.gradient[0]}08 0%, transparent 70%)`,
        }}
        animate={
          isRunning
            ? { opacity: [0.4, 0.8, 0.4], scale: [0.98, 1.02, 0.98] }
            : { opacity: 0.3, scale: 1 }
        }
        transition={
          isRunning
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.5 }
        }
      />

      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="relative z-10"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient[0]} />
            <stop offset="100%" stopColor={colors.gradient[1]} />
          </linearGradient>
        </defs>

        {/* Track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const isMajor = i % 5 === 0;
          const innerR = radius - (isMajor ? 16 : 12);
          const outerR = radius - 8;
          return (
            <line
              key={i}
              x1={center + innerR * Math.cos(rad)}
              y1={center + innerR * Math.sin(rad)}
              x2={center + outerR * Math.cos(rad)}
              y2={center + outerR * Math.sin(rad)}
              stroke={isMajor ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}
              strokeWidth={isMajor ? 1.5 : 0.75}
            />
          );
        })}

        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            filter: isRunning ? colors.glow : colors.glow.replace(/0\.\d/g, (m) => String(Number(m) * 0.5)),
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={timeDisplay}
            className="text-5xl font-mono font-bold text-text-primary tracking-wider"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {timeDisplay}
          </motion.span>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em] mt-2",
              phaseLabelColor[phase]
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {colors.label}
          </motion.span>
        </AnimatePresence>

        <span className="text-[11px] text-text-muted mt-1.5 tracking-wide">
          Cycle {currentCycle} of {cyclesBeforeLong}
        </span>
      </div>
    </div>
  );
}
