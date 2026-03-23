import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { playChime } from "@/services/alarmSound";

const MESSAGES = [
  "Focus! Your future self will thank you.",
  "The grind doesn't stop. Neither should you.",
  "Distractions are temporary. Results are forever.",
  "You're better than this. Get back to it.",
  "Every second counts. Make it count.",
  "Champions don't take unplanned breaks.",
  "Your goals aren't going to achieve themselves.",
  "Stay locked in. You've got this.",
  "The only way out is through.",
  "Discipline is choosing between what you want now and what you want most.",
];

export function AlarmLevel1() {
  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    []
  );

  useEffect(() => {
    playChime();
  }, []);

  return (
    <motion.div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9990,
        width: 320,
        borderRadius: 12,
        padding: "12px 16px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.05))",
        backdropFilter: "blur(40px) saturate(1.8)",
        WebkitBackdropFilter: "blur(40px) saturate(1.8)",
        border: "1px solid rgba(255, 140, 0, 0.4)",
        boxShadow: "0 0 15px rgba(255,140,0,0.3), inset 0 0 15px rgba(255,140,0,0.05)",
      }}
      initial={{ x: 350, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 350, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <AlertTriangle style={{ width: 20, height: 20, color: "#ff8c00" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#ff8c00", margin: 0 }}>
            Get back to work!
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
