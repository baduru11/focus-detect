import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { AlarmLevel3 } from "@/components/alarm/AlarmLevel3";

/**
 * Standalone alarm page rendered in the overlay window.
 * Covers the entire monitor with a transparent background + alarm effects.
 * Listens for a "dismiss" event from the main window.
 */
export default function AlarmPage() {
  const [dismissed, setDismissed] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_alarm_overlay");
    } catch {
      // fallback
    }
  };

  // Auto-close if the main window tells us to via localStorage polling
  // (cross-window communication fallback)
  useEffect(() => {
    const check = setInterval(async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        // Listen for close request
        const unlisten = await win.onCloseRequested(async () => {
          setDismissed(true);
        });
        clearInterval(check);
        return () => unlisten();
      } catch {
        // Not ready yet
      }
    }, 500);

    return () => {
      clearInterval(check);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (dismissed) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      style={{ background: "rgba(0, 0, 0, 0.85)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AlarmLevel3 onDismiss={handleDismiss} />
    </motion.div>
  );
}
