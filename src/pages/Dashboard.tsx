import { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Eye, Monitor, Minimize2, ChevronDown, Check } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { PomodoroRing } from "@/components/timer/PomodoroRing";
import { TimerControls } from "@/components/timer/TimerControls";
import { DetectionStatus } from "@/components/detection/DetectionStatus";
import { useApp } from "@/context/AppContext";
import { phaseToSeconds } from "@/lib/pomodoro";
import type { PomodoroConfig } from "@/types/pomodoro";
import type { Profile } from "@/types/profile";

const DEFAULT_CONFIG: PomodoroConfig = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLong: 4,
};

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

function ProfileSelector({
  profiles,
  activeProfile,
  onSelect,
}: {
  profiles: Profile[];
  activeProfile: Profile | null;
  onSelect: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 py-2 px-4 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Target className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-secondary">
          {activeProfile?.icon} {activeProfile?.name ?? "No Profile"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 min-w-[200px] py-1.5 rounded-xl bg-[#16161e]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl z-50"
          >
            {profiles.length === 0 && (
              <div className="px-4 py-3 text-xs text-text-muted">No profiles</div>
            )}
            {profiles.map((p) => {
              const isActive = p.id === activeProfile?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors cursor-pointer ${
                    isActive ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <span className="text-base leading-none">{p.icon}</span>
                  <span className={`text-sm flex-1 ${isActive ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                    {p.name}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  const {
    pomodoroState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipPhase,
    activeProfile,
    profiles,
    setActiveProfile,
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
  const totalSeconds = phaseToSeconds(pomodoroState.phase, config);
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
      {/* Top bar: profile selector + widget toggle */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <ProfileSelector
          profiles={profiles}
          activeProfile={activeProfile}
          onSelect={setActiveProfile}
        />
        <button
          className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Switch to mini widget"
          onClick={async () => {
            try {
              const { invoke } = await import("@tauri-apps/api/core");
              await invoke("toggle_widget", { visible: true });
              const { getCurrentWindow } = await import("@tauri-apps/api/window");
              await getCurrentWindow().hide();
            } catch { /* Not in Tauri */ }
          }}
        >
          <Minimize2 className="w-4 h-4 text-text-muted" />
        </button>
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

