import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Bell,
  Target,
  Trophy,
  Calendar,
  Zap,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FocusRingChart } from "@/components/stats/FocusRingChart";
import { TimelineBar } from "@/components/stats/TimelineBar";
import { WeeklyBarChart } from "@/components/stats/WeeklyBarChart";
import { StreakCard } from "@/components/stats/StreakCard";
import { AchievementCard } from "@/components/stats/AchievementCard";
import { DistractorLeaderboard } from "@/components/stats/DistractorLeaderboard";
import { useStats } from "@/hooks/useStats";
import { cn } from "@/lib/utils";

type Tab = "today" | "weekly" | "alltime";

const tabs: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "weekly", label: "Weekly" },
  { id: "alltime", label: "All-time" },
];

const tabVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Stats() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const stats = useStats();

  if (stats.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2
            className="w-6 h-6 animate-spin text-text-muted"
          />
          <span className="text-sm text-text-muted">Loading stats...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-10 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Statistics
        </h1>
        <motion.button
          className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/[0.03]"
          onClick={stats.refreshStats}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Refresh
        </motion.button>
      </motion.div>

      {/* Tab bar — clean pill style */}
      <motion.div
        className="flex gap-1 mb-6 flex-shrink-0 bg-white/[0.03] rounded-lg p-1 w-fit"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "relative px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer",
              activeTab === tab.id
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {activeTab === tab.id && (
              <motion.div
                className="absolute inset-0 rounded-md bg-white/[0.06] border border-white/[0.08]"
                layoutId="stats-tab-bg"
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "today" && (
            <motion.div
              key="today"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Ring chart + Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
                <GlassCard className="flex items-center justify-center p-6">
                  <FocusRingChart focusPercent={stats.focusPercent} />
                </GlassCard>
                <GlassCard>
                  <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">
                    Today's Timeline
                  </h3>
                  <TimelineBar sessions={stats.todayTimeline} />
                </GlassCard>
              </div>

              {/* Stat cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AchievementCard
                  icon={<Clock className="w-4 h-4" />}
                  title="Focus Time"
                  value={formatMinutes(stats.todaySummary.focusMinutes)}
                  glowColor="cyan"
                />
                <AchievementCard
                  icon={<Bell className="w-4 h-4" />}
                  title="Alarms Triggered"
                  value={String(stats.todaySummary.alarms)}
                  glowColor="red"
                />
                <AchievementCard
                  icon={<Target className="w-4 h-4" />}
                  title="Cycles Completed"
                  value={String(stats.todaySummary.cycles)}
                  glowColor="green"
                />
              </div>

              {/* Distractors */}
              <DistractorLeaderboard items={stats.topDistractors} />
            </motion.div>
          )}

          {activeTab === "weekly" && (
            <motion.div
              key="weekly"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Weekly bar chart */}
              <GlassCard>
                <h3 className="text-xs font-semibold text-text-muted mb-6 uppercase tracking-wider">
                  Focus Hours This Week
                </h3>
                <WeeklyBarChart data={stats.weeklyBars} />
              </GlassCard>

              {/* Streak + Best achievement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StreakCard
                  current={stats.streak.current}
                  best={stats.streak.best}
                />
                <AchievementCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  title="Weekly Focus Total"
                  value={formatMinutes(
                    stats.weekSummary.reduce(
                      (sum, d) => sum + d.focusMinutes,
                      0
                    )
                  )}
                  glowColor="purple"
                />
              </div>

              {/* Weekly totals summary */}
              <GlassCard>
                <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">
                  Weekly Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SummaryItem
                    label="Total Focus"
                    value={formatMinutes(
                      stats.weekSummary.reduce(
                        (s, d) => s + d.focusMinutes,
                        0
                      )
                    )}
                    color="#6366f1"
                  />
                  <SummaryItem
                    label="Total Distractions"
                    value={formatMinutes(
                      stats.weekSummary.reduce(
                        (s, d) => s + d.distractionMinutes,
                        0
                      )
                    )}
                    color="#ef4444"
                  />
                  <SummaryItem
                    label="Total Alarms"
                    value={String(
                      stats.weekSummary.reduce((s, d) => s + d.alarms, 0)
                    )}
                    color="#f59e0b"
                  />
                  <SummaryItem
                    label="Total Cycles"
                    value={String(
                      stats.weekSummary.reduce((s, d) => s + d.cycles, 0)
                    )}
                    color="#22c55e"
                  />
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "alltime" && (
            <motion.div
              key="alltime"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* Big numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AchievementCard
                  icon={<Clock className="w-4 h-4" />}
                  title="Total Hours Focused"
                  value={`${stats.allTimeSummary.totalFocusHours}h`}
                  glowColor="cyan"
                />
                <AchievementCard
                  icon={<Zap className="w-4 h-4" />}
                  title="Best Streak"
                  value={`${stats.streak.best} days`}
                  glowColor="green"
                />
                <AchievementCard
                  icon={<BarChart3 className="w-4 h-4" />}
                  title="Total Sessions"
                  value={String(stats.allTimeSummary.totalSessions)}
                  glowColor="purple"
                />
              </div>

              {/* Achievement records */}
              <GlassCard>
                <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">
                  Personal Records
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AchievementCard
                    icon={<Trophy className="w-4 h-4" />}
                    title="Best Focus Day"
                    value={formatMinutes(
                      stats.allTimeSummary.bestDayMinutes
                    )}
                    glowColor="cyan"
                  />
                  <AchievementCard
                    icon={<Calendar className="w-4 h-4" />}
                    title="Best Day Date"
                    value={
                      stats.allTimeSummary.bestDayDate
                        ? new Date(
                            stats.allTimeSummary.bestDayDate + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"
                    }
                    glowColor="purple"
                  />
                </div>
              </GlassCard>

              {/* All-time distractors */}
              <DistractorLeaderboard items={stats.topDistractors} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Helper sub-component ---

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-white/[0.02]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <span className="text-lg font-semibold font-mono" style={{ color, opacity: 0.8 }}>
        {value}
      </span>
      <span className="text-[10px] text-text-muted uppercase tracking-wider font-light">
        {label}
      </span>
    </motion.div>
  );
}
