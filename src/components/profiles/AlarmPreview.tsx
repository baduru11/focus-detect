import { useState, useCallback } from "react";
import { Volume2 } from "lucide-react";
import { playChime, playAlert, playSiren, stop } from "@/services/alarmSound";

export function AlarmPreview() {
  const [previewing, setPreviewing] = useState<number | null>(null);

  const preview = useCallback(async (level: number) => {
    if (previewing !== null) {
      stop();
      setPreviewing(null);
      return;
    }

    setPreviewing(level);
    if (level === 1) playChime();
    else if (level === 2) playAlert();
    else playSiren();

    // Auto-stop after 3s
    setTimeout(() => {
      stop();
      setPreviewing(null);
    }, 3000);
  }, [previewing]);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#888", marginRight: 4 }}>Preview:</span>
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          onClick={() => preview(level)}
          style={{
            background: previewing === level
              ? "rgba(0, 240, 255, 0.15)"
              : "rgba(255, 255, 255, 0.05)",
            border: previewing === level
              ? "1px solid rgba(0, 240, 255, 0.4)"
              : "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 6,
            padding: "4px 10px",
            color: previewing === level ? "#00f0ff" : "#aaa",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s",
          }}
        >
          <Volume2 size={12} />
          L{level}
        </button>
      ))}
    </div>
  );
}
