import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { DetectionPipeline, type DetectionCallbacks } from "@/services/detectionPipeline";
import type { Profile } from "@/types/profile";
import type { ActiveWindowInfo } from "@/services/detectionService";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/detectionService", () => ({
  getActiveWindowInfo: vi.fn(),
}));
vi.mock("@/services/matchingEngine", () => ({
  matchWindowAgainstProfile: vi.fn(),
}));
vi.mock("@/services/screenshotService", () => ({
  captureScreenshot: vi.fn(),
}));
vi.mock("@/services/visionService", () => ({
  analyzeScreenshot: vi.fn(),
}));
vi.mock("@/services/settingsService", () => ({
  getAIConfig: vi.fn(),
}));

import { getActiveWindowInfo } from "@/services/detectionService";
import { matchWindowAgainstProfile } from "@/services/matchingEngine";
import { captureScreenshot } from "@/services/screenshotService";
import { analyzeScreenshot } from "@/services/visionService";
import { getAIConfig } from "@/services/settingsService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetActiveWindowInfo = getActiveWindowInfo as Mock;
const mockMatchWindow = matchWindowAgainstProfile as Mock;
const mockCaptureScreenshot = captureScreenshot as Mock;
const mockAnalyzeScreenshot = analyzeScreenshot as Mock;
const mockGetAIConfig = getAIConfig as Mock;

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "test-profile",
    name: "Test Profile",
    icon: "code",
    mode: "blacklist",
    apps: [],
    pomodoro: { work: 25, shortBreak: 5, longBreak: 15, cyclesBeforeLong: 4 },
    detection: { checkInterval: 30, graceCountdown: 5, alarmLockDuration: 60, alarmLevel: 2 },
    monitors: { detection: "primary", alarm: "primary" },
    ...overrides,
  };
}

function makeWindowInfo(overrides: Partial<ActiveWindowInfo> = {}): ActiveWindowInfo {
  return {
    title: "VS Code",
    process_name: "code.exe",
    app_name: "Visual Studio Code",
    ...overrides,
  };
}

function makeCallbacks(overrides: Partial<DetectionCallbacks> = {}): DetectionCallbacks {
  return {
    onCheck: vi.fn(),
    onGraceStart: vi.fn(),
    onGraceTick: vi.fn(),
    onAlarm: vi.fn(),
    onBackOnTask: vi.fn(),
    onVisionAnalysis: vi.fn(),
    ...overrides,
  };
}

/**
 * Advance fake timers by `ms` milliseconds, properly flushing async callbacks.
 * vi.advanceTimersByTimeAsync handles both timer callbacks AND the microtask
 * queue (resolved promises) so that async functions like runCheck() settle.
 */
