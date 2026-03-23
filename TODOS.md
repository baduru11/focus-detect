# TODOS

## ~~TODO 1: Fix CLAUDE.md inaccuracies~~ **Completed** (2026-03-23)
- CLAUDE.md updated: grace countdown 10s, widget polling 1000ms, "No test framework" line removed, alarm model documented, new services documented.

## TODO 2: Add Widget close-requested handler
- **What:** Register `tauri://close-requested` on Widget window to call `setAlwaysOnTop(false)` before close
- **Why:** React `useEffect` cleanup alone is unreliable for async Tauri operations during rapid window teardown
- **Context:** `beforeunload` handler for main window added 2026-03-23 (stops detection + alarm sound). Widget handler still pending.
- **Depends on:** Nothing
- **Priority:** Medium — affects daily-driver reliability
- **Partially completed:** Main window `beforeunload` done. Widget `close-requested` remaining.

## ~~TODO 3: Remove dead getMockData code~~ **Completed** (2026-03-23)
- `getMockData()` already removed in prior commit. Verified — no references in codebase.

## TODO 4: Keyboard shortcuts (global hotkeys)
- **What:** Global hotkeys for pause/resume/skip without touching the mouse (Ctrl+Shift+P, Ctrl+Shift+S)
- **Why:** Power users expect keyboard control. Reduces context switching during focus sessions.
- **Context:** Deferred from CEO review 2026-03-23. Use `tauri-plugin-global-shortcut`. Not theatrical enough for current "Stabilize & Polish" scope.
- **Depends on:** Nothing
- **Priority:** P2 — quality-of-life

## TODO 5: First-run onboarding
- **What:** 3-step guide for new users: create profile → configure detection → start first session
- **Why:** Without onboarding, new users see an empty dashboard with no guidance on how to start.
- **Context:** Deferred from CEO review 2026-03-23. Should show meme preview during setup. Important for community adoption.
- **Depends on:** ~~Meme system complete~~ Meme system is now implemented (2026-03-23). No blockers.
- **Priority:** P2 — user experience

## TODO 6: ProfileEditor refactor
- **What:** Split 796-line monolith into: AppSelector, SiteEditor, PomodoroPreview sub-components
- **Why:** Current file is 2x recommended limit, 8+ nesting levels, hard to maintain and reason about.
- **Context:** Identified in CEO review 2026-03-23 system audit. Must wait for test safety net before refactoring.
- **Depends on:** Test coverage (Phase 1 of Stabilize & Polish)
- **Priority:** P3 — code health

## TODO 7: sessionService split
- **What:** Separate CRUD operations from stats/reporting queries into sessionService + statsQueryService
- **Why:** 417-line file mixing concerns. Reporting queries are complex and unrelated to session CRUD.
- **Context:** Identified in CEO review 2026-03-23 system audit. Must wait for test safety net.
- **Depends on:** Test coverage (Phase 1 of Stabilize & Polish)
- **Priority:** P3 — code health

## TODO 8: Configure Content Security Policy
- **What:** Set proper CSP in `tauri.conf.json` instead of `"csp": null`. Restrict to needed origins (self, Tauri asset protocol, AI provider API domains).
- **Why:** CSP is currently completely disabled. Plan adds user-provided filesystem images (meme system) and `shell.open()`. No CSP means any XSS in the webview could access arbitrary resources.
- **Context:** Flagged by Outside Voice in CEO review 2026-03-23. Not critical for local desktop app but should be done before any public distribution.
- **Depends on:** Meme system complete (need to know which origins are required)
- **Priority:** P2 — security hygiene

## TODO 9: Remove or wire alarm overlay dead code
- **What:** `AlarmPage.tsx` and `alarm_overlay.rs` (`show_alarm_overlay`/`hide_alarm_overlay`) are dead code. The IPC command is registered in lib.rs but never invoked from the frontend. L3 alarm renders in-window via AlarmController.
- **Why:** Dead code confuses future developers and wastes bundle size. Either remove it entirely, or wire `show_alarm_overlay` into useDetection when L3 fires (requires dual-window coordination for sound/state).
- **Context:** Discovered by Outside Voice in eng review 2026-03-23. The alarm overlay was likely an early prototype for fullscreen alarms that was superseded by the in-window AlarmController approach with `setAlwaysOnTop(true)`.
- **Depends on:** Nothing
- **Priority:** P2 — dead code removal
