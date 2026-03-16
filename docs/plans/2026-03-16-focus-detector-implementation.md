# Focus Detector — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Tauri 2.0 desktop app that monitors user activity and triggers escalating meme alarms when they go off-task, with Pomodoro timer and activity profiles.

**Architecture:** Tauri 2.0 with Rust backend handling window detection, screenshots, and AI vision bridge. React frontend renders cyberpunk glassmorphism UI with Framer Motion animations. SQLite stores profiles, sessions, and stats locally.

**Tech Stack:** Tauri 2.0, Rust, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, tauri-plugin-screenshots, tauri-plugin-sql (SQLite), active-win-pos-rs, Web Audio API

**Design doc:** `docs/plans/2026-03-16-focus-detector-design.md`

---

## Phase 0: Prerequisites & Project Scaffold

### Task 0.1: Install Rust Toolchain

**Why:** Tauri 2.0 requires Rust. Not currently installed on this machine.

**Step 1: Install Rust via rustup**

Run:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Or on Windows, download and run `rustup-init.exe` from https://rustup.rs

Expected: `rustc --version` outputs `rustc 1.8x.x`

**Step 2: Install Tauri CLI prerequisites (Windows)**

Run:
```bash
rustup target add x86_64-pc-windows-msvc
```

Verify:
```bash
rustc --version && cargo --version
```

**Step 3: Commit — skip (no code yet)**

---

### Task 0.2: Scaffold Tauri + React + TypeScript Project

**Files:**
- Create: entire project scaffold via CLI

**Step 1: Create the Tauri app**

Run from `C:/Users/badur/baduru/02_Projects/detect`:
```bash
npm create tauri-app@latest . -- --template react-ts
```
Select: Package manager = npm, Frontend = React + TypeScript

**Step 2: Verify scaffold builds**

Run:
```bash
cd C:/Users/badur/baduru/02_Projects/detect
npm install
npm run tauri dev
```
Expected: A blank Tauri window opens with the React template.

**Step 3: Initialize git**

Run:
```bash
git init
git add -A
git commit -m "chore: scaffold Tauri 2.0 + React + TypeScript project"
```

---

### Task 0.3: Install Core Dependencies (Frontend)

**Files:**
- Modify: `package.json`
- Modify: `tailwind.config.ts` / `postcss.config.js`

**Step 1: Install Tailwind CSS v4 + shadcn/ui + Framer Motion + utilities**

Run:
```bash
npm install tailwindcss @tailwindcss/vite framer-motion lucide-react clsx tailwind-merge class-variance-authority
npx shadcn@latest init
```
When prompted for shadcn: select default style, pick CSS variables = yes.

**Step 2: Install Tauri frontend plugins**

Run:
```bash
npm install tauri-plugin-screenshots-api @tauri-apps/plugin-sql @tauri-apps/api
```

**Step 3: Verify dev server still runs**

Run: `npm run tauri dev`
Expected: App opens with Tailwind classes working.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add Tailwind, shadcn/ui, Framer Motion, Tauri plugins"
```

---

### Task 0.4: Install Core Dependencies (Rust Backend)

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

**Step 1: Add Rust crate dependencies**

Run from `src-tauri/`:
```bash
cargo add tauri-plugin-screenshots
cargo add tauri-plugin-sql --features sqlite
cargo add active-win-pos-rs
cargo add serde --features derive
cargo add serde_json
cargo add tokio --features full
cargo add chrono --features serde
cargo add base64
cargo add reqwest --features json
```

**Step 2: Enable tray-icon feature in Tauri**

In `src-tauri/Cargo.toml`, ensure tauri has:
```toml
tauri = { version = "2", features = ["tray-icon"] }
```

**Step 3: Register plugins in `src-tauri/src/lib.rs`**

```rust
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_screenshots::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Add permissions in `src-tauri/capabilities/default.json`**

Add to the `permissions` array:
```json
"screenshots:default",
"sql:default"
```

**Step 5: Verify it compiles**

Run: `npm run tauri dev`
Expected: App compiles and opens.

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Rust dependencies — screenshots, SQL, active-win, serde"
```

---

## Phase 1: Foundation — Theme, Layout, Router

### Task 1.1: Set Up Cyberpunk Glassmorphism Theme

**Files:**
- Create: `src/styles/theme.css`
- Modify: `src/index.css`
- Create: `src/lib/utils.ts` (cn helper)

**Step 1: Create the global theme CSS**

Create `src/styles/theme.css` with:
- CSS custom properties for the cyberpunk color palette (#0a0a0f, #00f0ff, #bf00ff, #ff003c, #00ff88, #e0e0ff)
- Glass panel base class (`.glass-panel` with backdrop-filter, border glow, surface color)
- Neon glow utility classes (`.neon-cyan`, `.neon-purple`, `.neon-red`, `.neon-green`)
- Animated gradient border utility
- Scrollbar styling (dark, thin, neon accent)

**Step 2: Create cn() utility**

Create `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3: Import theme in index.css, set body background to #0a0a0f**

