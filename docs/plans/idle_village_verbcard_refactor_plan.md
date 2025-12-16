# Idle Village VerbCard Refactor – Implementation Plan

**Status:** Planning  
**Scope:** Refactor the Idle Village UI (vertical slice) to adopt the new `VerbCard` system, modernize map interactions, and streamline jobs/quests display while preserving the config-first architecture.

---

## 1. Objectives

1. **Unify Verb Rendering**  
   - Replace ad-hoc map markers and legacy verb props with the new `VerbCard` API (`icon`, `progressFraction`, `elapsedSeconds`, `totalDuration`, `injuryPercentage`, `deathPercentage`, `assignedCount`, `totalSlots`, `visualVariant`, `progressStyle`).
   - Ensure timers derive from `globalRules.secondsPerTimeUnit` (default 60s) to avoid hardcoded conversions.

2. **Map Experience**  
   - Each `mapSlot` (config-driven) should render a **Verb cluster** showing scheduled jobs/quests and outstanding quest offers, using drag-friendly `VerbCard`s scaled for the map.
   - Droppable states (`dropState` = `idle | valid | invalid`) must reflect dnd-kit feedback when hovering a resident/offer.

3. **Compact Activity HUD**  
   - The “Jobs & Quests in progress” panel should become a **text-first summary** (name + reward + timer badge) to keep the map readable. The summary pulls from the same scheduled verb data structure to avoid duplication.

4. **Quest/Job Offers**  
   - Offers displayed on map slots must share tone colors, risk indicators, and call-to-action (“Accept”) buttons, backed by existing metadata (`verbToneId`, `risk` fields).

5. **Diagnostics & Tests**  
   - Maintain deterministic RNG for reproducible UI tests. Expand Vitest coverage for the new selectors/helpers that build `ScheduledVerbSummary`.

---

## 2. Non-Goals

- No redesign of TimeEngine/IdleVillageEngine logic. The refactor is UI + helper focused.
- No introduction of offline progression, new quest types, or additional resources.
- No change to VerbCard core visuals beyond scaling/variants already supported in `VerbCard.tsx`.

---

## 3. Architectural Decisions

1. **Single Source of Truth (`ScheduledVerbSummary`)**  
   - Build summaries via pure helpers that take `ScheduledActivity`, `ActivityDefinition`, `VillageState`, and config-provided tone colors.  
   - Both the map clusters and the HUD reuse the exact same summaries.

2. **`MapSlotVerbCluster` Component**  
   - Wraps one `mapSlot`, renders a vertical stack of scaled `VerbCard`s (active jobs/quests first, offers next, placeholder if empty).
   - Provides a single droppable surface to keep drag-and-drop simple (dragging onto the cluster behaves like targeting the slot).

3. **Compact HUD Rows**  
   - Each row: `icon | label | reward / risk | timer chip | action when applicable`.
   - Timer chip reads `remainingSeconds` → `mm:ss`, color-coded via tone.  
   - Completed verbs become dismissible entries with “Collect” action.

4. **Config-Driven Styling**  
   - Tone colors sourced from `globalRules.verbToneColors`.  
   - Quest difficulty/reward variance badges (future) piggyback on metadata but stay out of the critical path for this refactor.

5. **Testing Strategy**  
   - Unit tests for helper functions (derive variant, tone, risk, deadlines, scheduled summaries).
   - UI regression: Playwright smoke test to ensure dragging still schedules jobs and that map clusters render expected verb counts.

---

## 4. Implementation Phases

### Phase A – Data & Helpers

1. Finalize `ScheduledVerbSummary` type (include slotId, resource labels, tone, drop state hints).
2. Implement helper pipeline:
   - `deriveVisualVariant`, `deriveProgressStyle`, `deriveTone`, `deriveIcon`, `deriveRisk`, `deriveDeadlineLabel`.
   - `buildScheduledVerbSummary(activity, scheduled, config, villageState, currentTime, secondsPerTimeUnit)`.
3. Add Vitest coverage for helper edge cases (quests without metadata, jobs without rewards, zero-duration safety).

### Phase B – Map Slot Clusters

1. Implement `MapSlotVerbCluster` with scaled `VerbCard`s and droppable hook.  
2. Replace legacy `MapSlotMarker` usage with clusters:
   - Group scheduled summaries by `slotId`.
   - Attach quest offers per slot (convert to lightweight summary using activity metadata).  
3. Ensure dnd-kit interactions still call `handleAssignResidentToSlot` / `handleAcceptQuestOffer`.

### Phase C – Compact HUD

1. Create `VerbSummaryRow` component (pure, text-based).
2. Feed rows with the same `ScheduledVerbSummary` array used by the map.  
3. Support categories:
   - Hunger/injury system verbs (system tone).  
   - Active jobs/quests (running).  
   - Completed verbs (collect action).  
   - Quest offers (accept action).  
4. Remove legacy `VerbCard` usages from the HUD to avoid prop mismatches.

### Phase D – Quest Offer Integration & UX Polish

1. Ensure quest offers display risk badges and “Accept” CTA both on the map and in HUD.  
2. Highlight selected slot both in cluster outline and HUD entry (bidirectional focus).  
3. Add CTA key hints (e.g., tooltip or button text referencing drag/drop).

### Phase E – Testing & Documentation

1. Add Vitest suite for `ScheduledVerbSummary` helpers.  
2. Update Playwright scenario for Idle Village (drag job → see map cluster update, quest offer accept, etc.).  
3. Document configuration expectations (tone colors, seconds per time unit) inside `docs/plans/idle_village_plan.md` references and `IdleVillagePage.tsx` comments where necessary.

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Drag-and-drop regressions when consolidating droppable surfaces | Keep `MapSlotVerbCluster`’s droppable id identical to historical `slot-${slot.id}`; emit integration test. |
| Timer desync if `secondsPerTimeUnit` missing | Provide fallback `DEFAULT_SECONDS_PER_TIME_UNIT = 60` and log warning if config omits it. |
| VerbCard prop mismatch in HUD | HUD uses text rows, not VerbCard, so only map clusters instantiate VerbCard to minimize prop surface area. |
| Performance with many activities | Summaries computed via memoized selectors keyed on `villageState.activities` + `config.version`. |

---

## 6. Deliverables

- Updated `IdleVillagePage.tsx` with helper pipeline, map clusters, compact HUD, and consistent VerbCard usage.
- `MapSlotVerbCluster.tsx` (or inline component) plus supporting styles.
- Unit + Playwright tests covering new helpers and UI flows.
- Updated plan/tasks references (this file + checklist entries in `idle_village_tasks.md`).

---
