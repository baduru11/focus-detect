import Database from "@tauri-apps/plugin-sql";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SessionRecord {
  id: string;
  profile_id: string;
  started_at: string;
  ended_at: string | null;
  phase: string;
  cycles_completed: number;
  focus_seconds: number;
  distraction_seconds: number;
  alarms_level1: number;
  alarms_level2: number;
  alarms_level3: number;
}

export interface DaySummary {
  date: string;
  focusMinutes: number;
  distractionMinutes: number;
  alarms: number;
  cycles: number;
}

export interface StreakInfo {
  current: number;
  best: number;
}

export interface AllTimeSummary {
  totalFocusHours: number;
  bestDayMinutes: number;
  bestDayDate: string;
  totalSessions: number;
}

export interface DistractorEntry {
  name: string;
  count: number;
}

export interface TimelineSegment {
  startMinute: number;
  endMinute: number;
  type: "focus" | "alarm" | "break";
}

// ─── Database helper ────────────────────────────────────────────────────────

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:focus_detector.db");
  }
  return db;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Session CRUD ───────────────────────────────────────────────────────────

export async function startSession(profileId: string): Promise<string> {
  try {
    const database = await getDb();
    const id = generateUUID();
    const now = new Date().toISOString();
    await database.execute(
      `INSERT INTO sessions (id, profile_id, started_at, phase, cycles_completed,
        focus_seconds, distraction_seconds, alarms_level1, alarms_level2, alarms_level3)
       VALUES ($1, $2, $3, 'focus', 0, 0, 0, 0, 0, 0)`,
      [id, profileId, now]
    );
    return id;
  } catch {
    return generateUUID();
  }
}

export async function endSession(
  sessionId: string,
  stats?: {
    phase?: string;
    cyclesCompleted?: number;
    focusSeconds?: number;
    distractionSeconds?: number;
    alarmsLevel1?: number;
    alarmsLevel2?: number;
    alarmsLevel3?: number;
  }
): Promise<void> {
  try {
    const database = await getDb();
    const now = new Date().toISOString();
    await database.execute(
      `UPDATE sessions SET ended_at = $1, phase = COALESCE($2, phase),
        cycles_completed = COALESCE($3, cycles_completed),
        focus_seconds = COALESCE($4, focus_seconds),
        distraction_seconds = COALESCE($5, distraction_seconds),
        alarms_level1 = COALESCE($6, alarms_level1),
        alarms_level2 = COALESCE($7, alarms_level2),
        alarms_level3 = COALESCE($8, alarms_level3)
       WHERE id = $9`,
      [
        now,
        stats?.phase ?? null,
        stats?.cyclesCompleted ?? null,
        stats?.focusSeconds ?? null,
        stats?.distractionSeconds ?? null,
        stats?.alarmsLevel1 ?? null,
        stats?.alarmsLevel2 ?? null,
        stats?.alarmsLevel3 ?? null,
        sessionId,
      ]
    );
  } catch {
    // silently fail if DB is unavailable
  }
}

// ─── Query helpers ──────────────────────────────────────────────────────────

