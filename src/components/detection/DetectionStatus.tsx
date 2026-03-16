import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectionState } from "@/hooks/useDetection";
import type { ActiveWindowInfo } from "@/services/detectionService";

interface DetectionStatusProps {
  detectionState: DetectionState;
  graceRemaining: number;
  alarmLevel: number;
  lastWindow: ActiveWindowInfo | null;
  compact?: boolean;
}

const stateConfig: Record<
  DetectionState,
  {
    label: string;
    icon: typeof Shield;
    color: string;
    bgColor: string;
    borderColor: string;
    pulseColor: string;
  }
> = {
  idle: {
    label: "Idle",
    icon: Shield,
    color: "text-text-muted",
    bgColor: "bg-white/[0.04]",
    borderColor: "border-white/[0.08]",
    pulseColor: "bg-white/10",
  },
  checking: {
    label: "Monitoring",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/[0.06]",
    borderColor: "border-emerald-500/20",
    pulseColor: "bg-emerald-400/20",
  },
  grace: {
    label: "Grace Period",
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/[0.06]",
    borderColor: "border-amber-500/20",
    pulseColor: "bg-amber-400/20",
  },
  alarm: {
    label: "Off Task!",
    icon: ShieldAlert,
    color: "text-red-400",
    bgColor: "bg-red-500/[0.06]",
    borderColor: "border-red-500/20",
    pulseColor: "bg-red-400/20",
  },
};

export function DetectionStatus({
  detectionState,
  graceRemaining,
  alarmLevel,
  lastWindow,
  compact = false,
}: DetectionStatusProps) {
  const config = stateConfig[detectionState];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-3 rounded-lg",
          "border transition-colors duration-300",
          config.bgColor,
          config.borderColor
        )}
      >
        <div className="relative">
          <Icon className={cn("w-3.5 h-3.5", config.color)} strokeWidth={1.5} />
          {(detectionState === "checking" || detectionState === "alarm") && (
            <motion.span
              className={cn(
                "absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full",
                detectionState === "checking"
                  ? "bg-emerald-400"
                  : "bg-red-400"
              )}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {detectionState === "grace" && graceRemaining > 0 && (
          <span className="text-xs text-amber-400/80 font-mono">
            {graceRemaining}s
          </span>
        )}
        {detectionState === "alarm" && alarmLevel > 0 && (
          <span className="text-[10px] text-red-400/70">
            L{alarmLevel}
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 py-2.5 px-4 rounded-xl",
        "border transition-all duration-300",
        config.bgColor,
        config.borderColor
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status indicator with pulse */}
      <div className="relative flex-shrink-0">
        <Icon className={cn("w-4 h-4", config.color)} strokeWidth={1.5} />
        <AnimatePresence>
          {detectionState !== "idle" && (
            <motion.span
              className={cn(
                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                config.pulseColor
              )}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Label + countdown */}
      <div className="flex flex-col min-w-0">
        <span className={cn("text-xs font-semibold leading-tight", config.color)}>
          {config.label}
          {detectionState === "alarm" && alarmLevel > 0 && (
            <span className="text-red-400/60 ml-1 font-normal">
              Level {alarmLevel}
            </span>
          )}
        </span>
        {detectionState === "grace" && graceRemaining > 0 && (
          <span className="text-[10px] text-amber-400/70 font-mono leading-tight">
            {graceRemaining}s remaining
          </span>
        )}
      </div>

      {/* Last window info */}
      {lastWindow && detectionState !== "idle" && (
        <div className="flex items-center gap-1.5 ml-auto min-w-0">
          <Eye className="w-3 h-3 text-text-muted flex-shrink-0" strokeWidth={1.5} />
          <span className="text-[10px] text-text-muted truncate max-w-[120px]">
            {lastWindow.app_name || lastWindow.process_name}
          </span>
        </div>
      )}
    </motion.div>
  );
}
