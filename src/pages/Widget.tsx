import { useEffect, useState } from "react";
import { Play, Pause, Square, SkipForward, Maximize2 } from "lucide-react";

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
    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setAlwaysOnTop(true);
      } catch { /* ignore */ }
    })();
    const interval = setInterval(async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setAlwaysOnTop(true);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const data = localStorage.getItem("widget-sync");
        if (data) setState(JSON.parse(data));
      } catch { /* ignore */ }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const send = (action: string) => {
    localStorage.setItem("widget-action", JSON.stringify({ action, ts: Date.now() }));
  };

  const openMain = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("widget_open_main");
    } catch { /* ignore */ }
  };

  const c: Record<string, string> = {
    work: "#818cf8", shortBreak: "#6ee7b7", longBreak: "#6ee7b7",
  };
  const dc: Record<string, string> = {
    idle: "#444", checking: "#34d399", grace: "#fbbf24", alarm: "#f87171",
  };

  return (
    <div style={{
      width: "100%", height: "100%", background: "#0d0d1a",
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 16px",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#f0f0f5",
    }}>
      {/* Drag area: dot + timer */}
      <div
        onMouseDown={async () => {
          try {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            await getCurrentWindow().startDragging();
          } catch { /* ignore */ }
        }}
        style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "grab" }}
      >
        {/* Detection dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: state.status === "idle" ? "#444" : dc[state.detection],
          boxShadow: state.detection !== "idle" ? `0 0 6px ${dc[state.detection]}` : "none",
        }} />

        {/* Timer */}
        <span style={{
          fontSize: 22, fontWeight: 600,
          fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
          fontVariantNumeric: "tabular-nums",
          color: c[state.phase] || "#f0f0f5",
        }}>
          {state.time}
        </span>

        {/* Grace */}
        {state.detection === "grace" && (
          <span style={{ fontSize: 11, color: "#fbbf24", fontFamily: "monospace" }}>
            {state.graceRemaining}s
          </span>
        )}
      </div>

      {/* Controls — inline next to timer */}
      {state.status === "idle" ? (
        <Btn onClick={() => send("start")}><Play size={14} /></Btn>
      ) : (
        <>
          {state.status === "running" ? (
            <Btn onClick={() => send("pause")}><Pause size={14} /></Btn>
          ) : (
            <Btn onClick={() => send("resume")}><Play size={14} color="#34d399" /></Btn>
          )}
          <Btn onClick={() => send("stop")}><Square size={12} color="#f87171" /></Btn>
          <Btn onClick={() => send("skip")}><SkipForward size={13} /></Btn>
        </>
      )}

      {/* Expand */}
      <Btn onClick={openMain}><Maximize2 size={13} color="#666" /></Btn>
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "none",
        borderRadius: 6, padding: 6,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#ccc",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
    >
      {children}
    </button>
  );
}
