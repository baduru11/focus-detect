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

  // Force always-on-top repeatedly (in case it gets lost)
  useEffect(() => {
    const enforce = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setAlwaysOnTop(true);
      } catch { /* ignore */ }
    };
    enforce();
    const interval = setInterval(enforce, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync state
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

  const colors: Record<string, string> = {
    work: "#818cf8", shortBreak: "#6ee7b7", longBreak: "#6ee7b7",
  };
  const detColors: Record<string, string> = {
    idle: "#555", checking: "#34d399", grace: "#fbbf24", alarm: "#f87171",
  };

  return (
    <div style={{
      width: "100%", height: "100%", background: "#0d0d1a",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#f0f0f5",
      overflow: "hidden",
    }}>
      {/* Drag region — click and drag to move */}
      <div
        onMouseDown={async () => {
          try {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            await getCurrentWindow().startDragging();
          } catch { /* ignore */ }
        }}
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "12px 16px",
          cursor: "grab",
        }}
      >
        {/* Timer row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            background: state.status === "idle" ? "#555" : colors[state.phase],
            boxShadow: state.status !== "idle" ? `0 0 6px ${colors[state.phase]}` : "none",
          }} />

          <span style={{
            fontSize: 24, fontWeight: 600, flex: 1,
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
            fontVariantNumeric: "tabular-nums",
            color: colors[state.phase] || "#f0f0f5",
          }}>
            {state.time}
          </span>

          {state.detection === "grace" && (
            <span style={{ fontSize: 12, color: "#fbbf24", fontFamily: "monospace" }}>
              {state.graceRemaining}s
            </span>
          )}
        </div>

        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#8b8ca0" }}>
            {state.phase === "work" ? "Focus" : state.phase === "shortBreak" ? "Break" : "Long Break"}
          </span>
          {state.detection !== "idle" && (
            <>
              <span style={{ color: "#333" }}>·</span>
              <span style={{ fontSize: 10, color: detColors[state.detection], fontWeight: 500 }}>
                {state.detection === "checking" ? "Monitoring" : state.detection === "grace" ? "Grace" : state.detection === "alarm" ? "OFF TASK" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Button bar — NOT draggable */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "8px 12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        {state.status === "idle" && (
          <Btn onClick={() => sendAction("start")}><Play size={14} color="#818cf8" /> Start</Btn>
        )}
        {state.status === "running" && (
          <Btn onClick={() => sendAction("pause")}><Pause size={14} /> Pause</Btn>
        )}
        {state.status === "paused" && (
          <Btn onClick={() => sendAction("resume")}><Play size={14} color="#34d399" /> Resume</Btn>
        )}
        {state.status !== "idle" && (
          <Btn onClick={() => sendAction("stop")}><Square size={12} color="#f87171" /> Stop</Btn>
        )}
        <div style={{ flex: 1 }} />
        <Btn onClick={openMain}><Maximize2 size={13} color="#888" /></Btn>
      </div>
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6, padding: "5px 10px",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        color: "#ccc", fontSize: 12, fontFamily: "inherit",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
    >
      {children}
    </button>
  );
}
