import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NeonButton } from "@/components/ui/NeonButton";
import { playSiren, stop } from "@/services/alarmSound";
import { GlitchEffect } from "./GlitchEffect";
import { ScreenShake } from "./ScreenShake";
import { ParticleBurst } from "./ParticleBurst";

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

interface AlarmLevel3Props {
  lockDuration?: number;
  onDismiss: () => void;
  memeUrl?: string | null;
}

export function AlarmLevel3({
  lockDuration = 15,
  onDismiss,
  memeUrl,
}: AlarmLevel3Props) {
  const [countdown, setCountdown] = useState(lockDuration);
  const [messageIndex, setMessageIndex] = useState(0);
  const [particleTrigger, setParticleTrigger] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const shuffledMessages = useMemo(() => {
    const shuffled = [...MESSAGES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  useEffect(() => {
    playSiren();
    return () => {
      stop();
    };
  }, []);

  // Burst particles on mount
  useEffect(() => {
    setParticleTrigger((p) => p + 1);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
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
  }, [countdown]);

  // Cycle motivational messages every 2 seconds
  useEffect(() => {
    messageIntervalRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % shuffledMessages.length);
    }, 2000);
    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [shuffledMessages.length]);

  const handleDismiss = useCallback(() => {
    if (countdown > 0) return;
    stop();
    onDismiss();
  }, [countdown, onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark red-tinted background */}
      <div className="absolute inset-0 bg-void/90" />
      <div className="absolute inset-0 bg-neon-red/10" />

      {/* Pulsing red neon border around entire screen */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          boxShadow: [
            "inset 0 0 60px rgba(255, 0, 60, 0.4), inset 0 0 120px rgba(255, 0, 60, 0.1)",
            "inset 0 0 100px rgba(255, 0, 60, 0.7), inset 0 0 200px rgba(255, 0, 60, 0.2)",
            "inset 0 0 60px rgba(255, 0, 60, 0.4), inset 0 0 120px rgba(255, 0, 60, 0.1)",
          ],
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Particle burst */}
      <ParticleBurst trigger={particleTrigger} particleCount={100} />

      {/* Main content with glitch + shake */}
      <GlitchEffect intensity={3}>
        <ScreenShake intensity={3}>
          <div className="relative w-screen h-screen flex flex-col items-center justify-center gap-6 p-8">
            {/* Countdown */}
            {countdown > 0 && (
              <motion.div
                className={cn(
                  "text-8xl font-mono font-bold text-neon-red",
                  "drop-shadow-[0_0_30px_rgba(255,0,60,0.8)]"
                )}
                animate={{
                  scale: [1, 1.1, 1],
                  textShadow: [
                    "0 0 20px rgba(255, 0, 60, 0.6)",
                    "0 0 40px rgba(255, 0, 60, 1)",
                    "0 0 20px rgba(255, 0, 60, 0.6)",
                  ],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {countdown}
              </motion.div>
            )}

            {/* Meme image */}
            {memeUrl && (
              <motion.img
                src={memeUrl}
                alt=""
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                className="max-w-md max-h-64 object-contain rounded-xl"
                style={{ filter: "drop-shadow(0 0 20px rgba(255, 0, 60, 0.5))" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              />
            )}

            {/* Cycling motivational message */}
            <motion.p
              key={messageIndex}
              className={cn(
                "text-2xl md:text-3xl font-bold text-center max-w-2xl px-4",
                "text-text-primary",
                "drop-shadow-[0_0_20px_rgba(255,0,60,0.5)]"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {shuffledMessages[messageIndex]}
            </motion.p>

            {/* Dismiss button — only appears when countdown ends */}
            {countdown <= 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
              >
                <NeonButton
                  variant="danger"
                  size="lg"
                  onClick={handleDismiss}
                  className="text-lg px-12 py-5 font-bold tracking-wider"
                >
                  I'M BACK!
                </NeonButton>
              </motion.div>
            )}
          </div>
        </ScreenShake>
      </GlitchEffect>
    </motion.div>
  );
}
