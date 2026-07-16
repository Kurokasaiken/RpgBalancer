# Implementation Plan 10: AI Production Pipeline
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** Medium  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Duration:** 2 weeks

---

## Executive Summary

Operationalize the AI-first workflow defined in ADR-004 and Implementation Plan 00 by building the tooling, validation hooks, and runtime preview loop that allows designers to go from prompt → config → schema → runtime preview → freeze with minimal human intervention. This plan turns the "AI Production Pipeline" concept into code and governance.

**Key Deliverables:**
- AI prompt templates + generator scripts for new components/POIs/buildings
- Config scaffolder that emits schema-compliant JSON + TypeScript hints
- Automated validation harness (schema, contract, seed, localization, skin)
- Runtime preview harness that spins up component sandboxes from generated configs
- Freeze checklist automation (tests, docs, telemetry evidence)
- Pipeline telemetry + dashboards to measure AI throughput/quality

---

## Objectives

1. Codify the pipeline: Designer Prompt → AI Generator → Config Artifact → Schema Validation → Runtime Preview → Freeze.
2. Provide CLI + UI surfaces for prompt submission, AI responses, and review.
3. Ensure generated configs automatically register with Component Registry + Default Resolver.
4. Automate evidence gathering (lint, tests, screenshots) for frozen governance.
5. Capture telemetry for AI success rate, rejection reasons, and review time.

---

## Architecture

### Pipeline Stages
1. **Prompt Intake** – CLI/VSCode snippet + Notion template referencing ADR IDs.
2. **AI Generation** – Calls internal model endpoint (mocked locally) to produce config + metadata.
3. **Schema Validation** – Zod/JSON schema checks plus custom rules (config-first, localization, seed, skin, physics).
4. **Runtime Preview** – Launches component test harness in headless browser, captures screenshots + metrics.
5. **Freeze Automation** – Generates PR checklist, updates COMPONENT_MASTER_INDEX entry, attaches telemetry/logs.

### Tooling Components
- `scripts/ai/promptRunner.ts` – handles prompts, attaches ADR context.
- `scripts/ai/configScaffolder.ts` – converts AI JSON to project structure.
- `scripts/ai/pipelineValidator.ts` – orchestrates schema + runtime validation.
- `scripts/ai/freezeChecklist.ts` – ensures contract/test/doc evidence before freeze.
- `docs/ai/ai_pipeline_guide.md` – describes usage + guardrails.

### Telemetry
- Events: `ai_pipeline_generated`, `ai_pipeline_validated`, `ai_pipeline_rejected`, `ai_pipeline_frozen`.
- Payload includes prompt ID, component ID, validation results, screenshots, reviewer, duration.

---

## Implementation Phases

### Phase 10.1: Pipeline Specification (Days 1-2)
- Create `docs/ai/ai_pipeline_guide.md` describing stages, required inputs (prompt, ADR references), review roles.
- Define telemetry contract + schema for pipeline events.
- Align with ADR-004 requirements; link to Plan 00 deliverables.
- Safeguards: `npm run lint -- docs/`; `npm run build:check`.

### Phase 10.2: Prompt Runner & Config Scaffolder (Days 3-5)
- Build `scripts/ai/promptRunner.ts` to collect context, send prompt, store responses (`/data/ai_runs/`).
- Implement `scripts/ai/configScaffolder.ts` to map AI output → `data/presets/...` + `src/game/components/...` stubs.
- Include AI templates for buildings, POIs, materials, quests.
- Safeguards: lint scripts + unit tests.

### Phase 10.3: Validation Harness (Days 6-8)
- Implement `scripts/ai/pipelineValidator.ts` to run schema validation, localization checks, seed coverage, skin enforcement, physics defaults.
- Integrate with existing `ComponentTestPage` for runtime preview (headless + screenshot capture).
- Fail pipeline when validation errors arise; produce actionable report.
- Safeguards: `npm run test -- scripts/ai`; `npm run build:check`.

### Phase 10.4: Runtime Preview & Evidence Capture (Days 8-10)
- Extend component harness to accept generated configs, render states, capture PNG + metrics (FPS, complexity).
- Store artifacts under `test-results/ai-pipeline/<componentId>/`.
- Auto-generate markdown snippet summarizing results for PR.
- Safeguards: visual regression tests, lint.

### Phase 10.5: Freeze Automation (Days 11-12)
- Implement `scripts/ai/freezeChecklist.ts` to ensure contract/test/doc/telemetry evidence before marking component `trusted`/`frozen`.
- Update `COMPONENT_MASTER_INDEX` programmatically (Plan 08 dependency).
- Hook into Kanban lint to verify pipeline ID on frozen entries.
- Safeguards: lint + `npm run kanban:lint`.

### Phase 10.6: Telemetry & Dashboard (Days 13-14)
- Emit telemetry events during pipeline stages.
- Build lightweight dashboard (CLI or simple web) summarizing success/failure rates.
- Document review flow + SLAs.
- Safeguards: analytics tests + lint.

---

## File Structure

```
scripts/ai/
├── promptRunner.ts
├── configScaffolder.ts
├── pipelineValidator.ts
├── freezeChecklist.ts
└── __tests__/
    ├── promptRunner.test.ts
    ├── configScaffolder.test.ts
    ├── pipelineValidator.test.ts
    └── freezeChecklist.test.ts

docs/ai/
└── ai_pipeline_guide.md

data/ai_runs/
└── (generated prompt/response artifacts)
```

---

## Success Criteria

- Pipeline command executes full loop and outputs config + validation report.
- Runtime preview automatically captures screenshots + metrics.
- Freeze checklist enforces ADR-006 requirements (contract, tests, docs, runtime evidence).
- Telemetry dashboards show pipeline throughput + rejection reasons.
- Designers can create new POI/building via prompt with zero manual wiring.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI output drift | Invalid configs | Strict schema validation + curated templates |
| Pipeline flakiness | Blocks content velocity | Retry logic, artifact logging, staged rollout |
| Evidence gaps | Frozen governance violations | Automated checklist + Kanban lint |
| Security/privacy | Prompt data leaks | Redact sensitive info, store locally, audit access |

---

## Dependencies

- Plan 00 (Architecture foundation)
- Plan 01 (Component runtime)
- Plan 02-05 (Rendering, Material, Physics, Seed) for config scaffolding
- Plan 06-08 (Content systems + Frozen governance) for integration
- Plan 09 (Modding layer) for future mod pipeline support

---

## Timeline

| Phase | Days |
| --- | --- |
| 10.1 Specification | 2 |
| 10.2 Prompt Runner & Scaffolder | 3 |
| 10.3 Validation Harness | 3 |
| 10.4 Runtime Preview | 2 |
| 10.5 Freeze Automation | 2 |
| 10.6 Telemetry & Dashboard | 2 |

Total: **2 weeks**.

---

## Next Steps

1. Draft AI pipeline guide + telemetry contract.
2. Build prompt runner + config scaffolder with ADR context injection.
3. Implement validation + runtime preview harness.
4. Automate freeze checklist + Kanban lint enforcement.
5. Ship telemetry + dashboard for pipeline adoption.
