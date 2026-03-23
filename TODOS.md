# TODOS

## TODO 1: Fix CLAUDE.md inaccuracies
- **What:** Update widget polling interval from '200ms' to '1000ms', grace countdown default from '5s' to '10s'
- **Why:** CLAUDE.md is the project truth for future AI sessions. Wrong values cause confusion.
- **Context:** Discovered during eng review 2026-03-23. Widget.tsx uses `setInterval(1000)`, ProfileEditor defaults graceCountdown to 10.
- **Depends on:** Nothing
- **Priority:** Low — documentation fix

## TODO 2: Add lifecycle handlers for clean shutdown
- **What:** Register `beforeunload` + `tauri://close-requested` event listeners to stop detection pipeline, stop alarm sounds, and clear `setAlwaysOnTop` on window close
- **Why:** Without this, closing the app can leave orphaned audio oscillators, running detection intervals, or the widget stuck as always-on-top
- **Context:** React `useEffect` cleanup alone is unreliable for async Tauri operations during rapid window teardown. Need Tauri-level event handler.
- **Depends on:** Nothing
- **Priority:** Medium — affects daily-driver reliability

## TODO 3: Remove dead getMockData code
- **What:** Delete `getMockData()` function from `sessionService.ts` (lines 331-417, 87 lines) and remove unused import in `useStats.ts`
- **Why:** Dead code shipping in production. Stats page already shows zeroes when no data exists (useStats.ts:71-80).
- **Context:** Was previously used for demo/placeholder data. Confirmed unused — the import exists but `getMockData` is never called.
- **Depends on:** Nothing
- **Priority:** Low — cleanup

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
- **Depends on:** Meme system complete
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
