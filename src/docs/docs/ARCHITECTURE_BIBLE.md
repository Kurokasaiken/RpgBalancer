---
title: RPG Balancer Architecture Bible
status: active
owner: Cascade
last_reviewed: 2026-02-11
domain: core
description: "Single hub for philosophy, engineering mandates, UI canon, and documentation workflow"
---

# RPG Balancer — Architecture & Strategy Bible

> TL;DR: everything in this repo must obey the weight-based creator pattern, config-first rules, async persistence, and the Gilded Observatory visual canon. This document is the entry point; it links to all living specs and encodes the documentation lifecycle so we never lose track again.

## 1. Mission Control

| Need | Start Here | Why |
| --- | --- | --- |
| Vision & north star | [`MASTER_PLAN.md`](./MASTER_PLAN.md) | Long-term architecture & roadmap |
| Current implementation status | `IMPLEMENTED_PLAN.md` | Avoid duplicating finished work |
| Core philosophy & design system | [`PROJECT_PHILOSOPHY.md`](./PROJECT_PHILOSOPHY.md) | Weight-based creator + Gilded Observatory |
| Day-to-day rules | [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md) | Concrete guardrails for coding |
| Prompt/Kanban workflow | [`coordinator/agent_assignments.md`](./coordinator/agent_assignments.md) | Task state, evidence, dependencies |

All other docs should explicitly point back to this bible so newcomers land here first.

## 2. Engineering Mandates

1. **Weight-Based Creator Pattern** (see `PROJECT_PHILOSOPHY.md`)
   - Every entity (spell, item, resident, stat, archetype) is a collection of `{value, weight}` ticks.
   - No “secret formulas” inside components — logic lives in config or reusable modules under `src/balancing/**`.

2. **Config-First / JSON-Driven**
   - Stats, cards, formulas, layouts must come from config (`src/balancing/config/**`, `src/ui/**/config/**`).
   - Zod schemas validate everything. No raw JSON without schema enforcement.

3. **Async Persistence Only**
   - All storage flows through `PersistenceService` (`src/shared/persistence/PersistenceService.ts`).
   - Direct `localStorage`/`sessionStorage` access is banned (see persistent reminder in memory bank).

4. **Telemetry + Guardian Ready**
   - Every surface emitting gameplay data must use `trackTelemetryEvent` and respect Guardian mandates (health-check, build:deploy, log updates to `test-results/guardian-deployment-log.json`).

5. **JSDoc Coverage**
   - New functions/interfaces require JSDoc (rule enforced since 2026-02-11). Missing docs are lint failures.

## 3. UI / UX Canon

- **Theme**: Gilded Observatory (deep obsidian backgrounds, ivory text, gilded accents). Spell Creator “Arcane Tech Glass” components are the reusable design system for data-dense cards.
- **Components**: `TechGlassCard`, `StatSlider`, `DropFeedbackUI`, `ActivitySlotCard`, `LocationCard`, `WorkerCard` must be imported instead of bespoke markup.
- **Accessibility**: Refer to `accessibility/idle_village_drag_accessibility.md` and note the outstanding TODOs (colorblind palette toggle, font scaling, rebindable controls, audio cues, pause-friendly timers). Future prompts tackling UX must close these gaps.
- **Motion & Feedback**: Prefer subtle animations; always respect `prefers-reduced-motion`. Audio cues must be opt-in and routed through config.

## 4. Coordination & Guardian Rules (Quick Reference)

1. **Coordinator Mandate (2026-01-07)**
   - Every prompt must go through strategist → coordinator → agent flow.
   - `prompt:check`, dependency audits, Kanban row updates are mandatory; Kanban lint will fail otherwise.

2. **Guardian Mandate**
   - Before deploy: `npm run guardian:health-check` + `npm run build:deploy` + `npm run guardian:deploy-guard`.
   - Log results in `test-results/guardian-deployment-log.json`.

3. **Evidence Discipline**
   - Each prompt finishes with `test-results/<prompt-id>-<date>.log` including lint/test/build outputs and any `rg` evidence.

## 5. Documentation Taxonomy & Metadata

Every living doc must start with YAML frontmatter:

```yaml
---
title: Friendly Name
status: active | draft | archived
owner: TeamOrPerson
last_reviewed: YYYY-MM-DD
domain: idle_village | balancer | guardian | etc.
description: "Optional short blurb"
---
```

### Folder Roles

| Folder | Purpose |
| --- | --- |
| `src/docs/docs/` | Active, authoritative docs (keep tidy). |
| `src/docs/docs/plans/` | Active implementation plans only (≤ 30 files). Completed/obsolete plans move to archive. |
| `src/docs/archive/<domain>/` | Archived docs preserved for reference. Each subfolder needs a README describing the historical context. |
| `_OLD_DEPRECATED/` | Legacy experiments (Punch/STS) — read-only, never touched for gameplay changes. |

## 6. Doc Lifecycle Workflow

1. **Draft**: newly created doc gets `status: draft`, must list owner + due date.
2. **Active**: once reviewed by coordinator or landed in main, set `status: active` and update `last_reviewed`.
3. **Stale Check**: docs with `last_reviewed > 60 days` are flagged by the audit script (see below) and must be either refreshed or archived.
4. **Archive**: move file to `src/docs/archive/<domain>/` and set `status: archived`. Keep a short summary + link inside the archive README.

## 7. Upcoming Automation (`docs:audit`)

We will add `npm run docs:audit` with the following checks:

- Missing frontmatter.
- `status` not in {draft, active, archived}.
- `last_reviewed` older than 90 days for active docs.
- Files in `src/docs/docs/plans/` that reference completed prompts.
- Unlinked docs (not referenced by this Bible or MASTER_PLAN).

The command will output `test-results/docs-audit-YYYY-MM-DD.json` and fail CI/Guardian if violations exist. Until the script is implemented, manual reviews should follow the same checklist.

## 8. Immediate TODOs

1. **Add frontmatter** to:
   - `PROJECT_PHILOSOPHY.md`
   - `DEVELOPMENT_GUIDELINES.md`
   - `MASTER_PLAN.md`
   - `IMPLEMENTATION_PLANS_INDEX.md`
2. **Create archive directories** for:
   - Punch Club / STS
   - Idle Village plans superseded by Phase 12
3. **Write `docs:audit` script** (Node/TS) and wire it into Guardian + Kanban lint pipelines.
4. **Keep this Bible updated** whenever philosophy/mandates change (Kanban row + evidence log required for edits).

---

Keeping the documentation lean is now a first-class engineering task. Treat this Bible as the front door: if a new doc or plan can’t be justified or linked here, it probably belongs in the archive.
