---
title: TimeEngine ↔ DayNightPOI Interaction
status: draft
updated: 2026-08-13
type: interaction-spec
---

# TimeEngine ↔ DayNightPOI Interaction

## Data Flow

```text
TimeEngine (simulation)
   │
   │ currentTime
   │
   ▼
useMinimalGameplay (gameplay store)
   │
   │ isDayPhase, cycleProgress, isPaused
   │
   ▼
DayNightPOI (presentation)
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| TimeEngine | `currentTime` | gameplay store | computes phase |
| gameplay store | `isDayPhase` | DayNightPOI | selects icon color |
| gameplay store | `cycleProgress` | DayNightPOI | fills progress halo |
| gameplay store | `isPaused` | DayNightPOI | switches to pause icon |

## State Transitions

When `currentTime` crosses `dayTimeUnits` boundary:

- `isDayPhase` flips `true ↔ false`
- `cycleProgress` resets to 0 and begins counting up
- `DayNightPOI` cross-fades the icon over 220ms
- Telemetry `day_night_transition` is emitted

When `pauseGame()` is called:

- `isPaused` becomes `true`
- `DayNightPOI` shows pause bars
- `TimeEngine.advanceTime` is not invoked while paused

## Edge Cases

- Pause at boundary: phase calculation must not flip while paused because `currentTime` is frozen
- Speed multiplier: DayNightPOI always reads the same `isDayPhase`/`cycleProgress`; speed only changes UI update cadence, not simulation
- Unmount: DayNightPOI removes its telemetry listener; `useMinimalGameplay` continues on other surfaces

## Invariants

- Day/Night state is a pure function of `currentTime` and config
- `DayNightPOI` has no local timers or independent phase state
- `DayNightTimeEngineStrip` (clockKit) runs the canonical `tick(intervalMs, 'auto')` loop while mounted and `!isPaused`. It reads `config.loop.tickIntervalMs` and calls `gameplay.tick()` on the shared `useMinimalGameplay` store. `PoiDetailQuestRosterTimeClockIntegrationPage` still syncs the IdleVillage `config` into the store so `tick()` can recalculate `isDayPhase`/`cycleProgress`.

## Runtime Evidence

`/poi-quest-detail-roster-time-clock` Playwright suite (2026-08-14):

- `should advance the day/night cycle halo while time runs` — after resuming and selecting 4x speed, `currentTick > 0`, `data-progress > 0` and `data-paused="false"`.
- `should pause the day/night cycle and stop progress` — clicking pause sets `data-paused="true"` and `data-progress` stays constant for 1 s.
- `should transition from day to night and flip the icon/color` — canonical `isDayPhase` flips to `false` and `DayNightPoiSkin` renders `data-phase="night"`.

## References

- [`time_engine_spec.md`](./time_engine_spec.md)
- [`day_night_poi_spec.md`](./day_night_poi_spec.md)
- [`time_engine_trusted.md`](./trusted/time_engine_trusted.md)
