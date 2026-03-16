import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Small floating widget — like Zoom's mini window.
 * Shows timer countdown + detection status.
 * Click to open main window.
 */
export default function Widget() {
  const [time, setTime] = useState("25:00");
  const [status, setStatus] = useState<"idle" | "focus" | "break">("idle");

  // Dragging support
  const startDrag = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {
      // Not in Tauri
    }
  };

  const openMain = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("widget_open_main");
    } catch {
      // Not in Tauri
    }
  };

  // Listen for timer updates from main window via localStorage polling
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const data = localStorage.getItem("widget-sync");
        if (data) {
          const parsed = JSON.parse(data);
          setTime(parsed.time || "25:00");
          setStatus(parsed.status || "idle");
        }
      } catch {
        // ignore
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    idle: "#555566",
    focus: "#6366f1",
    break: "#34d399",
  };

  return (
    <div
      className="w-full h-full flex items-center select-none"
      style={{ background: "transparent" }}
    >
      <motion.div
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer"
        style={{
          background: "rgba(15, 15, 25, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
        onMouseDown={startDrag}
        onDoubleClick={openMain}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Status dot */}
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: statusColors[status],
            boxShadow: status !== "idle" ? `0 0 8px ${statusColors[status]}` : "none",
          }}
        />

        {/* Timer */}
        <span
          className="text-sm font-mono font-medium tabular-nums"
          style={{ color: "#f0f0f5" }}
        >
          {time}
        </span>

        {/* Status label */}
        <span
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: statusColors[status] }}
        >
          {status === "idle" ? "Ready" : status === "focus" ? "Focus" : "Break"}
        </span>
      </motion.div>
    </div>
  );
}
