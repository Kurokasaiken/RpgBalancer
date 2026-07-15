# Implementation Plan — Quest Engine Reconciliation (ADR-001)

**Status:** Draft (Strategist handoff to Coordinator)
**Date:** 2026-07-15
**Owning ADR:** ADR-001 — Quest Engine Reconciliation & Opportunity Foundation
**Scope:** `src/engine/**`, `src/balancing/config/idleVillage/**`, `src/ui/idleVillage/**`
**Related plans:**
- `src/docs/docs/plans/idle_village_plan.md` (Phase 12 master)
- `src/docs/docs/plans/idle_village_modifiers_plan.md` (Modifier registry — out of scope for demo)
- `src/docs/docs/plans/quest_chronicle_plan.md` (Phase C — theater CTA pending)
- `src/docs/docs/plans/quest_role_assignment_rework_strategy.md`
- `src/docs/docs/MASTER_PLAN.md`

---

## 0. Purpose

Execute the six decisions of ADR-001 (D1–D6) to leave the codebase with:

1. A single canonical resolution engine (`QuestPowerEngine` = E3).
2. A single canonical activity config (`defaultConfig.ts` ActivityDefinition = C2).
3. A single seeded RNG service (`RngService`) with `masterSeed` persisted.
4. Two clearly labeled non-canonical assets: `engine/quest/QuestEngine.ts` (E1) frozen, `engine/game/idleVillage/QuestEngine.ts` (E2) deprecated.
5. Modifier engine and Quest Chronicle theater/sandbox wiring explicitly deferred, not silently pending.

This plan is the runway. It does **not** introduce `OpportunityInstance` or the phased-interruptible model — those are Step 2 (post-reconciliation).

---

## 1. Guardrails (invariants that apply to every task in this plan)

Verified against `.windsurf/rules/00-project-invariants.md` and `coordinator/canonical-systems.md`:

- **Config-first:** every new value (variance categories, questPowerRules, masterSeed key, retreat cost) lives in a Zod-validated config module. No inline numbers in engines or components.
- **Persistence:** `masterSeed` and any migrated quest state go through `@/shared/persistence/PersistenceService`. Zero direct `localStorage`.
- **i18n:** every new user-facing string (retreat CTA copy, quest labels migrated from C1) goes through `useTranslation` with `common` / `idleVillage` namespaces.
- **Skin/Theme:** no new `.css` files. Any visual affordance introduced (retreat button, phase indicator) reuses `skinConfigRegistry` presets and primitives from `src/ui/idleVillage/skins/primitives/`.
- **Component Reuse:** before adding any UI, check `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`, and `src/ui/idleVillage/frozen/kits/registry.ts`.
- **State Management:** `masterSeed` and quest runtime state → Zustand (shared domain). Local UI state (modal open, phase focus) → Context.
- **Documentation Governance:** every trusted/frozen file touched requires update of the matching `*_trusted.md` plus `COMPONENT_MASTER_INDEX.md` and evidence log under `test-results/`.

---

## 2. Runtime & config inventory (verified 2026-07-15)

| Layer | Canonical | Non-canonical (to freeze/deprecate) |
|-------|-----------|-------------------------------------|
| Resolution engine | `src/engine/game/idleVillage/QuestPowerEngine.ts` (E3) | `src/engine/quest/QuestEngine.ts` (E1, frozen) · `src/engine/game/idleVillage/QuestEngine.ts` (E2, deprecated) |
| Quest/Activity config | `src/balancing/config/idleVillage/defaultConfig.ts` (C2) | `src/balancing/config/idleVillage/questConfig.ts` (C1, deprecated after C1→C2 migration) |
| RNG | (new) `src/engine/shared/RngService.ts` | LCG in E1 (kept internal), `Math.random()` in `JobResolver`, `QuestResolver`, `spawnQuestOffersIfNeeded` |
| Chronicle | `useQuestChronicle` view-model (partial) | Theater CTA + sandbox wiring → Step 2 |
| Modifier engine | `gameplayModifierRegistry` + `gameplayModifierEngine` (disconnected) | Stays disconnected for demo (D5) |

Confirmed consumers of C1 to migrate (D3):
- `src/pages/minimal-poi.tsx` (`bandit-camp-demo`)
- `src/ui/idleVillage/frozen/kits/questDetailKit.tsx` (`ancient-ruins`)
- `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx` (`ancient-ruins`)
- `src/ui/idleVillage/store/gameplayStore.ts` (`DEFAULT_QUEST_STATE`)
- `src/ui/idleVillage/pages/PoiDetailVerificationPage.tsx` (already reads C2 for `quest_dangerous_hunt`, verify parity)

