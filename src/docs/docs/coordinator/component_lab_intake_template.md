# Idle Village Component Lab – Candidate Intake Template

_Source_: `.windsurf/plans/idle-village-component-lab-plan-21fd14.md` · Section "Candidate Intake & Definition"

Use this template for every Component Lab candidate before creating execution prompts. Each subsection captures the config-first context (deps, telemetry, Style Lab), backlog routing, and evidence requirements.

## 1. Candidate Metadata

| Field | Guidance | Example |
| --- | --- | --- |
| **Component ID** | Use `IV-CLP-###` or map to existing strategy ID | `IV-CLP-101` |
| **Component Name** | Official UI name as it appears in the plan | `Night Threat HUD` |
| **Plan Reference** | Markdown link to the exact subsection inside the Component Lab plan | `[Night Threat HUD](.windsurf/plans/idle-village-component-lab-plan-21fd14.md#night-threat-hud)` |
| **Priority Stream** | `MG` (Minimal Gameplay) or `VS` (Village Sandbox) | `MG` |
| **Owning Squad** | Coordinator owner or specialist label | `StyleLab-Orchestrator` |
| **Intake Date** | ISO date string `YYYY-MM-DD` | `2026-02-15` |
| **Status** | `candidate`, `approved`, `prompted`, `in-progress`, `done` | `candidate` |
| **Backlog Row** | Kanban table row/anchor once registered | `agent_assignments.md#idle-village-component-lab` |

## 2. Problem Statement & KPIs

- **Narrative**: Summarize the user-facing objective (1–2 sentences) referencing current pain points.
- **Success KPIs**: Bullet list of measurable outcomes (e.g., "Latency < 50 ms", "Telemetry coverage 100%").
- **Guardrails**: Explicit constraints from plan (config-first, zero hardcode, dependency reuse).

## 3. Dependency & Config Matrix

Capture every module the component must read from (never inline values). Fill all rows; if a category is not used, write `Not applicable – <reason>` instead of leaving blank.

| Category | Files / Modules | Notes |
| --- | --- | --- |
| **Balancer / Engine Data** | e.g., `src/balancing/config/idleVillage/nightThreatConfig.ts` | Reference schema + reason |
| **Hooks / Controllers** | e.g., `useResidentDropValidation`, `useAudioCueConfig` | Include expected selectors/actions |
| **Assets** | Icons, audio, motion presets from `public/assets` or `src/ui/idleVillage/assets` | Include licensing status |
| **Persistence Keys** | PersistenceService keys (read/write) | Mention retention window |
| **Telemetry Providers** | e.g., `trackTelemetryEvent`, `questDiagnostics` | List required event names |

## 4. Style Laboratory & Visual Guardrails

- **Preset**: Document the Style Lab preset (e.g., `Minimal Frontier`, `Arcane Tech Glass`).
- **Surface Tokens**: Map `card`, `panel`, `hud` tokens to `minimalGameplayConfig.ui.tokens` or equivalent.
- **Motion / Micro-interactions**: Reference tokens or config file for transitions (no ad-hoc easing).
- **Accessibility**: Contrast, focus rings, and ARIA roles derived from Style Lab tokens.

## 5. Telemetry Instrumentation Contract

Use the shared telemetry provider (`trackTelemetryEvent`). Standard event IDs for Component Lab work:

- `component_lab_viewed`
- `component_lab_interacted`
- `component_lab_error`
- `component_lab_promoted`

For each component, define:

| Event ID | Trigger | Payload Schema |
| --- | --- | --- |
| `component_lab_viewed` | Component mounted or toggled on | `{ componentId, presetId, context: 'component_lab', timestamp }` |
| `component_lab_interacted` | User action (hover, drag, CTA) | Extend with `{ actionType, residentId?, slotId? }` |
| `component_lab_error` | Validation/runtime issue | `{ componentId, errorCode, message, recoveryHint }` |
| `component_lab_promoted` | Component graduates to Minimal Gameplay | `{ componentId, evidenceLog, checklistVersion }` |

Document any extra events mandated by the plan (Quest, Expedition, Combat Replay, etc.).

## 6. Testing & Evidence Requirements

- **Unit / RTL Tests**: List required suites with file paths (e.g., `tests/unit/idleVillage/NightThreatHUD.test.tsx`).
- **Playwright / Visual Tests**: Reference spec names when Component Lab requires visual regression.
- **Evidence Log Pattern**: `test-results/<componentId>-component-lab-<YYYY-MM-DD>.log` storing `lint`, `test`, `build:check`, `kanban:lint` outputs + screenshots.
- **Telemetry Snapshots**: Mention whether to attach sample telemetry payloads.

## 7. Backlog & Kanban Hooks

- **Strategy Task Link**: Add the corresponding row under `## Idle Village Component Lab` in `strategy_tasks.md`.
- **Coordinator Kanban Note**: Update `src/docs/docs/coordinator/agent_assignments.md` Kanban table with priority (`MG`/`VS`), template link, and latest evidence log.
- **Dependencies**: Reference any upstream prompts (e.g., IV-CLP-001) that must complete first.

## 8. Intake Checklist (Copy/Paste in each candidate)

- [ ] Metadata section completed with plan links and owner
- [ ] Dependency matrix references only config-first modules (no inline weights)
- [ ] Style Lab preset + tokens confirmed with `useStyleLabTokens`
- [ ] Telemetry contract validated with analytics lead
- [ ] Testing scope + evidence log path agreed
- [ ] Backlog row + Kanban note updated with template permalink

## 9. Promotion Readiness Notes

Document criteria for promoting the component from the Lab to production surfaces (Minimal Gameplay or Village Sandbox). Include:

- **Readiness Scorecard** (0–5 for UX polish, telemetry, performance, accessibility)
- **Outstanding Risks** with mitigation owners
- **Rollback Plan** if promotion fails (config toggle, feature flag, etc.)

> Once this template is filled, attach it to the prompt evidence log and reference it from both the strategy task entry and the coordinator Kanban note.
