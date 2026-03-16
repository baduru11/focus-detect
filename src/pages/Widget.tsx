import { useEffect, useState } from "react";
import { Play, Pause, Square, Maximize2 } from "lucide-react";

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

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const data = localStorage.getItem("widget-sync");
        if (data) setState(JSON.parse(data));
      } catch { /* ignore */ }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const sendAction = (action: string) => {
    localStorage.setItem("widget-action", JSON.stringify({ action, ts: Date.now() }));
  };

  const openMain = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("widget_open_main");
    } catch { /* ignore */ }
  };

  const phaseColors: Record<string, string> = {
    work: "#6366f1",
    shortBreak: "#34d399",
    longBreak: "#34d399",
  };

  const phaseLabels: Record<string, string> = {
    work: "Focus",
    shortBreak: "Break",
    longBreak: "Long Break",
  };

  const detectionColors: Record<string, string> = {
    idle: "#555",
    checking: "#34d399",
    grace: "#fbbf24",
    alarm: "#f87171",
  };

  const detectionLabels: Record<string, string> = {
    idle: "",
    checking: "Monitoring",
    grace: `Grace ${state.graceRemaining}s`,
    alarm: "OFF TASK",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a14",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        color: "#f0f0f5",
        overflow: "hidden",
      }}
    >
      {/* Timer row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Status dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: state.status === "idle" ? "#555" : phaseColors[state.phase],
            boxShadow: state.status !== "idle" ? `0 0 8px ${phaseColors[state.phase]}` : "none",
            flexShrink: 0,
          }}
        />

        {/* Time */}
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
            fontVariantNumeric: "tabular-nums",
            color: phaseColors[state.phase] || "#f0f0f5",
            flex: 1,
          }}
        >
          {state.time}
        </span>

        {/* Controls */}
        <div style={{ display: "flex", gap: 4 }}>
          {state.status === "idle" && (
            <button onClick={() => sendAction("start")} style={btnStyle}>
              <Play size={16} color="#6366f1" />
            </button>
          )}
          {state.status === "running" && (
            <button onClick={() => sendAction("pause")} style={btnStyle}>
              <Pause size={16} color="#f0f0f5" />
            </button>
          )}
          {state.status === "paused" && (
            <button onClick={() => sendAction("resume")} style={btnStyle}>
              <Play size={16} color="#34d399" />
            </button>
          )}
          {state.status !== "idle" && (
            <button onClick={() => sendAction("stop")} style={btnStyle}>
              <Square size={14} color="#f87171" />
            </button>
          )}
          <button onClick={openMain} style={btnStyle} title="Open main window">
            <Maximize2 size={14} color="#888" />
          </button>
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 12, color: "#8b8ca0", fontWeight: 500 }}>
          {phaseLabels[state.phase] || "Ready"}
        </span>
        {state.detection !== "idle" && (
          <>
            <span style={{ color: "#333", fontSize: 10 }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: detectionColors[state.detection],
                }}
              />
              <span style={{ fontSize: 11, color: detectionColors[state.detection], fontWeight: 500 }}>
                {detectionLabels[state.detection]}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: 6,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