export async function getTodaySessions(): Promise<SessionRecord[]> {
  try {
    const database = await getDb();
    const today = todayISO();
    const rows = await database.select<SessionRecord[]>(
      `SELECT * FROM sessions WHERE date(started_at) = $1 ORDER BY started_at ASC`,
      [today]
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getWeekSummary(): Promise<DaySummary[]> {
  try {
    const database = await getDb();
    const results: DaySummary[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const rows = await database.select<
        {
          total_focus: number;
          total_distraction: number;
          total_alarms: number;
          total_cycles: number;
        }[]
      >(
        `SELECT
          COALESCE(SUM(focus_seconds), 0) as total_focus,
          COALESCE(SUM(distraction_seconds), 0) as total_distraction,
          COALESCE(SUM(alarms_level1 + alarms_level2 + alarms_level3), 0) as total_alarms,
          COALESCE(SUM(cycles_completed), 0) as total_cycles
         FROM sessions WHERE date(started_at) = $1`,
        [dateStr]
      );
      const row = rows[0];
      results.push({
        date: dateStr,
        focusMinutes: Math.round((row?.total_focus ?? 0) / 60),
        distractionMinutes: Math.round((row?.total_distraction ?? 0) / 60),
        alarms: row?.total_alarms ?? 0,
        cycles: row?.total_cycles ?? 0,
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function getAllTimeSummary(): Promise<AllTimeSummary> {
  try {
    const database = await getDb();
    const totals = await database.select<
      { total_focus: number; total_sessions: number }[]
    >(
      `SELECT COALESCE(SUM(focus_seconds), 0) as total_focus, COUNT(*) as total_sessions FROM sessions`
    );
    const bestDay = await database.select<
      { day_date: string; day_focus: number }[]
    >(
      `SELECT date(started_at) as day_date, SUM(focus_seconds) as day_focus
       FROM sessions GROUP BY date(started_at) ORDER BY day_focus DESC LIMIT 1`
    );
    return {
      totalFocusHours: Math.round(((totals[0]?.total_focus ?? 0) / 3600) * 10) / 10,
      bestDayMinutes: Math.round((bestDay[0]?.day_focus ?? 0) / 60),
      bestDayDate: bestDay[0]?.day_date ?? "",
      totalSessions: totals[0]?.total_sessions ?? 0,
    };
  } catch {
    return { totalFocusHours: 0, bestDayMinutes: 0, bestDayDate: "", totalSessions: 0 };
  }
}

export async function getStreakInfo(): Promise<StreakInfo> {
  try {
    const database = await getDb();
    const days = await database.select<{ day_date: string }[]>(
      `SELECT DISTINCT date(started_at) as day_date FROM sessions
       WHERE cycles_completed > 0 AND (alarms_level2 + alarms_level3) = 0
       ORDER BY day_date DESC`
    );
    if (days.length === 0) return { current: 0, best: 0 };

    let current = 0;
    let best = 0;
    let streak = 0;
    let prevDate: Date | null = null;

    for (const row of days) {
      const d = new Date(row.day_date + "T00:00:00");
      if (prevDate === null) {
        const today = new Date(todayISO() + "T00:00:00");
        const diffFromToday = Math.round(
          (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffFromToday <= 1) {
          streak = 1;
        } else {
          streak = 0;
          best = 1;
          prevDate = d;
          continue;
        }
      } else {
        const diff = Math.round(
          (prevDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          streak++;
        } else {
          if (current === 0) current = streak;
          best = Math.max(best, streak);
          streak = 1;
        }
      }
      prevDate = d;
    }
    if (current === 0) current = streak;
    best = Math.max(best, streak);

    return { current, best };
  } catch {
    return { current: 0, best: 0 };
  }
}

export async function getTopDistractors(): Promise<DistractorEntry[]> {
  try {
    const database = await getDb();
    const rows = await database.select<{ app_name: string; cnt: number }[]>(
      `SELECT app_name, COUNT(*) as cnt FROM distractions
       GROUP BY app_name ORDER BY cnt DESC LIMIT 5`
    );
    return rows.map((r) => ({ name: r.app_name, count: r.cnt }));
  } catch {
    return [];
  }
}

// ─── Timeline builder ───────────────────────────────────────────────────────

export function buildTimeline(sessions: SessionRecord[]): TimelineSegment[] {
  if (sessions.length === 0) return [];
  const segments: TimelineSegment[] = [];

  for (const s of sessions) {
    const start = new Date(s.started_at);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const durationMin = Math.round((s.focus_seconds + s.distraction_seconds) / 60);
    const endMin = startMin + Math.max(durationMin, 1);
    const totalAlarms = s.alarms_level1 + s.alarms_level2 + s.alarms_level3;

    if (s.focus_seconds > 0) {
      segments.push({ startMinute: startMin, endMinute: endMin, type: "focus" });
    }
    if (totalAlarms > 0) {
      const alarmMin = startMin + Math.round(durationMin * 0.5);
      segments.push({
        startMinute: alarmMin,
        endMinute: Math.min(alarmMin + 1, endMin),
        type: "alarm",
      });
    }
    if (s.phase === "break" || s.phase === "longBreak") {
      segments.push({ startMinute: startMin, endMinute: endMin, type: "break" });
    }
  }

  return segments.sort((a, b) => a.startMinute - b.startMinute);
}

// ─── Mock data ──────────────────────────────────────────────────────────────

export function getMockData() {
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weekSummary: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayIdx = d.getDay();
    const isWeekend = dayIdx === 0 || dayIdx === 6;
    const baseFocus = isWeekend ? 45 : 120;
    const jitter = Math.round((Math.random() - 0.3) * 60);
    return {
      date: d.toISOString().slice(0, 10),
      focusMinutes: Math.max(15, baseFocus + jitter),
      distractionMinutes: Math.round(10 + Math.random() * 25),
      alarms: Math.round(Math.random() * 6),
      cycles: Math.round(2 + Math.random() * 4),
    };
  });

  const todaySummary = weekSummary[6];

  const focusPercent =
    todaySummary.focusMinutes + todaySummary.distractionMinutes > 0
      ? Math.round(
          (todaySummary.focusMinutes /
            (todaySummary.focusMinutes + todaySummary.distractionMinutes)) *
            100
        )
      : 0;

  const weeklyBars = weekSummary.map((d) => {
    const date = new Date(d.date + "T00:00:00");
    return {
      day: dayNames[date.getDay()],
      hours: Math.round((d.focusMinutes / 60) * 10) / 10,
    };
  });

  const todayTimeline: TimelineSegment[] = [
    { startMinute: 540, endMinute: 565, type: "focus" },
    { startMinute: 565, endMinute: 570, type: "break" },
    { startMinute: 570, endMinute: 595, type: "focus" },
    { startMinute: 595, endMinute: 596, type: "alarm" },
    { startMinute: 596, endMinute: 600, type: "break" },
    { startMinute: 600, endMinute: 625, type: "focus" },
    { startMinute: 630, endMinute: 655, type: "focus" },
    { startMinute: 660, endMinute: 665, type: "break" },
    { startMinute: 665, endMinute: 690, type: "focus" },
    { startMinute: 690, endMinute: 691, type: "alarm" },
    {
      startMinute: now.getHours() * 60 + now.getMinutes() - 20,
      endMinute: now.getHours() * 60 + now.getMinutes(),
      type: "focus",
    },
  ];

  const allTimeSummary: AllTimeSummary = {
    totalFocusHours: 42.3,
    bestDayMinutes: 185,
    bestDayDate: "2026-03-10",
    totalSessions: 156,
  };

  const streak: StreakInfo = { current: 7, best: 12 };

  const topDistractors: DistractorEntry[] = [
    { name: "Discord", count: 34 },
    { name: "YouTube", count: 28 },
    { name: "Twitter/X", count: 19 },
    { name: "Slack", count: 12 },
    { name: "Reddit", count: 8 },
  ];

  return {
    todaySummary,
    weekSummary,
    focusPercent,
    weeklyBars,
    todayTimeline,
    allTimeSummary,
    streak,
    topDistractors,
  };
}
