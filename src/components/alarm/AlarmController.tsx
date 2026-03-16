import { useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { stop } from "@/services/alarmSound";
import { AlarmLevel1 } from "./AlarmLevel1";
import { AlarmLevel2 } from "./AlarmLevel2";

interface AlarmControllerProps {
  alarmLevel: 0 | 1 | 2 | 3;
  onDismiss: () => void;
}

async function showOverlay() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("show_alarm_overlay");
  } catch {
    // Not in Tauri
  }
}

async function hideOverlay() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("hide_alarm_overlay");
  } catch {
    // Not in Tauri
  }
}

export function AlarmController({
  alarmLevel,
  onDismiss,
}: AlarmControllerProps) {
  const handleDismiss = useCallback(() => {
    stop();
    hideOverlay();
    onDismiss();
  }, [onDismiss]);

  // Level 3: show separate fullscreen overlay window on the monitor
  useEffect(() => {
    if (alarmLevel >= 3) {
      showOverlay();
    } else {
      hideOverlay();
    }
  }, [alarmLevel]);

  useEffect(() => {
    if (alarmLevel === 0) {
      stop();
      hideOverlay();
    }
  }, [alarmLevel]);

  useEffect(() => {
    return () => {
      stop();
      hideOverlay();
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {/* Level 1: small toast in-app */}
      {alarmLevel === 1 && (
        <AlarmLevel1 key="alarm-1" onDismiss={handleDismiss} />
      )}
      {/* Level 2: popup in-app */}
      {alarmLevel === 2 && (
        <AlarmLevel2 key="alarm-2" onDismiss={handleDismiss} />
      )}
      {/* Level 3: separate fullscreen overlay window (AlarmPage) */}
      {/* The overlay is handled via the Tauri window, not rendered here */}
    </AnimatePresence>
  );
}
