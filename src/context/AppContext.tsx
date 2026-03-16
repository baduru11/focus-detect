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

  const pomodoroState = usePomodoro(config, {
    onPhaseChange: useCallback(() => {}, []),
    onCycleComplete: useCallback(() => {}, []),
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
  } = useDetection();

  const [lastCheckedWindow, setLastCheckedWindow] =
    useState<ActiveWindowInfo | null>(null);
  const [recentChecks, setRecentChecks] = useState<DetectionCheckEntry[]>([]);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [currentStreak] = useState(0);
  const focusStartRef = useRef<number | null>(null);

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

  // Track focus time
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

  const startTimer = useCallback(() => {
    pomodoroState.start();
  }, [pomodoroState]);

  const pauseTimer = useCallback(() => {
    pomodoroState.pause();
  }, [pomodoroState]);

  const resumeTimer = useCallback(() => {
    pomodoroState.resume();
    if (activeProfile) resumeDetection();
  }, [pomodoroState, activeProfile, resumeDetection]);

  const stopTimer = useCallback(() => {
    pomodoroState.stop();
    stopDetection();
    setRecentChecks([]);
    setLastCheckedWindow(null);
  }, [pomodoroState, stopDetection]);

  const skipPhase = useCallback(() => {
    pomodoroState.skip();
  }, [pomodoroState]);

  const dismissAlarm = useCallback(() => {
    // Alarm dismissed — detection pipeline handles de-escalation
  }, []);

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