---

## 3. Task decomposition

Each task carries: `execution_hint`, invariants touched, file targets, safeguard scope, evidence log. Execution order matters: tasks are gated by dependencies.

### T1 — Freeze E1 (branching QuestEngine)
- **ADR link:** D1
- **execution_hint:** `atomic`
- **file_targets:** `src/engine/quest/QuestEngine.ts`
- **operation:** prepend `@experimental FROZEN` JSDoc header (verbatim from ADR §D1), no logic change.
- **invariants:** documentation governance.
- **safeguards:** `npm run lint -- src/engine/quest` · `npm run build:check`.
- **evidence:** `test-results/adr001-t1-<date>.log`.
- **DoD:** header present, no import diff, `grep "new QuestEngine("` in `src/` yields only tests + docs.

### T2 — Extract `RngService`
- **ADR link:** D2
- **execution_hint:** `verified`
- **file_targets (new):**
  - `src/engine/shared/RngService.ts` (LCG + `createRng`, `deriveSeed`, `rollOutcome`)
  - `src/engine/shared/rngConfig.ts` (Zod schema for `WeightedDistribution` unifying `variance.rewardCategories` and E3 outcome distribution)
  - `tests/unit/engine/shared/RngService.test.ts` (determinism, `deriveSeed` stability, `rollOutcome` distribution invariants)
- **operation:** lift LCG class out of E1 into `RngService`; keep E1 importing from the new module. Public API strictly as specified in ADR §D2.
- **invariants:** config-first (Zod), component reuse (single PRNG for the repo).
- **safeguards:** `npm run lint -- src/engine/shared tests/unit/engine/shared` · `npm run test -- tests/unit/engine/shared` · `npm run build:check`.
- **evidence:** `test-results/adr001-t2-<date>.log`.
- **DoD:** tests green, E1 still compiles, no behavioral drift in `QuestEngine.test.ts`.

### T3 — Persist `masterSeed`
- **ADR link:** D2 (persistence half)
- **execution_hint:** `verified`
- **file_targets:**
  - `src/engine/game/idleVillage/store.ts` (or equivalent Zustand store — verify path in task) — add `masterSeed` field, initialize once at run creation.
  - `src/shared/persistence/persistenceKeys.ts` — add `idleVillage_master_seed_v1`.
  - `src/engine/game/idleVillage/TimeEngine.ts` — accept injected `rng` derived from `masterSeed` via `deriveSeed(masterSeed, 'timeEngine')`.
  - `tests/unit/idleVillage/masterSeed.test.ts` (persistence roundtrip, no regeneration on load).
- **invariants:** persistence (PersistenceService only), state management (Zustand for shared state).
- **safeguards:** lint + test + build:check on scope above.
- **evidence:** `test-results/adr001-t3-<date>.log`.
- **DoD:** save→load→save produces identical seed; telemetry event `master_seed_initialized` fires exactly once per run.

### T4 — Purge `Math.random()` inside idleVillage engines
- **ADR link:** D2 (migration half)
- **execution_hint:** `verified`
- **file_targets:**
  - `src/engine/game/idleVillage/JobResolver.ts`
  - `src/engine/game/idleVillage/QuestPowerEngine.ts` (audit — already accepts injected `rng`; verify no residuals)
  - `src/engine/game/idleVillage/QuestResolver.ts`
  - `src/engine/game/idleVillage/QuestEngine.ts` (E2, legacy — migrate anyway to unblock removal)
  - `src/engine/game/idleVillage/TimeEngine.ts` (`spawnQuestOffersIfNeeded`)
- **operation:** every `Math.random()` in scope becomes a call to an injected `Rng` derived from `masterSeed` via `deriveSeed`. IDs generated with `Math.random()` (e.g., scheduled activity IDs in `JobResolver`) become deterministic via a dedicated `deriveSeed(masterSeed, 'ids', counter)` stream.
- **invariants:** config-first, determinism (implicit).
- **safeguards:** lint + test + build:check on `src/engine/game/idleVillage`. Add regression test: `grep "Math.random" src/engine/game/idleVillage` returns 0 matches.
- **evidence:** `test-results/adr001-t4-<date>.log` including the grep output.
- **DoD:** grep clean, no test regression in `tests/unit/idleVillage/**`.

