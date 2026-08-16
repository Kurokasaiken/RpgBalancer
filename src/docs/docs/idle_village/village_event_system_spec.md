# Village Event System Spec

**Status:** candidate
**Version:** 1.0.0
**Owner:** Devin
**Last Updated:** 2026-08-15

## Goal

The `VillageEvent` system is the canonical log of everything that happens inside the village simulation. Every scheduling, start, completion, cancellation, injury, daily food consumption, and trial-of-fire event is emitted by the `TimeEngine` and recorded in `VillageState.eventLog`. This document describes the event types, their lifecycle, how they are produced, and which parts are still mocked or not wired to the UI.

## Data Flow

```text
User action / Time tick
   │
   ▼
TimeEngine.tick() / scheduleActivity() / cancelActivity()
   │
   ├─ writes new event to newEvents[]
   ├─ updates VillageState (residents, resources, activities)
   ▼
VillageState.eventLog (append-only, chronological)
   │
   ▼
Consumers: ChronicleStrip, QuestChronicle, WorldSurface notifications, telemetry
```

## Event Types

| Type | Emit Condition | Payload | Status |
|---|---|---|---|
| `activity_scheduled` | User assigns resident(s) to an activity | `scheduledId`, `activityId`, `characterIds`, `slotId` | implemented |
| `activity_started` | `tick()` reaches `activity.startTime` | `scheduledId`, `activityId` | implemented |
| `activity_completed` | `tick()` reaches `activity.endTime` or resolver fires | `scheduledId`, `activityId`, `rewards?`, `continuousJob?` | implemented |
| `activity_cancelled` | User cancels an activity before completion | `scheduledId`, `activityId`, `reason` | partially implemented (stub in UI) |
| `fatigue_changed` | Fatigue is updated during a tick | `residentId`, `delta`, `newFatigue` | **MOCKED — not actively emitted** |
| `injury_applied` | `InjuryEngine` rolls a light injury | `residentId`, `scheduledId`, `activityId`, `severity`, `recoveryTime`, `fatigueAtInjury`, `dangerRating` | implemented |
| `food_consumed_daily` | Daily food consumption tick | `amount`, `newFood` | implemented |
| `trial_of_fire` | A quest phase reaches a milestone requiring a skill check | `scheduledId`, `phaseIndex` | implemented |

## Event Lifecycle

### Production

Events are produced in three places:
1. **Scheduling** (`TimeEngine.scheduleActivity`) → `activity_scheduled`
2. **Tick progression** (`TimeEngine.tick`) → `activity_started`, `activity_completed`, `fatigue_changed`, `food_consumed_daily`
3. **Resolvers** (`JobResolver.resolveJob`, `QuestResolver.resolveQuest`, `InjuryEngine.applyFatigueInjuryForActivity`) → `activity_completed`, `injury_applied`

### Ordering
- `eventLog` is append-only.
- Events are stored with `time: VillageTimeUnit`.
- Consumers should sort by `time` before presenting, because resolver events may be emitted slightly out of tick order.

## Post-Quest Outcomes

When a quest completes, `QuestResolver` emits a `quest_completed` event (not yet in `VillageEvent` union, but it is the contract shape used by the resolver). The `QuestPowerEngine` determines the outcome distribution and modifiers.

### Possible quest outcomes (best → worst)

1. `perfect`
2. `success`
3. `partial`
4. `fail`
5. `deadly`

### Post-failure effects

| Outcome | Resource rewards | Injury chance | Death chance | Resident return |
|---|---|---|---|---|
| `perfect` | full × `rewardMultipliers.perfect` | low | 0 | immediate |
| `success` | full × `rewardMultipliers.success` | low | 0 | immediate |
| `partial` | reduced × `rewardMultipliers.partial` | moderate | 0 | immediate |
| `fail` | none / penalty | high | 0 | immediate |
| `deadly` | none | high | high | immediate, may die |

### What is NOT yet implemented
- **Quest failure recovery UI:** there is no dedicated screen or card for "quest failed" beyond `QuestChronicle`. The reward modal exists for success; a failure modal is MOCKED.
- **Timeout behavior:** if a quest is not manually completed before its deadline, the `TimeEngine` still marks it `completed` at `endTime`; there is no explicit `quest_timeout` event or partial-failure logic yet.
- **Resident death handling:** `death` can be rolled by `QuestPowerEngine` but the downstream state transition (`status: 'dead'`) is not fully wired through `ResidentState` consumers.

## World Event Registry

The `worldEventRegistry` (`src/engine/world/config/worldEventRegistry.ts`) holds templates for visual/atmospheric events:

- `weather` — environment tint
- `threat` — red global tint
- `resource` — green global tint

These are **currently visual-only** in the `useWorldState` store. They do **not** emit `VillageEvent`s and do **not** affect village gameplay math yet.

## Trigger System

### Current
- Quest milestones trigger `trial_of_fire` events.
- Continuous jobs trigger `activity_completed` at each cycle and optionally auto-reschedule.
- Daily food consumption is checked every tick.

### Missing / Mocked
- **Event tiers (from `DESIGN_PILLARS.md`):** ambient, threat, major, run-threatening. No tiering logic exists in `VillageEvent`.
- **Reactive world triggers:** hidden discoveries, hover-easter eggs, zone entry. These are only in `DESIGN_PILLARS.md`; no code or `VillageEvent` type for them.
- **Event queue UI:** `ChronicleStrip` is a `DESIGN_PILLARS` proposal; no canonical component exists.

## Invariants

- `eventLog` is never mutated in place; every tick produces a new `VillageState`.
- Events must have a `time` value ≥ the previous `currentTime`.
- A `quest_completed` event must contain the same `rewards` that were actually applied to `resources`.
- `injury_applied` must only occur for living residents with `status !== 'dead'`.

## Test Commands

```bash
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts
npx playwright test tests/e2e/idleVillage/minimal-job-poi-roster-time-integration.spec.ts
npm run build:check
```

## References

- Code: `src/engine/game/idleVillage/TimeEngine.ts`, `JobResolver.ts`, `QuestResolver.ts`, `InjuryEngine.ts`
- World events: `src/engine/world/config/worldEventRegistry.ts`
- Quest power: `src/engine/game/idleVillage/QuestPowerEngine.ts`
- Design pillars: `DESIGN_PILLARS.md`
