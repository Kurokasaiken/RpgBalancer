---
title: TimeEngine Spec
status: draft
updated: 2026-08-13
type: component-spec
---

# TimeEngine Spec

## State Machine (ASCII)

```text
[init] ──► idle
 idle ──(schedule)──► scheduled
 scheduled ──(advanceTime)──► running
 running ──(pauseGame)──► paused
 paused ──(resumeGame)──► running
 running ──(milestone)──► milestone
 milestone ──(resolve)──► running
 running ──(complete)──► completed
 completed ──(collect)──► idle
```

## Detailed Scenarios

### Scenario 1: Schedule an activity

**Given:** valid `activityId`, available `residentIds`, and a `slotId` from config
**When:** `TimeEngine.scheduleActivity(deps, state, input)` is called
**Then:** resident status becomes `away`, a `ScheduledActivity` is created, and an `activity_scheduled` event is logged
**Visual contract:** POI shows a slot filled with the resident portrait and the start CTA becomes enabled

### Scenario 2: Time advances

**Given:** a running activity with remaining duration > 0
**When:** `TimeEngine.advanceTime(deps, state, delta)` runs
**Then:** `currentTime` increments by integer ticks, fatigue/food are applied, and activity `progress` increases
**Visual contract:** ActivityCapsule progress bar and MM:SS timer update

### Scenario 3: Activity completes and resolves

**Given:** an activity whose elapsed time reached duration
**When:** `TimeEngine.resolveActivityOutcome(deps, state, scheduledId)` is called
**Then:** outcome is rolled with injected `rng`, rewards/death/injury are applied, and activity moves to `completed`
**Visual contract:** POI shows "Collect" CTA; if death occurred, Trial of Fire panel opens

### Scenario 4: Day/Night cycle

**Given:** `config.globalRules.dayNightCycle` defines `dayTimeUnits` and `nightTimeUnits`
**When:** `currentTime % totalCycleTime` crosses the day boundary
**Then:** `state.isDayPhase` flips and a `day_night_transition` event is emitted
**Visual contract:** DayNightPOI changes sun/moon icon and progress color

### Scenario 5: Pause freezes quest time

**Given:** a quest is running and `isPaused === true`
**When:** `advanceTime` is not invoked (because the user paused the game or opened the quest detail)
**Then:** no quest phase, milestone, or reward is resolved; `currentTime` does not change
**Visual contract:** `DayNightPOI` shows the pause icon; `MagicCircleHalo` stops; no milestone modal appears

## Invariants

- `currentTime` is monotonically increasing and integer-valued
- Simulation time advances 1:1; speed multipliers are UI-layer only
- Every state change produces an event log entry
- No hardcoded domain values; all formulas come from `IdleVillageConfig`
- `resolveActivityOutcome` uses injected `rng`, never `Math.random()`

## References

- Trusted contract: [`time_engine_trusted.md`](./trusted/time_engine_trusted.md)
- Used by: [`day_night_poi_spec.md`](./day_night_poi_spec.md), [`roster_spec.md`](./roster_spec.md), [`quest_spec.md`](./quest_spec.md)
