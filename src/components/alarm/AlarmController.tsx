import { useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { stop } from "@/services/alarmSound";
import { AlarmLevel1 } from "./AlarmLevel1";
import { AlarmLevel2 } from "./AlarmLevel2";
import { AlarmLevel3 } from "./AlarmLevel3";

interface AlarmControllerProps {
  alarmLevel: 0 | 1 | 2 | 3;
  onDismiss: () => void;
}

async function setFullscreen(fullscreen: boolean) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    if (fullscreen) {
      await win.setFullscreen(true);
      await win.setAlwaysOnTop(true);
      await win.setFocus();
    } else {
      await win.setFullscreen(false);
      await win.setAlwaysOnTop(false);
    }
  } catch {
    // Not in Tauri environment
  }
}

export function AlarmController({
  alarmLevel,
  onDismiss,
}: AlarmControllerProps) {
  const handleDismiss = useCallback(() => {
    stop();
    setFullscreen(false);
    onDismiss();
  }, [onDismiss]);

  // Fullscreen on alarm level 2+, restore on dismiss
  useEffect(() => {
    if (alarmLevel >= 2) {
      setFullscreen(true);
    } else {
      setFullscreen(false);
    }
  }, [alarmLevel]);

  // Stop all sounds when alarm level changes to 0
  useEffect(() => {
    if (alarmLevel === 0) {
      stop();
      setFullscreen(false);
    }
  }, [alarmLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      setFullscreen(false);
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      {alarmLevel === 1 && (
        <AlarmLevel1 key="alarm-1" onDismiss={handleDismiss} />
      )}
      {alarmLevel === 2 && (
        <AlarmLevel2 key="alarm-2" onDismiss={handleDismiss} />
      )}
      {alarmLevel === 3 && (
        <AlarmLevel3 key="alarm-3" onDismiss={handleDismiss} />
      )}
    </AnimatePresence>
  );
}