**Step 4: Verify** — `npm run tauri dev`, app should show dark void background.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add cyberpunk glassmorphism theme system"
```

---

### Task 1.2: Set Up App Layout & Router

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/pages/Dashboard.tsx`
- Create: `src/pages/Profiles.tsx`
- Create: `src/pages/Stats.tsx`
- Create: `src/pages/Settings.tsx`
- Modify: `src/App.tsx`

**Step 1: Install React Router**

```bash
npm install react-router-dom
```

**Step 2: Create AppShell layout component**

Glass sidebar on left with navigation icons (Dashboard, Profiles, Stats, Settings). Main content area on right. Use Framer Motion `AnimatePresence` for page transitions.

**Step 3: Create placeholder page components**

Each page is a simple glass panel with the page title for now.

**Step 4: Wire up App.tsx with routes**

```typescript
<BrowserRouter>
  <AppShell>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/profiles" element={<Profiles />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </AppShell>
</BrowserRouter>
```

**Step 5: Verify** — navigation between pages works with transitions.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell layout with sidebar navigation and routing"
```

---

### Task 1.3: Build Reusable Glass UI Components

**Files:**
- Create: `src/components/ui/GlassCard.tsx`
- Create: `src/components/ui/NeonButton.tsx`
- Create: `src/components/ui/NeonSlider.tsx`
- Create: `src/components/ui/NeonToggle.tsx`
- Create: `src/components/ui/NeonInput.tsx`

**Step 1: Build GlassCard**

Glass panel container with:
- `backdrop-filter: blur(20px)`
- Gradient border that glows on hover (Framer Motion `whileHover`)
- 3D tilt effect on hover using CSS perspective transforms
- Props: `children`, `className`, `glow` (cyan | purple | red | green), `hoverable`

**Step 2: Build NeonButton**

- Glass background with neon border glow matching variant
- Ripple click effect (animated expanding circle)
- Variants: `primary` (cyan), `danger` (red), `success` (green), `ghost`
- Framer Motion `whileTap` scale effect

**Step 3: Build NeonSlider**

- Range slider with neon glow trail on the filled portion
- Tooltip showing current value
- Props: `min`, `max`, `value`, `onChange`, `label`, `unit`

**Step 4: Build NeonToggle**

- Pill-shaped toggle switch
- Elastic sliding animation (Framer Motion spring)
- Neon glow when active

**Step 5: Build NeonInput**

- Glass background text input
- Neon bottom-border glow on focus
- Props: standard input props + `label`

**Step 6: Verify** — create a test page showing all components.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add glassmorphism UI component library — card, button, slider, toggle, input"
```

---

## Phase 2: Pomodoro Timer

### Task 2.1: Pomodoro Timer State Machine

**Files:**
- Create: `src/hooks/usePomodoro.ts`
- Create: `src/types/pomodoro.ts`

**Step 1: Define types**

```typescript
// src/types/pomodoro.ts
export type TimerPhase = "work" | "shortBreak" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused";

export interface PomodoroConfig {
  work: number;           // minutes
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLong: number;
}

export interface PomodoroState {
  phase: TimerPhase;
  status: TimerStatus;
  secondsRemaining: number;
  currentCycle: number;    // 1-based
  totalCyclesCompleted: number;
}
```

**Step 2: Build usePomodoro hook**

Custom hook managing timer state with:
- `start()`, `pause()`, `resume()`, `stop()`, `skip()` actions
- Auto-transition: work → shortBreak → work → ... → longBreak after N cycles
- `secondsRemaining` ticks down every second via `setInterval`
- Pause detection during breaks (for the detection pipeline)
- Callbacks: `onPhaseChange`, `onCycleComplete`, `onTimerEnd`

**Step 3: Write test** — create `src/hooks/__tests__/usePomodoro.test.ts`

Test cases:
- Timer counts down correctly
- Phase transitions work (work → shortBreak → work)
- Long break triggers after N cycles
- Pause/resume preserves remaining time
- Skip advances to next phase

