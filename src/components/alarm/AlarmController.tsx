import { useEffect, useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { stop } from "@/services/alarmSound";
import { getRandomMeme } from "@/services/memeService";
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
      // Don't maximize or steal focus — alarm UI renders inside the app window
      // as a fixed overlay. The off-task window stays active so detection
      // continues to see it (prevents the self-focus dismiss loop).
    }
  } catch {
    // Not in Tauri
  }
}

export function AlarmController({
  alarmLevel,
  onDismiss,
}: AlarmControllerProps) {
  const [memeUrl, setMemeUrl] = useState<string | null>(null);

  // Pick a random meme when alarm activates (L2/L3 only — L1 toast is too small)
  useEffect(() => {
    if (alarmLevel >= 2) {
      setMemeUrl(getRandomMeme());
    } else {
      setMemeUrl(null);
    }
  }, [alarmLevel]);

  const handleDismiss = useCallback(() => {
    stop();
    setMemeUrl(null);
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
        <AlarmLevel1 key="alarm-1" />
      )}
      {alarmLevel === 2 && (
        <AlarmLevel2 key="alarm-2" onDismiss={handleDismiss} memeUrl={memeUrl} />
      )}
      {alarmLevel === 3 && (
        <AlarmLevel3 key="alarm-3" onDismiss={handleDismiss} memeUrl={memeUrl} />
      )}
    </AnimatePresence>
  );
}
