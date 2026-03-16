# Focus Detector — Design Document

**Date:** 2026-03-16
**Status:** Approved
**Codename:** Detect

## Overview

A desktop productivity enforcement app that monitors what the user is doing on their PC and triggers escalating alarms with memes, sounds, and visual effects when they go off-task. Built around the Pomodoro technique with fully customizable activity profiles.

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Desktop Framework | **Tauri 2.0** (Rust backend) | ~3MB bundle, ~28MB RAM idle. Essential for always-running background app |
| Frontend | **React 19 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion** | Best ecosystem for Tauri 2, rich animation support |
| Screen Capture | **tauri-plugin-screenshots** (xcap) | Native monitor/window capture for Tauri v2 |
| AI Vision (local) | **IPEX-LLM / Ollama + Qwen-VL 7B** | Free, unlimited, runs on Intel Arc 140V iGPU via IPEX-LLM |
| AI Vision (cloud fallback) | **Gemini Flash-Lite → Groq → OpenRouter** (all free tiers) | Multi-provider rotation for zero-cost cloud fallback |
| Database | **SQLite** (via Tauri plugin) | Session history, stats, settings. Fully local |
| Audio | **Web Audio API** | Siren/alarm sounds in webview |
| Animations | **Framer Motion + CSS + Canvas** | Glitch effects, particles, screen shake |

## Design Language

### Visual Style: Cyberpunk Glassmorphism

**Color Palette:**
```
Background:      #0a0a0f     (deep void black)
Surface:         rgba(15, 15, 35, 0.6) + backdrop-blur(20px)
Primary Neon:    #00f0ff     (cyan electric)
Secondary Neon:  #bf00ff     (purple plasma)
Alert:           #ff003c     (red alarm)
Success:         #00ff88     (green focus)
Text:            #e0e0ff     (soft white-blue)
Border Glow:     1px solid rgba(0, 240, 255, 0.15) + neon box-shadow
```

**Design Principles:**
- Glass panels — every card/container uses `backdrop-filter: blur(20px)` with subtle gradient borders that glow on hover
- Liquid animations — spring-based transitions (Framer Motion), elements morph rather than snap
- Neon accents — glowing edges, pulsing focus indicators, animated gradient strokes
- Particle effects — subtle floating particles in background, reactive to timer state
- Micro-interactions — button ripples, elastic toggles, 3D tilt-on-hover cards
- Accent color customizable by user

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 Tauri 2.0 App                    │
│                                                  │
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │ Rust Backend  │    │  React Frontend (UI)    │ │
│  │               │    │                         │ │
│  │ - Screenshot  │    │  - Pomodoro Timer       │ │
│  │ - Window      │    │  - Floating Widget      │ │
│  │   Detection   │    │  - Settings / Profiles  │ │
│  │ - AI Vision   │    │  - Alarm Overlays       │ │
│  │   Bridge      │    │  - Stats Dashboard      │ │
│  │ - Alarm Ctrl  │    │  - Meme Display         │ │
│  │ - SQLite DB   │    │  - Profile Editor       │ │
│  │ - System Tray │    │  - Monitor Config       │ │
│  └──────┬───────┘    └─────────────────────────┘ │
│         │                                        │
│  ┌──────┴───────────────────────────────────┐    │
│  │         Detection Pipeline               │    │
│  │                                          │    │
│  │  1. Get active window title + process    │    │
│  │  2. Match against profile rules          │    │
│  │  3. If ambiguous → screenshot + AI       │    │
│  │  4. If off-task → grace countdown        │    │
│  │  5. If still off-task → escalating alarm │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

## Core Features

### 1. Pomodoro Timer

- Default: 25min work / 5min short break / 15min long break after 4 cycles
- **All values fully customizable per profile** with polished slider UI
- Visual cycle timeline preview below sliders
- During breaks: detection pauses completely, widget shows relaxed green state
- System tray icon shows timer countdown
- Optional floating widget (always-on-top, draggable pill shape with neon ring)
- Widget available on both tray + floating, user toggles floating on/off
- Floating widget selectable per monitor

### 2. Activity Profiles

Users create named profiles that define what's "on-task":

```json
{
  "name": "Studying",
  "icon": "📚",
  "mode": "whitelist",

  "apps": [
    { "name": "Notion", "process": "Notion.exe", "allowed": true },
    {
      "name": "Chrome", "process": "chrome.exe", "allowed": true,
      "sites": ["coursera.org", "docs.google.com", "scholar.google.com"]
    },
    { "name": "SumatraPDF", "process": "SumatraPDF.exe", "allowed": true }
  ],

  "pomodoro": {
    "work": 25,
    "shortBreak": 5,
    "longBreak": 15,
    "cyclesBeforeLong": 4
  },

  "detection": {
    "checkInterval": 30,
    "graceCountdown": 10,
    "alarmLockDuration": 15
  },

  "monitors": {
    "detection": "all",
    "alarm": "all"
  }
}
```

**Matching logic:**
- **Whitelist mode** — only listed apps/sites allowed, everything else triggers detection
- **Blacklist mode** — everything allowed except listed apps/sites

**Profile UX:**
- Horizontal scroll of glass cards, active profile has neon glow border
- Click to switch, long-press to edit, "+" card to create new
- App picker scans installed apps automatically, searchable list with icons
- For browsers: expand to add specific site URLs
- Drag-and-drop whitelist/blacklist with animated reorder

### 3. Detection Pipeline

