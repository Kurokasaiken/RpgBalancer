# Idle Village Agent Instructions

## Mandate

Any agent editing files under `src/ui/idleVillage/**` **must**:

1. Invoke the `agent-execution-mandate` skill before any modifications.
2. Immediately invoke the `idle-village-task` skill (`.windsurf/skills/idle-village-task/SKILL.md`) to load config-first gameplay, Style Lab, persistence, telemetry, drag-drop, and safeguard requirements.
3. Reference the project philosophy (`.windsurf/rules/philosophy.md`) and Idle Village plans:
   - `src/docs/docs/plans/idle_village_plan.md`
   - `src/docs/docs/plans/minimal_gameplay_implementation_plan.md`
4. Use the prompt source of truth `src/docs/docs/coordinator/minimal_gameplay_prompts.md`.
5. Update Kanban (`src/docs/docs/coordinator/agent_assignments.md`) using the `/kanban-update` workflow once work is complete.

> **Bugfix fast track**
>
> When the coordinator/owner is live in the thread and explicitly authorizes a hotfix, agents may skip steps 1–5 *only* for that scoped fix. Document the approval callout in the final reply and still follow the Core Requirements + Safeguards below.

## Core Requirements

- Config-first architecture: read/write stats and UI tokens from `src/balancing/config/idleVillage/**`.
- Persistence via `PersistenceService` helpers only.
- Telemetry via `trackTelemetryEvent` with detailed payloads.
- Drag & drop using `dnd-kit` helpers (`useResidentDropValidation`, `DropFeedbackUI`).
- Style Lab UI atoms: respect spacing, color, typography tokens.
- Autosave loops ≥ 30s, timers ≥ 500ms.
- Evidence logs: `test-results/<prompt-id>-<YYYY-MM-DD>.log`.
- Trusted roster components: before creare/aggiornare liste PG/roster, consulta `src/docs/docs/idle_village/roster_trusted_components.md` e importa sempre da `src/ui/idleVillage/roster/index.ts`.

## Safeguards

Run (and fix on failure):

```bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run kanban:lint
```

## Reporting

- Follow `/kanban-update` workflow for status + evidence updates.
- Completion report template lives inside `idle-village-task` skill; reuse it for final replies.
