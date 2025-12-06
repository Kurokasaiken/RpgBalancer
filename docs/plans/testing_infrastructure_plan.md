# Testing Infrastructure & Global Suite Plan

**Date:** 2025-12-06  
**Status:** Draft – Implementation In Progress  
**Related Phases:**
- Phase 2 – Archetype Balancing (Combat simulation tests)
- Phase 10 – Config-Driven Balancer (BalancerNew, config solver)
- Phase 10.5 – Stat Stress Testing & Auto Stat Balancer

---

## 🎯 OBJECTIVE

Design and maintain a **unified testing infrastructure** that validates the RPG Balancer system end-to-end:

1. **Config & Domain Integrity** – BalancerConfig, formulas, stat weights, simulation engines.  
2. **UI/UX Surfaces** – BalancerNew, Stat Stress Testing tools, core Gilded Observatory pages.  
3. **E2E Behavior** – Real browser flows with config-driven logic (locks, derived stats, fight metrics, stress tests).  
4. **Single Entry Point** – A small set of npm scripts (`test:all`, `test:all:quick`, etc.) that run the full suite.

The system must be **config-first**: tests read from `src/balancing/config/*` and shared types, never hardcoding stats, weights, or formulas locally.

---

## 🧱 LAYERS & SCOPE

### Layer 0 – Static Analysis & Lint

- **Tools:** TypeScript, ESLint.  
- **Goal:** Ensure the project always compiles and respects lint rules before any runtime tests.
- **Scope:** Entire repo.

### Layer 1 – Config & Schema Healthcheck (Vitest)

- **Goal:** Guarantee that **BalancerConfig** and related config objects are internally consistent and compatible with domain models.
- **Examples:**
  - All stat IDs used in formulas and cards exist in `BalancerConfig.stats`.
  - No `isDerived` stat is missing a formula (unless explicitly marked).
  - All formula references are valid and acyclic at the config level.
  - Mapping between `BalancerConfig.stats` and `StatBlock` / `DEFAULT_STATS` is valid.

This layer acts as a **safety net** whenever config or schema changes.

### Layer 2 – Domain & Simulation Tests (Vitest)

- **Goal:** Validate the core balancing logic in isolation from the UI.
- **Scope:**
  - Config-driven **ConfigSolver** (multi-lock behavior, derived/base interactions, error handling, cascade logic).
  - 1v1 **mathEngine** and deterministic simulator (`simulateExpectedTTK`, EDPT, EHP, etc.).
  - Monte Carlo simulation tools and Round Robin engines (where applicable).

Tests at this layer must:
- Reuse formulas and weights from `balancing/config` and existing domain modules.  
- Avoid duplicating combat formulas or stat semantics in test code.

### Layer 3 – React UI / Component Tests (Vitest + jsdom)

- **Goal:** Ensure the main UI surfaces correctly integrate with config and domain logic.
- **Targets:**
  - `BalancerNew` (config-driven solver integration, lock and derived stat behavior, equal-fight metrics bar).
  - `StatStressTestingPage` and related components (Round Robin configuration, mode selection, history display via `StatBalanceHistoryStore`).

These tests verify **wiring and component behavior** without requiring a real browser.

### Layer 4 – E2E Browser Tests (Playwright)

- **Goal:** Validate real user flows in a real browser, including:
  - Page navigation & app startup.
  - Interactive behavior for BalancerNew (locks, derived stats, 1v1 metrics).
  - Stat Stress Testing flows (fast/full modes, visible results, history updates).

- **Tooling:** Playwright test project configured with a dev-server webServer (Vite) and dedicated E2E spec files.

E2E tests must favor **few, high-value scenarios** that mirror real design goals and are stable across refactors.

---

## 📦 DELIVERABLES

This plan produces:

1. **Global Test Scripts (NPM):**
   - `test:lint` – Lint-only run.  
   - `test:unit` – Vitest unit/integration suite.  
   - `test:all` – Full orchestrated run (lint + unit + E2E).  
   - `test:all:quick` – Fast smoke run (lint + core unit tests, no heavy simulations/E2E).

2. **Config Healthcheck Suite:**
   - Dedicated tests under `src/balancing/config/__tests__/` that validate BalancerConfig, formulas, and cards.

3. **Domain & Solver Tests:**
   - Extended tests around ConfigSolver, math engine, and simulators, ensuring correct behavior for:
     - Derived stat editing and inversion.
     - Base stat edits with derived locks.
     - Error cases (conflicting locks, min/max constraints).

4. **UI Component Tests:**
   - Tests for BalancerNew and StatStressTesting UI, verifying rendering, props wiring, simple interactions.

5. **Playwright E2E Specs:**
   - Minimal but expressive suite that covers:
     - BalancerNew derived stat & lock scenarios.
     - StatStressTestingPage stress-test run and history.
     - App startup & tab navigation smoke test.

6. **Documentation & Governance Links:**
   - This plan and its task file referenced from `MASTER_PLAN.md` under a dedicated Testing & QA section.

---

## 🧭 PHASES & PRIORITIES

### Phase T1 – NPM Scripts & Baseline Wiring

- Introduce `test:lint`, `test:unit`, `test:all`, `test:all:quick` scripts.  
- Align CI (if any) and local workflows around these entry points.  
- Ensure `test:all` can be safely run before releases or major changes.

### Phase T2 – Config & Schema Healthcheck

- Implement BalancerConfig health tests (stats, formulas, cards, StatBlock mapping).  
- Ensure changes in BalancerConfig or schema must pass this layer before merging.

### Phase T3 – Domain & Solver Coverage

- Cover ConfigSolver behavior and critical combat math modules with deterministic tests.  
- Align scenarios with documented balancing goals (e.g. htk behaviors, lock semantics, EDPT/TTK expectations).

### Phase T4 – UI/Component Coverage

- Write focused tests for BalancerNew and StatStressTesting UI.  
- Ensure config-driven approach: components must read from hooks/config modules rather than hardcoded values.

### Phase T5 – Playwright E2E Flows

- Create high-value E2E specs for:
  - BalancerNew core flows (locks, derived stats, equal-fight metrics bar).  
  - StatStressTesting quick runs and history.  
  - App startup/navigation smoke.

### Phase T6 – Documentation & Master Plan Integration

- Add Testing & QA Infrastructure section to `MASTER_PLAN.md`.  
- Ensure `testing_infrastructure_tasks.md` links back here and is used as the execution checklist.

---

## 🔗 RELATION TO OTHER PLANS

- **`plans/combat_simulation_plan.md` / `combat_simulation_tasks.md`**  
  Testing for Monte Carlo simulation is **in-scope** for this plan only as an integration target; its internal design remains owned by the combat simulation plan.

- **`plans/stat_stress_testing_plan.md` / `stat_stress_testing_tasks.md`**  
  This plan ensures the Stat Stress Testing UI and engines have proper automated coverage but does not redefine their balancing methodology.

- **`plans/config_driven_balancer_plan.md` / `config_driven_balancer_tasks.md`**  
  This plan provides the testing infrastructure to guard Config-Driven Balancer changes (especially BalancerNew and ConfigSolver). It does not own the feature design itself.

---

## 📑 TASK CHECKLIST REFERENCE

The concrete execution checklist for this plan lives in:

- `plans/testing_infrastructure_tasks.md`

That file contains all actionable tasks as Markdown checkboxes (`- [ ]`) and is the **single source of truth** for implementation progress.
