import type { Profile } from "@/types/profile";
import type { MatchResult } from "@/services/matchingEngine";
import {
  getActiveWindowInfo,
  type ActiveWindowInfo,
} from "@/services/detectionService";
import { matchWindowAgainstProfile } from "@/services/matchingEngine";
import { captureScreenshot } from "@/services/screenshotService";
import { analyzeScreenshot } from "@/services/visionService";
import { getAIConfig } from "@/services/settingsService";

export interface VisionEvent {
  screenshot: string; // base64
  result: { onTask: boolean; confidence: number; reason: string };
  timestamp: number;
}

export interface DetectionCallbacks {
  onCheck: (result: MatchResult, windowInfo: ActiveWindowInfo) => void;
  onGraceStart: (seconds: number) => void;
  onGraceTick: (remaining: number) => void;
  onAlarm: (level: 1 | 2 | 3) => void;
  onBackOnTask: () => void;
  onVisionAnalysis?: (event: VisionEvent) => void;
}

export type PipelineState = "idle" | "running" | "paused";

export class DetectionPipeline {
  private intervalId: number | null = null;
  private graceTimeoutId: number | null = null;
  private graceTickId: number | null = null;
  private state: PipelineState = "idle";
  private profile: Profile | null = null;
  private callbacks: DetectionCallbacks | null = null;
  private inGrace: boolean = false;
  private inAlarm: boolean = false;
  private lastAICheckTime: number = 0;
  private lastAIResult: "on_task" | "off_task" = "on_task";
  private aiCheckRunning: boolean = false;
  private graceRemaining: number = 0;

  start(profile: Profile, callbacks: DetectionCallbacks): void {
    this.stop();
    this.profile = profile;
    this.callbacks = callbacks;
    this.inGrace = false;
    this.inAlarm = false;
    this.graceRemaining = 0;
    this.state = "running";

    this.runCheck();
    this.intervalId = window.setInterval(() => {
      this.runCheck();
    }, 1000);
  }

  stop(): void {
    this.clearAllTimers();
    this.state = "idle";
    this.profile = null;
    this.callbacks = null;
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
    this.runCheck();
    this.intervalId = window.setInterval(() => {
      this.runCheck();
    }, 1000);
  }

  resetAlarm(): void {
    this.inAlarm = false;
  }

  getState(): PipelineState {
    return this.state;
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

      // If the active window is our own app:
      // - Always report it so the UI shows the current window
      // - During alarm: treat as on-task so user can dismiss by clicking back
      // - Otherwise: skip detection logic to avoid interfering
      if (this.isSelfWindow(windowInfo)) {
        this.callbacks.onCheck("on_task", windowInfo);
        if (this.inAlarm) {
          this.handleOnTask();
        }
        return;
      }

      const result = matchWindowAgainstProfile(windowInfo, this.profile);

      if (result === "ambiguous") {
        const now = Date.now();
        const AI_COOLDOWN = (this.profile.detection.checkInterval || 30) * 1000;

        if (!this.aiCheckRunning && now - this.lastAICheckTime > AI_COOLDOWN) {
          this.aiCheckRunning = true;
          this.resolveAmbiguous().then((resolved) => {
            this.lastAIResult = resolved;
            this.lastAICheckTime = Date.now();
            this.aiCheckRunning = false;
          }).catch(() => {
            this.aiCheckRunning = false;
          });
        }

        this.callbacks.onCheck(this.lastAIResult === "off_task" ? "off_task" : "on_task", windowInfo);
        if (this.lastAIResult === "off_task") {
          this.handleOffTask();
        } else {
          this.handleOnTask();
        }
        return;
      }

      this.callbacks.onCheck(result, windowInfo);
      if (result === "off_task") {
        this.handleOffTask();
      } else {
        this.handleOnTask();
      }
    } catch (error) {
      console.warn("Detection check failed:", error);
    }
  }

  private handleOffTask(): void {
    if (!this.profile || !this.callbacks) return;

    // Already alarming — nothing more to do
    if (this.inAlarm) return;

    // Grace period already running
    if (this.inGrace) return;

    // Start grace countdown
    this.inGrace = true;
    this.graceRemaining = this.profile.detection.graceCountdown;
    this.callbacks.onGraceStart(this.graceRemaining);

    const alarmLevel = this.profile.detection.alarmLevel ?? 3;

    this.graceTickId = window.setInterval(() => {
      this.graceRemaining--;
      if (this.graceRemaining > 0) {
        this.callbacks?.onGraceTick(this.graceRemaining);
      } else {
        // Grace expired — fire alarm at configured level
        this.clearGraceTimers();
        this.inGrace = false;
        this.inAlarm = true;
        this.callbacks?.onAlarm(alarmLevel as 1 | 2 | 3);
      }
    }, 1000);
  }

  private handleOnTask(): void {
    if (!this.callbacks) return;

    if (this.inGrace) {
      this.clearGraceTimers();
      this.inGrace = false;
      this.graceRemaining = 0;
      this.callbacks.onBackOnTask();
      return;
    }

    if (this.inAlarm) {
      this.inAlarm = false;
      this.callbacks.onBackOnTask();
      return;
    }
  }

  private async resolveAmbiguous(): Promise<"on_task" | "off_task"> {
    try {
      const apiKeys = await getAIConfig();

      const hasAnyProvider =
        apiKeys.gemini || apiKeys.groq || apiKeys.openRouter || apiKeys.ollamaModel;
      if (!hasAnyProvider) {
        return "on_task";
      }

      const screenshot = await captureScreenshot();
      const profileContext = this.profile
        ? `Profile "${this.profile.name}" (${this.profile.mode} mode)`
        : "general focus";

      const visionResult = await analyzeScreenshot(
        screenshot,
        profileContext,
        apiKeys
      );

      this.callbacks?.onVisionAnalysis?.({
        screenshot,
        result: visionResult,
        timestamp: Date.now(),
      });

      // Guard: malformed response — missing or non-numeric confidence
      const confidence = typeof visionResult.confidence === "number" && !isNaN(visionResult.confidence)
        ? visionResult.confidence
        : 0.5;

      if (confidence < 0.5) {
        return "on_task";
      }

      // Guard: empty/undefined onTask field
      if (typeof visionResult.onTask !== "boolean") {
        console.warn("Vision returned non-boolean onTask:", visionResult.onTask);
        return "on_task"; // benefit of the doubt
      }

      return visionResult.onTask ? "on_task" : "off_task";
    } catch (error) {
      console.warn("Vision analysis failed for ambiguous result:", error);
      return "on_task";
    }
  }

  private isSelfWindow(windowInfo: ActiveWindowInfo): boolean {
    const proc = windowInfo.process_name.toLowerCase();
    const title = windowInfo.title.toLowerCase();
    const app = windowInfo.app_name.toLowerCase();

    const selfProcesses = [
      "focus-detector.exe",
      "focus detector.exe",
      "focus_detector.exe",
    ];
    if (selfProcesses.includes(proc)) return true;

    if (app === "focus detector" || app === "focus-detector") return true;
    if (title === "focus detector") return true;

    return false;
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
