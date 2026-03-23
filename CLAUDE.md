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

No test framework is configured. No linter is configured.

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

### State Management

- **AppContext** (`src/context/AppContext.tsx`): Single React Context holds all global state — profiles, timer, detection, alarm level, recent checks. This is the central coordination point.
- **Hooks**: `usePomodoro` (timer FSM), `useDetection` (pipeline lifecycle), `useProfiles` (CRUD), `useStats` (SQLite queries)
- **Widget sync**: Main window ↔ Widget communicate via `localStorage` polling (1000ms), not Tauri IPC. Keys: `widget-sync` (state), `widget-action` (commands). Deduplication via timestamps.

### Multi-Window Setup

| Window | Size | Behavior |
|--------|------|----------|
| Main | 1200×800 | Primary UI, resizable |
| Widget | 340×52 | Always-on-top, transparent, draggable, single-row timer |
| Alarm overlay | Fullscreen | Covers monitor during escalated alarms |

Window management is in `src-tauri/src/tray.rs` (widget, tray menu) and `src-tauri/src/alarm_overlay.rs`.

### Tauri IPC Commands

Defined in `src-tauri/src/lib.rs`, implemented in `detection.rs`, `tray.rs`, `alarm_overlay.rs`, `monitors.rs`:
- `get_active_window_info`, `capture_screenshot`, `list_running_apps`
- `toggle_widget`, `widget_open_main`, `show_alarm_overlay`, `hide_alarm_overlay`
- `update_tray_tooltip`, `get_monitors`

Frontend invokes via `@tauri-apps/api` `invoke()`. Tray menu emits `tray-action` events.

### AI Vision Providers (`src/services/visionService.ts`)

Fallback chain: Ollama (local) → Gemini → Groq → OpenRouter. Each receives a screenshot and returns `{onTask, confidence, reason}`. API keys stored in SQLite settings table.

### Profile System

Profiles define detection behavior:
- **Mode**: `whitelist` (only listed = allowed) or `blacklist` (listed = blocked)
- **Apps**: Rules with `{name, process, allowed, sites[]}` — site rules are matched against window title
- **Pomodoro config**: work/break durations, cycles before long break
- **Detection config**: `checkInterval` (AI cooldown), `graceCountdown`, `alarmLockDuration`

### Database

SQLite via `tauri-plugin-sql`. Schema in `src-tauri/migrations/001_init.sql`. Tables: `profiles`, `sessions`, `distractions`, `settings`.

### Path Alias

`@/` maps to `./src/` (configured in `vite.config.ts` and `tsconfig.json`).
