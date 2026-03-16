CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  mode TEXT DEFAULT 'blacklist',
  apps TEXT DEFAULT '[]',
  pomodoro TEXT DEFAULT '{}',
  detection TEXT DEFAULT '{}',
  monitors TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  phase TEXT NOT NULL,
  cycles_completed INTEGER DEFAULT 0,
  focus_seconds INTEGER DEFAULT 0,
  distraction_seconds INTEGER DEFAULT 0,
  alarms_level1 INTEGER DEFAULT 0,
  alarms_level2 INTEGER DEFAULT 0,
  alarms_level3 INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS distractions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  detected_at DATETIME NOT NULL,
  app_name TEXT,
  window_title TEXT,
  alarm_level INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO profiles (id, name, icon, mode, apps, pomodoro, detection, monitors)
VALUES (
  'default',
  'General Focus',
  '🎯',
  'blacklist',
  '[{"name":"YouTube (Chrome)","process":"chrome.exe","allowed":false,"sites":["youtube.com"]},{"name":"YouTube (Whale)","process":"whale.exe","allowed":false,"sites":["youtube.com"]},{"name":"YouTube (Edge)","process":"msedge.exe","allowed":false,"sites":["youtube.com"]},{"name":"Reddit","process":"chrome.exe","allowed":false,"sites":["reddit.com"]},{"name":"Reddit (Whale)","process":"whale.exe","allowed":false,"sites":["reddit.com"]},{"name":"Twitter","process":"chrome.exe","allowed":false,"sites":["twitter.com","x.com"]},{"name":"Twitter (Whale)","process":"whale.exe","allowed":false,"sites":["twitter.com","x.com"]}]',
  '{"work":25,"shortBreak":5,"longBreak":15,"cyclesBeforeLong":4}',
  '{"checkInterval":30,"graceCountdown":10,"alarmLockDuration":15}',
  '{"detection":"all","alarm":"all"}'
);
