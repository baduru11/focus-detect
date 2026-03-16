import type { Profile } from "@/types/profile";
import type { MatchResult } from "@/services/matchingEngine";
import { getActiveWindowInfo } from "@/services/detectionService";
import { matchWindowAgainstProfile } from "@/services/matchingEngine";

export interface DetectionCallbacks {
  onCheck: (result: MatchResult) => void;
  onGraceStart: (seconds: number) => void;
  onGraceTick: (remaining: number) => void;
  onAlarm: (level: 1 | 2 | 3) => void;
  onBackOnTask: () => void;
}

export type PipelineState = "idle" | "running" | "paused";

const MAX_ESCALATION = 3;

export class DetectionPipeline {
  private intervalId: number | null = null;
  private graceTimeoutId: number | null = null;
  private graceTickId: number | null = null;
  private escalationLevel: number = 0;
  private state: PipelineState = "idle";
  private profile: Profile | null = null;
  private callbacks: DetectionCallbacks | null = null;
  private inGrace: boolean = false;
  private inAlarm: boolean = false;
  private graceRemaining: number = 0;

  start(profile: Profile, callbacks: DetectionCallbacks): void {
    this.stop();
    this.profile = profile;
    this.callbacks = callbacks;
    this.escalationLevel = 0;
    this.inGrace = false;
    this.inAlarm = false;
    this.graceRemaining = 0;
    this.state = "running";

    const intervalMs = profile.detection.checkInterval * 1000;

    // Run an immediate check, then set up the interval
    this.runCheck();
    this.intervalId = window.setInterval(() => {
      this.runCheck();
    }, intervalMs);
  }

  stop(): void {
    this.clearAllTimers();
    this.state = "idle";
    this.profile = null;
    this.callbacks = null;
    this.escalationLevel = 0;
    this.inGrace = false;
    this.inAlarm = false;
    this.graceRemaining = 0;
  }

  pause(): void {
    if (this.state !== "running") return;
    this.clearAllTimers();
    this.state = "paused";
  }

  resume(): void {
    if (this.state !== "paused" || !this.profile || !this.callbacks) return;

    this.state = "running";
    const intervalMs = this.profile.detection.checkInterval * 1000;

    this.runCheck();
    this.intervalId = window.setInterval(() => {
      this.runCheck();
    }, intervalMs);
  }

  resetEscalation(): void {
    this.escalationLevel = 0;
    this.inAlarm = false;
  }

  getState(): PipelineState {
    return this.state;
  }

  getEscalationLevel(): number {
    return this.escalationLevel;
  }

  private clearAllTimers(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.graceTimeoutId !== null) {
      window.clearTimeout(this.graceTimeoutId);
      this.graceTimeoutId = null;
    }
    if (this.graceTickId !== null) {
      window.clearInterval(this.graceTickId);
      this.graceTickId = null;
    }
  }

  private async runCheck(): Promise<void> {
    if (this.state !== "running" || !this.profile || !this.callbacks) return;

    try {
      const windowInfo = await getActiveWindowInfo();
      const result = matchWindowAgainstProfile(windowInfo, this.profile);

      this.callbacks.onCheck(result);

      if (result === "ambiguous") {
        // Treat ambiguous as on_task for now (vision needs API keys)
        this.handleOnTask();
        return;
      }

      if (result === "off_task") {
        this.handleOffTask();
      } else {
        this.handleOnTask();
      }
    } catch (error) {
      // If we can't get window info (e.g., app is not running in Tauri),
      // silently skip this check cycle
      console.warn("Detection check failed:", error);
    }
  }

  private handleOffTask(): void {
    if (!this.profile || !this.callbacks) return;

    if (this.inAlarm) {
      // Already alarming — escalate if not at max
      if (this.escalationLevel < MAX_ESCALATION) {
        this.escalationLevel++;
        this.callbacks.onAlarm(
          this.escalationLevel as 1 | 2 | 3
        );
      }
      return;
    }

    if (this.inGrace) {
      // Grace period already running, let it continue
      return;
    }

    // Start grace countdown
    this.inGrace = true;
    this.graceRemaining = this.profile.detection.graceCountdown;
    this.callbacks.onGraceStart(this.graceRemaining);

    this.graceTickId = window.setInterval(() => {
      this.graceRemaining--;
      if (this.graceRemaining > 0) {
        this.callbacks?.onGraceTick(this.graceRemaining);
      } else {
        // Grace expired — trigger alarm
        this.clearGraceTimers();
        this.inGrace = false;
        this.inAlarm = true;
        this.escalationLevel = 1;
        this.callbacks?.onAlarm(1);
      }
    }, 1000);

    // Also set a hard timeout as a safety net
    this.graceTimeoutId = window.setTimeout(() => {
      if (this.inGrace) {
        this.clearGraceTimers();
        this.inGrace = false;
        this.inAlarm = true;
        this.escalationLevel = 1;
        this.callbacks?.onAlarm(1);
      }
    }, this.profile.detection.graceCountdown * 1000 + 100);
  }

  private handleOnTask(): void {
    if (!this.callbacks) return;

    if (this.inGrace) {
      // User got back on task during grace period
      this.clearGraceTimers();
      this.inGrace = false;
      this.graceRemaining = 0;
      this.callbacks.onBackOnTask();
      return;
    }

    if (this.inAlarm) {
      // User got back on task after alarm
      this.inAlarm = false;
      this.escalationLevel = Math.max(0, this.escalationLevel - 1);
      this.callbacks.onBackOnTask();
      return;
    }
  }

  private clearGraceTimers(): void {
    if (this.graceTimeoutId !== null) {
      window.clearTimeout(this.graceTimeoutId);
      this.graceTimeoutId = null;
    }
    if (this.graceTickId !== null) {
      window.clearInterval(this.graceTickId);
      this.graceTickId = null;
    }
  }
}
