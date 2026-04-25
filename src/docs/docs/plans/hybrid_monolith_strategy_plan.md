# Hybrid Monolith Implementation Plan

This plan outlines how to implement the "Jekyll & Hyde" hybrid monolith so we can iterate rapidly in a lab space without destabilizing the public Idle Village experience.

## 1. Foundations & Alignment

- Reconfirm project guardrails (philosophy.md, MASTER_PLAN, Idle Village plans) to ensure the sandbox respects config-first, telemetry, and persistence expectations.
- Inventory shared modules (components, engine, features) and tag any legacy references that must stay out of both `game/` and `lab/` going forward.

## 2. Folder Structure Carve-out

- Create `src/game/` for stable surfaces (landing, MinimalGameplay, Map showcase) and `src/lab/` for prototypes (sandbox shell, experiments, draft components).
- Move existing stable pages into `src/game/` incrementally; mirror existing imports via index files to avoid breaking routes during the migration.
- Add `src/lab/components`, `src/lab/experiments`, and `src/lab/Sandbox.tsx` to host chaotic work; wire shared UI through `src/components` only after it is production-ready.

## 3. Router & Feature Flag

- In `App.tsx`, wrap lab routes (`/lab/*`) with a guard that checks `import.meta.env.VITE_ENABLE_LAB`.
- Define lab sub-routes (sandbox, combat-v2, tech-tree) under a `<LabLayout>` shell that is only bundled when the flag is true.
- Provide safe fallbacks (404/redirect) when the flag is false so production builds never expose lab URLs.

## 4. Build & Environment Configuration

- Add `.env.local` (dev) with `VITE_ENABLE_LAB=true` and `.env.production` with `false` so deployments hide the lab by default.
- Extend `vite.config.ts` to tree-shake lab bundles when the flag is off (e.g., conditional aliases or Rollup manualChunks) to keep showcase builds light.
- Introduce npm scripts: `dev:lab`, `dev:game`, `build:game`, `build:lab` to streamline workflows and CI steps.

## 5. Promotion Workflow

- Document the promotion path in coordinator docs: prototype inside `src/lab`, extract reusable logic to `src/engine` or `src/components`, then wire the stable feature inside `src/game` once it passes QA.
- Annotate lab modules with TODO tags or metadata so Kanban can track what’s ready for promotion.
- Ensure telemetry/persistence hooks added in the lab respect the same contracts before they graduate to the game.

## 6. Git & QA Strategy

- Keep working on `main` with feature flags; lab changes can land even if incomplete because they are hidden.
- For risky shared-engine edits, branch off (`feat/lab-experiment`) until the alternative API (e.g., `calculateDamageV2`) stabilizes, then merge and deprecate the old one.
- Update safeguard scripts so CI runs both `build:game` and `build:lab`, plus targeted tests (stable e2e vs sandbox smoke) to prevent regressions.

## 7. Documentation & Follow-up

- Record the architecture in `src/docs/docs/coordinator/hybrid_monolith_strategy.md` and link it from the MASTER_PLAN.
- Add a checklist to future PR templates (folder location, env guard, promotion status) to keep the pattern consistent.
- Once implemented, brief the coordinator via Kanban update and align the next tasks (e.g., Minimal Landing rewrite, Map refactor) with the new structure.