### T5 — Migrate C1 quests to C2 (`ActivityDefinition`)
- **ADR link:** D3
- **execution_hint:** `architectural` (touches trusted kits)
- **file_targets:**
  - `src/balancing/config/idleVillage/defaultConfig.ts` — add `bandit-camp-demo`, `ancient-ruins`, `herb-gathering` as `ActivityDefinition` with `tag: 'quest'`, `slotBlueprints`, `resolutionEngineId: 'questPower'`, `questPowerRules`, `varianceCategory`.
  - `src/pages/minimal-poi.tsx` — read from C2.
  - `src/ui/idleVillage/frozen/kits/questDetailKit.tsx` — read from C2 (trusted).
  - `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx` — read from C2 (trusted).
  - `src/ui/idleVillage/store/gameplayStore.ts` — replace `DEFAULT_QUEST_STATE` C1 source with C2 equivalent.
- **operation:** lossy translation as specified in ADR §D3 — per-skill checks collapse into a single `questDifficulty` scalar. Document the mapping table (skill_check → difficulty component) in the plan changelog.
- **invariants:** config-first, i18n (labels must go through `t()`), documentation governance.
- **trusted doc updates required:**
  - `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`
  - `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` rows for `questDetailKit`, `locationDetailKit` (source path + last-certified date).
- **safeguards:** lint + test + build:check on `src/balancing/config/idleVillage`, `src/pages/minimal-poi.tsx`, `src/ui/idleVillage/frozen/kits`. RTL smoke test on `/minimal-gameplay` (parity screenshot).
- **evidence:** `test-results/adr001-t5-<date>.log` + before/after screenshots under `test-results/adr001-t5-parity/`.
- **DoD:** `/minimal-gameplay` behaves identically to pre-migration (verified via existing Playwright suites `tests/active-hud-regression.spec.ts` and `tests/activity-cards-parity.spec.ts`).

### T6 — Deprecate C1 (`questConfig.ts`) and E2
- **ADR link:** D1 + D3
- **execution_hint:** `atomic` (after T5 lands)
- **file_targets:**
  - `src/balancing/config/idleVillage/questConfig.ts` — `@deprecated` JSDoc + ADR-001 reference at file head. Keep exports (types still consumed by `QuestChainProgressTracker`, telemetry) until physical removal task (out of scope for this plan — tracked separately).
  - `src/engine/game/idleVillage/QuestEngine.ts` — `@deprecated` JSDoc + ADR-001 reference.
- **operation:** documentation only. No runtime changes.
- **safeguards:** lint + build:check.
- **evidence:** `test-results/adr001-t6-<date>.log`.
- **DoD:** JSDoc present, no new imports of C1 introduced after this task (enforced via lint rule/task in follow-up).

### T7 — Complete quality-roll via existing `variance.rewardCategories`
- **ADR link:** D4
- **execution_hint:** `verified`
- **file_targets:**
  - `src/engine/game/idleVillage/QuestResolver.ts` (lines ~77–86 — replace "always first category" stub).
  - `src/balancing/config/idleVillage/types.ts` — ensure `QualityResult { tier, multiplier }` type exists (extend if missing, do not duplicate).
  - `tests/unit/idleVillage/QuestResolver.test.ts` — cover roll distribution across categories with seeded RNG.
- **operation:** read `varianceCategory` from `ActivityDefinition`, roll via `RngService.rollOutcome`. No new Zod schema.
- **invariants:** config-first, determinism.
- **safeguards:** lint + test + build:check on scope.
- **evidence:** `test-results/adr001-t7-<date>.log`.
- **DoD:** deterministic outcome given same seed; distribution matches config weights within tolerance in test.

