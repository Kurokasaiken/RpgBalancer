---
title: POI ↔ Detail Interaction
status: draft
updated: 2026-08-14
type: interaction-spec
---

# POI ↔ Detail Interaction

## Data Flow

```text
ActivityCapsule (POI)
   │
   │ click ──► open / close
   │
   ▼
FloatingPanel + ActivityCapsuleDetailSkinAware
   │
   │ slot assignments, start/cancel/collect
   │
   ▼
useMinimalGameplay (state updates)
```

| Source | Data | Consumer | Effect |
|---|---|---|---|
| POI | `activityId` | Detail | loads the same `ActivityDefinition` and slot blueprints |
| POI | `onActivityClick` | Detail | opens the floating panel |
| Detail | `onSlotAssign`, `onSlotDetach` | POI/Store | updates assignments and re-renders the capsule |
| Detail | `onStart` / `onCollect` | POI | changes POI status and progress |
| Detail | `onClose` | POI | panel closes; POI remains visible |

## State Transitions

When the user clicks a POI:

- `FloatingPanel` opens at a default or remembered position
- `ActivityCapsuleDetailSkinAware` receives the same `activityId`
- Panel header, POI display, slot rack, and CTA render
- For Quest POIs, the game is paused so the player can assemble the party without time passing

When a slot is assigned inside the detail:

- The detail calls `onSlotAssign(slotId)`
- The store adds the resident to that slot
- The POI capsule re-renders to show the filled slot summary

When Start is clicked:

- `TimeEngine` schedules the activity
- The POI state becomes `in-progress`
- The detail may show real-time progress or minimize

## Edge Cases

- Open multiple details: each is an independent `FloatingPanel` with its own `activityId`; z-index managed by last interaction
- Minimize detail while activity runs: the POI capsule continues to show progress; detail can be restored
- Close detail with unstarted assignments: assignments are kept in store; panel state is local

## Invariants

- Detail does not own activity state; it only delegates actions to the store/TimeEngine
- `FloatingPanel` is non-modal; the map remains interactive
- The same slot blueprints are used by POI and Detail (single source: `ActivityDefinition`)
- Opening a Quest POI detail pauses the game
- Closing a Quest POI detail resumes the canonical clock

## Runtime Evidence

Playwright suite `poiQuestDetailRosterTimeClock.spec.ts` (2026-08-14):

- `should open the Quest POI detail and show the ResidentSlotRack` — click on `QuestPOI` opens `poi-detail-wrapper-test`; `resident-slot-rack-root` is visible and at least one `slot-button-*` is present.
- `should pause the game when opening the Quest POI detail` — `__idleVillageTestHooks.getQuestState().isPaused` flips from `false` to `true` after the click.
- `should drag the POI detail panel by its header` — the detail `FloatingPanel` moves when the header is dragged (pre-existing coverage).
- `should resume the game when the POI detail is closed and reopen on POI click` — closing `poi-detail-wrapper-test` flips `__idleVillageTestHooks.getQuestState().isPaused` back to `false`; clicking `QuestPOI` again reopens the detail.

## Comportamento atteso (2026-08-15)

- **Pausa al chiudi detail:** chiudere il POI detail ripristina lo stato di pausa che era in vigore prima dell'apertura; se il gioco era già in pausa, resta in pausa; se era in play, torna a scorrere. Test: `should preserve the pre-open pause state when the POI detail is closed`.
- **Drag preview sopra il detail:** durante il drag di un resident token sopra il POI detail, l'overlay/la card trascinata deve restare visibile e sopra il pannello. Test: `should keep the resident drag preview visible when hovering the POI detail`.

## References

- [`poi_spec.md`](./poi_spec.md)
- [`detail_spec.md`](./detail_spec.md)
- [`poi_detail_trusted.md`](./trusted/poi_detail_trusted.md)
