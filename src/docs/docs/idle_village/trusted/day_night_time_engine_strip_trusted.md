# DayNightTimeEngineStrip — Trusted Contract

## Metadata
- Status: `trusted`
- Area: `time`
- Canonical Name: DayNightTimeEngineStrip — canonical clock + day/night UI component
- Primary Files:
  - `src/ui/idleVillage/components/minimal/DayNightTimeEngineStrip.tsx`
  - `src/ui/idleVillage/frozen/kits/clockKit.tsx`
  - `src/ui/idleVillage/components/minimal/TimeEngineStrip.tsx`
- Runtime/Test Pages:
  - `/minimal-clock`
  - `/poi-quest-detail-roster-time-clock`
- Last Certified: `2026-08-15`
- Last Updated By: `Devin`
- Related Contracts:
  - `[COMPONENT_MASTER_INDEX.md](../COMPONENT_MASTER_INDEX.md)`
  - `[clockKit.md](../../../frozen/kits/clockKit.md)`

## 1. Purpose

`DayNightTimeEngineStrip` is the single drop-in component that both **displays** the canonical time and **drives** the canonical time loop. Mounting it on any page is enough to make time advance, day/night cycle, and Space play/pause work for that page. No page-level `setInterval` is required.

## 2. Canonical Runtime Contract

### 2.1 Time Loop Ownership

- When `isPaused === false`, the strip calls `gameplay.tick(intervalMs, 'auto')` every `gameplay.config.loop.tickIntervalMs` milliseconds.
- The `gameplay` object is either passed via the `gameplay` prop or obtained internally via `useMinimalGameplayWithIdleVillageConfig()`.
- The `tick` function is stored in a `useRef` so the interval does not reset on gameplay object reference changes.
- The interval is cleaned up when the component unmounts or `isPaused` becomes `true`.

### 2.2 Global Space Shortcut

- While the strip is mounted, `Space` is a page-wide play/pause shortcut.
- `Space` while `isPaused` calls `resumeGame('keyboard')`.
- `Space` while running calls `pauseGame('keyboard')`.
- `e.preventDefault()` is called to avoid page scroll.

### 2.3 Display

- The strip computes `dayNightProgress` from `gameState.currentTick` and `config.globalRules.dayNightCycle`.
- It renders `TimeEngineStrip` with the `DayNightPoiSkin` as the phase icon.
- It exposes speed control buttons `[1, 2, 4, 8]` and calls `setSpeedMultiplier` on the shared store.

## 3. Invariants

- Only one canonical time loop per mounted strip. If multiple strips are mounted, each runs its own interval; pages should avoid mounting more than one.
- No local time state. All `currentTick`, `currentDay`, `isDayPhase`, `cycleProgress`, `isPaused`, `speedMultiplier` are read from the shared `useMinimalGameplay` store.
- The strip does not implement quest/job/training semantics; it only advances the shared store's `currentTick`.

## 4. Integration Rules

### With `useMinimalGameplay`
- `pauseGame`, `resumeGame`, `setSpeedMultiplier`, and `tick` are called on the store.
- The strip subscribes to `gameplay.state` through the store.

### With `TimeEngineStrip`
- `TimeEngineStrip` is the visual surface. It receives `clockProps`, `phaseIcon`, `temporalDisplay`, and `onToggle`.
- `DayNightTimeEngineStrip` passes a `DayNightPoiSkin` icon and `pauseGame`/`resumeGame` via `onToggle`.

### With `DayNightPoiSkin`
- `DayNightPoiSkin` receives `isDayPhase`, `cycleProgress`, and `isPaused` from `gameplay.state`.

## 5. Acceptance Criteria

- [ ] Mounting the strip on a page starts the `tick()` loop when not paused.
- [ ] Pressing `Space` toggles play/pause and updates the store.
- [ ] Speed buttons change `speedMultiplier` in the store.
- [ ] `currentTick`, `currentDay`, `isDayPhase`, and `cycleProgress` advance while time runs.
- [ ] Unmounting the strip clears the interval.

## 6. Verification

### Runtime verification
- `npx playwright test tests/e2e/idleVillage/clockKitSpaceControl.spec.ts` — `Space` toggles play/pause on `/minimal-clock`.
- `npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts` — `should toggle play/pause with the Space key`.
- `npm run build:check`

## 7. Change Policy

`DayNightTimeEngineStrip` is `trusted`. Any changes to:
- Tick loop ownership or interval logic
- Space key behavior
- Speed control contract
- Display/props contract

Require:
1. Update of this trusted documentation
2. Update of `clockKit.md`
3. Update of `COMPONENT_MASTER_INDEX.md`
4. Evidence log of verification
