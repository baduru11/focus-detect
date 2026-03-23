# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Focus Detector** — a Tauri 2 + React 19 desktop app that monitors the active window, detects distraction via AI vision, enforces Pomodoro focus sessions, and triggers escalating alarms when users go off-task. Windows-focused (uses PowerShell for process listing, `.exe` process names).

## Commands

```bash
npm run dev          # Vite dev server (port 1420) + Tauri dev window with hot-reload
npm run build        # TypeScript check + Vite bundle + Tauri binary
npm run tauri dev    # Direct Tauri dev (alternative to npm run dev)
cargo build          # Build Rust backend only (run from src-tauri/)
cargo check          # Type-check Rust without building (run from src-tauri/)
```

```bash
npm test             # Vitest test suite (140+ tests)
npm run test:watch   # Vitest watch mode
```

No linter is configured.

## Architecture

### Two-Process Model

- **Rust backend** (`src-tauri/src/`): System integration — active window detection, screenshot capture, system tray, multi-window management, SQLite persistence via `tauri-plugin-sql`.
- **React frontend** (`src/`): UI + all business logic — detection pipeline, matching engine, AI vision, timer state machine, state management.

### Detection Pipeline (`src/services/detectionPipeline.ts`)

The core loop runs every 1 second during a work phase:
1. `get_active_window_info` → Tauri command returns `{title, process_name}`
2. `matchingEngine` evaluates window against active profile rules → `on_task | off_task | ambiguous`
3. If ambiguous and 30s cooldown elapsed: screenshot → AI vision provider → confidence-based result (< 0.5 = on_task)
4. Off-task triggers grace countdown (default 10s) → then alarm at profile-configured level (1, 2, or 3)
5. Return to on-task immediately dismisses alarm

**Note:** Alarm level is a per-profile preset (1, 2, or 3) — NOT auto-escalating at runtime. The `AlarmPage.tsx` / alarm overlay window is currently dead code (never invoked from frontend). L3 alarm renders in-window via `AlarmController` with `setAlwaysOnTop(true)`.

### State Management

- **AppContext** (`src/context/AppContext.tsx`): Single React Context holds all global state — profiles, timer, detection, alarm level, recent checks. This is the central coordination point.
- **Hooks**: `usePomodoro` (timer FSM), `useDetection` (pipeline lifecycle), `useProfiles` (CRUD), `useStats` (SQLite queries)
- **Widget sync**: Main window ↔ Widget communicate via `localStorage` polling (1000ms), not Tauri IPC. Keys: `widget-sync` (state), `widget-action` (commands). Deduplication via timestamps. Widget always-on-top enforced every 5s.

### Multi-Window Setup

| Window | Size | Behavior |
|--------|------|----------|
| Main | 1200×800 | Primary UI, resizable |
| Widget | 340×52 | Always-on-top, transparent, draggable, single-row timer |
| Alarm overlay | Fullscreen | **Dead code** — `show_alarm_overlay` never invoked from frontend. L3 alarm renders in-window via AlarmController. See TODO #9. |

Window management is in `src-tauri/src/tray.rs` (widget, tray menu) and `src-tauri/src/alarm_overlay.rs` (dead code).

### Tauri IPC Commands

Defined in `src-tauri/src/lib.rs`, implemented in `detection.rs`, `tray.rs`, `alarm_overlay.rs`, `monitors.rs`, `memes.rs`:
- `get_active_window_info`, `capture_screenshot`, `list_running_apps`
- `toggle_widget`, `widget_open_main`, `show_alarm_overlay`, `hide_alarm_overlay`
- `update_tray_tooltip`, `get_monitors`
- `list_custom_memes` — scans `appDataDir/memes/custom/` for user meme images

Frontend invokes via `@tauri-apps/api` `invoke()`. Tray menu emits `tray-action` events.

### AI Vision Providers (`src/services/visionService.ts`)

Fallback chain: Ollama (local) → Gemini → Groq → OpenRouter. Each receives a screenshot and returns `{onTask, confidence, reason}`. API keys stored in SQLite settings table.

### Profile System

Profiles define detection behavior:
- **Mode**: `whitelist` (only listed = allowed) or `blacklist` (listed = blocked)
- **Apps**: Rules with `{name, process, allowed, sites[]}` — site rules are matched against window title
- **Pomodoro config**: work/break durations, cycles before long break
- **Detection config**: `checkInterval` (AI cooldown), `graceCountdown`, `alarmLockDuration`

### Meme System (`src/services/memeService.ts`)

Displays memes in Level 2 and Level 3 alarms (L1 toast is too small). Bundled defaults in `/public/memes/defaults/` (Vite-served, hardcoded manifest). Custom memes loaded via `list_custom_memes` Rust IPC from `appDataDir/memes/custom/`. No-repeat-until-exhausted selection.

### Alarm Sound System (`src/services/alarmSound.ts`)

Primary: `.mp3` files via `AudioContext.decodeAudioData()` → `AudioBufferSourceNode` → `GainNode`. Fallback: Web Audio oscillator-based sounds if `.mp3` files not found. Volume control via `setVolume()`/`getVolume()`, persisted in SQLite settings. `AudioContext` resumed on first user interaction. Phase transition chime via `playPhaseChime()`.

### Celebrations

- **Confetti** (`src/components/ui/Confetti.tsx`): `canvas-confetti` library, triggers on work→break transition via `onPhaseChange` callback (checks for `shortBreak`/`longBreak` phase). Skips when document hidden.
- **Milestone toasts** (`src/components/ui/Toast.tsx`): Glass notification at 5, 10, 25 completed work sessions today. Uses `sessionsCompletedToday` counter in AppContext (NOT `currentStreak` which is day-streak).

### Database

SQLite via `tauri-plugin-sql`. Schema in `src-tauri/migrations/001_init.sql`. Tables: `profiles`, `sessions`, `distractions`, `settings`.

### Path Alias

`@/` maps to `./src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Design System
Always read `DESIGN.md` before making any visual or UI decisions. All font choices, colors, spacing, and aesthetic direction are defined there. Do not deviate without explicit user approval.
