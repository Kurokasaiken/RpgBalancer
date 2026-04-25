# IV-CLP-102 – Expedition List Intake

> **Source status**: The original section `.windsurf/plans/idle-village-component-lab-plan-21fd14.md#expedition-list` is currently missing from the repo. This intake reconstructs the requirements from strategy_tasks, agent_assignments, Minimal Gameplay configs, and existing Sandbox components until the source plan is restored. Once the plan file is recovered, update the references below.

## 1. Candidate Metadata

| Field | Value |
| --- | --- |
| **Component ID** | `IV-CLP-102` |
| **Component Name** | Expedition List – mission roster & risk chips |
| **Plan Reference** | _Missing file_: `.windsurf/plans/idle-village-component-lab-plan-21fd14.md#expedition-list` (restore/replace ASAP) |
| **Priority Stream** | `MG` – Minimal Gameplay surface needs this before VS promotion |
| **Owning Squad** | Component Lab Coordinator · Idle Village Minimal Gameplay stream |
| **Intake Date** | 2026-02-15 |
| **Status** | candidate |
| **Backlog Row** | `src/docs/docs/coordinator/strategy_tasks.md#idle-village-component-lab` (IV-CLP-102) + `agent_assignments.md` Kanban entry |

## 2. Problem Statement & KPIs

- **Narrative**: Minimal Gameplay needs a config-first Expedition List showing the current mission roster, participant chips, and quest risk indicators. Today the dispatch list logic is trapped inside VillageSandbox/TestRoster prototypes, blocking reuse in the Component Lab and future promotion to MG.
- **Pain**: Designers cannot iterate on mission copy, risk chips, or Style Lab polish without editing Sandbox internals. Telemetry is incomplete (`component_lab_expedition_list_viewed` is referenced but never emitted) and hydration work happens on every toggle.
- **Success KPIs**:
  - Expedition list renders (hydration) in < **150 ms** using config fixtures (as per strategy_tasks row).
  - Risk chip telemetry (`component_lab_expedition_list_*`) hits **100 % coverage** for mount, interaction, and errors.
  - List and chip configuration read exclusively from `questConfig` + Minimal Gameplay config (zero inline quest data).
  - Component Lab harness can mount/unmount without memory leaks (React StrictMode clean).
- **Guardrails**:
  - Config-first only: mission data, chip colors, timers, and copy must come from config modules (`questConfig`, `minimalGameplayConfig`, `riskDisplayConfig`, future `expeditionsConfig`).
  - Persistence through `PersistenceService` where state needs to survive reloads (e.g., last selected expedition filter).
  - Follow Style Laboratory presets (Minimal Frontier) and token mapping—no Tailwind hex literals.
  - Telemetry via `trackTelemetryEvent` with documented payload contracts.

## 3. Dependency & Config Matrix

| Category | Files / Modules | Notes |
| --- | --- | --- |
| **Balancer / Engine Data** | `src/balancing/config/idleVillage/questConfig.ts`, `src/balancing/config/idleVillage/minimalGameplayConfig.ts`, `src/balancing/config/idleVillage/riskDisplayConfig.ts` | Quest roster, skill checks, risk percentages, UI tokens. Extend with `expeditionsConfig.ts` if mission-specific fields are needed (owner + ETA). |
| **Hooks / Controllers** | `useMinimalGameplayStore`, `selectResidentRosterStates`, `useDropFeedback`, `useResidentDropValidation`, (planned) `useExpeditionListData` | Data hydration, roster compatibility, and validation. New hook must live under `src/ui/idleVillage/components/expeditions/`. |
| **Assets** | `public/assets/idleVillage/icons/*.svg`, risk stripe gradients defined in Style Lab tokens | Mission icons + optional background textures referenced via config IDs. No inline imports. |
| **Persistence Keys** | `PersistenceService` key `component-lab-expedition-list-prefs` (new) for filter/toggle state | Reuse existing persistence helper modules; never touch localStorage directly. |
| **Telemetry Providers** | `trackTelemetryEvent` (`src/analytics/telemetry/telemetryProvider.ts`), `dropFeedbackTelemetry.ts`, `questDiagnostics` (if reused) | Events listed in §5 must go through shared provider. |

## 4. Style Laboratory & Visual Guardrails

- **Preset**: Minimal Frontier (matches current MG hero shell). Document overrides inside `useMinimalStyleLabTokens` consumer.
- **Surface Tokens**: Use `minimalGameplayConfig.ui.tokens` for cards/panels (`cardRadiusPx`, `accentHex`, panel bg). Expedition risk chips should rely on `riskDisplayConfig` + Style Lab surfaces rather than hand-crafted gradients.
- **Motion / Micro-interactions**: Borrow animations from `dropFeedbackConfig.ts` (pulse, fade) or Style Lab motion tokens; re-export as config fields (e.g., `expeditionListConfig.motion.glow`).
- **Accessibility**: Maintain ≥4.5:1 contrast for text over mission cards, use focus-visible rings from Style Lab tokens, and expose ARIA labels (`aria-describedby` linking chips to risk percentages).

