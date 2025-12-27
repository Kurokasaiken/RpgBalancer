# Village Sandbox ActivityCard Refactor – Implementation Plan

**Status:** Planning → Phase A execution  
**Scope:** Refactor the Village Sandbox UI (vertical slice) to adopt the ActivityCard/ActivitySlot system, modernize map interactions, and streamline jobs/quests display while preserving the config-first architecture.

---

## 1. Objectives

1. **Unify Activity Rendering**  
   - Replace ad-hoc map markers and legacy VerbCard props with the new ActivityCard detail data pipeline (`icon`, `progressFraction`, `elapsedSeconds`, `totalDuration`, `injuryPercentage`, `deathPercentage`, `assignedCount`, `totalSlots`, `visualVariant`, `progressStyle`).
   - Ensure timers derive from `globalRules.secondsPerTimeUnit` (default 60s) to avoid hardcoded conversions.

2. **Map Experience**  
   - Each `mapSlot` (config-driven) should render a **Activity cluster** showing scheduled jobs/quests and outstanding quest offers, using drag-friendly ActivityCard miniatures scaled for the map.
   - Droppable states (`dropState` = `idle | valid | invalid`) must reflect dnd-kit feedback when hovering a resident/offer.

3. **Compact Active HUD**  
   - The “Jobs & Quests in progress” panel should become a **text-first summary** (name + reward + timer badge) to keep the map readable. The summary pulls from the same scheduled activity data structure to avoid duplication.

4. **Quest/Job Offers**  
   - Offers displayed on map slots must share tone colors, risk indicators, and call-to-action (“Accept”) buttons, backed by existing metadata (`activityToneId`, `risk` fields).

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

1. Finalize the shared `VerbSummary` type (scheduled + quest offer + system/completed sources) with slotId, resource labels, tone, drop state hints, and CTA metadata.
2. Implement helper pipeline:
   - `deriveVisualVariant`, `deriveProgressStyle`, `deriveTone`, `deriveIcon`, `deriveRisk`, `deriveDeadlineLabel`.
   - `buildScheduledVerbSummary(activity, scheduled, config, villageState, currentTime, secondsPerTimeUnit)`.
   - Add a sister helper for quest offers (convert `QuestOffer` + `ActivityDefinition` into lightweight summaries for map/HUD reuse) plus shared `getResourceLabel`.
   - Enforce timing conversions via `globalRules.secondsPerTimeUnit` with `DEFAULT_SECONDS_PER_TIME_UNIT = 60` fallback.
3. Add Vitest coverage for helper edge cases (quests without metadata, jobs without rewards, zero-duration safety).
4. Remove legacy `CompletedVerb`/map marker specific props that duplicate the new summary structure, keeping a single source of truth.
5. **Phase A tactical breakdown (current focus, updated 2025‑12‑17):**
   1. **A.1 – Imports & duplication cleanup *(in progress)*:** wire `IdleVillagePage` to consume helpers from `verbSummaries.ts`, delete inline duplicates, ensure `DEFAULT_SECONDS_PER_TIME_UNIT` + builder utilities resolve from one module.
   2. **A.2 – Scheduling summaries *(blocked on A.1)*:** replace `activeActivities` derived props with `buildScheduledVerbSummary`, including assignee names and tone/risk metadata.
   3. **A.3 – Quest offer summaries *(pending)*:** generate quest offer summaries via helper, expose `assigneeNames`, `rewardLabel`, `deadlineLabel`, and hook them into both map clusters and HUD pipeline.
   4. **A.4 – System/completed verbs *(pending)*:** convert hunger/injury/system verbs and completed jobs/quests into `VerbSummary` objects via dedicated builders, eliminating ad-hoc `CompletedVerb` structures.
   5. **A.5 – Slot grouping selectors *(pending)*:** memoize `verbsBySlot` / `questOffersBySlot` keyed on slotId, ensuring both map clusters and future HUD consume the same grouped data.
   6. **A.6 – HUD migration prep *(pending)*:** expose lightweight `VerbSummaryRow` props (label/reward/timer) so the HUD can be replaced in Phase C without additional data plumbing.

### Phase B – Map Slot Clusters

1. Implement `MapSlotVerbCluster` with scaled `VerbCard`s and droppable hook.  
2. Replace legacy `MapSlotMarker` usage with clusters:
   - Group scheduled summaries by `slotId`.
   - Attach quest offers per slot (convert to lightweight summary using activity metadata).  
3. Ensure dnd-kit interactions still call `handleAssignResidentToSlot` / `handleAcceptQuestOffer`.
4. Delete the fallback `MapSlotMarker` component once clusters are wired to render path and droppable IDs match the old pattern (`slot-${slot.id}`).

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
