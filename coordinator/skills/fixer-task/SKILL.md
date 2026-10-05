---
name: fixer-task
description: Sequential fixer agent that scans each Idle Village surface for errors, diagnoses root causes, and applies project-aligned fixes before re-validating.
triggers:
  - "fixer"
  - "page fixer"
  - "error fixer"
---

# Fixer Task Skill

## Mission
Automate the "apri → leggi errore → risolvi → riesegui" loop across every surface (pages, components, tests) affected by Idle Village / Minimal Gameplay, ensuring each fix respects:
- Project philosophy (`.windsurf/rules/philosophy.md`)
- Implementation plans (`src/docs/docs/plans/idle_village_plan.md`, `minimal_gameplay_implementation_plan.md`, `minimal-to-vertical-slice-roadmap-*.md`)
- Coordinator prompts (`src/docs/docs/coordinator/agent_assignments.md`, `minimal_gameplay_prompts.md`)
- Closed tasks/Evidence logs (scan `test-results/*.log` & Kanban history to understand prior work before altering shared modules)

### Mandatory References (consult + cite every run)

- `src/docs/docs/PROJECT_PHILOSOPHY.md`
- `src/docs/docs/plans/art_direction_plan.md`
- `.windsurf/plans/style-lab-flexibility-1a9890.md`
- `material-canvas-v2.html`
- `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md`
- `src/docs/docs/QA/test-route-drag-guidelines.md` (obbligatorio se i fix toccano la pagina `/test`, harness drag, o suite Playwright correlate)

Before touching code, list these references at the top of your fixer notes (marking “N/A – backend-only” only when verified) and cite them in the evidence log under a "Docs Consulted" section.

## Required Skills
1. Invoke `agent-execution-mandate` to enforce lock checks, Kanban updates, safeguards.
2. Invoke `idle-village-task` immediately after (Style Lab, config-first, telemetry, persistence, dnd-kit).
3. If coordinating with other agents or splitting fixes, load `coordinator-mandate`.

## Workflow
### Phase 1 – Discovery & Context
1. **Enumerate Targets**: Build the list of pages/components/tests to audit (source: failing CI, QA list, Playwright/visual suites, manual roster). Document order in evidence log.
2. **Load Context** for each target before touching code:
   - Read associated prompt row in Kanban and any closed tasks mentioning the same files.
   - Review latest plan section (IMPLEMENTED_PLAN / DEVELOPMENT_GUIDELINES) for layout/density/audio/token rules.
3. **Execute Detection**:
   - Run the most relevant check (Playwright spec, Puppeteer scripted flow if available, visual baseline, RTL test, lint, manual page load) for the current target only.
   - Capture the exact error output (stack trace, console error, failing assertion) in the evidence log.
   - If multiple errors appear simultaneously, queue them FIFO for this page.
4. **Reference Sync**: Before applying any fix, confirm you’ve refreshed the Mandatory References and updated the "Docs Consulted" section in the working log for this session. UI surfaces must follow Game Feel Bible chapters (particles, cursor avatar, living shaders) and Style Lab token requirements; log any deviations as blockers.
   - Se la superficie coinvolge la route `/test` (TestRosterPage, ResidentSlotRack harness, Playwright drag spec), applica i requisiti di `src/docs/docs/QA/test-route-drag-guidelines.md`: drags con `page.mouse`, baseline Pixelmatch/Applitools, Trace Viewer attivo, evidence log `test-results/test-route-drag-vrt-<data>.log`.
   - **Test parity**: ogni variazione a `useMinimalActivitySlots`, `ActivitySlotCard`, `ActionToolbar` o `useMinimalStyleLabTokens` richiede aggiornare le rispettive suite RTL/Vitest. Non marcare il prompt "Completato" senza aver indicato i test toccati nel piano e nel log.
   - **/test harness compliance**: modifiche a TestRosterPage, WorkerPanel harness o Playwright drag suites devono includere screenshot VRT + trace secondo `src/docs/docs/QA/test-route-drag-guidelines.md` e allegare l'evidence nel log principale.

### Phase 2 – Fix Loop (per page / error)
1. **Root Cause**:
   - Trace to the owning module (config, hook, component). Consult closed tasks/evidence to avoid regressions (e.g., see how MG-07 handled drop glow before editing ActivitySlot again).
   - Identify whether bug stems from config drift, missing tokens, stale hooks, or improper API usage.
2. **Apply Fix**:
   - Follow config-first rules (stats/colors in config, telemetry via `trackTelemetryEvent`, persistence via `PersistenceService`).
   - Use Style Lab tokens/components; no inline magic numbers.
   - Remove legacy handlers/logs per Refactor Guardrail checklist (agent-execution Step 1.6).
3. **Re-run Local Check** for this target immediately. If new errors appear, loop until clean before moving to next page.
4. **Regression Sweep**:
   - When a shared module changes, rerun any other page/tests listed under “dependants” in the prompt or log (e.g., updating `MinimalGameplayPage` requires revalidating MG visual suite).

### Phase 3 – Documentation & Reporting
1. **Evidence Log**: `test-results/fixer-task-<date>.log` summarizing:
   - Pages scanned, errors detected, actions taken, commands executed (lint/test/build/visual/e2e).
   - Links to prior tasks consulted (Kanban rows, evidence files).
   - **Docs Consulted**: list every mandatory reference (noting any N/A with justification) so reviewers can trace compliance.
2. **Kanban**:
   - If fixing an existing prompt, note the fixer intervention in the “Note” column (e.g., “Fixer pass resolved Playwright import issue”).
   - For newly discovered issues outside active prompts, add backlog rows via `/kanban-update` if they require follow-up work beyond the fixer session.
3. **Completion Report**: Use Idle Village completion template; highlight remaining known issues (if any) and attach command outputs.

## Safeguards (per fixer run)
```
npm run lint -- <touched paths>
npm run test -- <targeted suites>
npm run test:e2e -- <playwright specs>
# Puppeteer regression commands when applicable (e.g., npm run test:pupeteer -- <spec>)
npm run build:check
npm run kanban:lint
```
Re-run failing commands after each fix until all pass.

## Pro Tips
- **One agent for both detection & fix** keeps context hot; only split if the work explicitly requires separate specialists.
- **Snapshot references**: Before editing layout/visual files, compare vs. last MG evidence log to understand intended state.
- **Closed task lookup**: search `test-results/*` & `agent_assignments.md` for the file name to learn why prior decisions were made before changing them.
- **Sequential discipline**: Never move to the next page until current page is clean (passing lint/tests and manual checks).
