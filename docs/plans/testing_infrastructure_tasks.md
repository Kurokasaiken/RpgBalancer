# Testing Infrastructure - Task Checklist

**Reference Plan:** [testing_infrastructure_plan.md](testing_infrastructure_plan.md)

---

## PHASE T1: NPM Scripts & Baseline Wiring

- [ ] Add `test:lint` script in `package.json` (delegate to existing `lint` script).
- [ ] Add `test:unit` script in `package.json` (non-watch Vitest run).
- [ ] Add `test:all` script in `package.json` (lint + unit + E2E orchestration).
- [ ] Add `test:all:quick` script in `package.json` (lint + unit only, no E2E).
- [ ] Document the new scripts in `README.md` or a dedicated Testing section.

---

## PHASE T2: Config & Schema Healthcheck

- [ ] Create `src/balancing/config/__tests__/BalancerConfigHealth.test.ts`.
- [ ] Add test: all stat IDs used in formulas exist in `BalancerConfig.stats`.
- [ ] Add test: all stat IDs used by cards exist in `BalancerConfig.stats`.
- [ ] Add test: `isDerived` stats have valid formulas (unless explicitly exempted).
- [ ] Add test: BalancerConfig formulas reference only known stats, no obvious self-cycles.
- [ ] Add test: mapping between `BalancerConfig.stats` and `StatBlock` / `DEFAULT_STATS` is valid (no missing required fields).

---

## PHASE T3: Domain & Solver Coverage

- [ ] Create/extend tests for `ConfigSolver` (config-driven solver) behavior.
- [ ] Add test: editing a base stat updates dependent derived stats when unlocked.
- [ ] Add test: editing a derived stat adjusts a non-locked input stat (first available input).
- [ ] Add test: editing a derived stat with all inputs locked fails with an error.
- [ ] Add test: ConfigSolver respects min/max constraints from BalancerConfig.
- [ ] Add test: cascade changes are reported (even if only as a list of affected stat IDs).
- [ ] Extend existing 1v1 math engine tests to ensure EDPT/TTK/EHP are deterministic.
- [ ] Ensure tests reuse values and formulas from Balancer config modules (no magic numbers where avoidable).

---

## PHASE T4: UI / Component Coverage

- [ ] Add tests for `BalancerNew` component (jsdom + Vitest).
- [ ] Test: BalancerNew renders with default config and shows equal-fight metrics bar without crashing.
- [ ] Test: changing a base stat via UI control triggers a call to the config-driven solver.
- [ ] Test: derived stat fields are editable when unlocked and read-only when locked.
- [ ] Add tests for `StatStressTestingPage` and related components.
- [ ] Test: switching between `fast` and `full` iteration modes changes the iterations configuration passed to the runner.
- [ ] Test: when `StatBalanceHistoryStore` has runs/sessions, the "Balance History" section renders recent items.

---

## PHASE T5: Playwright E2E Flows

- [ ] Create `tests/e2e/balancer-new.spec.ts` (or equivalent path) for BalancerNew flows.
- [ ] E2E: open BalancerNew tab, verify core stats and equal-fight metrics render.
- [ ] E2E: Scenario 1 – change base stat (e.g. hp) and verify dependent derived stat (e.g. htk) updates according to formula.
- [ ] E2E: Scenario 2 – lock one input, edit derived stat, verify other input adjusts.
- [ ] E2E: Scenario 3 – lock all inputs, attempt to edit derived stat, verify no change and error feedback.
- [ ] Create `tests/e2e/stat-stress-testing.spec.ts` for Stat Stress Testing UI.
- [ ] E2E: open Stat Stress Testing page, run `fast` mode, verify results table/summary appears.
- [ ] E2E: verify Balance History updates after at least one auto-balance session.
- [ ] Create `tests/e2e/app-smoke.spec.ts` for app startup and tab navigation.
- [ ] E2E: verify app loads without critical console errors and main tabs are navigable.

---

## PHASE T6: Documentation & Master Plan Integration

- [ ] Add a "Testing & QA Infrastructure" section to `docs/MASTER_PLAN.md` linking to this plan and tasks file.
- [ ] Ensure this plan is referenced by other relevant plans (e.g. config-driven balancer, stat stress testing) where appropriate.
- [ ] Add a short "How to run all tests" subsection to `README.md` with example commands (`npm run test:all`, `npm run test:all:quick`).
- [ ] Periodically review this checklist and close completed items.
