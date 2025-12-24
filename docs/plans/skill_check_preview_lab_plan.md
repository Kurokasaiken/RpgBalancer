# Skill Check Preview Lab Refactor – Implementation Plan

**Status:** Draft (2025-12-24)  
**Related Tasks:** [plans/skill_check_preview_lab_tasks.md](skill_check_preview_lab_tasks.md)

---

## 1. Context & Objectives

The Skill Check Preview Lab currently exposes two visual modes (“Dispatch Polygon” and “Alt Visuals”) and relies on legacy controls (Shot Power, Spin Bias, “Lancia pallina”). Designers have confirmed that the the V6 Alt Visual is the canonical visualization and must replace the SVG dispatch polygon while keeping the existing stats and injury/death logic. Additional UX updates are required:

- Remove the “Alt Visuals” tab entirely and consolidate on a single “Dispatch Polygon” entry that actually renders the V6 canvas.
- Replace legacy controls with the V6 actions (“Riavvia scena”, “Ritira dado”, optional “Stella Perfetta” toggle).
- Display stat icons sourced from the balancer config according to the requested 5-point cardinal distribution logic.

This plan outlines how to refactor `SkillCheckPreviewPage.tsx` and supporting modules without violating config-first rules or duplicating domain definitions.

---

## 2. Goals & Non-Goals

### Goals

1. **View Mode Simplification** – Remove `alt-v6-plus`/`alt-v8` pathways and make AltVisuals V6 the primary renderer for the Dispatch Polygon tab.
2. **Control Replacement** – Surface V6 controls in the Lab so “Shot Power / Spin Bias / Lancia pallina” are retired.
3. **Stat Cardinality Visuals** – Implement deterministic assignment of stat icons to the 5 axis points using balancer metadata (no hardcoding).
4. **Config-First Compliance** – Ensure all stat definitions, icon IDs, and weights still come from `useBalancerConfig` + shared utilities.
5. **Documentation & Task Tracking** – Provide actionable tasks and documentation updates (this plan + linked task list).

### Non-Goals

- Rewriting AltVisuals V6 canvas internals (only consume existing API).
- Changing balancing formulas, stat weights, or simulation math.
- Introducing new stats/config schema changes beyond icon metadata already available.
- Building new UI modes beyond the mandated V6 integration.

---

## 3. Constraints & Dependencies

- **Weight-Based Creator / Config-First**: All stat data must flow from `useBalancerConfig`, `statIconUtils`, and `altVisualsAxis` helpers. No inline lists of stats or icons.
- **JSDoc Coverage**: Any new functions or helpers introduced must include JSDoc per repo rules.
- **Existing Storage Keys**: `VIEW_MODE_STORAGE_KEY` / `ALT_VIEW_MODE_STORAGE_KEY` cleanup must avoid breaking localStorage consumers (migrate or guard).
- **Gilded Observatory Theme**: All UI swaps must retain observatory tokens/components.
- **Testing**: Updates should be covered in existing UI/unit regression suites (at minimum ensure `tests/ui.spec.ts` expectations stay valid, add targeted tests if logic changes).

---

## 4. Architecture & Component Touchpoints

| Area | Impact |
| --- | --- |
| `src/ui/testing/SkillCheckPreviewPage.tsx` | Main UI refactor: remove Alt visuals tab, embed `AltVisualsV6Asterism`, replace controls, add stat icon distribution logic. |
| `src/ui/testing/AltVisualsV6Asterism.tsx` | Already supports optional controls; only reuse API, possibly pass axis meta array generated from new logic. |
| `src/ui/testing/altVisualsAxis.ts` | Source for deriving axis metadata; may require helper to map balancer stats to axis meta array. |
| `src/ui/shared/statIconUtils.ts` | Provides icon components/glyphs; reuse for new cardinal overlay. |
| Tests (`tests/ui.spec.ts`, potential new unit file) | Update snapshots/assertions to reflect single-view mode and new controls. |
| Docs | This plan + master plan entry + task list update. |

---

## 5. Implementation Phases

### Phase 1 – View Mode Consolidation & Storage Cleanup

1. Remove `alt-v6-plus` option and associated state branching in `SkillCheckPreviewPage.tsx`.
2. Ensure localStorage reads gracefully fallback (e.g., clear obsolete stored values).
3. Retain future flexibility by keeping enum scaffolding minimal (type unions or constants).

### Phase 2 – V6 Embedding & Controls

1. Replace the SVG dispatch polygon block with `<AltVisualsV6Asterism>` while keeping surrounding layout.
2. Surface V6 control buttons (“Riavvia scena”, “Ritira dado”) directly in the “Dispatch Polygon” column; wire handlers to component refs or state.
3. Remove legacy physics sliders and “Lancia pallina” button; confirm there are no dangling references to `shotPower` / `spinBias` / `handleThrow`.
4. Decide whether the “Stella Perfetta (Test Mode)” toggle is shown (requirement currently says “no stella perfetta” → set `enablePerfectStarToggle={false}`).

### Phase 3 – Stat Cardinality & Icon Overlay

1. Derive active stats from config and determine how many unique stats are selected.
2. Apply distribution logic across the 5 axis points:
   - 1 stat → all 5 points same stat
   - 2 stats → first stat gets 3 positions, second gets 2
   - 3 stats → distribution 2 / 2 / 1 (order by selection priority)
   - 4 stats → 2 / 1 / 1 / 1 (first stat doubled)
   - 5+ stats → first five unique stats (one each)
3. Retrieve icon metadata via `getStatIconComponent` / `deriveAxisMeta` using balancer definitions; avoid manual emoji.
4. Pass computed `axisMeta` array to `AltVisualsV6Asterism` so the canvas renders correct icons.
5. Consider memoized helper or service (with JSDoc) to keep React component lean.

### Phase 4 – Validation & Polish

1. Run UI/unit tests (at least `npm run test -- tests/ui.spec.ts`) and adjust expectations for new controls.
2. Smoke-test AltVisuals V6 within the Lab to ensure controls operate (restart/reroll) and stat icons update when toggling stats.
3. Update documentation (`MASTER_PLAN.md`, plan/tasks) and ensure changelog/TODOs reflect completion.

---

## 6. Deliverables

- Updated `SkillCheckPreviewPage.tsx` using V6 visuals and new controls.
- Helper/utilities (if needed) with full JSDoc for stat cardinality distribution.
- Updated tests verifying UI regressions.
- Documentation updates: plan + tasks (this doc), master plan reference, TODO tracking.

---

## 7. Rollout & Verification Checklist

- [ ] Manual verification inside Skill Check Preview Lab (default config).
- [ ] Regression tests green.
- [ ] No lint/type errors.
- [ ] Designers confirm icons + controls match V6 spec.

---

### References

- [AltVisuals V6 Component](../../src/ui/testing/AltVisualsV6Asterism.tsx)
- [Stat Icon Utilities](../../src/ui/shared/statIconUtils.ts)
- [Tasks Tracker](skill_check_preview_lab_tasks.md)
