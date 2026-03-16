import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square } from "lucide-react";

/**
 * Floating widget — like Zoom's mini window.
 * Syncs with main window via localStorage.
 * Shows timer + play/pause/stop controls.
 */

interface WidgetState {
  time: string;
  phase: "work" | "shortBreak" | "longBreak";
  status: "idle" | "running" | "paused";
  detection: "idle" | "checking" | "grace" | "alarm";
  graceRemaining: number;
}

export default function Widget() {
  const [state, setState] = useState<WidgetState>({
    time: "25:00",
    phase: "work",
    status: "idle",
    detection: "idle",
    graceRemaining: 0,
  });

  // Sync from main window via localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const data = localStorage.getItem("widget-sync");
        if (data) {
          setState(JSON.parse(data));
        }
      } catch { /* ignore */ }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const sendAction = (action: string) => {
    localStorage.setItem("widget-action", JSON.stringify({ action, ts: Date.now() }));
  };

  const startDrag = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch { /* Not in Tauri */ }
  };

  const openMain = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("widget_open_main");
    } catch { /* Not in Tauri */ }
  };

  const phaseColors = {
    work: "#6366f1",
    shortBreak: "#34d399",
    longBreak: "#34d399",
  };

  const detectionDot = {
    idle: "#555",
    checking: "#34d399",
    grace: "#fbbf24",
    alarm: "#f87171",
  };

  return (
    <div className="w-full h-full flex items-center" style={{ background: "transparent" }}>
      <motion.div
        className="flex items-center gap-2 px-3 py-2 rounded-xl w-full"
        style={{
          background: "rgba(10, 10, 18, 0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}
        onMouseDown={startDrag}
      >
        {/* Detection status dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: detectionDot[state.detection],
            boxShadow: state.detection !== "idle" ? `0 0 6px ${detectionDot[state.detection]}` : "none",
          }}
        />

        {/* Timer */}
        <span
          className="text-[15px] font-mono font-semibold tabular-nums flex-1"
          style={{ color: phaseColors[state.phase] }}
        >
          {state.time}
        </span>

        {/* Grace countdown */}
        {state.detection === "grace" && (
          <span className="text-[11px] text-amber-400 font-mono tabular-nums">
            {state.graceRemaining}s
          </span>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1">
          {state.status === "idle" && (
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); sendAction("start"); }}
            >
              <Play className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
            </button>
          )}
          {state.status === "running" && (
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); sendAction("pause"); }}
            >
              <Pause className="w-3.5 h-3.5" style={{ color: "#f0f0f5" }} />
            </button>
          )}
          {state.status === "paused" && (
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); sendAction("resume"); }}
            >
              <Play className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
            </button>
          )}
          {state.status !== "idle" && (
            <button
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); sendAction("stop"); }}
            >
              <Square className="w-3 h-3" style={{ color: "#f87171" }} />
            </button>
          )}
        </div>

        {/* Open main */}
        <button
          className="text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer ml-1"
          onClick={(e) => { e.stopPropagation(); openMain(); }}
        >
          ↗
        </button>
      </motion.div>
    </div>
  );
}
