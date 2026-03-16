import Database from "@tauri-apps/plugin-sql";
import type { Profile } from "@/types/profile";

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

interface ProfileRow {
  id: string;
  name: string;
  icon: string;
  mode: "whitelist" | "blacklist";
  apps: string;
  pomodoro: string;
  detection: string;
  monitors: string;
}

function parseProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    mode: row.mode,
    apps: JSON.parse(row.apps),
    pomodoro: JSON.parse(row.pomodoro),
    detection: JSON.parse(row.detection),
    monitors: JSON.parse(row.monitors),
  };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const database = await getDb();
  const rows = await database.select<ProfileRow[]>(
    "SELECT id, name, icon, mode, apps, pomodoro, detection, monitors FROM profiles"
  );
  return rows.map(parseProfileRow);
}

export async function getProfile(id: string): Promise<Profile | null> {
  const database = await getDb();
  const rows = await database.select<ProfileRow[]>(
    "SELECT id, name, icon, mode, apps, pomodoro, detection, monitors FROM profiles WHERE id = $1",
    [id]
  );
  if (rows.length === 0) return null;
  return parseProfileRow(rows[0]);
}

export async function createProfile(
  profile: Omit<Profile, "id">
): Promise<Profile> {
  const database = await getDb();
  const id = generateUUID();
  await database.execute(
    "INSERT INTO profiles (id, name, icon, mode, apps, pomodoro, detection, monitors) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [
      id,
      profile.name,
      profile.icon,
      profile.mode,
      JSON.stringify(profile.apps),
      JSON.stringify(profile.pomodoro),
      JSON.stringify(profile.detection),
      JSON.stringify(profile.monitors),
    ]
  );
  return { id, ...profile };
}

export async function updateProfile(
  id: string,
  updates: Partial<Omit<Profile, "id">>
): Promise<void> {
  const database = await getDb();
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    setClauses.push(`icon = $${paramIndex++}`);
    values.push(updates.icon);
  }
  if (updates.mode !== undefined) {
    setClauses.push(`mode = $${paramIndex++}`);
    values.push(updates.mode);
  }
  if (updates.apps !== undefined) {
    setClauses.push(`apps = $${paramIndex++}`);
    values.push(JSON.stringify(updates.apps));
  }
  if (updates.pomodoro !== undefined) {
    setClauses.push(`pomodoro = $${paramIndex++}`);
    values.push(JSON.stringify(updates.pomodoro));
  }
  if (updates.detection !== undefined) {
    setClauses.push(`detection = $${paramIndex++}`);
    values.push(JSON.stringify(updates.detection));
  }
  if (updates.monitors !== undefined) {
    setClauses.push(`monitors = $${paramIndex++}`);
    values.push(JSON.stringify(updates.monitors));
  }

  if (setClauses.length === 0) return;

  values.push(id);
  await database.execute(
    `UPDATE profiles SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteProfile(id: string): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM profiles WHERE id = $1", [id]);
}

export async function getSettingValue(key: string): Promise<string | null> {
  const database = await getDb();
  const rows = await database.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1",
    [key]
  );
  if (rows.length === 0) return null;
  return rows[0].value;
}

export async function setSettingValue(
  key: string,
  value: string
): Promise<void> {
  const database = await getDb();
  await database.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
    [key, value]
  );
}