Run: `npm test`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Pomodoro timer state machine hook with tests"
```

---

### Task 2.2: Pomodoro Ring Timer UI (Dashboard)

**Files:**
- Create: `src/components/timer/PomodoroRing.tsx`
- Create: `src/components/timer/TimerControls.tsx`
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Build PomodoroRing component**

SVG circle arc timer with:
- Animated arc that decreases as time runs (Framer Motion `animate` on `strokeDashoffset`)
- Neon glow on the arc (CSS filter: `drop-shadow` with cyan/green/red based on phase)
- Center text: time remaining (MM:SS) + phase label + cycle count
- Color changes: cyan = work, green = break, red = alarm/grace period
- Pulsing glow animation when running
- Smooth arc transition on phase change

**Step 2: Build TimerControls**

Row of NeonButtons:
- Play/Pause (toggles), Stop (resets), Skip (next phase)
- Icons from lucide-react

**Step 3: Integrate into Dashboard page**

- PomodoroRing centered and prominent
- TimerControls below it
- Active profile indicator (name + icon) above the ring
- Today's streak counter below controls

**Step 4: Verify** — timer starts, counts down, transitions phases, ring animates.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add animated Pomodoro ring timer UI with neon glow effects"
```

---

### Task 2.3: Floating Timer Widget Window

**Files:**
- Create: `src/widget/Widget.tsx`
- Create: `src/widget/widget.html`
- Modify: `src-tauri/src/lib.rs` (create secondary window)
- Modify: `src-tauri/tauri.conf.json` (add widget window config)

**Step 1: Configure widget window in tauri.conf.json**

Add a second window:
```json
{
  "label": "widget",
  "url": "/widget",
  "width": 200,
  "height": 60,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "resizable": false,
  "skipTaskbar": true
}
```

**Step 2: Build Widget.tsx**

Small pill-shaped glass container:
- Timer countdown (MM:SS)
- Thin neon ring border around the pill, color-coded by state
- Draggable (Tauri window drag region)
- States: cyan (focused), orange (grace countdown), red (alarm), green (break)
- Minimal — just timer + phase icon
- Right-click context menu: pause, stop, show main window

**Step 3: Add Rust command to toggle widget visibility**

```rust
#[tauri::command]
async fn toggle_widget(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("widget") {
        if visible { window.show().map_err(|e| e.to_string())?; }
        else { window.hide().map_err(|e| e.to_string())?; }
    }
    Ok(())
}
```

**Step 4: Verify** — widget window appears as always-on-top pill, updates with timer.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add floating timer widget window — draggable, always-on-top"
```

---

## Phase 3: Activity Profiles & Detection

### Task 3.1: Profile Data Model & SQLite Schema

**Files:**
- Create: `src/types/profile.ts`
- Create: `src-tauri/migrations/001_init.sql`
- Modify: `src-tauri/src/lib.rs` (add migration)

**Step 1: Define TypeScript types**

```typescript
// src/types/profile.ts
export interface AppRule {
  name: string;
  process: string;
  allowed: boolean;
  sites?: string[];  // for browsers
}

export interface MonitorConfig {
  detection: "all" | "primary" | string[];  // monitor IDs
  alarm: "all" | "primary" | "detected" | string[];
}

export interface DetectionConfig {
  checkInterval: number;     // seconds
  graceCountdown: number;    // seconds
  alarmLockDuration: number; // seconds
}

export interface PomodoroConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLong: number;
}

export interface Profile {
  id: string;
  name: string;
  icon: string;
  mode: "whitelist" | "blacklist";
  apps: AppRule[];
  pomodoro: PomodoroConfig;
  detection: DetectionConfig;
  monitors: MonitorConfig;
}
```

**Step 2: Create SQLite migration**

```sql
-- 001_init.sql
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  mode TEXT DEFAULT 'blacklist',
  apps TEXT DEFAULT '[]',           -- JSON
  pomodoro TEXT DEFAULT '{}',       -- JSON
  detection TEXT DEFAULT '{}',      -- JSON
  monitors TEXT DEFAULT '{}',       -- JSON
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

