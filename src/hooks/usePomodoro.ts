import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PomodoroConfig,
  PomodoroState,
  TimerPhase,
} from "@/types/pomodoro";

interface PomodoroCallbacks {
  onPhaseChange?: (phase: TimerPhase) => void;
  onCycleComplete?: (cycle: number) => void;
  onTimerEnd?: () => void;
}

function phaseToSeconds(phase: TimerPhase, config: PomodoroConfig): number {
  switch (phase) {
    case "work":
      return config.work * 60;
    case "shortBreak":
      return config.shortBreak * 60;
    case "longBreak":
      return config.longBreak * 60;
  }
}

function getInitialState(config: PomodoroConfig): PomodoroState {
  return {
    phase: "work",
    status: "idle",
    secondsRemaining: config.work * 60,
    currentCycle: 1,
    totalCyclesCompleted: 0,
  };
}

export function usePomodoro(
  config: PomodoroConfig,
  callbacks?: PomodoroCallbacks
) {
  const [state, setState] = useState<PomodoroState>(() =>
    getInitialState(config)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref current without triggering re-renders
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getNextPhase = useCallback(
    (
      currentPhase: TimerPhase,
      currentCycle: number
    ): { phase: TimerPhase; cycle: number } => {
      if (currentPhase === "work") {
        if (currentCycle >= config.cyclesBeforeLong) {
          return { phase: "longBreak", cycle: currentCycle };
        }
        return { phase: "shortBreak", cycle: currentCycle };
      }
      // After any break, go to work
      if (currentPhase === "longBreak") {
        return { phase: "work", cycle: 1 };
      }
      // shortBreak -> next work cycle
      return { phase: "work", cycle: currentCycle + 1 };
    },
    [config.cyclesBeforeLong]
  );

  const transitionToNextPhase = useCallback(
    (currentState: PomodoroState): PomodoroState => {
      const { phase: nextPhase, cycle: nextCycle } = getNextPhase(
        currentState.phase,
        currentState.currentCycle
      );

      const wasWork = currentState.phase === "work";
      const newTotalCompleted = wasWork
        ? currentState.totalCyclesCompleted + 1
        : currentState.totalCyclesCompleted;

      if (wasWork) {
        callbacksRef.current?.onCycleComplete?.(currentState.currentCycle);
      }

      callbacksRef.current?.onPhaseChange?.(nextPhase);

      return {
        phase: nextPhase,
        status: "running",
        secondsRemaining: phaseToSeconds(nextPhase, config),
        currentCycle: nextCycle,
        totalCyclesCompleted: newTotalCompleted,
      };
    },
    [config, getNextPhase]
  );

  // Tick logic
  useEffect(() => {
    if (state.status !== "running") {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.secondsRemaining <= 1) {
          callbacksRef.current?.onTimerEnd?.();
          return transitionToNextPhase(prev);
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    return clearTimer;
  }, [state.status, clearTimer, transitionToNextPhase]);

  // Sync config changes when idle
  useEffect(() => {
    if (state.status === "idle") {
      setState((prev) => ({
        ...prev,
        secondsRemaining: phaseToSeconds(prev.phase, config),
      }));
    }
  }, [config, state.status]);

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "idle") return prev;
      callbacksRef.current?.onPhaseChange?.(prev.phase);
      return {
        ...prev,
        status: "running",
        secondsRemaining: phaseToSeconds(prev.phase, config),
      };
    });
  }, [config]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "running") return prev;
      return { ...prev, status: "paused" };
    });
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "paused") return prev;
      return { ...prev, status: "running" };
    });
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setState(getInitialState(config));
  }, [config, clearTimer]);

  const skip = useCallback(() => {
    setState((prev) => {
      if (prev.status === "idle") return prev;
      const next = transitionToNextPhase(prev);
      return { ...next, status: prev.status };
    });
  }, [transitionToNextPhase]);

  return { state, start, pause, resume, stop, skip };
}
