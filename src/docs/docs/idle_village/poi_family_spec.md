---
title: POI Family Spec
status: draft
updated: 2026-08-15
type: component-spec
---

# POI Family Spec

## Goal

Define the shared contract for every **Point of Interest (POI)** in the Idle Village: a map capsule that exposes an `ActivityDefinition`, accepts resident cards in slots, progresses with the canonical time engine, and resolves into rewards or state changes. This root covers behavior that is **identical** for all POI kinds (`job`, `quest`, `training`, `maintenance`, `cooldown`). Specializations live in the child specs.

## Canonical sources

- Config schema: `src/balancing/config/idleVillage/types.ts` (`ActivityDefinition`, `ActivityCardKind`, `ActivitySlotModifier`, `ActivityFatigueProfile`)
- Default config: `src/balancing/config/idleVillage/defaultConfig.ts`
- Map capsule: `src/ui/idleVillage/components/ActivityCapsule.tsx` (see `poi_standard_trusted.md`)
- POI detail: `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`
- Interaction layer: `src/ui/idleVillage/interaction/` — `useDragOutcome`, `DragOutcomeFlight`, `useExtractionSequence`, `bloomEffect.ts`
- Master index: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`

## Data flow

```text
IdleVillageConfig.activities[id]
        │
        ▼
ActivityCapsule (map)  ◄──── click ── POI detail opens
        │
        ▼
ActivityCapsuleDetailSkinAware
        │
        ├── ResidentSlotRack (assign / extract)
        │   │
        │   ▼
        │   RosterDraggable ── drag / click-to-assign
        │
        ├── CTA (Start / Embark / Cancel / Collect)
        │
        ▼
Resolution engine (job / quest_dispatch / quest_combat / ...)
        │
        ▼
TimeEngine ── canonical time / day-night
        │
        ▼
Outcome (rewards, fatigue, injury, death, expiration)
        │
        ▼
Resource HUD + Roster + Chronicle
```

| Step | Source | Data | Consumer | Effect |
|------|--------|------|----------|--------|
| 1 | `IdleVillageConfig.activities[id]` | `ActivityDefinition` | `ActivityCapsule` / `ActivityCapsuleDetailSkinAware` | Renders capsule and detail |
| 2 | `ResidentSlotRack` | slot blueprint + assigned resident | `useResidentDropValidation` | Validates drop/click-to-assign |
| 3 | `onDragEnd` / click | `RosterDropVerdict` | `DragOutcomeFlight` | Magnetic flight into slot |
| 4 | `onFlightComplete` | resident + slot | slot rack controller | Assignment written |
| 5 | `onStart` / `onEmbark` | full slots | resolution engine | Transition `ready → in-progress` |
| 6 | `TimeEngine` | elapsed time | resolution engine | Phase/tick progress |
| 7 | Resolution engine | rewards, fatigue | store + HUD | Apply outcome, update roster |

## State machine

```text
[m]        idle
 idle ──(assign slot)──► ready
 ready ──(start/embark)──► in-progress
 in-progress ──(tick/phase)──► in-progress
 in-progress ──(complete)──► completed
 completed ──(collect)──► idle
 idle ──(expire)──► gone