-- Insert default profile
INSERT INTO profiles (id, name, icon, mode, apps, pomodoro, detection, monitors)
VALUES (
  'default',
  'General Focus',
  '🎯',
  'blacklist',
  '[{"name":"YouTube","process":"chrome.exe","allowed":false,"sites":["youtube.com"]},{"name":"Reddit","process":"chrome.exe","allowed":false,"sites":["reddit.com"]},{"name":"Twitter","process":"chrome.exe","allowed":false,"sites":["twitter.com","x.com"]}]',
  '{"work":25,"shortBreak":5,"longBreak":15,"cyclesBeforeLong":4}',
  '{"checkInterval":30,"graceCountdown":10,"alarmLockDuration":15}',
  '{"detection":"all","alarm":"all"}'
);
```

**Step 3: Register migration with the SQL plugin in lib.rs**

**Step 4: Verify** — app starts, database file is created with tables.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SQLite schema — profiles, sessions, distractions, settings"
```

---

### Task 3.2: Profile CRUD Service

**Files:**
- Create: `src/services/profileService.ts`
- Create: `src/hooks/useProfiles.ts`

**Step 1: Build profileService.ts**

Functions using `@tauri-apps/plugin-sql`:
- `getAllProfiles(): Promise<Profile[]>`
- `getProfile(id: string): Promise<Profile>`
- `createProfile(profile: Omit<Profile, 'id'>): Promise<Profile>`
- `updateProfile(id: string, updates: Partial<Profile>): Promise<void>`
- `deleteProfile(id: string): Promise<void>`

JSON fields (apps, pomodoro, detection, monitors) are serialized/deserialized.

**Step 2: Build useProfiles hook**

React hook wrapping the service with state management:
- `profiles`, `activeProfile`, `setActiveProfile`
- `createProfile`, `updateProfile`, `deleteProfile` mutations
- Loads profiles on mount

**Step 3: Verify** — create/read/update/delete a profile from the dev console.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add profile CRUD service and React hook"
```

---

### Task 3.3: Active Window Detection (Rust)

**Files:**
- Create: `src-tauri/src/detection.rs`
- Modify: `src-tauri/src/lib.rs` (register commands)

**Step 1: Create detection module**

```rust
// src-tauri/src/detection.rs
use active_win_pos_rs::get_active_window;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ActiveWindowInfo {
    pub title: String,
    pub process_name: String,
    pub app_name: String,
}

#[tauri::command]
pub fn get_active_window_info() -> Result<ActiveWindowInfo, String> {
    match get_active_window() {
        Ok(window) => Ok(ActiveWindowInfo {
            title: window.title,
            process_name: window.process_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            app_name: window.app_name,
        }),
        Err(()) => Err("Failed to get active window".to_string()),
    }
}
```

**Step 2: Register command in lib.rs**

```rust
.invoke_handler(tauri::generate_handler![
    detection::get_active_window_info,
])
```

**Step 3: Create frontend wrapper**

Create `src/services/detectionService.ts`:
```typescript
import { invoke } from "@tauri-apps/api/core";

export interface ActiveWindowInfo {
  title: string;
  process_name: string;
  app_name: string;
}

export async function getActiveWindowInfo(): Promise<ActiveWindowInfo> {
  return invoke("get_active_window_info");
}
```

**Step 4: Verify** — call from dev console, see current window info returned.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add active window detection via Rust command"
```

---

### Task 3.4: Profile Matching Engine

**Files:**
- Create: `src/services/matchingEngine.ts`
- Create: `src/services/__tests__/matchingEngine.test.ts`

**Step 1: Build the matching engine**

```typescript
export type MatchResult = "on_task" | "off_task" | "ambiguous";

export function matchWindowAgainstProfile(
  window: ActiveWindowInfo,
  profile: Profile
): MatchResult {
  // 1. Check process name against app rules
  // 2. If browser, check window title for site patterns
  // 3. If no match found:
  //    - whitelist mode: "off_task" (not in allowed list)
  //    - blacklist mode: "on_task" (not in blocked list)
  // 4. If browser matched but no site rules: "ambiguous"
}
```

**Step 2: Write tests**

Test cases:
- Whitelist mode: known app allowed → on_task
- Whitelist mode: unknown app → off_task
- Blacklist mode: blocked app → off_task
- Blacklist mode: unknown app → on_task
- Browser with matching blocked site in title → off_task
- Browser with no site match → ambiguous
- Case-insensitive matching

Run: `npm test`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add profile matching engine with whitelist/blacklist logic"
```

---

### Task 3.5: Screenshot + AI Vision Service

**Files:**
- Create: `src/services/visionService.ts`
- Create: `src/types/ai.ts`

**Step 1: Define AI provider types**

```typescript
// src/types/ai.ts
export interface VisionProvider {
  name: string;
  type: "local" | "cloud";
  analyze(screenshot: string, profileContext: string): Promise<VisionResult>;
}

