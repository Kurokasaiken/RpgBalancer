---
title: TimeEngine ↔ Quest Interaction
status: draft
updated: 2026-08-13
type: interaction-spec
---

# TimeEngine ↔ Quest Interaction

## Data Flow

```text
TimeEngine
   │
   │ currentTime, advanceTime, resolveActivityOutcome
   │
   ▼
Scheduled Quest Activity
   │
   │ elapsed time, phase boundaries
   │
   ▼
useMilestoneEngine
   │
   │ milestone reached
   │
   ▼
MilestoneCheckModal (pause until resolved)
   │
   │ resolved
   │
   ▼
TimeEngine.advanceTime resumes
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| TimeEngine | `currentTime` | Quest activity | tracks elapsed ticks |
| `questBlueprints` | `phases[]` | `TimeEngine` + `useMilestoneEngine` | defines total duration and number of skill checks |
| `TimeEngine.advanceTime` | elapsed ticks | `useMilestoneEngine` | fires `milestoneReached` at phase boundaries |
| `MilestoneCheckModal` | resolved | `TimeEngine` | unblocks quest advance |
| `TimeEngine.resolveActivityOutcome` | final phase | Quest | completes quest, opens chronicle |

## State Transitions

When the quest starts:

- `TimeEngine.scheduleActivity` creates a `ScheduledActivity` with duration from the blueprint
- The quest enters `running`

As `TimeEngine.advanceTime` runs:

- `currentTime` increases
- `useMilestoneEngine` compares elapsed time to phase boundaries
- When a boundary is crossed, the quest enters `milestone` and time pauses

When the milestone is resolved:

- `useMilestoneEngine` allows the quest to continue
- `TimeEngine.advanceTime` resumes

When the final phase completes:

- `TimeEngine.resolveActivityOutcome` applies rewards and injuries
- The quest enters `completed`
- The POI becomes clickable to open `QuestChronicle`

## Edge Cases

- `isPaused` while the quest is running: `advanceTime` is not called, so the magic circle also stops
- Speed multiplier: only affects UI display cadence, not simulation; milestones still happen at the same `currentTime`
- Player cancels the quest: `TimeEngine` removes the scheduled activity and returns residents

## Invariants

- Phase boundaries are computed from the blueprint's total duration and number of phases
- Milestone resolution blocks quest time advancement
- The canonical quest outcome is produced by `TimeEngine.resolveActivityOutcome`

## References

- [`time_engine_spec.md`](./time_engine_spec.md)
- [`quest_spec.md`](./quest_spec.md)
- [`time_engine_trusted.md`](./trusted/time_engine_trusted.md)