## 5. Telemetry Instrumentation Contract

| Event ID | Trigger | Payload Schema |
| --- | --- | --- |
| `component_lab_viewed` | Expedition List mounted in lab harness/TestRoster toggle | `{ componentId: 'IV-CLP-102', presetId, context: 'component_lab', timestamp }` |
| `component_lab_interacted` | Resident chip hover, CTA click, drag attempt | `{ componentId: 'IV-CLP-102', actionType, expeditionId, residentId?, slotId?, presetId, timestamp }` |
| `component_lab_error` | Data hydration failure, validation error, persistence read failure | `{ componentId: 'IV-CLP-102', errorCode, message, recoveryHint, expeditionId?, timestamp }` |
| `component_lab_promoted` | Future hand-off when MG adopts the component | `{ componentId: 'IV-CLP-102', evidenceLog, checklistVersion }` |
| `component_lab_expedition_list_viewed` | **New** – risk chips rendered with data | `{ componentId: 'IV-CLP-102', expeditionCount, riskSummary: { injuryAvg, deathAvg }, source: 'questConfig', timestamp }` |
| `component_lab_expedition_chip_selected` | Designer clicks a mission to inspect details | `{ componentId: 'IV-CLP-102', expeditionId, participants, riskLevel, timestamp }` |

Telemetry integration must reuse the shared provider and include presets/context tags for analytics dashboards.

## 6. Testing & Evidence Requirements

- **Unit / RTL**:
  - `tests/unit/idleVillage/ExpeditionList.test.tsx` – rendering, risk chip layout, telemetry mocks.
  - `tests/unit/idleVillage/useExpeditionListData.test.ts` – config hydration, sorting, filtering.
  - `tests/unit/idleVillage/ExpeditionFixtures.test.ts` – deterministic fixture loader (once script lands).
- **Playwright / Visual**:
  - Add to `tests/e2e/idleVillage/TestRosterPage.spec.ts` (toggle renders, accessibility tree).
  - Optional visual snapshot for risk stripes if required by Style Lab QA.
- **Evidence Log Pattern**: `test-results/iv-clp-102-component-lab-<YYYY-MM-DD>.log` capturing lint (`src/ui/idleVillage`, `scripts/idleVillage`), targeted tests, `npm run build:check`, and `npm run kanban:lint` outputs + screenshots from lab harness.
- **Telemetry Snapshots**: Attach sample payload JSON (one per event type) to the evidence log for analytics verification.

## 7. Backlog & Kanban Hooks

- **Strategy Task Link**: `src/docs/docs/coordinator/strategy_tasks.md` row `IV-CLP-102` (update “Note coordinator” to point here).
- **Coordinator Kanban Note**: `src/docs/docs/coordinator/agent_assignments.md` → entry "IV-CLP-102 – Expedition List Intake" must reference this intake and MG priority.
- **Dependencies**: Blocks IV-CLP-202 extraction prompt and any downstream promotion work. Also depends on IV-CLP-002 (dependency mapper CLI) for accurate module inventory.

## 8. Intake Checklist

- [x] Metadata completed, owner + plan reference (flagged missing source doc).
- [x] Dependency matrix references config-first modules (quest/minimal configs, telemetry provider, PersistenceService).
- [x] Style Lab preset & tokens documented with guardrails.
- [x] Telemetry contract defined, including Expedition-specific events.
- [x] Testing scope + evidence log path specified.
- [x] Backlog + Kanban linkage recorded (strategy row + agent_assignments entry).

## 9. Promotion Readiness Notes

| Criterion | Status (0–5) | Notes |
| --- | --- | --- |
| **UX polish** | 2 | Needs Style Lab wrappers + risk chip visual parity with QuestRiskDisplay. |
| **Telemetry** | 1 | Events defined but not yet wired; add mocks + snapshot tests. |
| **Performance** | 1 | Hydration budget (<150 ms) unverified; requires fixture profiling. |
| **Accessibility** | 2 | Existing roster chips have focus styles; mission cards need aria-live summary of risk chips. |

### Outstanding Risks

1. _Missing Source Plan_: Without the `.windsurf` plan, requirements drift may occur. Action: coordinator to restore or recreate the Expedition List section in the plan repo and update this intake.
2. _Config Drift_: Quest data currently in `questConfig.ts` uses placeholder values (Gilded palette). Need `expeditionsConfig.ts` to house Minimal Frontier tokens + mission metadata before promotion.
3. _Telemetry Debt_: `component_lab_expedition_list_viewed` mentioned in IV-CLP-202 but no implementation; ensure hook + tests land before extraction prompt kicks off.

### Rollback Plan

- Keep the Expedition List experimental flag-scoped inside the Component Lab/TestRoster harness. If issues arise, disable the toggle via `component-lab-config.json` without touching MinimalGameplayPage.
- Preserve fixtures under `scripts/idleVillage/expeditionFixtures.ts` so Sandbox can revert to previous behavior instantly.