export interface VisionResult {
  onTask: boolean;
  confidence: number;
  reason: string;
}
```

**Step 2: Build cloud provider (Gemini free tier)**

```typescript
async function analyzeWithGemini(
  screenshotBase64: string,
  profileContext: string
): Promise<VisionResult> {
  // POST to Gemini API with vision prompt:
  // "The user's activity profile is: [profile]. Based on this screenshot,
  //  is the user on-task? Respond with JSON: {onTask: bool, confidence: 0-1, reason: string}"
}
```

**Step 3: Build provider chain with fallback**

Gemini → Groq → OpenRouter. Each wrapped in try/catch, falls to next on error/rate-limit.

**Step 4: Build screenshot capture wrapper**

```typescript
import { getMonitorScreenshot } from "tauri-plugin-screenshots-api";

export async function captureScreen(monitorId?: number): Promise<string> {
  // Returns base64 encoded screenshot
}
```

**Step 5: Verify** — capture screenshot, send to Gemini, get on/off task result.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add AI vision service with multi-provider fallback chain"
```

---

### Task 3.6: Detection Pipeline Orchestrator

**Files:**
- Create: `src/services/detectionPipeline.ts`
- Create: `src/hooks/useDetection.ts`

**Step 1: Build the detection pipeline**

```typescript
export class DetectionPipeline {
  private intervalId: number | null = null;
  private graceTimeoutId: number | null = null;
  private escalationLevel: number = 0;

  start(profile: Profile, callbacks: DetectionCallbacks): void {
    // Every profile.detection.checkInterval seconds:
    // 1. getActiveWindowInfo()
    // 2. matchWindowAgainstProfile()
    // 3. If ambiguous → captureScreen() + analyzeVision()
    // 4. If off_task → startGraceCountdown()
    // 5. If still off_task after grace → triggerAlarm(escalationLevel++)
    // 6. If back on_task → cancelGrace, de-escalate
  }

  stop(): void { /* clear intervals */ }
  pause(): void { /* for breaks */ }
  resetEscalation(): void { /* on new pomodoro cycle */ }
}

interface DetectionCallbacks {
  onCheck: (result: MatchResult) => void;
  onGraceStart: (seconds: number) => void;
  onGraceTick: (remaining: number) => void;
  onAlarm: (level: 1 | 2 | 3) => void;
  onBackOnTask: () => void;
}
```

**Step 2: Build useDetection hook**

Wires the pipeline to React state. Starts/stops with Pomodoro work phases. Pauses during breaks.

**Step 3: Integrate with usePomodoro**

- Pipeline starts when work phase begins
- Pipeline pauses when break phase begins
- Escalation resets on new cycle

**Step 4: Verify** — start a Pomodoro, switch to a blacklisted app, see grace countdown + alarm trigger in console.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add detection pipeline orchestrator with grace period and escalation"
```

---

## Phase 4: Alarm System

### Task 4.1: Alarm Sound System

**Files:**
- Create: `src/services/alarmSound.ts`
- Create: `public/sounds/chime.mp3` (source a free sound)
- Create: `public/sounds/alert.mp3`
- Create: `public/sounds/siren.mp3`

**Step 1: Build sound service**

```typescript
export class AlarmSoundService {
  private audioContext: AudioContext;

  playChime(): void { /* level 1 — gentle */ }
  playAlert(): void { /* level 2 — alert tone */ }
  playSiren(): void { /* level 3 — loud, looping */ }
  stop(): void { /* stop all sounds */ }
  setVolume(level: number): void { /* 0-1 */ }
}
```

Uses Web Audio API for low-latency playback with volume control.

**Step 2: Source 3 free sounds** — use royalty-free sounds or generate with a tone generator.

**Step 3: Verify** — trigger each sound from dev console.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add alarm sound system with 3 escalation levels"
```

---

### Task 4.2: Meme Content Manager

**Files:**
- Create: `src/services/memeService.ts`
- Create: `public/memes/defaults/` (add 10-15 starter memes)

**Step 1: Build meme service**

```typescript
export class MemeService {
  async getRandomMeme(): Promise<string> {
    // Scans defaults/ + custom/ folders
    // Returns random image path
  }

  async getAllMemes(): Promise<MemeItem[]> {
    // Returns list with preview thumbnails
  }

  async addCustomMeme(filePath: string): Promise<void> { }
  async removeMeme(id: string): Promise<void> { }
}
```

Uses Tauri filesystem API to read the memes directory.

