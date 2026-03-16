import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Flame, Clock, Zap, Eye, Monitor, ChevronDown } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Ripple } from "@/components/magicui/Ripple";
import { PomodoroRing } from "@/components/timer/PomodoroRing";
import { TimerControls } from "@/components/timer/TimerControls";
import { DetectionStatus } from "@/components/detection/DetectionStatus";
import { useApp } from "@/context/AppContext";
import type { PomodoroConfig, TimerPhase } from "@/types/pomodoro";
import type { ActiveWindowInfo } from "@/services/detectionService";

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

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}

const resultColors: Record<string, string> = {
  on_task: "text-emerald-400",
  off_task: "text-red-400",
  ambiguous: "text-amber-400",
};

const resultLabels: Record<string, string> = {
  on_task: "On Task",
  off_task: "Off Task",
  ambiguous: "Ambiguous",
};

export default function Dashboard() {
  const {
    pomodoroState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipPhase,
    activeProfile,
    detectionState,
    graceRemaining,
    alarmLevel,
    lastCheckedWindow,
    recentChecks,
    todayFocusMinutes,
    currentStreak,
  } = useApp();

  const config = activeProfile?.pomodoro ?? DEFAULT_CONFIG;
  const totalSeconds = phaseTotalSeconds(pomodoroState.phase, config);
  const isIdle = pomodoroState.status === "idle";
  const isRunning = pomodoroState.status === "running";

  const handleStart = useCallback(() => startTimer(), [startTimer]);
  const handlePause = useCallback(() => pauseTimer(), [pauseTimer]);
  const handleResume = useCallback(() => resumeTimer(), [resumeTimer]);
  const handleStop = useCallback(() => stopTimer(), [stopTimer]);
  const handleSkip = useCallback(() => skipPhase(), [skipPhase]);

  const todayHours = Math.floor(todayFocusMinutes / 60);
  const todayMins = Math.floor(todayFocusMinutes % 60);

  return (
    <motion.div
      className="h-full flex flex-col items-center justify-start gap-7 px-8 py-10 overflow-y-auto"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
      initial="hidden"
      animate="show"
    >
      {/* Active Profile Card */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3 py-2 px-4 rounded-lg bg-white/[0.05] border border-white/[0.08]">
          <Target className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-secondary">
            {activeProfile?.name ?? "No Profile"}
          </span>
        </div>
      </motion.div>

      {/* Timer Ring with Ripple */}
      <motion.div variants={staggerItem} className="relative">
        {isRunning && (
          <Ripple
            mainCircleSize={180}
            mainCircleOpacity={0.05}
            numCircles={5}
          />
        )}

        {isIdle ? (
          <motion.div
            className="flex flex-col items-center justify-center"
            style={{ height: 280 }}
          >
            <PomodoroRing
              secondsRemaining={pomodoroState.secondsRemaining}
              totalSeconds={totalSeconds}
              phase={pomodoroState.phase}
              status={pomodoroState.status}
              currentCycle={pomodoroState.currentCycle}
              cyclesBeforeLong={config.cyclesBeforeLong}
            />
          </motion.div>
        ) : (
          <PomodoroRing
            secondsRemaining={pomodoroState.secondsRemaining}
            totalSeconds={totalSeconds}
            phase={pomodoroState.phase}
            status={pomodoroState.status}
            currentCycle={pomodoroState.currentCycle}
            cyclesBeforeLong={config.cyclesBeforeLong}
          />
        )}
      </motion.div>

      {/* Timer Controls */}
      <motion.div variants={staggerItem}>
        <TimerControls
          status={pomodoroState.status}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onSkip={handleSkip}
        />
      </motion.div>

      {/* Detection Status Panel */}
      {!isIdle && (
        <motion.div
          variants={staggerItem}
          className="w-full max-w-sm"
        >
          <GlassCard className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                <Monitor className="w-3 h-3 text-accent-light" strokeWidth={1.8} />
              </div>
              <span className="text-[11px] text-text-muted uppercase tracking-[0.12em] font-semibold">
                Detection Status
              </span>
            </div>

            {/* Status badge */}
            <DetectionStatus
              detectionState={detectionState}
              graceRemaining={graceRemaining}
              alarmLevel={alarmLevel}
              lastWindow={lastCheckedWindow}
            />

            {/* Last checked window */}
            {lastCheckedWindow && (
              <div className="mt-3.5 flex items-start gap-2.5 py-2.5 px-3 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Eye className="w-3 h-3 text-text-muted" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5 font-medium">
                    Active Window
                  </p>
                  <p className="text-[13px] text-text-primary font-medium leading-tight">
                    {lastCheckedWindow.app_name || lastCheckedWindow.process_name}
                  </p>
                  <p className="text-[11px] text-text-muted leading-tight truncate mt-0.5">
                    {truncate(lastCheckedWindow.title, 60)}
                  </p>
                </div>
              </div>
            )}

            {/* Recent checks log — show 3, expandable */}
            {recentChecks.length > 0 && (
              <RecentChecksLog checks={recentChecks} />
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* Quick Stats Row */}
      <motion.div
        variants={staggerItem}
        className="flex items-center gap-6 text-sm text-text-muted"
      >
        <span>
          Cycle <span className="text-text-primary font-medium tabular-nums">{pomodoroState.currentCycle}/{config.cyclesBeforeLong}</span>
        </span>
        <span className="w-px h-3 bg-white/10" />
        <span>
          Streak <span className="text-text-primary font-medium tabular-nums">{currentStreak}</span>
        </span>
        <span className="w-px h-3 bg-white/10" />
        <span>
          Today <span className="text-text-primary font-medium tabular-nums">{todayHours}h {todayMins}m</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── Recent Checks with dropdown ──────────────────────────

function RecentChecksLog({ checks }: { checks: Array<{ timestamp: number; result: string; window: ActiveWindowInfo | null }> }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? checks : checks.slice(0, 3);

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-text-muted uppercase tracking-wider mb-2 px-1 font-medium cursor-pointer hover:text-text-secondary transition-colors"
      >
        Recent Checks ({checks.length})
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {visible.map((check, i) => (
            <motion.div
              key={`${check.timestamp}-${i}`}
              className="flex items-center gap-2 py-1.5 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.05]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  check.result === "on_task"
                    ? "bg-emerald-400"
                    : check.result === "off_task"
                      ? "bg-red-400"
                      : "bg-amber-400"
                }`}
              />
              <span className={`text-[11px] font-medium ${resultColors[check.result]}`}>
                {resultLabels[check.result]}
              </span>
              <span className="text-[11px] text-text-muted truncate flex-1 min-w-0">
                {check.window
                  ? truncate(check.window.app_name || check.window.process_name, 20)
                  : "---"}
              </span>
              <span className="text-[10px] text-text-muted/60 font-mono flex-shrink-0 tabular-nums">
                {formatTimestamp(check.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