```

**Notes:**
- The POI detail does **not** pause time automatically.
- `Start` / `Embark` commits immediately when the CTA is clicked while time is running and all required slots are filled; if the game is paused, the activity does not begin until `resumeGame` is called and `tick()` advances.
- Removing a resident or changing a consumable after starting does not cancel the already-started activity.

## Scenarios

### S-001 — Open POI detail

**GIVEN** a POI on the map in `idle` state

**WHEN** the user clicks the capsule

**THEN** `ActivityCapsuleDetailSkinAware` opens as a draggable panel, centered in the map viewport; the page behind remains interactive; the panel shows POI info, slot rack, CTA, and progress

**Visual contract:** no backdrop, header has `cursor: move`, panel clamped to viewport bounds

**Test:** `poiQuestDetailRosterTimeClock.spec.ts` — `should open the Quest POI detail and show the ResidentSlotRack`

### S-002 — Assign resident from roster

**GIVEN** the POI detail is open and a slot blueprint accepts the dragged resident

**WHEN** the user drops the resident onto a slot or the POI medallion

**THEN** the resident flies into the slot, `onFlightComplete` writes the assignment, the slot shows the resident, and the CTA enables when all required slots are filled

**Visual contract:** `bloomEffect` highlights valid targets; in-slot token appears only after flight lands; locked residents are `Away` (alpha 0.35, grayscale, `pointer-events: none`)

**Test:** `poiQuestRegressions.spec.ts` — `should assign a compatible resident via the API and reflect it in the detail`

### S-003 — Extraction

**GIVEN** an occupied slot

**WHEN** the user press-and-holds the slot (560ms) until overshoot

**THEN** teeth retract, bezel opens, on `onExtracted` the assignment is cleared, the resident returns to the roster

**Visual contract:** no `×` button; extraction is the only removal affordance; return flight is `isInset: false`

**Test:** `interaction_core_spec.md` verification on `/slot`

### S-004 — Start / Embark while time runs

**GIVEN** all required slots are filled and the user clicks Start/Embark

**WHEN** `isPaused === false` and all required slots are still valid

**THEN** the POI transitions to `in-progress`, the activity is scheduled, and time progression begins

**Visual contract:** CTA becomes a progress/speed control; the POI halo starts filling

**Test:** `poiQuestRegressions.spec.ts` — `should start a quest only when time resumes`

### S-005 — Time progression

**GIVEN** the POI is `in-progress`

**WHEN** the canonical `TimeEngine` advances

**THEN** the POI progress is derived from `TimeEngine` elapsed time, not from a local timer; `DayNightPOI` and halo reflect the same canonical state

**Visual contract:** no local `setTimeout` or `setInterval`; halo fills/drains from canonical `progressFraction`

**Test:** `time_engine_day_night_poi_interaction_spec.md`

### S-006 — Completion and collection

**GIVEN** the POI is `completed`

**WHEN** the user clicks Collect (non-continuous) or time ticks (continuous)

**THEN** rewards are applied, fatigue is consumed, residents are released or remain depending on `continuousJob`

**Visual contract:** non-continuous shows a Collect CTA / reward screen; continuous shows a small `+` delta on the resource HUD

**Test:** child specs (`poi_job_spec.md`, `poi_quest_spec.md`)

## Visual / runtime contract

- **Capsule** is a map marker, not a detail view (`poi_standard_trusted.md`).
- **Detail** is a draggable, minimizable, closeable floating panel with no backdrop (`detail_spec.md`, `floating_panel_spec.md`).
- **Slot rack** is config-driven from `ActivityDefinition.metadata.slotBlueprints` (`interaction_core_spec.md`).
- **Drag** uses `dnd-kit` with `DragOutcomeFlight`; token remains mounted and becomes `Away` during drag (`interaction_core_spec.md`).
- **Halo / progress** is derived from `TimeEngine`; color and fill direction are skin/preset driven (`day_night_poi_spec.md`).
- **Rewards / costs / fatigue** are config-driven (`ActivityDefinition.rewards`, `costs`, `fatigueProfile`, `dailyRewardProfile`, `dailyFatigueCost`).

## Invariants

- [ ] Every POI is an `ActivityDefinition` from `IdleVillageConfig`; no hardcoded lists in pages.
- [ ] No local timers; `TimeEngine` is the single source of time.
- [ ] Drag flow never writes resident status; it changes the assignment store, and the roster re-derives.
- [ ] Start/Embark begins the activity only when time is running and all required slots are valid.
- [ ] `ActivitySlotModifier` (per slot index) and `residentRiskModifiers` (per slot blueprint) compose: environment multiplier + resident delta.
- [ ] Every specialized POI behavior (quest, job, training, cooldown) is documented in a child spec and linked from this root.
- [ ] Every spec links to its test command and evidence log.
- [ ] All user-facing strings go through i18n (`idleVillage` namespace).
- [ ] No standalone `.css` files; skin through `skinConfigRegistry`.
- [ ] Persistence via `PersistenceService` only.

## Slot modifiers mapping

| Concept | Source | Scope | Meaning |
|---------|--------|-------|---------|
| `ActivitySlotModifier` | `ActivityDefinition.slotModifiers[index]` | slot environment | `fatigueMult`, `riskMult`, `yieldMult` applied to calculations that touch this slot |
| `residentRiskModifiers` | slot blueprint (`metadata.residentRiskModifiers`) | resident occupying the slot | flat `deathChanceDelta` / `injuryChanceDelta` added to the resident's risk |
| `emptyPenalty` | slot blueprint (`metadata.emptyPenalty`) | party level | malus applied to party power / risk when a `required` slot is left empty |

## Test commands

```bash
# POI quest focused
npx playwright test tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts --project="Desktop Chrome"

# POI regressions (will be extended to family)
npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts --project="Desktop Chrome"

# Build + lint
npm run build:check
npm run kanban:lint
```

## Evidence

- Template: `.mw/templates/ai-friendly-spec.md`
- Plan: `plans/PLAN-005-poi-family-ai-friendly.md`
- Existing quest evidence: `test-results/poi-quest-detail-roster-time-clock-err-028-030-2026-08-15.md`
- Build log: `test-results/build-check-2026-08-15.log` (passed)

## Child specs

- `poi_job_spec.md` — one-shot and continuous jobs, stamina, auto-collect, resource HUD
- `quest_spec.md` — quest lifecycle, milestones, skill check, `trialOfFire`, chronicle
- `poi_training_spec.md` — stat/XP focus, low risk
- `poi_maintenance_spec.md` — upkeep / building POIs
- `poi_cooldown_spec.md` — time-limited POIs with countdown and expiration

## References

- Trusted: `trusted/poi_standard_trusted.md`
- Related: `poi_spec.md`, `detail_spec.md`, `interaction_core_spec.md`, `time_engine_spec.md`, `day_night_poi_spec.md`, `roster_slot_rack_interaction_spec.md`
- Master index: `COMPONENT_MASTER_INDEX.md`