**Step 2: Bundle 10-15 starter memes** — source royalty-free funny/motivational memes.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add meme content manager with default starter pack"
```

---

### Task 4.3: Alarm Overlay Components

**Files:**
- Create: `src/components/alarm/AlarmLevel1.tsx` (toast nudge)
- Create: `src/components/alarm/AlarmLevel2.tsx` (popup warning)
- Create: `src/components/alarm/AlarmLevel3.tsx` (fullscreen takeover)
- Create: `src/components/alarm/GlitchEffect.tsx`
- Create: `src/components/alarm/ScreenShake.tsx`
- Create: `src/components/alarm/ParticleBurst.tsx`
- Create: `src/components/alarm/AlarmController.tsx`

**Step 1: Build AlarmLevel1 (Nudge)**

- Small glass toast slides in from bottom-right corner
- Framer Motion `slideIn` + `fadeOut` animation
- Shows random meme thumbnail + "Get back to work!" text
- Auto-dismisses when user returns to on-task app

**Step 2: Build AlarmLevel2 (Warning)**

- Larger centered popup glass panel
- Random meme/gif displayed prominently
- Alert sound plays
- Neon red border flash on screen edges (CSS box-shadow animation)
- "I'm back" NeonButton with 3-second cooldown (button disabled, countdown shown)

**Step 3: Build GlitchEffect**

- RGB split overlay (3 offset copies of content with different color channels)
- Scanline overlay (repeating horizontal lines)
- Random jitter animation
- CSS-only, toggled via className

**Step 4: Build ScreenShake**

- Wraps content in a Framer Motion `animate` with random x/y transforms
- Configurable intensity

**Step 5: Build ParticleBurst**

- Canvas-based particle explosion
- Neon-colored particles burst from center
- Fade out over 2-3 seconds

**Step 6: Build AlarmLevel3 (Full Alarm)**

- Fullscreen overlay (100vw x 100vh, z-index: 9999)
- Combines: GlitchEffect + ScreenShake + ParticleBurst
- Rapid meme slideshow (cycles every 1-2 seconds)
- Loud siren loop
- Pulsing red neon borders
- Endurance countdown timer (15s default, adjustable)
- Cannot be dismissed until countdown ends AND user returns to on-task app

**Step 7: Build AlarmController**

Stateful component that renders the correct alarm level based on detection pipeline events.

**Step 8: Verify** — trigger each alarm level manually, verify effects render correctly.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add escalating alarm overlays with glitch, shake, and particle effects"
```

---

## Phase 5: Profile Editor & Settings UI

### Task 5.1: Profile Editor Page

**Files:**
- Create: `src/components/profiles/ProfileCard.tsx`
- Create: `src/components/profiles/ProfileEditor.tsx`
- Create: `src/components/profiles/AppPicker.tsx`
- Create: `src/components/profiles/SiteRuleEditor.tsx`
- Modify: `src/pages/Profiles.tsx`

**Step 1: Build ProfileCard**

- Glass card showing profile icon, name, mode badge (whitelist/blacklist)
- Active profile has animated neon cyan border glow
- Click to select, edit icon button
- Framer Motion `layoutId` for smooth transitions

**Step 2: Build AppPicker**

- Searchable list of system apps (fetched via Rust command that scans installed programs)
- Each app row: icon + name + toggle (allowed/blocked)
- For browser entries: expandable section to add site URL rules

**Step 3: Build SiteRuleEditor**

- List of site URLs with add/remove
- NeonInput for new URL entry
- Animated list with Framer Motion `AnimatePresence`

**Step 4: Build ProfileEditor**

- Full editor panel with sections:
  - Name + icon picker
  - Mode toggle (whitelist/blacklist)
  - AppPicker
  - Pomodoro config sliders (work, short break, long break, cycles)
  - Detection config sliders (interval, grace, lock duration)
  - Monitor config (see Task 5.3)

**Step 5: Wire up Profiles page**

- Horizontal scroll of ProfileCards
- "+" card to create new
- Selecting a card opens the editor panel with slide-in animation