async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DetectionPipeline", () => {
  let pipeline: DetectionPipeline;

  beforeEach(() => {
    vi.useFakeTimers();
    pipeline = new DetectionPipeline();

    // Sensible defaults — individual tests override as needed
    mockGetActiveWindowInfo.mockResolvedValue(makeWindowInfo());
    mockMatchWindow.mockReturnValue("on_task");
    mockCaptureScreenshot.mockResolvedValue("base64png");
    mockAnalyzeScreenshot.mockResolvedValue({ onTask: true, confidence: 0.9, reason: "coding" });
    mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
  });

  afterEach(() => {
    pipeline.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. start() sets state to "running" and begins interval
  // -----------------------------------------------------------------------
  describe("start()", () => {
    it("sets state to running", () => {
      pipeline.start(makeProfile(), makeCallbacks());
      expect(pipeline.getState()).toBe("running");
    });

    it("runs an initial check immediately", async () => {
      const callbacks = makeCallbacks();

      pipeline.start(makeProfile(), callbacks);
      // Flush just the initial async runCheck (no timer advance needed)
      await advance(0);

      expect(mockGetActiveWindowInfo).toHaveBeenCalled();
      expect(callbacks.onCheck).toHaveBeenCalled();
    });

    it("runs periodic checks every 1 second", async () => {
      const callbacks = makeCallbacks();

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // initial check

      const initialCount = mockGetActiveWindowInfo.mock.calls.length;

      await advance(1000); // +1 check
      await advance(1000); // +1 check
      await advance(1000); // +1 check

      expect(mockGetActiveWindowInfo.mock.calls.length).toBe(initialCount + 3);
    });

    it("calling start() a second time stops the previous session first", async () => {
      const cb1 = makeCallbacks();
      const cb2 = makeCallbacks();

      pipeline.start(makeProfile(), cb1);
      await advance(0);
      expect(cb1.onCheck).toHaveBeenCalled();

      pipeline.start(makeProfile(), cb2);
      await advance(0);
      expect(cb2.onCheck).toHaveBeenCalled();

      // Advance — only cb2 should receive further checks
      const cb1CountAfterRestart = (cb1.onCheck as Mock).mock.calls.length;
      await advance(1000);
      expect((cb1.onCheck as Mock).mock.calls.length).toBe(cb1CountAfterRestart);
      expect((cb2.onCheck as Mock).mock.calls.length).toBeGreaterThan(1);
    });
  });

  // -----------------------------------------------------------------------
  // 2. stop() clears all timers and resets state
  // -----------------------------------------------------------------------
  describe("stop()", () => {
    it("sets state to idle and stops checks", async () => {
      const callbacks = makeCallbacks();

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      pipeline.stop();
      expect(pipeline.getState()).toBe("idle");

      const countBefore = (callbacks.onCheck as Mock).mock.calls.length;
      await advance(3000);
      expect((callbacks.onCheck as Mock).mock.calls.length).toBe(countBefore);
    });

    it("clears grace timers", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // off_task -> starts grace

      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(1);

      pipeline.stop();
      // Grace tick should NOT fire after stop
      await advance(10000);
      expect(callbacks.onAlarm).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 3. pause() only from "running"
  // -----------------------------------------------------------------------
  describe("pause()", () => {
    it("pauses when running", async () => {
      pipeline.start(makeProfile(), makeCallbacks());
      await advance(0);

      pipeline.pause();
      expect(pipeline.getState()).toBe("paused");
    });

    it("does nothing when idle", () => {
      pipeline.pause();
      expect(pipeline.getState()).toBe("idle");
    });

    it("does nothing when already paused", async () => {
      pipeline.start(makeProfile(), makeCallbacks());
      await advance(0);

      pipeline.pause();
      pipeline.pause();
      expect(pipeline.getState()).toBe("paused");
    });

    it("stops interval ticks", async () => {
      const callbacks = makeCallbacks();
      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      pipeline.pause();
      const countAtPause = (callbacks.onCheck as Mock).mock.calls.length;

      await advance(5000);
      expect((callbacks.onCheck as Mock).mock.calls.length).toBe(countAtPause);
    });
  });

  // -----------------------------------------------------------------------
  // 4. resume() only from "paused"
  // -----------------------------------------------------------------------
  describe("resume()", () => {
    it("resumes after pause", async () => {
      const callbacks = makeCallbacks();
      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      pipeline.pause();
      expect(pipeline.getState()).toBe("paused");

      pipeline.resume();
      expect(pipeline.getState()).toBe("running");

      await advance(0); // flush the immediate runCheck on resume
      // Should have run checks both on start and resume
      expect(mockGetActiveWindowInfo.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("does nothing when idle", () => {
      pipeline.resume();
      expect(pipeline.getState()).toBe("idle");
    });

    it("does nothing when already running", async () => {
      pipeline.start(makeProfile(), makeCallbacks());
      await advance(0);

      pipeline.resume(); // no-op
      expect(pipeline.getState()).toBe("running");
    });
  });

  // -----------------------------------------------------------------------
  // 5. runCheck with on_task result
  // -----------------------------------------------------------------------
  describe("runCheck — on_task", () => {
    it("calls onCheck callback with on_task and window info", async () => {
      const callbacks = makeCallbacks();
      const windowInfo = makeWindowInfo({ title: "My Editor" });
      mockGetActiveWindowInfo.mockResolvedValue(windowInfo);
      mockMatchWindow.mockReturnValue("on_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", windowInfo);
    });

    it("does not start grace period", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("on_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      expect(callbacks.onGraceStart).not.toHaveBeenCalled();
      expect(callbacks.onAlarm).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 6. runCheck with off_task result -> grace countdown
  // -----------------------------------------------------------------------
  describe("runCheck — off_task -> grace -> alarm", () => {
    it("starts grace countdown on first off_task", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      expect(callbacks.onGraceStart).toHaveBeenCalledWith(5);
    });

    it("fires onGraceTick each second during grace", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // initial check -> grace starts (remaining=5)

      // Grace ticks: 4, 3, 2, 1, then alarm
      await advance(1000);
      expect(callbacks.onGraceTick).toHaveBeenCalledWith(4);

      await advance(1000);
      expect(callbacks.onGraceTick).toHaveBeenCalledWith(3);

      await advance(1000);
      expect(callbacks.onGraceTick).toHaveBeenCalledWith(2);

      await advance(1000);
      expect(callbacks.onGraceTick).toHaveBeenCalledWith(1);
    });

    it("fires onAlarm at configured level when grace expires", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // off_task -> grace starts (remaining=5)

      // 5 ticks of 1s each to expire grace
      for (let i = 0; i < 5; i++) {
        await advance(1000);
      }

      expect(callbacks.onAlarm).toHaveBeenCalledWith(2);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Grace countdown: ticks and alarm
  // -----------------------------------------------------------------------
  describe("grace countdown mechanics", () => {
    it("respects custom graceCountdown value", async () => {
      const callbacks = makeCallbacks();
      const profile = makeProfile({
        detection: { checkInterval: 30, graceCountdown: 3, alarmLockDuration: 60, alarmLevel: 1 },
      });
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(profile, callbacks);
      await advance(0);

      expect(callbacks.onGraceStart).toHaveBeenCalledWith(3);

      await advance(1000); // remaining 2
      await advance(1000); // remaining 1
      await advance(1000); // remaining 0 -> alarm

      expect(callbacks.onAlarm).toHaveBeenCalledWith(1);
    });

    it("uses alarm level 3 when alarmLevel is not set on profile", async () => {
      const callbacks = makeCallbacks();
      const profile = makeProfile();
      (profile.detection as Record<string, unknown>).alarmLevel = undefined;
      profile.detection.graceCountdown = 1;
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(profile, callbacks);
      await advance(0);

      await advance(1000); // grace expires

      expect(callbacks.onAlarm).toHaveBeenCalledWith(3);
    });
  });

  // -----------------------------------------------------------------------
  // 8. handleOnTask while in grace -> cancel grace, fire onBackOnTask
  // -----------------------------------------------------------------------
  describe("handleOnTask during grace", () => {
    it("cancels grace and fires onBackOnTask", async () => {
      const callbacks = makeCallbacks();

      // First check: off_task -> starts grace
      mockMatchWindow.mockReturnValueOnce("off_task");
      // Subsequent checks: on_task -> cancels grace
      mockMatchWindow.mockReturnValue("on_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // off_task -> grace start

      expect(callbacks.onGraceStart).toHaveBeenCalledWith(5);

      // Next interval tick -> on_task -> cancels grace
      await advance(1000);

      expect(callbacks.onBackOnTask).toHaveBeenCalledTimes(1);
      // After cancellation, grace tick should not fire alarm
      await advance(10000);
      expect(callbacks.onAlarm).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 9. handleOnTask while in alarm -> clears alarm, fires onBackOnTask
  // -----------------------------------------------------------------------
  describe("handleOnTask during alarm", () => {
    it("clears alarm and fires onBackOnTask", async () => {
      const callbacks = makeCallbacks();
      const profile = makeProfile({
        detection: { checkInterval: 30, graceCountdown: 1, alarmLockDuration: 60, alarmLevel: 2 },
      });

      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(profile, callbacks);
      await advance(0); // off_task -> grace (1s)
      await advance(1000); // grace expired -> alarm fires

      expect(callbacks.onAlarm).toHaveBeenCalledWith(2);

      // Now switch to on_task
      mockMatchWindow.mockReturnValue("on_task");
      await advance(1000);

      expect(callbacks.onBackOnTask).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Already in alarm -> handleOffTask returns early (no new grace)
  // -----------------------------------------------------------------------
  describe("already in alarm", () => {
    it("does not start a new grace period when already alarming", async () => {
      const callbacks = makeCallbacks();
      const profile = makeProfile({
        detection: { checkInterval: 30, graceCountdown: 1, alarmLockDuration: 60, alarmLevel: 2 },
      });
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(profile, callbacks);
      await advance(0); // off_task -> grace start
      await advance(1000); // grace expired -> alarm

      expect(callbacks.onAlarm).toHaveBeenCalledTimes(1);
      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(1);

      // Further off_task checks should NOT start new grace periods
      await advance(1000);
      await advance(1000);

      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onAlarm).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Already in grace -> handleOffTask returns early (no double grace)
  // -----------------------------------------------------------------------
  describe("already in grace", () => {
    it("does not start a second grace when already in grace", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // off_task -> grace starts

      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(1);

      // More off_task checks arrive during grace period
      await advance(1000);
      await advance(1000);

      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // 12. Self-window detection -> skipped (reports on_task)
  // -----------------------------------------------------------------------
  describe("self-window detection", () => {
    it("skips detection for focus-detector.exe process", async () => {
      const callbacks = makeCallbacks();
      const selfWindow = makeWindowInfo({
        title: "Focus Detector",
        process_name: "focus-detector.exe",
        app_name: "Focus Detector",
      });
      mockGetActiveWindowInfo.mockResolvedValue(selfWindow);
      mockMatchWindow.mockClear(); // clear beforeEach default calls

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", selfWindow);
      expect(mockMatchWindow).not.toHaveBeenCalled();
    });

    it("skips detection when app_name matches", async () => {
      const callbacks = makeCallbacks();
      const selfWindow = makeWindowInfo({
        title: "Settings",
        process_name: "some-other.exe",
        app_name: "focus-detector",
      });
      mockGetActiveWindowInfo.mockResolvedValue(selfWindow);
      mockMatchWindow.mockClear();

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", selfWindow);
      expect(mockMatchWindow).not.toHaveBeenCalled();
    });

    it("skips detection when title is 'focus detector'", async () => {
      const callbacks = makeCallbacks();
      const selfWindow = makeWindowInfo({
        title: "Focus Detector",
        process_name: "other.exe",
        app_name: "other",
      });
      mockGetActiveWindowInfo.mockResolvedValue(selfWindow);
      mockMatchWindow.mockClear();

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", selfWindow);
      expect(mockMatchWindow).not.toHaveBeenCalled();
    });

    it("clears alarm when self-window detected during alarm", async () => {
      const callbacks = makeCallbacks();
      const profile = makeProfile({
        detection: { checkInterval: 30, graceCountdown: 1, alarmLockDuration: 60, alarmLevel: 2 },
      });

      // Start off_task to trigger alarm
      mockMatchWindow.mockReturnValue("off_task");
      mockGetActiveWindowInfo.mockResolvedValue(makeWindowInfo());

      pipeline.start(profile, callbacks);
      await advance(0); // off_task -> grace
      await advance(1000); // grace expires -> alarm

      expect(callbacks.onAlarm).toHaveBeenCalledTimes(1);

      // Now user focuses self-window
      mockGetActiveWindowInfo.mockResolvedValue(
        makeWindowInfo({
          title: "Focus Detector",
          process_name: "focus-detector.exe",
          app_name: "Focus Detector",
        })
      );

      await advance(1000);

      expect(callbacks.onBackOnTask).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // 13. Ambiguous + AI cooldown not elapsed -> uses lastAIResult
  // -----------------------------------------------------------------------
  describe("ambiguous — AI cooldown", () => {
    it("uses lastAIResult (on_task) when cooldown has not elapsed", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      // lastAIResult defaults to "on_task" so first ambiguous check reports on_task
      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", expect.any(Object));

      // AI check was triggered (cooldown was 0 at start, so it fires)
      expect(mockGetAIConfig).toHaveBeenCalled();
    });

    it("does not trigger AI check when cooldown has not elapsed", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
      mockAnalyzeScreenshot.mockResolvedValue({ onTask: true, confidence: 0.9, reason: "ok" });

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // initial: triggers AI

      const aiCallCountAfterFirst = mockGetAIConfig.mock.calls.length;

      // Advance less than checkInterval (30s)
      await advance(1000);

      // getAIConfig should NOT have been called again
      expect(mockGetAIConfig.mock.calls.length).toBe(aiCallCountAfterFirst);
    });

    it("triggers AI check after cooldown elapses", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
      mockAnalyzeScreenshot.mockResolvedValue({ onTask: true, confidence: 0.9, reason: "ok" });

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // initial: triggers AI

      const aiCallCountAfterFirst = mockGetAIConfig.mock.calls.length;

      // Advance past cooldown (30s)
      await advance(31000);

      expect(mockGetAIConfig.mock.calls.length).toBeGreaterThan(aiCallCountAfterFirst);
    });

    it("uses previous off_task AI result while cooldown active", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
      // AI resolves with off_task (high confidence)
      mockAnalyzeScreenshot.mockResolvedValue({ onTask: false, confidence: 0.8, reason: "distracted" });

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // initial check triggers AI + reports on_task (default lastAIResult)

      // Let AI promise resolve — lastAIResult becomes "off_task"
      await advance(100);

      // Next check (within cooldown) should use cached off_task
      await advance(1000);

      const offTaskCalls = (callbacks.onCheck as Mock).mock.calls.filter(
        ([result]: [string]) => result === "off_task"
      );
      expect(offTaskCalls.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // 14. resolveAmbiguous: no providers -> on_task
  // -----------------------------------------------------------------------
  describe("resolveAmbiguous — no providers", () => {
    it("returns on_task when no AI providers configured", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({});
      mockCaptureScreenshot.mockClear();

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      // Let the resolveAmbiguous promise settle
      await advance(100);

      // Should report on_task since no providers available
      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", expect.any(Object));
      // captureScreenshot should NOT have been called (early return before screenshot)
      expect(mockCaptureScreenshot).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 15. resolveAmbiguous: confidence < 0.5 -> on_task
  // -----------------------------------------------------------------------
  describe("resolveAmbiguous — low confidence", () => {
    it("returns on_task when confidence < 0.5 regardless of onTask value", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
      mockAnalyzeScreenshot.mockResolvedValue({
        onTask: false,
        confidence: 0.3,
        reason: "uncertain",
      });

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      // Let resolveAmbiguous settle
      await advance(100);

      // Next check should still report on_task due to low confidence override
      await advance(1000);
      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", expect.any(Object));
      expect(callbacks.onGraceStart).not.toHaveBeenCalled();
    });

    it("returns on_task when confidence < 0.5 even if onTask is true", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ groq: "key-456" });
      mockAnalyzeScreenshot.mockResolvedValue({
        onTask: true,
        confidence: 0.4,
        reason: "not sure",
      });

      pipeline.start(makeProfile(), callbacks);
      await advance(0);
      await advance(100);

      // on_task with low confidence still results in on_task
      await advance(1000);
      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", expect.any(Object));
    });
  });

  // -----------------------------------------------------------------------
  // Additional edge cases
  // -----------------------------------------------------------------------
  describe("error handling", () => {
    it("continues running when getActiveWindowInfo throws", async () => {
      const callbacks = makeCallbacks();
      mockGetActiveWindowInfo
        .mockRejectedValueOnce(new Error("IPC failed"))
        .mockResolvedValue(makeWindowInfo());
      mockMatchWindow.mockReturnValue("on_task");

      pipeline.start(makeProfile(), callbacks);
      await advance(0); // first check fails

      expect(callbacks.onCheck).not.toHaveBeenCalled();
      expect(pipeline.getState()).toBe("running");

      // Second check succeeds
      await advance(1000);
      expect(callbacks.onCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe("resolveAmbiguous — vision analysis callback", () => {
    it("calls onVisionAnalysis callback when AI resolves", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
      const visionResult = { onTask: true, confidence: 0.9, reason: "focused on code" };
      mockAnalyzeScreenshot.mockResolvedValue(visionResult);

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      // Let resolveAmbiguous settle
      await advance(100);

      expect(callbacks.onVisionAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          screenshot: "base64png",
          result: visionResult,
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe("resolveAmbiguous — vision analysis failure", () => {
    it("falls back to on_task when vision analysis throws", async () => {
      const callbacks = makeCallbacks();
      mockMatchWindow.mockReturnValue("ambiguous");
      mockGetAIConfig.mockResolvedValue({ gemini: "key-123" });
      mockAnalyzeScreenshot.mockRejectedValue(new Error("API down"));

      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      // Let the rejection settle
      await advance(100);

      // After failure, lastAIResult should remain "on_task" (default)
      await advance(1000);
      expect(callbacks.onCheck).toHaveBeenCalledWith("on_task", expect.any(Object));
    });
  });

  describe("resetAlarm()", () => {
    it("resets alarm flag so new off_task triggers fresh grace", async () => {
      const callbacks = makeCallbacks();
      const profile = makeProfile({
        detection: { checkInterval: 30, graceCountdown: 1, alarmLockDuration: 60, alarmLevel: 2 },
      });
      mockMatchWindow.mockReturnValue("off_task");

      pipeline.start(profile, callbacks);
      await advance(0); // off_task -> grace
      await advance(1000); // grace expires -> alarm

      expect(callbacks.onAlarm).toHaveBeenCalledTimes(1);
      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(1);

      // Reset alarm externally
      pipeline.resetAlarm();

      // Next off_task check should start a new grace period
      await advance(1000);
      expect(callbacks.onGraceStart).toHaveBeenCalledTimes(2);
    });
  });

  describe("runCheck when not running", () => {
    it("does not run checks when state is idle", () => {
      const callsBefore = mockGetActiveWindowInfo.mock.calls.length;
      expect(pipeline.getState()).toBe("idle");
      // No new calls should have been made for this pipeline instance
      expect(mockGetActiveWindowInfo.mock.calls.length).toBe(callsBefore);
    });

    it("does not run checks when state is paused", async () => {
      const callbacks = makeCallbacks();
      pipeline.start(makeProfile(), callbacks);
      await advance(0);

      const checksBefore = mockGetActiveWindowInfo.mock.calls.length;
      pipeline.pause();

      await advance(5000);
      expect(mockGetActiveWindowInfo.mock.calls.length).toBe(checksBefore);
    });
  });
});
