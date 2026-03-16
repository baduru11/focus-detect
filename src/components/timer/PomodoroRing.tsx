import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TimerPhase, TimerStatus } from "@/types/pomodoro";

interface PomodoroRingProps {
  secondsRemaining: number;
  totalSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  currentCycle: number;
  cyclesBeforeLong: number;
}

const phaseConfig: Record<TimerPhase, { label: string; gradient: [string, string] }> = {
  work: {
    label: "FOCUS",
    gradient: ["#818cf8", "#a78bfa"],
  },
  shortBreak: {
    label: "SHORT BREAK",
    gradient: ["#34d399", "#6ee7b7"],
  },
  longBreak: {
    label: "LONG BREAK",
    gradient: ["#34d399", "#818cf8"],
  },
};

const phaseLabelColor: Record<TimerPhase, string> = {
  work: "text-accent-light",
  shortBreak: "text-success",
  longBreak: "text-success",
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
  const strokeWidth = 6;
  const svgSize = (radius + strokeWidth) * 2;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const config = phaseConfig[phase];
  const gradientId = `ring-gradient-${phase}`;
  const isRunning = status === "running";

  return (
    <div className="relative flex items-center justify-center">
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: svgSize + 40,
          height: svgSize + 40,
          background: `radial-gradient(circle, ${config.gradient[0]}06 0%, transparent 70%)`,
        }}
        animate={
          isRunning
            ? { opacity: [0.3, 0.6, 0.3] }
            : { opacity: 0.2 }
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
            <stop offset="0%" stopColor={config.gradient[0]} />
            <stop offset="100%" stopColor={config.gradient[1]} />
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

        {/* Progress ring — clean gradient stroke with subtle shadow */}
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
            filter: `drop-shadow(0 0 2px ${config.gradient[0]}26)`,
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
            className="text-5xl font-light text-text-primary tracking-wider font-mono"
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
              "text-xs font-medium uppercase tracking-[0.2em] mt-2",
              phaseLabelColor[phase]
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {config.label}
          </motion.span>
        </AnimatePresence>

        <span className="text-[11px] text-text-muted mt-1.5 tracking-wide font-light">
          Cycle {currentCycle} of {cyclesBeforeLong}
        </span>
      </div>
    </div>
  );
}
