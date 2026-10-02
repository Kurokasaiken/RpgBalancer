---
title: Mission Planner Spec
status: candidate
updated: 2026-10-01
type: component-spec
---

# Mission Planner Spec (v7)

> Implements `PLAN-018-mission-planner.md` v3 (T-000.5…T-007), desiderata v23 rev.4.
> Mathematical contract: [`mission_planner_math_spec.md`](./mission_planner_math_spec.md)
> (normative — the Planner preview and the resolver are two surfaces over the same
> pure functions). Data-model decisions: [`mission_planner_data_model_fix.md`](./mission_planner_data_model_fix.md).
> > PLAN-019 note (2026-10-01): this spec documents the Planner as shipped. Per
> `plans/PLAN-019-quest-macro-plan.md` §S2/S3 it will be remapped when the validated
> quest model lands; nothing here is final architecture.

## 1. Goal

Before a quest launch the player assembles an expedition draft — party members,
equipment loadouts, consumables — and sees a **deterministic, RNG-free preview** of
the outcome distribution, per-member injury/death risk, duration and reward. The
same model drives the actual resolution: the Planner shows the distribution, the
resolver samples from it.

## 2. Data flow

```text
blueprint (questBlueprints.ts, checkStatTags + riskProfile per phase)
   + items (questItems.ts — Zod: statDeltas, risk deltas, coverRiskDelta, consumables)
   + draft (useMissionPlannerDraft — Context, NOT persisted, immutable)
        assignments / loadouts / consumables
   → buildMissionInput (missionPlannerEngine.ts)
        applyLoadoutToResident per member (MP-03), canonical member order
        (slot index, then residentId), itemEffects, emptySlotPenalty
   → computeMissionPreview (missionPlannerMath.ts)
        exact DP over alive-set × passed-count — no RNG
   → buildPlannerView (plannerViewModel.ts)
        quest metrics + per-phase preview (memberPhaseRisk range on all-alive
        mask, surviveThrough, dominant retreatTier)
   → MissionPlannerPanel (presentational, FloatingPanel)

Embark → buildLaunchPayload → validateDraft (reason-typed rejection)
   → useQuestPoiSession.startQuestWithPayload
        consumables consumed at launch; memberStates persisted per phase
   → missionResolver samples the SAME DP per phase
        weakest-tag check on the alive set, per-member risk rolls,
        dead out / injured keep rolling, wipe → deadly
   → checkpoint (D2): continue = computeMissionPreview on remaining phases ×
        alive members; retreat = deterministic classifyTier on played phases
   → finalizeQuestRun → tier (isPassingVerdict = win|bigwin) → consequences
```

## 3. Scenarios (Given-When-Then)

### S1 — Palindrome reversibility

**Given:** a draft A on a quest page
**When:** the player adds a member, equipment and a consumable, then removes them
in reverse order (`A → A+PG → A+PG+equip → A+PG+equip+consumable → … → A`)
**Then:** `serializeOutcome(preview)` is **bit-identical** at A and at the restored A.

### S2 — Tutorial quest draft (`quest_city_rats`)

**Given:** the Mission Planner open on the tutorial quest with a lone hero
**When:** the player adds a villager, then assigns the draft horse
(`quest_mount_draft_horse`, slot `mount`, `durationMult 0.5`)
**Then:** the SUCCESSO headline changes with each member; the BY MEMBER section
shows both risks; Durata decreases and the `mount` slot renders as occupied.

### S3 — Non-blocking panel

**Given:** the Mission Planner floating panel is open over the quest page
**When:** the player interacts with the page behind it (roster, quest list, clock)
**Then:** the page remains fully interactive — the panel never traps pointer input.

### S4 — Invalid draft

**Given:** a required slot is empty or a member in the draft left the roster
**When:** the preview recomputes (live invalidation)
**Then:** `canEmbark=false`, the blocker reason is listed, Embark stays disabled.

### S5 — Checkpoint dual preview

**Given:** a running quest stops at a continue/retreat checkpoint after phase k
**When:** the panel opens
**Then:** "if you push on" shows a recomputed preview on the remaining phases with
the members still alive; "if you retreat now" shows the deterministic tier the
already-played phases resolve to.

### S6 — Per-member death cascade

**Given:** a party where a member dies mid-run
**When:** the resolver samples later phases
**Then:** the dead member contributes neither stats nor risk rolls; the injured
keep contributing; a wipe resolves the run as `deadly`.

## 4. Contracts

- **Preview purity:** `computeMissionPreview` is a pure function of
  `(party, loadout, consumables, config)`; no RNG, no mutable state reads, no
  writes to `statSnapshot`. Every emitted probability rounded to 6dp.
- **Single model:** Planner and resolver MUST stay on the same functions in
  `missionPlannerMath.ts` (±1.5pp Monte-Carlo agreement at ≥10k seeded runs).
- **Verdicts:** `isPassingVerdict = {bigwin, win}` — `almost` is not a pass.
- **Tier table:** `resolveQuestOutcomeTier` semantics; retreat resolves on the
  phases played (`c·2 ≥ played → success`), `played=0 → fail`, wipe → `deadly`.
- **Loadout:** one pure `applyLoadoutToResident` used by BOTH preview and
  resolver; `LoadoutError` is typed (`UNKNOWN_ITEM`, `SLOT_MISMATCH`).
- **Draft state:** Context-local, never persisted, never Zustand (per rules).
- **i18n:** namespaces `missionPlanner.*`, `questCheckpoint.*`, `questOutcome.*`;
  i18next-icu interpolation uses single braces `{var}` — `{{var}}` renders
  literally and is a bug.
- **Config-first:** items/penalties/multipliers only from
  `src/balancing/config/idleVillage/quests/**` (Zod schemas).

## 5. Test commands

```bash
npm run test -- idleVillage            # unit/RTL scope (math, engine, draft, panel, resolver, milestones)
npx playwright test tests/e2e/idleVillage/missionPlanner.spec.ts   # E2E (S1–S3)
npm run build:check
npm run kanban:lint
```

Smoke route: `/poi-quest-detail-roster-time-clock` must return 200 and the panel
must open from the Mission Planner button.

## 6. Legacy surface

`useQuestAssignmentPreview` / `QuestAssignmentPreview` (QuestPowerEngine preview)
remain wired on `PoiDetailQuestRosterIntegrationPage` only, as the legacy path —
status `deprecated` in `COMPONENT_MASTER_INDEX.md`. New quest surfaces MUST use
the Mission Planner preview.
