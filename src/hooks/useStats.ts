import { useState, useEffect, useCallback } from "react";
import {
  type DaySummary,
  type AllTimeSummary,
  type StreakInfo,
  type DistractorEntry,
  type TimelineSegment,
  getTodaySessions,
  getWeekSummary,
  getAllTimeSummary,
  getStreakInfo,
  getTopDistractors,
  buildTimeline,
  getMockData,
} from "@/services/sessionService";

interface StatsData {
  todaySummary: DaySummary;
  focusPercent: number;
  todayTimeline: TimelineSegment[];
  weekSummary: DaySummary[];
  weeklyBars: { day: string; hours: number }[];
  allTimeSummary: AllTimeSummary;
  streak: StreakInfo;
  topDistractors: DistractorEntry[];
  loading: boolean;
  refreshStats: () => void;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function useStats(): StatsData {
  const [loading, setLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState<DaySummary>({
    date: "",
    focusMinutes: 0,
    distractionMinutes: 0,
    alarms: 0,
    cycles: 0,
  });
  const [focusPercent, setFocusPercent] = useState(0);
  const [todayTimeline, setTodayTimeline] = useState<TimelineSegment[]>([]);
  const [weekSummary, setWeekSummary] = useState<DaySummary[]>([]);
  const [weeklyBars, setWeeklyBars] = useState<{ day: string; hours: number }[]>([]);
  const [allTimeSummary, setAllTimeSummary] = useState<AllTimeSummary>({
    totalFocusHours: 0,
    bestDayMinutes: 0,
    bestDayDate: "",
    totalSessions: 0,
  });
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, best: 0 });
  const [topDistractors, setTopDistractors] = useState<DistractorEntry[]>([]);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      const [sessions, week, allTime, streakData, distractors] =
        await Promise.all([
          getTodaySessions(),
          getWeekSummary(),
          getAllTimeSummary(),
          getStreakInfo(),
          getTopDistractors(),
        ]);

      const hasData =
        sessions.length > 0 ||
        week.some((d) => d.focusMinutes > 0) ||
        allTime.totalSessions > 0;

      if (!hasData) {
        // No data — show zeroes, not mock data
        setTodaySummary({ date: new Date().toISOString().slice(0, 10), focusMinutes: 0, distractionMinutes: 0, alarms: 0, cycles: 0 });
        setFocusPercent(0);
        setTodayTimeline([]);
        setWeekSummary([]);
        setWeeklyBars([]);
        setAllTimeSummary({ totalFocusHours: 0, totalSessions: 0, bestDayMinutes: 0, bestDayDate: null });
        setStreak({ current: 0, best: 0 });
        setTopDistractors([]);
      } else {
        // Today summary from sessions
        let focusSec = 0;
        let distractSec = 0;
        let alarms = 0;
        let cycles = 0;
        for (const s of sessions) {
          focusSec += s.focus_seconds;
          distractSec += s.distraction_seconds;
          alarms += s.alarms_level1 + s.alarms_level2 + s.alarms_level3;
          cycles += s.cycles_completed;
        }
        const todayData: DaySummary = {
          date: new Date().toISOString().slice(0, 10),
          focusMinutes: Math.round(focusSec / 60),
          distractionMinutes: Math.round(distractSec / 60),
          alarms,
          cycles,
        };
        setTodaySummary(todayData);

        const total = todayData.focusMinutes + todayData.distractionMinutes;
        setFocusPercent(
          total > 0 ? Math.round((todayData.focusMinutes / total) * 100) : 0
        );

        setTodayTimeline(buildTimeline(sessions));
        setWeekSummary(week);
        setWeeklyBars(
          week.map((d) => {
            const date = new Date(d.date + "T00:00:00");
            return {
              day: dayNames[date.getDay()],
              hours: Math.round((d.focusMinutes / 60) * 10) / 10,
            };
          })
        );
        setAllTimeSummary(allTime);
        setStreak(streakData);
        setTopDistractors(distractors);
      }
    } catch {
      // Fallback to empty on error
      console.warn("Stats load error, showing empty:", err);
      setTodaySummary({ date: new Date().toISOString().slice(0, 10), focusMinutes: 0, distractionMinutes: 0, alarms: 0, cycles: 0 });
      setFocusPercent(0);
      setTodayTimeline([]);
      setWeekSummary([]);
      setWeeklyBars([]);
      setAllTimeSummary({ totalFocusHours: 0, totalSessions: 0, bestDayMinutes: 0, bestDayDate: null });
      setStreak({ current: 0, best: 0 });
      setTopDistractors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    todaySummary,
    focusPercent,
    todayTimeline,
    weekSummary,
    weeklyBars,
    allTimeSummary,
    streak,
    topDistractors,
    loading,
    refreshStats,
  };
}