**Step 6: Verify** — create, edit, delete profiles through the UI.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add profile editor with app picker, site rules, and Pomodoro config"
```

---

### Task 5.2: Settings Page

**Files:**
- Create: `src/components/settings/MemeManager.tsx`
- Create: `src/components/settings/AIProviderConfig.tsx`
- Create: `src/components/settings/ThemeCustomizer.tsx`
- Create: `src/components/settings/DataExport.tsx`
- Modify: `src/pages/Settings.tsx`

**Step 1: Build MemeManager**

- Grid of meme thumbnails (glass cards)
- Hover to preview full size
- Toggle individual memes on/off
- "Add custom" button opens file picker
- Delete button on custom memes (not defaults)

**Step 2: Build AIProviderConfig**

- Toggle: local model vs cloud API
- API key inputs for each cloud provider (Gemini, Groq, OpenRouter)
- "Test" button per provider — sends a test screenshot
- Provider priority drag-and-drop reorder

**Step 3: Build ThemeCustomizer**

- Accent color picker (preset neon colors + custom hex)
- Preview panel showing how UI elements look

**Step 4: Build DataExport**

- Export sessions as JSON or CSV
- Clear all data button (with confirmation modal)

**Step 5: Compose Settings page with all sections**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add settings page — meme manager, AI config, theme, data export"
```

---

### Task 5.3: Multi-Monitor Configuration

**Files:**
- Create: `src-tauri/src/monitors.rs`
- Create: `src/components/settings/MonitorLayout.tsx`

**Step 1: Rust command to get monitor info**

```rust
#[tauri::command]
pub fn get_monitors() -> Result<Vec<MonitorInfo>, String> {
    // Use tauri's monitor API to get:
    // - monitor id, name, resolution, position, scale factor, is_primary
}
```

**Step 2: Build MonitorLayout component**

- Visual diagram of monitors matching real physical arrangement
- Each monitor is a clickable glass rectangle
- Labeled with number, name, resolution
- Click to toggle for detection/alarm
- "All" toggle button
- Color coded: cyan = active for detection, purple = active for alarm
- "Test Alarm" button per monitor

**Step 3: Integrate into ProfileEditor**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add multi-monitor layout configuration UI"
```

---

## Phase 6: System Tray

### Task 6.1: System Tray Integration

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/tray.rs`
- Create: `src-tauri/icons/tray-icon.png`

**Step 1: Build tray module**

```rust
// src-tauri/src/tray.rs
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager,
};

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItemBuilder::with_id("show", "Show Window").build(app)?;
    let start = MenuItemBuilder::with_id("start", "Start Focus").build(app)?;
    let pause = MenuItemBuilder::with_id("pause", "Pause").build(app)?;
    let stop = MenuItemBuilder::with_id("stop", "Stop").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&show, &start, &pause, &stop, &quit])
        .build()?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Focus Detector")
        .on_menu_event(move |app, event| {
            match event.id().as_ref() {
                "show" => { /* show main window */ }
                "start" => { /* emit start event */ }
                "pause" => { /* emit pause event */ }
                "stop" => { /* emit stop event */ }
                "quit" => { app.exit(0); }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
```

**Step 2: Call setup_tray in lib.rs `.setup()` callback**

**Step 3: Update tray tooltip dynamically with timer state**

```rust
#[tauri::command]
fn update_tray_tooltip(app: tauri::AppHandle, text: String) -> Result<(), String> {
    // Update tray icon tooltip with current timer state
}
```

**Step 4: Verify** — tray icon appears, menu items work, tooltip updates.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add system tray with timer controls and dynamic tooltip"
```

---

## Phase 7: Stats Dashboard

### Task 7.1: Session Tracking Service

**Files:**
- Create: `src/services/sessionService.ts`
- Create: `src/hooks/useStats.ts`

**Step 1: Build session service**

```typescript
export class SessionService {
  async startSession(profileId: string): Promise<string> { /* returns session ID */ }
  async endSession(sessionId: string): Promise<void> { }
  async recordDistraction(sessionId: string, info: DistractionInfo): Promise<void> { }
  async updateSessionStats(sessionId: string, stats: Partial<SessionStats>): Promise<void> { }
  async getTodaySessions(): Promise<Session[]> { }
  async getWeekSessions(): Promise<Session[]> { }
  async getAllTimeSummary(): Promise<AllTimeSummary> { }
  async getStreakInfo(): Promise<StreakInfo> { }
}
```

**Step 2: Build useStats hook**

Exposes computed stats: today's focus time, distraction count, streak, weekly data, all-time summary.

**Step 3: Wire session tracking into detection pipeline**

- Session starts with Pomodoro start
- Distractions recorded when detected
- Session ends on stop

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add session tracking service with distraction recording"
```

---

### Task 7.2: Stats Dashboard UI

**Files:**
- Create: `src/components/stats/FocusRingChart.tsx`
- Create: `src/components/stats/TimelineBar.tsx`
- Create: `src/components/stats/WeeklyBarChart.tsx`
- Create: `src/components/stats/StreakCard.tsx`
- Create: `src/components/stats/AchievementCard.tsx`
- Create: `src/components/stats/DistractorLeaderboard.tsx`
- Modify: `src/pages/Stats.tsx`

