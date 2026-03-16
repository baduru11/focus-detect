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

export function AlarmController({
  alarmLevel,
  onDismiss,
}: AlarmControllerProps) {
  const handleDismiss = useCallback(() => {
    stop();
    onDismiss();
  }, [onDismiss]);

  // Stop all sounds when alarm level changes to 0
  useEffect(() => {
    if (alarmLevel === 0) {
      stop();
    }
  }, [alarmLevel]);

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      stop();
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
