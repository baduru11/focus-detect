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
