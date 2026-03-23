import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { useProfiles } from "@/hooks/useProfiles";
import { useDetection } from "@/hooks/useDetection";
import {
  startSession,
  endSession,
  updateSessionProgress,
  addDistraction,
  getTodaySessions,
  getStreakInfo,
} from "@/services/sessionService";
import { loadSavedTheme } from "@/components/settings/ThemeCustomizer";
import type { PomodoroConfig, PomodoroState } from "@/types/pomodoro";
import type { Profile } from "@/types/profile";
import type { ActiveWindowInfo } from "@/services/detectionService";
import type { MatchResult } from "@/services/matchingEngine";
import type { DetectionState } from "@/hooks/useDetection";

export interface DetectionCheckEntry {
  timestamp: number;
  result: MatchResult;
  window: ActiveWindowInfo | null;
}

interface AppContextValue {
  // Profiles
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (id: string) => Promise<void>;
  createProfile: (profile: Omit<Profile, "id">) => Promise<Profile>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;

  // Pomodoro
  pomodoroState: PomodoroState;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  skipPhase: () => void;

  // Detection
  detectionState: DetectionState;
  graceRemaining: number;
  alarmLevel: number;
  dismissAlarm: () => void;
  lastCheckedWindow: ActiveWindowInfo | null;
  recentChecks: DetectionCheckEntry[];
  lastVision: { screenshot: string; result: { onTask: boolean; confidence: number; reason: string }; timestamp: number } | null;

  // Session
  todayFocusMinutes: number;
  currentStreak: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_CONFIG: PomodoroConfig = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLong: 4,
};

