import { useState, useRef, useCallback } from "react";
import type { Profile } from "@/types/profile";
import type { MatchResult } from "@/services/matchingEngine";
import type { ActiveWindowInfo } from "@/services/detectionService";
import {
  DetectionPipeline,
  type DetectionCallbacks,
  type VisionEvent,
} from "@/services/detectionPipeline";

export type DetectionState = "idle" | "checking" | "grace" | "alarm";

interface UseDetectionReturn {
  detectionState: DetectionState;
  graceRemaining: number;
  alarmLevel: number;
  lastCheck: MatchResult | null;
  lastWindowInfo: ActiveWindowInfo | null;
  lastVision: VisionEvent | null;
  start: (profile: Profile) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export function useDetection(): UseDetectionReturn {
  const [detectionState, setDetectionState] = useState<DetectionState>("idle");
  const [graceRemaining, setGraceRemaining] = useState(0);
  const [alarmLevel, setAlarmLevel] = useState(0);
  const [lastCheck, setLastCheck] = useState<MatchResult | null>(null);
  const [lastWindowInfo, setLastWindowInfo] = useState<ActiveWindowInfo | null>(null);
  const [lastVision, setLastVision] = useState<VisionEvent | null>(null);

  const pipelineRef = useRef<DetectionPipeline | null>(null);

  const start = useCallback((profile: Profile) => {
    if (pipelineRef.current) {
      pipelineRef.current.stop();
    }

    const pipeline = new DetectionPipeline();
    pipelineRef.current = pipeline;

    const callbacks: DetectionCallbacks = {
      onCheck: (result: MatchResult, windowInfo: ActiveWindowInfo) => {
        setLastCheck(result);
        setLastWindowInfo(windowInfo);
        if (result === "on_task" || result === "ambiguous") {
          setDetectionState("checking");
        }
      },
      onGraceStart: (seconds: number) => {
        setDetectionState("grace");
        setGraceRemaining(seconds);
      },
      onGraceTick: (remaining: number) => {
        setGraceRemaining(remaining);
      },
      onAlarm: (level: 1 | 2 | 3) => {
        setDetectionState("alarm");
        setAlarmLevel(level);
        setGraceRemaining(0);
      },
      onBackOnTask: () => {
        setDetectionState("checking");
        setGraceRemaining(0);
        setAlarmLevel(0);
      },
      onVisionAnalysis: (event: VisionEvent) => {
        setLastVision(event);
      },
    };

    setDetectionState("checking");
    setAlarmLevel(0);
    setGraceRemaining(0);
    setLastCheck(null);
    setLastWindowInfo(null);
    setLastVision(null);

    pipeline.start(profile, callbacks);
  }, []);

  const stop = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.stop();
      pipelineRef.current = null;
    }
    setDetectionState("idle");
    setGraceRemaining(0);
    setAlarmLevel(0);
    setLastCheck(null);
    setLastWindowInfo(null);
    setLastVision(null);
  }, []);

  const pause = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.resume();
    }
  }, []);

  return {
    detectionState,
    graceRemaining,
    alarmLevel,
    lastCheck,
    lastWindowInfo,
    lastVision,
    start,
    stop,
    pause,
    resume,
  };
}
