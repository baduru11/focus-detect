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

async function setAlwaysOnTop(on: boolean) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.setAlwaysOnTop(on);
    if (on) {
      await win.show();
      await win.maximize();
      await win.setFocus();
    } else {
      await win.unmaximize();
    }
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
    setAlwaysOnTop(false);
    onDismiss();
  }, [onDismiss]);

  // Always-on-top when alarm is active so user can't hide it
  useEffect(() => {
    if (alarmLevel >= 1) {
      setAlwaysOnTop(true);
    } else {
      setAlwaysOnTop(false);
    }
  }, [alarmLevel]);

  useEffect(() => {
    if (alarmLevel === 0) {
      stop();
      setAlwaysOnTop(false);
    }
  }, [alarmLevel]);

  useEffect(() => {
    return () => {
      stop();
      setAlwaysOnTop(false);
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
