import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "@/hooks/usePomodoro";
import type { PomodoroConfig } from "@/types/pomodoro";

// 1-minute phases for fast tests
const config: PomodoroConfig = {
  work: 1,
  shortBreak: 1,
  longBreak: 1,
  cyclesBeforeLong: 2,
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePomodoro", () => {
  // ── 1. Initial state ──────────────────────────────────────────────
  describe("initial state", () => {
    it("starts idle in work phase with correct seconds", () => {
      const { result } = renderHook(() => usePomodoro(config));

      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.secondsRemaining).toBe(60);
      expect(result.current.state.currentCycle).toBe(1);
      expect(result.current.state.totalCyclesCompleted).toBe(0);
    });
  });

  // ── 2. start() → running ──────────────────────────────────────────
  describe("start()", () => {
    it("transitions status from idle to running", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());

      expect(result.current.state.status).toBe("running");
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.secondsRemaining).toBe(60);
    });

    // ── 3. start() when not idle → no-op ─────────────────────────────
    it("is a no-op when already running", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      expect(result.current.state.status).toBe("running");

      // Advance a few seconds so secondsRemaining changes
      act(() => vi.advanceTimersByTime(3000));
      const secondsBefore = result.current.state.secondsRemaining;

      act(() => result.current.start());

      // State unchanged — still running, seconds didn't reset
      expect(result.current.state.status).toBe("running");
      expect(result.current.state.secondsRemaining).toBe(secondsBefore);
    });

    it("is a no-op when paused", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => result.current.pause());
      expect(result.current.state.status).toBe("paused");

      const secondsBefore = result.current.state.secondsRemaining;

      act(() => result.current.start());

      expect(result.current.state.status).toBe("paused");
      expect(result.current.state.secondsRemaining).toBe(secondsBefore);
    });
  });

  // ── 4. pause() → paused ───────────────────────────────────────────
  describe("pause()", () => {
    it("transitions status from running to paused", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => result.current.pause());

      expect(result.current.state.status).toBe("paused");
    });

    // ── 5. pause() when not running → no-op ──────────────────────────
    it("is a no-op when idle", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.pause());

      expect(result.current.state.status).toBe("idle");
    });

    it("is a no-op when already paused", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => result.current.pause());
      expect(result.current.state.status).toBe("paused");

      act(() => result.current.pause());

      expect(result.current.state.status).toBe("paused");
    });
  });

  // ── 6. resume() → running ─────────────────────────────────────────
  describe("resume()", () => {
    it("transitions status from paused back to running", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => result.current.pause());
      expect(result.current.state.status).toBe("paused");

      act(() => result.current.resume());

      expect(result.current.state.status).toBe("running");
    });

    // ── 7. resume() when not paused → no-op ──────────────────────────
    it("is a no-op when idle", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.resume());

      expect(result.current.state.status).toBe("idle");
    });

    it("is a no-op when already running", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      expect(result.current.state.status).toBe("running");

      act(() => result.current.resume());

      expect(result.current.state.status).toBe("running");
    });
  });

  // ── 8. stop() → resets to initial state ────────────────────────────
  describe("stop()", () => {
    it("resets to initial state from running", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(10_000));

      act(() => result.current.stop());

      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.secondsRemaining).toBe(60);
      expect(result.current.state.currentCycle).toBe(1);
      expect(result.current.state.totalCyclesCompleted).toBe(0);
    });

    it("resets to initial state from paused", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(5000));
      act(() => result.current.pause());

      act(() => result.current.stop());

      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.secondsRemaining).toBe(60);
    });
  });

  // ── 9. skip() during work → transitions to shortBreak ─────────────
  describe("skip()", () => {
    it("transitions from work to shortBreak while preserving running status", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => result.current.skip());

      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.status).toBe("running");
      expect(result.current.state.secondsRemaining).toBe(60);
    });

    // ── 10. skip() during paused → transitions but preserves paused ──
    it("transitions from work to shortBreak while preserving paused status", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => result.current.pause());
      act(() => result.current.skip());

      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.status).toBe("paused");
      expect(result.current.state.secondsRemaining).toBe(60);
    });

    it("is a no-op when idle", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.skip());

      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.status).toBe("idle");
    });
  });

  // ── 11. Timer tick ─────────────────────────────────────────────────
  describe("timer tick", () => {
    it("decreases secondsRemaining by 1 each second while running", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      expect(result.current.state.secondsRemaining).toBe(60);

      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.state.secondsRemaining).toBe(59);

      act(() => vi.advanceTimersByTime(1000));
      expect(result.current.state.secondsRemaining).toBe(58);

      act(() => vi.advanceTimersByTime(3000));
      expect(result.current.state.secondsRemaining).toBe(55);
    });

    it("does not tick while paused", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(5000));
      expect(result.current.state.secondsRemaining).toBe(55);

      act(() => result.current.pause());
      act(() => vi.advanceTimersByTime(10_000));

      expect(result.current.state.secondsRemaining).toBe(55);
    });

    it("resumes ticking from where it left off after resume", () => {
      const { result } = renderHook(() => usePomodoro(config));

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(10_000));
      expect(result.current.state.secondsRemaining).toBe(50);

      act(() => result.current.pause());
      act(() => vi.advanceTimersByTime(30_000)); // no change while paused

      act(() => result.current.resume());
      act(() => vi.advanceTimersByTime(5000));

      expect(result.current.state.secondsRemaining).toBe(45);
    });
  });

  // ── 12. Work timer expires → transitions to shortBreak ─────────────
  describe("phase transitions on expiry", () => {
    it("transitions from work to shortBreak and calls onCycleComplete", () => {
      const onCycleComplete = vi.fn();
      const onTimerEnd = vi.fn();
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onCycleComplete, onTimerEnd, onPhaseChange })
      );

      act(() => result.current.start());
      // Advance the full 60 seconds
      act(() => vi.advanceTimersByTime(60_000));

      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.status).toBe("running");
      expect(result.current.state.secondsRemaining).toBe(60);
      expect(result.current.state.currentCycle).toBe(1);
      expect(result.current.state.totalCyclesCompleted).toBe(1);
      expect(onCycleComplete).toHaveBeenCalledWith(1);
      expect(onTimerEnd).toHaveBeenCalledTimes(1);
    });

    // ── 13. Work timer expires on last cycle → longBreak ──────────────
    it("transitions from work to longBreak on last cycle", () => {
      const onCycleComplete = vi.fn();
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onCycleComplete, onPhaseChange })
      );

      act(() => result.current.start());
      // Cycle 1 work (60s) → shortBreak
      act(() => vi.advanceTimersByTime(60_000));
      expect(result.current.state.phase).toBe("shortBreak");

      // shortBreak (60s) → work cycle 2
      act(() => vi.advanceTimersByTime(60_000));
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.currentCycle).toBe(2);

      // Cycle 2 work (60s) → longBreak (because cyclesBeforeLong = 2)
      act(() => vi.advanceTimersByTime(60_000));
      expect(result.current.state.phase).toBe("longBreak");
      expect(result.current.state.currentCycle).toBe(2);
      expect(result.current.state.totalCyclesCompleted).toBe(2);
      expect(onCycleComplete).toHaveBeenCalledTimes(2);
      expect(onCycleComplete).toHaveBeenLastCalledWith(2);
    });

    // ── 14. ShortBreak expires → work, cycle increments ───────────────
    it("transitions from shortBreak to work with incremented cycle", () => {
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onPhaseChange })
      );

      act(() => result.current.start());
      // work → shortBreak
      act(() => vi.advanceTimersByTime(60_000));
      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.currentCycle).toBe(1);

      // shortBreak → work
      act(() => vi.advanceTimersByTime(60_000));
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.currentCycle).toBe(2);
      expect(result.current.state.status).toBe("running");
    });

    // ── 15. LongBreak expires → work, cycle resets to 1 ──────────────
    it("transitions from longBreak to work with cycle reset to 1", () => {
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onPhaseChange })
      );

      act(() => result.current.start());
      // work1 (60s) → shortBreak (60s) → work2 (60s) → longBreak
      act(() => vi.advanceTimersByTime(180_000));
      expect(result.current.state.phase).toBe("longBreak");

      // longBreak (60s) → work with cycle = 1
      act(() => vi.advanceTimersByTime(60_000));
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.currentCycle).toBe(1);
      expect(result.current.state.status).toBe("running");
    });
  });

  // ── 16. Config change while idle → updates secondsRemaining ────────
  describe("config reactivity", () => {
    it("updates secondsRemaining when config changes while idle", () => {
      const initialConfig: PomodoroConfig = {
        work: 1,
        shortBreak: 1,
        longBreak: 1,
        cyclesBeforeLong: 2,
      };
      const { result, rerender } = renderHook(
        ({ cfg }) => usePomodoro(cfg),
        { initialProps: { cfg: initialConfig } }
      );

      expect(result.current.state.secondsRemaining).toBe(60);

      const newConfig: PomodoroConfig = {
        work: 2,
        shortBreak: 1,
        longBreak: 1,
        cyclesBeforeLong: 2,
      };
      rerender({ cfg: newConfig });

      expect(result.current.state.secondsRemaining).toBe(120);
      expect(result.current.state.status).toBe("idle");
    });

    it("does not update secondsRemaining when config changes while running", () => {
      const initialConfig: PomodoroConfig = {
        work: 1,
        shortBreak: 1,
        longBreak: 1,
        cyclesBeforeLong: 2,
      };
      const { result, rerender } = renderHook(
        ({ cfg }) => usePomodoro(cfg),
        { initialProps: { cfg: initialConfig } }
      );

      act(() => result.current.start());
      act(() => vi.advanceTimersByTime(5000));
      const secondsBefore = result.current.state.secondsRemaining;

      const newConfig: PomodoroConfig = {
        work: 2,
        shortBreak: 1,
        longBreak: 1,
        cyclesBeforeLong: 2,
      };
      rerender({ cfg: newConfig });

      // Should not jump to 120 — still counting down from previous value
      expect(result.current.state.secondsRemaining).toBe(secondsBefore);
    });
  });

  // ── 17. onPhaseChange callback fires on transitions ────────────────
  describe("onPhaseChange callback", () => {
    it("fires when start() is called", () => {
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onPhaseChange })
      );

      act(() => result.current.start());

      expect(onPhaseChange).toHaveBeenCalledWith("work");
    });

    it("fires on automatic phase transitions", () => {
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onPhaseChange })
      );

      act(() => result.current.start());
      onPhaseChange.mockClear();

      // work → shortBreak
      act(() => vi.advanceTimersByTime(60_000));
      expect(onPhaseChange).toHaveBeenCalledWith("shortBreak");

      onPhaseChange.mockClear();

      // shortBreak → work
      act(() => vi.advanceTimersByTime(60_000));
      expect(onPhaseChange).toHaveBeenCalledWith("work");
    });

    it("fires on skip()", () => {
      const onPhaseChange = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onPhaseChange })
      );

      act(() => result.current.start());
      onPhaseChange.mockClear();

      act(() => result.current.skip());

      expect(onPhaseChange).toHaveBeenCalledWith("shortBreak");
    });
  });

  // ── 18. onTimerEnd callback fires when timer reaches 0 ─────────────
  describe("onTimerEnd callback", () => {
    it("fires each time a phase timer expires", () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onTimerEnd })
      );

      act(() => result.current.start());

      // work expires
      act(() => vi.advanceTimersByTime(60_000));
      expect(onTimerEnd).toHaveBeenCalledTimes(1);

      // shortBreak expires
      act(() => vi.advanceTimersByTime(60_000));
      expect(onTimerEnd).toHaveBeenCalledTimes(2);

      // work expires again
      act(() => vi.advanceTimersByTime(60_000));
      expect(onTimerEnd).toHaveBeenCalledTimes(3);

      // longBreak expires
      act(() => vi.advanceTimersByTime(60_000));
      expect(onTimerEnd).toHaveBeenCalledTimes(4);
    });

    it("does not fire on skip", () => {
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onTimerEnd })
      );

      act(() => result.current.start());
      act(() => result.current.skip());

      expect(onTimerEnd).not.toHaveBeenCalled();
    });
  });

  // ── Full cycle integration ─────────────────────────────────────────
  describe("full pomodoro cycle integration", () => {
    it("completes a full set of cycles: work1 → short → work2 → long → work1", () => {
      const onCycleComplete = vi.fn();
      const onPhaseChange = vi.fn();
      const onTimerEnd = vi.fn();
      const { result } = renderHook(() =>
        usePomodoro(config, { onCycleComplete, onPhaseChange, onTimerEnd })
      );

      act(() => result.current.start());

      // Work cycle 1
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.currentCycle).toBe(1);
      act(() => vi.advanceTimersByTime(60_000));

      // Short break
      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.totalCyclesCompleted).toBe(1);
      act(() => vi.advanceTimersByTime(60_000));

      // Work cycle 2
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.currentCycle).toBe(2);
      act(() => vi.advanceTimersByTime(60_000));

      // Long break
      expect(result.current.state.phase).toBe("longBreak");
      expect(result.current.state.totalCyclesCompleted).toBe(2);
      act(() => vi.advanceTimersByTime(60_000));

      // Back to work cycle 1
      expect(result.current.state.phase).toBe("work");
      expect(result.current.state.currentCycle).toBe(1);
      expect(result.current.state.status).toBe("running");

      expect(onCycleComplete).toHaveBeenCalledTimes(2);
      expect(onTimerEnd).toHaveBeenCalledTimes(4);
      // start fires onPhaseChange("work"), then 4 transitions
      expect(onPhaseChange).toHaveBeenCalledTimes(5);
    });
  });
});
