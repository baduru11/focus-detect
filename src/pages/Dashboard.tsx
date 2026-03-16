import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Target, Flame, Clock, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonGradientCard } from "@/components/magicui/NeonGradientCard";
import { Ripple } from "@/components/magicui/Ripple";
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
  const isRunning = state.status === "running";

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
      className="h-full flex flex-col items-center justify-center gap-8 p-8 overflow-y-auto"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
      initial="hidden"
      animate="show"
    >
      {/* Active Profile Card — uses NeonGradientCard when running */}
      <motion.div variants={staggerItem}>
        {isRunning ? (
          <NeonGradientCard
            borderSize={1}
            borderRadius={14}
            neonColors={{ firstColor: "#00f0ff", secondColor: "#bf00ff" }}
            className="inline-block"
          >
            <div className="flex items-center gap-3 py-1 px-1">
              <Target className="w-4 h-4 text-neon-cyan/80" />
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-[0.15em] leading-none mb-0.5">
                  Active Profile
                </p>
                <p className="text-sm font-semibold text-text-primary leading-tight">
                  General Focus
                </p>
              </div>
            </div>
          </NeonGradientCard>
        ) : (
          <GlassCard className="flex items-center gap-3 py-3 px-5">
            <Target className="w-4 h-4 text-neon-cyan/60" />
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.15em] leading-none mb-0.5">
                Active Profile
              </p>
              <p className="text-sm font-semibold text-text-primary leading-tight">
                General Focus
              </p>
            </div>
          </GlassCard>
        )}
      </motion.div>

      {/* Timer Ring with Ripple behind it */}
      <motion.div variants={staggerItem} className="relative">
        {/* Ripple effect behind the timer */}
        {isRunning && (
          <Ripple
            mainCircleSize={180}
            mainCircleOpacity={0.08}
            numCircles={5}
          />
        )}

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

      {/* Quick Stats Row — elegant small cards */}
      <motion.div
        variants={staggerItem}
        className="flex items-center gap-4 flex-wrap justify-center"
      >
        <div className="card flex items-center gap-2.5 py-2.5 px-4 rounded-xl">
          <Zap className="w-3.5 h-3.5 text-neon-cyan/60" />
          <span className="text-xs text-text-secondary">
            Cycle{" "}
            <span className="text-text-primary font-semibold">
              {state.currentCycle}/{config.cyclesBeforeLong}
            </span>
          </span>
        </div>

        <div className="card flex items-center gap-2.5 py-2.5 px-4 rounded-xl">
          <Flame className="w-3.5 h-3.5 text-neon-orange/60" />
          <span className="text-xs text-text-secondary">
            Streak{" "}
            <span className="text-text-primary font-semibold">
              {state.totalCyclesCompleted}
            </span>
          </span>
        </div>

        <div className="card flex items-center gap-2.5 py-2.5 px-4 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-neon-purple/60" />
          <span className="text-xs text-text-secondary">
            Today{" "}
            <span className="text-text-primary font-semibold">
              {todayHours}h {todayMins}m
            </span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