**Step 1: Build FocusRingChart**

- SVG donut chart: focus % vs distraction %
- Animated fill on mount (Framer Motion)
- Neon glow on segments
- Center: percentage + label

**Step 2: Build TimelineBar**

- Horizontal bar showing today's sessions
- Green segments = focus, red blips = alarms
- Hover to see details

**Step 3: Build WeeklyBarChart**

- 7 vertical bars (Mon-Sun)
- Bar height = focus hours
- Neon gradient fill
- Animated grow-in on mount

**Step 4: Build StreakCard, AchievementCard, DistractorLeaderboard**

- Glass cards with neon glow
- StreakCard: current streak + best streak with fire animation
- AchievementCard: "Best day: 8h 20m" style personal records
- DistractorLeaderboard: ranked list of most-caught apps/sites

**Step 5: Compose Stats page**

- Tab view: Today / Weekly / All-time
- Framer Motion page transitions between tabs

**Step 6: Verify** — stats display correctly with mock data, animations work.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add stats dashboard with charts, streaks, and achievements"
```

---

## Phase 8: Integration & Polish

### Task 8.1: End-to-End Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Create: `src/context/AppContext.tsx`

**Step 1: Create AppContext**

Global context providing:
- Active profile
- Pomodoro state
- Detection pipeline state
- Alarm state
- Session data

**Step 2: Wire everything together**

- Dashboard: start Pomodoro → detection pipeline starts → alarms trigger → sessions recorded → stats update
- Profile switch: stops current session, reloads pipeline config
- Settings changes: apply in real-time

**Step 3: Test full flow**

1. Select profile → Start Pomodoro → Timer counts down
2. Switch to blacklisted app → Grace countdown on widget
3. Stay on blacklisted app → Level 1 alarm
4. Stay again → Level 2 → Level 3
5. Return to whitelisted app → Alarm dismisses
6. Break starts → Detection pauses
7. Stop → Check stats

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire end-to-end flow — timer, detection, alarms, sessions"
```

---

### Task 8.2: UI Polish Pass

**Files:**
- Various component files

**Step 1: Apply `@skill:ui-ux-pro-max` for final polish**

- Review all screens for visual consistency
- Add loading states (skeleton glass panels)
- Add empty states (no profiles yet, no stats yet)
- Add transition animations between all route changes
- Ensure all interactive elements have hover/active/focus states
- Add particle background to main window
- Smooth all rough edges

**Step 2: Accessibility pass**

- Keyboard navigation
- Focus indicators (neon ring)
- Sufficient contrast ratios
- Screen reader labels

**Step 3: Commit**

```bash
git add -A
git commit -m "style: UI polish pass — animations, states, transitions, accessibility"
```

---

### Task 8.3: App Icon & Branding

**Files:**
- Create: `src-tauri/icons/` (all required sizes)
- Modify: `src-tauri/tauri.conf.json` (app name, identifier)

**Step 1: Design app icon** — cyberpunk eye/shield motif with neon cyan glow

**Step 2: Generate all icon sizes** using `npm run tauri icon`

**Step 3: Set app metadata**

```json
{
  "productName": "Focus Detector",
  "identifier": "com.focusdetector.app",
  "version": "0.1.0"
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add app icon and branding"
```

---

### Task 8.4: Build & Package

**Step 1: Build production binary**

```bash
npm run tauri build
```

**Step 2: Test the packaged .exe / .msi installer**

**Step 3: Verify** — installed app runs correctly outside dev mode.

**Step 4: Commit & Tag**

```bash
git add -A
git commit -m "chore: production build configuration"
git tag v0.1.0
```

---

## Summary

| Phase | Tasks | What it delivers |
|---|---|---|
| **0** | 0.1–0.4 | Project scaffold, all dependencies installed |
| **1** | 1.1–1.3 | Theme, layout, router, glass UI components |
| **2** | 2.1–2.3 | Working Pomodoro timer + floating widget |
| **3** | 3.1–3.6 | Profiles, window detection, AI vision, full detection pipeline |
| **4** | 4.1–4.3 | Sound system, memes, escalating alarm overlays |
| **5** | 5.1–5.3 | Profile editor, settings page, multi-monitor config |
| **6** | 6.1 | System tray integration |
| **7** | 7.1–7.2 | Session tracking, stats dashboard with charts |
| **8** | 8.1–8.4 | Integration, polish, branding, build |
