import { Play, Pause, Square, SkipForward } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import type { TimerStatus } from "@/types/pomodoro";
import { motion } from "framer-motion";

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onSkip,
}: TimerControlsProps) {
  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isPaused = status === "paused";

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Stop button - only when not idle */}
      {!isIdle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <NeonButton variant="danger" size="md" onClick={onStop}>
            <span className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              Stop
            </span>
          </NeonButton>
        </motion.div>
      )}

      {/* Play / Pause toggle */}
      {isIdle && (
        <NeonButton variant="primary" size="lg" onClick={onStart}>
          <span className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Start Focus
          </span>
        </NeonButton>
      )}

      {isRunning && (
        <NeonButton variant="primary" size="md" onClick={onPause}>
          <span className="flex items-center gap-2">
            <Pause className="w-4 h-4" />
            Pause
          </span>
        </NeonButton>
      )}

      {isPaused && (
        <NeonButton variant="success" size="md" onClick={onResume}>
          <span className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Resume
          </span>
        </NeonButton>
      )}

      {/* Skip button - only when not idle */}
      {!isIdle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <NeonButton variant="ghost" size="md" onClick={onSkip}>
            <span className="flex items-center gap-2">
              <SkipForward className="w-4 h-4" />
              Skip
            </span>
          </NeonButton>
        </motion.div>
      )}
    </motion.div>
  );
}