const MAX_RECENT_CHECKS = 5;

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useProfiles();

  const config = activeProfile?.pomodoro ?? DEFAULT_CONFIG;

  // ─── Session tracking refs ───────────────────────────────────────────
  const sessionIdRef = useRef<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const sessionStatsRef = useRef({
    focusSeconds: 0,
    distractionSeconds: 0,
    alarmsLevel1: 0,
    alarmsLevel2: 0,
    alarmsLevel3: 0,
    cyclesCompleted: 0,
  });

  const pomodoroState = usePomodoro(config, {
    onPhaseChange: useCallback(() => {}, []),
    onCycleComplete: useCallback(() => {
      sessionStatsRef.current.cyclesCompleted++;
    }, []),
    onTimerEnd: useCallback(() => {}, []),
  });

  const {
    detectionState,
    graceRemaining,
    alarmLevel,
    lastCheck,
    lastWindowInfo,
    lastVision,
    start: startDetection,
    stop: stopDetection,
    pause: pauseDetection,
    resume: resumeDetection,
    dismissAlarm: dismissDetectionAlarm,
  } = useDetection();

  const [lastCheckedWindow, setLastCheckedWindow] =
    useState<ActiveWindowInfo | null>(null);
  const [recentChecks, setRecentChecks] = useState<DetectionCheckEntry[]>([]);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const focusStartRef = useRef<number | null>(null);

  // Stable refs for use inside intervals (avoids re-creating intervals on state change)
  const detectionStateRef = useRef(detectionState);
  useEffect(() => { detectionStateRef.current = detectionState; }, [detectionState]);
  const alarmLevelRef = useRef(alarmLevel);
  useEffect(() => { alarmLevelRef.current = alarmLevel; }, [alarmLevel]);
  const lastWindowRef = useRef(lastWindowInfo);
  useEffect(() => { lastWindowRef.current = lastWindowInfo; }, [lastWindowInfo]);

  // Sync lastWindowInfo from detection hook into context state
  useEffect(() => {
    if (lastWindowInfo) {
      setLastCheckedWindow(lastWindowInfo);
    }
  }, [lastWindowInfo]);

  // Track recent checks from detection hook
  useEffect(() => {
    if (lastCheck && lastWindowInfo) {
      setRecentChecks((prev) => {
        const entry: DetectionCheckEntry = {
          timestamp: Date.now(),
          result: lastCheck,
          window: lastWindowInfo,
        };
        const updated = [entry, ...prev].slice(0, MAX_RECENT_CHECKS);
        return updated;
      });
    }
  }, [lastCheck, lastWindowInfo]);

  // Track focus time (in-memory for dashboard display)
  useEffect(() => {
    if (
      pomodoroState.state.status === "running" &&
      pomodoroState.state.phase === "work"
    ) {
      focusStartRef.current = Date.now();
    } else if (focusStartRef.current) {
      const elapsed = (Date.now() - focusStartRef.current) / 60000;
      setTodayFocusMinutes((prev) => prev + elapsed);
      focusStartRef.current = null;
    }
  }, [pomodoroState.state.status, pomodoroState.state.phase]);

  // Track focus/distraction seconds — persist to DB every tick
  // sessionActive (state) is the trigger — sessionIdRef alone is a ref and won't re-fire this effect
  useEffect(() => {
    const { status, phase } = pomodoroState.state;
    if (status !== "running" || phase !== "work" || !sessionIdRef.current) return;
    const sid = sessionIdRef.current;
    const interval = setInterval(() => {
      const ds = detectionStateRef.current;
      if (ds === "grace" || ds === "alarm") {
        sessionStatsRef.current.distractionSeconds++;
      } else {
        sessionStatsRef.current.focusSeconds++;
      }
      const { focusSeconds, distractionSeconds } = sessionStatsRef.current;
      updateSessionProgress(sid, focusSeconds, distractionSeconds).catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroState.state.status, pomodoroState.state.phase, sessionActive]);

  // Track alarm escalations
  const prevAlarmRef = useRef(0);
  useEffect(() => {
    if (alarmLevel > prevAlarmRef.current && sessionIdRef.current) {
      if (alarmLevel === 1) sessionStatsRef.current.alarmsLevel1++;
      else if (alarmLevel === 2) sessionStatsRef.current.alarmsLevel2++;
      else if (alarmLevel >= 3) sessionStatsRef.current.alarmsLevel3++;
    }
    prevAlarmRef.current = alarmLevel;
  }, [alarmLevel]);

  // Record distraction events to DB
  const prevDetectionRef = useRef<DetectionState>("idle");
  useEffect(() => {
    if (
      detectionState === "grace" &&
      prevDetectionRef.current !== "grace" &&
      sessionIdRef.current &&
      lastWindowRef.current
    ) {
      const w = lastWindowRef.current;
      addDistraction(
        sessionIdRef.current,
        w.app_name || w.process_name,
        w.title,
        alarmLevelRef.current
      );
    }
    prevDetectionRef.current = detectionState;
  }, [detectionState]);

  // Load today stats from DB
  const refreshTodayStats = useCallback(async () => {
    try {
      const [sessions, streakData] = await Promise.all([
        getTodaySessions(),
        getStreakInfo(),
      ]);
      let focusSec = 0;
      for (const s of sessions) focusSec += s.focus_seconds;
      setTodayFocusMinutes(Math.round(focusSec / 60));
      setCurrentStreak(streakData.current);
    } catch { /* ignore */ }
  }, []);

  // Load stats + theme on mount
  useEffect(() => {
    refreshTodayStats();
    loadSavedTheme();
  }, [refreshTodayStats]);

  // Sync detection with timer phase
  useEffect(() => {
    const { status, phase } = pomodoroState.state;
    if (status === "running" && phase === "work" && activeProfile) {
      startDetection(activeProfile);
    } else if (status === "paused") {
      pauseDetection();
    } else if (status === "idle") {
      stopDetection();
    } else if (phase !== "work") {
      pauseDetection();
    }
  }, [
    pomodoroState.state.status,
    pomodoroState.state.phase,
    activeProfile,
    startDetection,
    stopDetection,
    pauseDetection,
  ]);

  const startTimer = useCallback(async () => {
    pomodoroState.start();
    if (activeProfile) {
      sessionStatsRef.current = {
        focusSeconds: 0, distractionSeconds: 0,
        alarmsLevel1: 0, alarmsLevel2: 0, alarmsLevel3: 0,
        cyclesCompleted: 0,
      };
      try {
        const id = await startSession(activeProfile.id);
        sessionIdRef.current = id;
        setSessionActive(true);
      } catch (error) {
        console.error("Failed to start session in DB:", error);
        sessionIdRef.current = null;
      }
    }
  }, [pomodoroState, activeProfile]);

  const pauseTimer = useCallback(() => {
    pomodoroState.pause();
  }, [pomodoroState]);

  const resumeTimer = useCallback(() => {
    pomodoroState.resume();
    if (activeProfile) resumeDetection();
  }, [pomodoroState, activeProfile, resumeDetection]);

  const stopTimer = useCallback(async () => {
    // End session in DB before resetting state
    if (sessionIdRef.current) {
      const stats = sessionStatsRef.current;
      try {
        await endSession(sessionIdRef.current, {
          phase: pomodoroState.state.phase,
          cyclesCompleted: stats.cyclesCompleted,
          focusSeconds: stats.focusSeconds,
          distractionSeconds: stats.distractionSeconds,
          alarmsLevel1: stats.alarmsLevel1,
          alarmsLevel2: stats.alarmsLevel2,
          alarmsLevel3: stats.alarmsLevel3,
        });
      } catch (error) {
        console.error("Failed to save session to DB:", error);
      }
      sessionIdRef.current = null;
      setSessionActive(false);
    }
    pomodoroState.stop();
    stopDetection();
    setRecentChecks([]);
    setLastCheckedWindow(null);
    refreshTodayStats();
  }, [pomodoroState, stopDetection, refreshTodayStats]);

  const skipPhase = useCallback(() => {
    pomodoroState.skip();
  }, [pomodoroState]);

  const dismissAlarm = useCallback(() => {
    dismissDetectionAlarm();
  }, [dismissDetectionAlarm]);

  // Sync state to widget via localStorage
  useEffect(() => {
    const mins = Math.floor(pomodoroState.state.secondsRemaining / 60);
    const secs = pomodoroState.state.secondsRemaining % 60;
    const time = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    localStorage.setItem("widget-sync", JSON.stringify({
      time,
      phase: pomodoroState.state.phase,
      status: pomodoroState.state.status,
      detection: detectionState,
      graceRemaining,
    }));
  }, [pomodoroState.state, detectionState, graceRemaining]);

  // Listen for widget actions
  const lastProcessedRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("widget-action");
        if (!raw) return;
        const { action, ts } = JSON.parse(raw);
        if (ts <= lastProcessedRef.current) return; // already processed
        if (Date.now() - ts > 3000) {
          localStorage.removeItem("widget-action");
          return;
        }
        lastProcessedRef.current = ts;
        localStorage.removeItem("widget-action");
        if (action === "start") startTimer();
        else if (action === "pause") pauseTimer();
        else if (action === "resume") resumeTimer();
        else if (action === "stop") stopTimer();
        else if (action === "skip") skipPhase();
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTimer, pauseTimer, resumeTimer, stopTimer, skipPhase]);

  return (
    <AppContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        pomodoroState: pomodoroState.state,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        skipPhase,
        detectionState,
        graceRemaining,
        alarmLevel,
        dismissAlarm,
        lastCheckedWindow,
        recentChecks,
        lastVision,
        todayFocusMinutes,
        currentStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
