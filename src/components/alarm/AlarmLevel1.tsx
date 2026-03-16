import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface AlarmLevel1Props {
  onDismiss: () => void;
}

export function AlarmLevel1({ onDismiss }: AlarmLevel1Props) {
  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    []
  );

  useEffect(() => {
    playChime();
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 right-6 z-[9990] w-[320px]",
        "glass-panel rounded-xl px-4 py-3",
        "border border-neon-orange/40",
        "shadow-[0_0_15px_rgba(255,140,0,0.3),inset_0_0_15px_rgba(255,140,0,0.05)]"
      )}
      initial={{ x: 350, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 350, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <AlertTriangle className="w-5 h-5 text-neon-orange" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neon-orange">
            Get back to work!
          </p>
          <p className="text-xs text-text-secondary mt-0.5 leading-snug truncate">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
