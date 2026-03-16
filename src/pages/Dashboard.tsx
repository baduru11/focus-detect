import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Target, Flame, Clock, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PomodoroRing } from "@/components/timer/PomodoroRing";
import { TimerControls } from "@/components/timer/TimerControls";
import { usePomodoro } from "@/hooks/usePomodoro";
import type { PomodoroConfig, TimerPhase } from "@/types/pomodoro";

const DEFAULT_CONFIG: PomodoroConfig = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLong: 4,
};

function phaseTotalSeconds(phase: TimerPhase, config: PomodoroConfig): number {
  switch (phase) {
    case "work":
      return config.work * 60;
    case "shortBreak":
      return config.shortBreak * 60;
    case "longBreak":
      return config.longBreak * 60;
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const config = DEFAULT_CONFIG;

  const callbacks = useMemo(
    () => ({
      onPhaseChange: (_phase: TimerPhase) => {},
      onCycleComplete: (_cycle: number) => {},
      onTimerEnd: () => {},
    }),
    []
  );

  const { state, start, pause, resume, stop, skip } = usePomodoro(
    config,
    callbacks
  );

  const totalSeconds = phaseTotalSeconds(state.phase, config);
  const isIdle = state.status === "idle";

  const handleStart = useCallback(() => start(), [start]);
  const handlePause = useCallback(() => pause(), [pause]);
  const handleResume = useCallback(() => resume(), [resume]);
  const handleStop = useCallback(() => stop(), [stop]);
  const handleSkip = useCallback(() => skip(), [skip]);

  const elapsedMinutes = Math.floor(
    ((totalSeconds - state.secondsRemaining) * state.totalCyclesCompleted) / 60
  );
  const todayHours = Math.floor(elapsedMinutes / 60);
  const todayMins = elapsedMinutes % 60;

  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center gap-6 p-6 overflow-y-auto"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
      initial="hidden"
      animate="show"
    >
      {/* Active Profile Card */}
      <motion.div variants={staggerItem}>
        <GlassCard glow="cyan" className="flex items-center gap-3 py-3 px-5">
          <Target className="w-5 h-5 text-neon-cyan" />
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.15em] leading-none mb-0.5">
              Active Profile
            </p>
            <p className="text-sm font-semibold text-text-primary leading-tight">
              General Focus
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Timer Ring */}
      <motion.div variants={staggerItem}>
        {isIdle ? (
          <motion.div
            className="flex flex-col items-center justify-center"
            style={{ height: 280 }}
          >
            <PomodoroRing
              secondsRemaining={state.secondsRemaining}
              totalSeconds={totalSeconds}
              phase={state.phase}
              status={state.status}
              currentCycle={state.currentCycle}
              cyclesBeforeLong={config.cyclesBeforeLong}
            />
          </motion.div>
        ) : (
          <PomodoroRing
            secondsRemaining={state.secondsRemaining}
            totalSeconds={totalSeconds}
            phase={state.phase}
            status={state.status}
            currentCycle={state.currentCycle}
            cyclesBeforeLong={config.cyclesBeforeLong}
          />
        )}
      </motion.div>

      {/* Timer Controls */}
      <motion.div variants={staggerItem}>
        <TimerControls
          status={state.status}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onSkip={handleSkip}
        />
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        variants={staggerItem}
        className="flex items-center gap-3 flex-wrap justify-center"
      >
        <GlassCard className="flex items-center gap-2 py-2.5 px-4 !rounded-xl">
          <Zap className="w-4 h-4 text-neon-cyan" />
          <span className="text-xs text-text-secondary">
            Cycle{" "}
            <span className="text-text-primary font-semibold">
              {state.currentCycle}/{config.cyclesBeforeLong}
            </span>
          </span>
        </GlassCard>

        <GlassCard className="flex items-center gap-2 py-2.5 px-4 !rounded-xl">
          <Flame className="w-4 h-4 text-neon-orange" />
          <span className="text-xs text-text-secondary">
            Streak{" "}
            <span className="text-text-primary font-semibold">
              {state.totalCyclesCompleted}
            </span>
          </span>
        </GlassCard>

        <GlassCard className="flex items-center gap-2 py-2.5 px-4 !rounded-xl">
          <Clock className="w-4 h-4 text-neon-purple" />
          <span className="text-xs text-text-secondary">
            Today{" "}
            <span className="text-text-primary font-semibold">
              {todayHours}h {todayMins}m
            </span>
          </span>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
