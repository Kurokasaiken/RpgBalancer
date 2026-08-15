---
title: POI Cooldown / Expiration Spec
status: draft
updated: 2026-08-15
type: component-spec
---

# POI Cooldown / Expiration Spec

## Goal

Define the contract for **time-limited POIs** that must be started before a deadline, or that disappear/trigger an event when the countdown reaches zero.

## Canonical sources

- `poi_standard_trusted.md` §6 Expiration contract
- `ActivityDefinition.durationFormula`, `travelTimeToFormula`, `travelTimeFromFormula`
- `ActivityCapsule` props: `timeRemainingMs`, `expirationThresholdMs`, `isExpirable`
- Root: `poi_family_spec.md`

## Data flow

```text
ActivityDefinition
        │
        ├── durationFormula  ──► total time budget
        ├── isExpirable      ──► disappear on zero?
        └── expirationEvent  ──► trigger on zero?
        │
        ▼
TimeEngine
        │
        ├── countdown  ──► halo drains
        ├── threshold  ──► orange/red warning
        └── zero       ──► expire / trigger
```

## State machine

```text
idle ──(assign)──► ready
 ready ──(start)──► in-progress
 in-progress ──(countdown reaches 0 while running)──► completed
 ready ──(countdown reaches 0 before start)──► expired ──(trigger)──► gone/event
```

## Scenarios

### C-001 — Countdown POI that does not disappear

**GIVEN** a `isExpirable: false` POI with a visible countdown

**WHEN** the countdown reaches zero

**THEN** the POI remains on the map; the halo is empty; the player can still start it with a penalty or reduced reward

**Visual contract:** halo drains counter-clockwise; color stays amber/yellow; no "urgent" pulse

**Test:** `poiFamilyRegressions.spec.ts` — `should keep a countdown POI on the map after zero`

### C-002 — Expirable POI that disappears

**GIVEN** an `isExpirable: true` POI with a deadline

**WHEN** the user does not assign/start the POI before the countdown reaches zero

**THEN** the POI disappears from the map and returns to a global pool or is consumed

**Visual contract:** halo drains to red; at zero the capsule fades out and is removed

**Test:** `poiFamilyRegressions.spec.ts` — `should remove an expirable POI after the deadline`

### C-003 — Expirable POI that triggers an event

**GIVEN** an expirable POI configured with `expirationEventId`

**WHEN** the deadline expires

**THEN** the POI disappears and the configured event is pushed to the world event queue

**Visual contract:** same as C-002, plus a world notification/alert at the event tier

**Test:** `poiFamilyRegressions.spec.ts` — `should trigger an event when an expirable POI expires`

### C-004 — Urgency visuals

**GIVEN** a POI with `expirationThresholdMs = 60000`

**WHEN** `timeRemainingMs` drops below the threshold

**THEN** the halo color transitions from amber to red and the countdown text begins to pulse

**Visual contract:** color shift, no alpha square; pulse is slow and readable

**Test:** `poiFamilyRegressions.spec.ts` — `should show urgency visuals near expiration`

## Visual / runtime contract

- **Halo fill direction:** for countdown, the halo is initially full and drains counter-clockwise.
- **Color:** starts in the activity's normal color, transitions to orange then red as time runs out.
- **Pulse:** only near expiration; not continuous.
- **Countdown text:** `MM:SS` until expiration; then `00:00` or disappears.
- **No auto-start:** a countdown POI never starts by itself; the player still must press Start/Embark.

## Invariants

- [ ] `timeRemainingMs` is derived from `TimeEngine`, not a local timer.
- [ ] `isExpirable` is the only flag that allows removal on zero.
- [ ] Expiration never runs in the same tick as start; state is deterministic.
- [ ] Urgency visuals are driven by `expirationThresholdMs` and are config-driven.
- [ ] Disappearing POIs emit telemetry (`poi_expire` or `poi_event_trigger`).

## Test commands

```bash
npx playwright test tests/e2e/idleVillage/poiFamilyRegressions.spec.ts --project="Desktop Chrome" --grep "cooldown\|expiration"
```

## Evidence

- `poi_standard_trusted.md` §6

## References

- Root: `poi_family_spec.md`
- Related: `time_engine_day_night_poi_interaction_spec.md`, `day_night_poi_spec.md`
