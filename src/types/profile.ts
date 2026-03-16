export interface AppRule {
  name: string;
  process: string;
  allowed: boolean;
  sites?: string[];
}

export interface MonitorConfig {
  detection: "all" | "primary" | string[];
  alarm: "all" | "primary" | "detected" | string[];
}

export interface DetectionConfig {
  checkInterval: number;
  graceCountdown: number;
  alarmLockDuration: number;
}

export interface PomodoroConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLong: number;
}

export interface Profile {
  id: string;
  name: string;
  icon: string;
  mode: "whitelist" | "blacklist";
  apps: AppRule[];
  pomodoro: PomodoroConfig;
  detection: DetectionConfig;
  monitors: MonitorConfig;
}
