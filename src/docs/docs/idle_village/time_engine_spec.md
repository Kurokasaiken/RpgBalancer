---
title: TimeEngine Spec
status: draft
updated: 2026-08-15
type: component-spec
---

# TimeEngine Spec

## State Machine (ASCII)

```text
[init] ──► createVillageStateFromConfig ──► idle
 idle ──(scheduleActivity)──► scheduled
 scheduled ──(advanceTime)──► running
 running ──(advanceTime)──► running
 running ──(resolveActivityOutcome)──► completed
 running ──(cancel or fail)──► cancelled / failed
```

`TimeEngine` itself does not know about pause/resume or speed multiplier. Those belong to the gameplay layer (`useMinimalGameplay`). `TimeEngine.advanceTime` always advances the canonical `currentTime` by the `delta` it receives and returns the new state plus any completed activity IDs.

## Detailed Scenarios

### Scenario 1: Schedule an activity

**Given:** valid `activityId`, available `residentIds`, and a `slotId` from config
**When:** `TimeEngine.scheduleActivity(deps, state, input)` is called
**Then:** resident status becomes `away`, a `ScheduledActivity` is created with `status: 'pending'`, and an `activity_scheduled` event is logged
**Visual contract:** POI shows a slot filled with the resident portrait and the start CTA becomes enabled

### Scenario 2: Time advances

**Given:** a running activity with remaining duration > 0
**When:** `TimeEngine.advanceTime(deps, state, delta)` runs
**Then:** `currentTime` advances by `delta` integer ticks, fatigue recovery / food consumption are applied per tick, and the activity progresses
**Visual contract:** ActivityCapsule progress bar and MM:SS timer update

### Scenario 3: Activity completes and resolves

**Given:** a `ScheduledActivity` whose `currentTime` reached `endTime`
**When:** `TimeEngine.resolveActivityOutcome(deps, state, scheduledId)` is called
**Then:** outcome is rolled with injected `rng`, rewards/death/injury are applied, and the activity moves to `completed`
**Visual contract:** POI shows "Collect" CTA; if death occurred, Trial of Fire panel opens

### Scenario 4: Day/Night cycle

**Given:** `config.globalRules.dayNightCycle` defines `dayTimeUnits` and `nightTimeUnits`
**When:** `currentTime % totalCycleTime` crosses the day boundary
**Then:** `isDaytime` flips inside `advanceTime` and a `day_night_transition` event is emitted by the gameplay layer
**Visual contract:** DayNightPOI changes sun/moon icon and progress color

### Scenario 5: Pause is a gameplay-layer concern

**Given:** the shared store is paused (`isPaused === true`)
**When:** `useMinimalGameplay.tick()` is called from `DayNightTimeEngineStrip`
**Then:** `TimeEngine.advanceTime` is NOT invoked; `currentTime` does not change
**Visual contract:** `DayNightPOI` shows the pause icon; no activities progress

## Invariants

- `currentTime` is monotonically increasing and integer-valued
- `TimeEngine.advanceTime` advances canonical time 1:1 by the `delta` it receives; speed multiplier is applied by the caller
- Every state change produces an event log entry
- No hardcoded domain values; all formulas come from `IdleVillageConfig`
- `resolveActivityOutcome` uses injected `rng`, never `Math.random()`

## References

- Trusted contract: [`time_engine_trusted.md`](./trusted/time_engine_trusted.md)
- Used by: [`day_night_poi_spec.md`](./day_night_poi_spec.md), [`roster_spec.md`](./roster_spec.md), [`quest_spec.md`](./quest_spec.md)
