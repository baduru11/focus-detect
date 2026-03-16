export type TimerPhase = "work" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface PomodoroConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLong: number;
}

export interface PomodoroState {
  phase: TimerPhase;
  status: TimerStatus;
  secondsRemaining: number;
  currentCycle: number;
  totalCyclesCompleted: number;
}
