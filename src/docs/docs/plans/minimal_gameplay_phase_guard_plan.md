# Minimal Gameplay Phase Guard Plan

## Overview
- Scope: orchestrate Minimal Gameplay vertical slice using NP-MIN-STRAT prompts.
- Source of truth: `docs/strategies/MINIMAL_GAMEPLAY_STRATEGY.md`.
- Philosophy: logic-first, config-first, persistence via `PersistenceService`, UI/E2E only after freeze.

## Deliverables
1. Six prompts (NP-MIN-STRAT-001…006) with Phase Guard, SAFE, OPS, EVID.
2. `scripts/minimalGameplay/phaseGuard.ts` + npm script + CI hook.
3. Dedicated npm scripts (`minimal:logic`, `minimal:wireframe-smoke`, `minimal:ui-regression`, `minimal:dnd-check`, `minimal:playtest-log`, `minimal:e2e`).
4. Kanban updates with freeze/evidence columns.

## Task Breakdown
| Prompt | Focus | Agent | Dependencies | SAFE Commands | OPS Commands | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NP-MIN-STRAT-001 | Logic Core | Logic-Architect | – | `npm run minimal:phase-guard && npm run lint -- src/balancing src/engines && npm run minimal:logic && npm run build:check && npm run kanban:lint` | `npm run minimal:logic` | `test-results/np-min-strat-001-<date>.log` |
| NP-MIN-STRAT-002 | State & Wireframe | Wireframe-Smith | 001 | `npm run minimal:phase-guard && npm run lint -- src/store src/ui/idleVillage && npm run minimal:wireframe-smoke && npm run build:check && npm run kanban:lint` | `npm run minimal:wireframe-smoke` | `test-results/np-min-strat-002-<date>.log` |
| NP-MIN-STRAT-003 | UI Integration | UI-Integrator | 002 | `npm run minimal:phase-guard && npm run lint -- src/ui/idleVillage && npm run minimal:dnd-check && npm run build:check && npm run kanban:lint` | `npm run minimal:dnd-check && npm run minimal:ui-regression` (if `MINIMAL_WIREFRAME=false`) | `test-results/np-min-strat-003-<date>.log` |
| NP-MIN-STRAT-004 | Visual Feedback | Feedback-Artisan | 003 | same SAFE as 003 | same OPS | `test-results/np-min-strat-004-<date>.log` |
| NP-MIN-STRAT-005 | Final Polish | Polish-Maestro | 004 | `npm run minimal:phase-guard && npm run lint -- src/ui/idleVillage && npm run minimal:playtest-log && npm run build:check && npm run kanban:lint` | `npm run minimal:playtest-log` | `test-results/np-min-strat-005-<date>.log` |
| NP-MIN-STRAT-006 | E2E Safeguard | E2E-Warden | 005 + freeze | `npm run minimal:phase-guard && npm run lint -- tests/e2e && npm run minimal:e2e && npm run build:check && npm run kanban:lint` | `npm run minimal:e2e` | `test-results/np-min-strat-006-<date>.log` |

## Phase Guard Script
- Reads `agent_assignments.md` to ensure prerequisite prompts are "Completato" with evidence path.
- Validates evidence files exist.
- For TASK-006 also ensure `.phase-freeze.json` indicates `MINIMAL_UI_FROZEN=true` and timestamp ≥48h.
- Generates `test-results/np-min-phase-guard-<ts>.log` and exits non-zero when violations occur.

## Automation Hooks
1. `npm run minimal:logic` → Vitest for `minimalGameRules` + `minimalConfig`.
2. `npm run minimal:wireframe-smoke` → store + PersistenceService smoke tests.
3. `npm run minimal:dnd-check` → drag & drop sensor/unit smoke.
4. `npm run minimal:ui-regression` → Storyshots/visual snapshots (gated by `MINIMAL_WIREFRAME` env).
5. `npm run minimal:playtest-log` → Playwright headless manual-session logger.
6. `npm run minimal:e2e` → Full Playwright suite.

## CI Integration
- Add workflow `minimal_slice.yml` executing: phase guard → logic tests → wireframe smoke → conditional UI regression → artifact upload of logs.
- Guardian deploy job depends on `minimal_slice` success.

## Kanban Instructions
- Add rows for NP-MIN-STRAT-001…006 with columns: `FreezeFlag`, `Evidence`, `PhaseGuardNotes`.
- Agents must update state + notes with evidence log path per completion.
- `npm run kanban:lint` checks presence of evidence + correct statuses.

## Runbook Notes
1. Before starting any task, run `npm run minimal:phase-guard -- --task <id>`.
2. If blocked, inspect latest log in `test-results/np-min-phase-guard-*.log` and update dependencies/evidence accordingly.
3. Keep `.phase-freeze.json` updated when UI freeze is toggled; log timestamp in Kanban notes.
