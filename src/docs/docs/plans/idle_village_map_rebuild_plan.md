# Idle Village Map Rebuild Implementation Plan

**Status:** Draft · **Owner:** Idle Village pod · **Last Updated:** 2025-12-18

## 0. Process Guardrails

1. **Frequent commits:** push (or at minimum commit locally) every 10 minutes while working on this effort. Treat this as a hard rule to avoid losing progress. When a push is not possible (e.g., broken build under investigation), create a local WIP commit and note the reason in the commit message.
2. **Config-first discipline:** no domain constants embedded inside UI components. All resource labels, passive effects, quest timers, etc. must come from `IdleVillageConfig` and associated helpers.
3. **Map-only scope:** the rebuilt page must remain a slim visualization surface—no HUD controls, toast stack, or resident cards. Any shared logic (undo/export/import, hunger FX) stays in `IdleVillagePage` until explicitly reintroduced via config-driven overlays.

## 1. Objectives

1. Recreate `IdleVillageMapPage.tsx` as a minimal map-only surface that renders VerbCards for jobs, passive effects, and quest offers on top of the background map.
2. Re-apply today’s functionality (passive verb summaries, quest expiry countdown/removal, fatigue-safe continuous jobs) on top of that minimal base.
3. Validate the new pipeline with lint + spot tests, adhering to the frequent-commit rule.

## 2. Deliverables

- Updated `IdleVillageMapPage.tsx` (minimal layout + shared verb summaries).
- Updated selectors/helpers if needed (e.g., `verbSummaries.ts`).
- Plan doc update (this file) reflecting completion status.
- Lint/test log in PR description.

## 3. Implementation Phases

### Phase A — Minimal Map Shell

1. **State shape:** keep local `useState` for `VillageState` (no HUD store). Seed via `createVillageStateFromConfig` and minimal founder fallback logic.
2. **Layout:** only include: map background, droppable slot clusters, VerbCards (jobs + quest offers + passive effects), play/pause pill (optional). Remove resident cards, HUD badges, market modal, import/export controls, hunger FX, toast container.
3. **Drag/drop:** retain resident drag + slot/quest droppables; ensure IDs and handlers survive the refactor.
4. **Push checkpoint** (10-min rule) once the page compiles with the stripped layout.

### Phase B — Reapply Verb Logic

1. **Passive effects:** reintroduce `buildPassiveEffectSummary`, grouping results into `verbsBySlot`. Ensure slot resolution uses config (`slotId` or `slotTags`).
2. **Quest expiry:** on each `advanceTimeBy`, drop offers whose `expiresAtTime <= currentTime`. Verb summaries must show countdown labels via `buildQuestOfferSummary`.
3. **Safe auto-repeat:** when jobs complete, auto-reschedule only if the activity is continuous/auto-repeat AND every assignee is available with fatigue below `globalRules.maxFatigueBeforeExhausted`.
4. **Shared cadence:** derive `secondsPerTimeUnit` + `dayLengthInTimeUnits` from config for all timers.
5. **Push checkpoint** after logic is back + basic manual test (drag + tick).

### Phase C — Validation & Docs

1. Run `npm run lint` (and targeted tests if feasible).
2. Update this plan’s status section with outcomes.
3. Final push with summary of changes + note confirming the 10-minute rule adherence for future work.

## 4. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Forgetting frequent pushes | Set a timer/reminder; each phase explicitly ends with a push checkpoint. |
| Map page quietly regains HUD features | Enforce “no HUD” requirement during code review; keep layout section minimal. |
| Divergence from IdleVillagePage logic | Share helper functions (passive summaries, quest expiry logic) instead of duplicating inline code. |

## 5. Tracking

- **Phase A owner:** Idle Village pod (in progress)
- **Phase B owner:** Idle Village pod (pending)
- **Phase C owner:** Idle Village pod (pending)

> Reminder: Commit/push every 10 minutes or less while executing this plan.