```
Every N seconds (configurable per profile, default 30s):

  ┌──────────────────────────┐
  │ Get active window title   │
  │ + process name            │
  │ (per selected monitor)    │
  └───────────┬──────────────┘
              ▼
  ┌──────────────────────────┐
  │ Match against profile     │  → "VS Code" in whitelist → ✅ OK
  │ whitelist / blacklist     │  → "YouTube - Chrome" in blacklist → ❌ OFF-TASK
  └───────────┬──────────────┘
              ▼ ambiguous (e.g. "Chrome" but unknown site)
  ┌──────────────────────────┐
  │ Take screenshot           │
  │ Send to AI vision model   │
  │ "Is this on-task for      │
  │  [profile name]?"         │
  └───────────┬──────────────┘
              ▼ OFF-TASK confirmed
  ┌──────────────────────────┐
  │ Grace countdown starts    │  → Widget turns orange with countdown
  │ (default 10s, adjustable) │  → User can self-correct
  └───────────┬──────────────┘
              ▼ still off-task
  ┌──────────────────────────┐
  │ ALARM (escalating level)  │
  └──────────────────────────┘
```

**AI Vision provider chain (all free):**
1. Local: IPEX-LLM / Ollama + Qwen-VL 7B (unlimited)
2. Cloud fallback: Gemini Flash-Lite → Groq → OpenRouter free models
3. Optional: user provides own API key for premium models

### 4. Alarm System — Escalating

| Level | Trigger | Effect | Dismissal |
|---|---|---|---|
| **1 — Nudge** | 1st offense | Small glass toast from corner + gentle chime + meme thumbnail. Widget turns orange | Auto-dismiss when back on task |
| **2 — Warning** | 2nd offense | Larger popup panel with meme/gif + alert sound. Widget pulses red. Neon border flash on screen edges | Click "I'm back" (3s cooldown) |
| **3 — Full Alarm** | 3rd+ offense | Fullscreen takeover: glitch effect, screen shake, loud siren, rapid meme slideshow, pulsing red neon borders, particle explosion, endurance countdown | Time-locked — cannot dismiss for 15s (adjustable). Must return to on-task app |

**Escalation resets** at start of each Pomodoro cycle. Getting back on task after alarm de-escalates by one level.

**Alarm effects:**
- Screen shake — CSS transform jitter animation
- Glitch effect — RGB split + scanline overlay
- Neon border pulse — animated box-shadow on screen edges
- Particle burst — canvas-based explosion
- Sound — Web Audio API with volume escalation

**Alarm content:**
```
/memes
  /defaults    ← bundled starter pack (10-15 memes + 3-4 sounds)
  /custom      ← user drops their own images/gifs/sounds here
```
- App scans both folders, picks randomly
- User can preview/manage/toggle content in settings
- Supports .png, .jpg, .gif (images) and .mp3, .wav (sounds)

### 5. Multi-Monitor Support

**Per-profile monitor settings:**

| Setting | Options | Default |
|---|---|---|
| Detect on | All / Primary only / Choose specific monitors | All |
| Alarm shows on | All / Primary only / Detected monitor / Choose specific | All |
| Floating widget on | Choose which monitor | Primary |

**Settings UX:**
- Visual diagram showing actual monitor arrangement (from OS), numbered and labeled with resolution
- Click to toggle each monitor for detection/alarm independently
- "All" toggle for quick select/deselect
- Alarm preview button — test alarm on selected monitors

**Detection behavior:**
- Screenshot capture runs per selected monitor
- Alarm metadata includes which monitor triggered it
- "Detected" alarm mode = alarm only appears on the offending monitor

### 6. Stats & Gamification

**Tracked per session:**
- Total focus time vs distraction time
- Number of alarms triggered (by level)
- Pomodoro cycles completed vs broken
- Which apps/sites caused distractions (ranked)
- Focus streak (consecutive clean Pomodoros)
- Best streak (all-time record)

**Dashboard views:**

| View | Content |
|---|---|
| **Today** | Ring chart (focus vs distraction %), timeline bar showing session history, alarms as red blips |
| **Weekly** | Day-by-day bar chart with focus hours, streak graph, "worst distractor" leaderboard |
| **All-time** | Total hours focused, best streak, most-used profiles, trend line over weeks/months |

**Gamification:**
- **Focus streak counter** — visible on widget + dashboard. Consecutive clean Pomodoros. Resets on Level 3 alarm
- **Daily goal** — user sets target (e.g., "6 Pomodoros"). Progress ring on dashboard
- **Personal records** — "Longest streak: 12 🔥", "Best day: 8h 20m" — glass achievement cards with neon glow

**Data:**
- SQLite local database, all data on device
- Export to JSON/CSV from settings

### 7. Screens Summary

1. **Main Dashboard** — Pomodoro ring timer (animated neon arc), active profile, streak counter, quick-start, today's stats
2. **Floating Widget** — Draggable pill, timer countdown, pulsing neon ring (cyan=focused, orange=grace, red=alarm)
3. **Profile Editor** — Glass cards, app picker, site URLs, Pomodoro sliders, detection tuning, monitor config
4. **Alarm Overlay** — Fullscreen glitch + shake + meme slideshow + siren (per escalation level)
5. **Stats Dashboard** — Animated charts, daily/weekly/all-time views, achievement cards
6. **Settings** — Meme manager, theme/accent color, monitor layout, export data, AI provider config
7. **System Tray** — Timer countdown, quick profile switch, start/pause/stop

## Privacy

- 100% local — no accounts, no cloud sync, no telemetry
- Screenshots are transient (analyzed then discarded, never stored)
- AI vision runs locally by default
- Cloud API calls are optional and user-initiated

## Future (v2+)

- **Camera/posture detection** — webcam-based detection (looking at phone, walked away, etc.) via MediaPipe/OpenCV. Architecture is designed to accommodate this as an additional detection source in the pipeline
- **Mobile companion** — timer sync to phone
- **Multiplayer** — shared focus sessions with friends, competitive streaks
