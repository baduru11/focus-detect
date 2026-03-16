import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Eye, Monitor } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/FlickeringGrid";
import { GlassCard } from "@/components/ui/GlassCard";
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
    lastVision,
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

      {/* Timer Ring */}
      <motion.div variants={staggerItem} className="relative">
        <PomodoroRing
          secondsRemaining={pomodoroState.secondsRemaining}
          totalSeconds={totalSeconds}
          phase={pomodoroState.phase}
          status={pomodoroState.status}
          currentCycle={pomodoroState.currentCycle}
          cyclesBeforeLong={config.cyclesBeforeLong}
        />
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

            {/* Last check — single row, updates live, no jarring animation */}
            {recentChecks.length > 0 && (() => {
              const latest = recentChecks[0];
              return (
                  <div
                    className="mt-3 flex items-center gap-2 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.05] transition-all duration-300"
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        latest.result === "on_task"
                          ? "bg-emerald-400"
                          : latest.result === "off_task"
                            ? "bg-red-400"
                            : "bg-amber-400"
                      }`}
                    />
                    <span className={`text-xs font-medium ${resultColors[latest.result]}`}>
                      {resultLabels[latest.result]}
                    </span>
                    <span className="text-xs text-text-muted truncate flex-1 min-w-0">
                      {latest.window
                        ? truncate(latest.window.app_name || latest.window.process_name, 30)
                        : "---"}
                    </span>
                    <span className="text-[11px] text-text-muted/60 font-mono flex-shrink-0 tabular-nums">
                      {formatTimestamp(latest.timestamp)}
                    </span>
                  </div>
              );
            })()}
          </GlassCard>
        </motion.div>
      )}

      {/* AI Vision Live Feed */}
      {lastVision && (
        <motion.div
          variants={staggerItem}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-accent" />
              <span className="text-xs text-text-muted uppercase tracking-wider font-medium">AI Vision</span>
              <span className={`ml-auto text-xs font-medium ${lastVision.result.onTask ? "text-emerald-400" : "text-red-400"}`}>
                {lastVision.result.onTask ? "On Task" : "Off Task"} ({Math.round(lastVision.result.confidence * 100)}%)
              </span>
            </div>
            <div className="flex gap-3">
              <img
                src={`data:image/png;base64,${lastVision.screenshot}`}
                alt="Last screenshot"
                className="w-40 h-24 object-cover rounded-lg border border-white/[0.08]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary leading-relaxed">
                  {lastVision.result.reason}
                </p>
                <p className="text-[11px] text-text-muted mt-2 font-mono tabular-nums">
                  {new Date(lastVision.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
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

