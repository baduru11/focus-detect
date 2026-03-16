import { motion } from "framer-motion";
import { Clock, Flame, Bell, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const stats = [
  {
    label: "Total Focus Time",
    value: "42h 15m",
    icon: Clock,
    glow: "cyan" as const,
    change: "+12% this week",
  },
  {
    label: "Current Streak",
    value: "7 days",
    icon: Flame,
    glow: "purple" as const,
    change: "Personal best!",
  },
  {
    label: "Alarms Triggered",
    value: "23",
    icon: Bell,
    glow: "red" as const,
    change: "-5 from last week",
  },
  {
    label: "Focus Score",
    value: "87%",
    icon: TrendingUp,
    glow: "green" as const,
    change: "+3% improvement",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Stats() {
  return (
    <div className="h-full p-8">
      <motion.h1
        className="text-3xl font-bold text-text-primary tracking-tight mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Statistics
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={item}>
              <GlassCard glow={stat.glow} className="h-full">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Icon
                      className="w-5 h-5"
                      style={{
                        color:
                          stat.glow === "cyan"
                            ? "#00f0ff"
                            : stat.glow === "purple"
                            ? "#bf00ff"
                            : stat.glow === "red"
                            ? "#ff003c"
                            : "#00ff88",
                      }}
                    />
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-text-primary">
                      {stat.value}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {stat.change}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Placeholder for future chart area */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard className="h-64 flex items-center justify-center">
          <div className="text-center text-text-muted">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Focus trend chart coming soon</p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
