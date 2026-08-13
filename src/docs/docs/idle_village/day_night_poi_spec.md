---
title: DayNightPOI Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# DayNightPOI Spec

## State Machine (ASCII)

```text
[mount] ──► day
 day ──(cycleProgress == 1)──► night
 night ──(cycleProgress == 1)──► day
 day / night ──(pauseGame)──► paused
 paused ──(resumeGame)──► previous phase
```

## Detailed Scenarios

### Scenario 1: Render day phase

**Given:** `useMinimalGameplay` reports `isDayPhase = true` and `cycleProgress = 0.4`
**When:** `DayNightPOI` renders
**Then:** it displays the sun icon, gold/amber ring, and a halo filled to 40%
**Visual contract:** Playwright sees `role=img` with `aria-label` containing "Day" and a circular progress indicator at 40%

### Scenario 2: Render night phase

**Given:** `useMinimalGameplay` reports `isDayPhase = false` and `cycleProgress = 0.7`
**When:** `DayNightPOI` renders
**Then:** it displays the moon icon, purple/indigo ring, and a halo filled to 70%
**Visual contract:** `aria-label` contains "Night" and ring color is purple

### Scenario 3: Pause / resume

**Given:** the game is running in day phase
**When:** the user clicks `DayNightActionCard` pause toggle
**Then:** `pauseGame()` is called, `DayNightPOI` shows pause bars and reduced bloom
**Visual contract:** Pause icon visible, ring opacity ~0.34, no progress animation

### Scenario 4: Phase transition telemetry

**Given:** current tick crosses the day/night boundary
**When:** `isDayPhase` flips in the store
**Then:** `DayNightPOI` emits a `day_night_transition` telemetry event
**Visual contract:** Smooth 220ms icon cross-fade between sun and moon

## Invariants

- All time state is read from `useMinimalGameplay`; no local timers
- Phase and progress are derived deterministically from `currentTick` and config
- Visual tokens come from `dayNightPoiSkinConfig` presets; no hardcoded colors
- DayNightPOI belongs to the POI family and follows its halo grammar

## References

- Trusted contract: [`daynight_trusted.md`](./trusted/daynight_trusted.md)
- Depends on: [`time_engine_spec.md`](./time_engine_spec.md)
- Used by: [`time_engine_day_night_poi_interaction_spec.md`](./time_engine_day_night_poi_interaction_spec.md)
