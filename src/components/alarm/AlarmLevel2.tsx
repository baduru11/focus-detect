import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonButton } from "@/components/ui/NeonButton";
import { playAlert, stop } from "@/services/alarmSound";

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

interface AlarmLevel2Props {
  onDismiss: () => void;
}

export function AlarmLevel2({ onDismiss }: AlarmLevel2Props) {
  const [cooldown, setCooldown] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    []
  );

  useEffect(() => {
    playAlert();
    return () => {
      stop();
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cooldown]);

  const handleDismiss = useCallback(() => {
    if (cooldown > 0) return;
    stop();
    onDismiss();
  }, [cooldown, onDismiss]);

  return (
    <>
      {/* Red pulsing vignette */}
      <motion.div
        className="fixed inset-0 z-[9994] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(255, 0, 60, 0.15) 100%)",
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Centered panel */}
      <div className="fixed inset-0 z-[9995] flex items-center justify-center">
        <motion.div
          className={cn(
            "glass-panel rounded-2xl p-8 w-[500px] max-w-[90vw] text-center",
            "border-2 border-neon-red/60"
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Animated red border glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255, 0, 60, 0.3), inset 0 0 20px rgba(255, 0, 60, 0.05)",
                "0 0 40px rgba(255, 0, 60, 0.6), inset 0 0 40px rgba(255, 0, 60, 0.1)",
                "0 0 20px rgba(255, 0, 60, 0.3), inset 0 0 20px rgba(255, 0, 60, 0.05)",
              ],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />

          <AlertTriangle className="w-12 h-12 text-neon-red mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neon-red mb-2">
            You're off task!
          </h2>
          <p className="text-text-secondary text-sm mb-6">{message}</p>

          <NeonButton
            variant="danger"
            size="lg"
            onClick={handleDismiss}
            disabled={cooldown > 0}
            className={cn(
              "w-full",
              cooldown > 0 && "opacity-60 cursor-not-allowed"
            )}
          >
            {cooldown > 0 ? `Wait ${cooldown}s...` : "I'm back!"}
          </NeonButton>
        </motion.div>
      </div>
    </>
  );
}