### T8 — Documentation & governance closure
- **ADR link:** All decisions
- **execution_hint:** `verified`
- **file_targets:**
  - `src/docs/docs/adr/ADR-001-quest-engine-reconciliation.md` — canonical ADR file (this is where user's chat draft lands).
  - `src/docs/docs/plans/quest_engine_reconciliation_plan.md` — this file, updated with per-task changelog entries.
  - `src/docs/docs/plans/idle_village_plan.md` — cross-link to ADR-001 in Quest/Job System section.
  - `src/docs/docs/plans/quest_chronicle_plan.md` — mark Phase C theater CTA + sandbox wiring as Step 2 (post-reconciliation), reference ADR §D6.
  - `src/docs/docs/plans/idle_village_modifiers_plan.md` — mark GM-ENG wiring as post-demo (D5), reference ADR-001.
  - `src/docs/docs/MASTER_PLAN.md` — add ADR-001 entry to governance section.
  - `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` — updated rows for touched frozen kits.
- **safeguards:** `npm run kanban:lint` · markdown lint if configured.
- **evidence:** `test-results/adr001-t8-<date>.log`.
- **DoD:** all links resolve, `COMPONENT_MASTER_INDEX.md` last-certified dates updated for touched rows, master plan references the ADR.

---

## 4. Dependency graph

```
T1 (freeze E1) ──┐
                 ├─▶ T8 (docs)
T2 (RngService) ─┼─▶ T3 (masterSeed) ─▶ T4 (Math.random purge) ─▶ T7 (quality roll)
                 │                                              │
                 └─▶ T5 (C1→C2 migration) ─▶ T6 (deprecate C1/E2) ┘
```

- T1 is independent, ship first (lowest risk, unblocks governance narrative).
- T2 gates T3, T4, T7.
- T5 gates T6.
- T8 runs last, consolidates all documentation deltas into one commit.

---

## 5. Explicit non-goals (guarded from scope creep)

The following are **out of scope** for this plan. Any prompt that pulls them in must be rejected and re-scoped:

- Introduction of `OpportunityInstance`, phased-interruptible resolution, retreat cost, auto-continue policy. → **Step 2**, separate plan.
- Wiring of `gameplayModifierEngine` to `QuestPowerEngine` / `TimeEngine`. → **Post-demo** (ADR §D5).
- Theater CTA + sandbox wiring for `useQuestChronicle`. → **Step 2** (ADR §D6).
- Physical removal of `questConfig.ts` and E2 files. → **Follow-up task** after this plan closes (add ticket at T8).
- Location System, World Tension/Minaccia, World Memory. → **Post-Step 2**.
- Branching narrative activation (E1 as runtime engine). → **Frozen until explicit post-demo decision**.

---

## 6. Definition of Done for the entire plan

Mirrors ADR-001 DoD, extended with governance:

1. ✅ E1 header `@experimental FROZEN` (T1).
2. ✅ `RngService.ts` exists with tests, `WeightedDistribution` Zod schema (T2).
3. ✅ `masterSeed` persisted via `PersistenceService`, never regenerated on load (T3).
4. ✅ `grep "Math.random" src/engine/game/idleVillage` returns 0 (T4).
5. ✅ All C1 quests migrated to C2 `ActivityDefinition`; `/minimal-gameplay` parity verified via Playwright (T5).
6. ✅ `questConfig.ts` and E2 marked `@deprecated` with ADR-001 reference (T6).
7. ✅ `QuestResolver` quality-roll reads `varianceCategory`, deterministic per seed (T7).
8. ✅ All trusted docs and `COMPONENT_MASTER_INDEX.md` updated with last-certified date (T5, T8).
9. ✅ ADR-001 exists as `src/docs/docs/adr/ADR-001-...md` (T8).
10. ✅ `npm run lint && npm run test && npm run build:check && npm run kanban:lint` all green on final commit.

---

## 7. Handoff to Coordinator

The coordinator receives this plan and generates 8 Kanban rows (T1–T8) under a new epic **ADR-001 / Quest Engine Reconciliation** in `src/docs/docs/coordinator/agent_assignments.md`. Each row must reproduce:

- Task ID (`ADR001-T1` … `ADR001-T8`).
- File targets and operations verbatim from §3.
- `execution_hint` verbatim.
- Safeguard scope + timeout budget (per invariant defaults: lint ≤120s, test ≤300s, build:check ≤180s, kanban:lint ≤30s).
- Evidence log path.
- Trusted doc impacts (T5 in particular).
- Explicit "do not pull scope from §5" clause.

Dependencies (§4) are encoded as `blocked_by` fields.

Strategist flags for Coordinator awareness:

- **T5 is the only architectural task.** Lossy C1→C2 translation demands human review of the skill-check→difficulty mapping table before merge.
- **T4 touches every idleVillage engine.** The `grep "Math.random"` regression check must be added to CI as a permanent gate, not just a one-off (candidate for `.windsurf/rules/` invariant update — flag to Coordinator for auto-registration decision).
- **No new invariants introduced by this plan.** RngService is a new cross-cutting utility but does not warrant an invariant until a second seeded system consumes it. Revisit at end of Step 2.

---

## 8. Changelog

- **2026-07-15:** Initial draft by Strategist. Awaiting Coordinator dispatch.
