import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function Dashboard() {
  const [running, setRunning] = useState(false);

  const timerRadius = 90;
  const circumference = 2 * Math.PI * timerRadius;
  const progress = running ? 0.35 : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-8">
      <motion.h1
        className="text-3xl font-bold text-text-primary tracking-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        Dashboard
      </motion.h1>

      {/* Timer Ring */}
      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          {/* Background ring */}
          <circle
            cx="110"
            cy="110"
            r={timerRadius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <motion.circle
            cx="110"
            cy="110"
            r={timerRadius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset: circumference * (1 - progress),
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.5))",
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#bf00ff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold text-text-primary">
            {running ? "25:00" : "00:00"}
          </span>
          <span className="text-xs text-text-muted mt-1">
            {running ? "FOCUSING" : "READY"}
          </span>
        </div>
      </motion.div>

      {/* Active Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard glow="cyan" className="flex items-center gap-3 py-4 px-6">
          <Target className="w-5 h-5 text-neon-cyan" />
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              Active Profile
            </p>
            <p className="text-sm font-semibold text-text-primary">
              General Focus
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Start/Stop Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <NeonButton
          variant={running ? "danger" : "primary"}
          size="lg"
          onClick={() => setRunning(!running)}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <Pause className="w-5 h-5" /> Stop Focus
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5" /> Start Focus
            </span>
          )}
        </NeonButton>
      </motion.div>
    </div>
  );
}
