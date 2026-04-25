# Idle Village Component Lab – Resource Pinball Monitor Intake

_Source_: `.windsurf/plans/idle-village-component-lab-plan-21fd14.md` · Section "Resource Pinball Monitor"

Use this template for every Component Lab candidate before creating execution prompts. Each subsection captures the config-first context (deps, telemetry, Style Lab), backlog routing, and evidence requirements.

## 1. Candidate Metadata

| Field | Guidance | Example |
| --- | --- | --- |
| **Component ID** | Use `IV-CLP-###` or map to existing strategy ID | `IV-CLP-105` |
| **Component Name** | Official UI name as it appears in the plan | `Resource Pinball Monitor` |
| **Plan Reference** | Markdown link to the exact subsection inside the Component Lab plan | `[Resource Pinball Monitor](.windsurf/plans/idle-village-component-lab-plan-21fd14.md#resource-pinball-monitor)` |
| **Priority Stream** | `MG` (Minimal Gameplay) or `VS` (Village Sandbox) | `VS` |
| **Owning Squad** | Coordinator owner or specialist label | `Component-Extractor` |
| **Intake Date** | ISO date string `YYYY-MM-DD` | `2026-02-16` |
| **Status** | `candidate`, `approved`, `prompted`, `in-progress`, `done` | `candidate` |
| **Backlog Row** | Kanban table row/anchor once registered | `agent_assignments.md#idle-village-component-lab` |

## 2. Problem Statement & KPIs

- **Narrative**: The Resource Pinball Monitor provides a dynamic and engaging visualization of village resources, using pinball-like animations to display real-time resource flows and changes in an intuitive, game-like manner.
- **Success KPIs**:
  - Latency < 100ms for resource update animations
  - Telemetry coverage 100% for resource change events
  - User engagement metrics > 80% for resource monitoring interactions
- **Guardrails**: Must follow config-first architecture, zero hardcoded values, reuse existing dependency modules, integrate Style Lab motion tokens for animations.

## 3. Dependency & Config Matrix

Capture every module the component must read from (never inline values). Fill all rows; if a category is not used, write `Not applicable – <reason>` instead of leaving blank.

| Category | Files / Modules | Notes |
| --- | --- | --- |
| **Balancer / Engine Data** | `src/balancing/config/idleVillage/resourceConfig.ts` | Resource thresholds, flow rates, and pinball physics parameters |
| **Hooks / Controllers** | `useResourceFlow`, `useAudioCueConfig`, `useMinimalStyleLabTokens` | Resource state management, audio feedback for pinball events, Style Lab styling |
| **Assets** | Icons and motion presets from `public/assets/ui/pinball/` | Pinball ball icons, bounce sound effects, flow animation sprites |
| **Persistence Keys** | `resource_pinball_prefs` (read/write) | User preferences for pinball display mode, sound settings. Retention: 30 days |
| **Telemetry Providers** | `trackTelemetryEvent`, resource flow diagnostics | `resource_pinball_event`, `resource_flow_start`, `resource_flow_end` |

## 4. Style Laboratory & Visual Guardrails

- **Preset**: Minimal Frontier (for clean, futuristic resource visualization).
- **Surface Tokens**: Map `card` for pinball lanes, `panel` for resource counters, `hud` for overlay information to `minimalGameplayConfig.ui.tokens`.
- **Motion / Micro-interactions**: Reference `motionTokens.pinballBounce` and `motionTokens.resourceFlow` from Style Lab config for bounce easing and flow transitions (no ad-hoc easing).
- **Accessibility**: High contrast for resource indicators, focus rings on interactive pinball elements, ARIA live regions for resource announcements.

## 5. Telemetry Instrumentation Contract

Use the shared telemetry provider (`trackTelemetryEvent`). Standard event IDs for Component Lab work:

- `component_lab_viewed`
- `component_lab_interacted`
- `component_lab_error`
- `component_lab_promoted`

For each component, define:

| Event ID | Trigger | Payload Schema |
| --- | --- | --- |
| `component_lab_viewed` | Component mounted or toggled on | `{ componentId: 'resourcePinballMonitor', presetId: 'minimal_frontier', context: 'component_lab', timestamp }` |
| `component_lab_interacted` | User action (pinball bounce, resource flow interaction) | `{ actionType: 'bounce' | 'flow_start' | 'flow_end', resourceType, amount }` |
| `component_lab_error` | Validation/runtime issue | `{ componentId: 'resourcePinballMonitor', errorCode, message, recoveryHint }` |
| `component_lab_promoted` | Component graduates to Minimal Gameplay | `{ componentId: 'resourcePinballMonitor', evidenceLog, checklistVersion }` |
| `resource_pinball_event` | Specific pinball interactions | `{ eventType: 'bounce' | 'lane_complete', resourceType, bounceCount, timestamp }` |

Document any extra events mandated by the plan (resource flow diagnostics).

## 6. Testing & Evidence Requirements

- **Unit / RTL Tests**: `tests/unit/idleVillage/ResourcePinballMonitor.test.tsx` covering config loading, animation triggers, telemetry events.
- **Playwright / Visual Tests**: `tests/visual/idleVillage/resource-pinball-monitor.spec.ts` for animation regression testing.
- **Evidence Log Pattern**: `test-results/iv-clp-105-2026-02-16.log` storing `lint`, `test`, `build:check`, `kanban:lint` outputs + animation screenshots.
- **Telemetry Snapshots**: Attach sample telemetry payloads for pinball bounce events.

## 7. Backlog & Kanban Hooks

- **Strategy Task Link**: Add the corresponding row under `## Idle Village Component Lab` in `strategy_tasks.md`.
- **Coordinator Kanban Note**: Update `src/docs/docs/coordinator/agent_assignments.md` Kanban table with priority (`VS`), template link, and latest evidence log.
- **Dependencies**: Reference upstream prompt IV-CLP-001 (completed) for harness foundation.

## 8. Intake Checklist (Copy/Paste in each candidate)

- [x] Metadata section completed with plan links and owner
- [x] Dependency matrix references only config-first modules (no inline weights)
- [x] Style Lab preset + tokens confirmed with `useStyleLabTokens`
- [x] Telemetry contract validated with analytics lead
- [x] Testing scope + evidence log path agreed
- [x] Backlog row + Kanban note updated with template permalink

## 9. Promotion Readiness Notes

Document criteria for promoting the component from the Lab to production surfaces (Minimal Gameplay or Village Sandbox). Include:

- **Readiness Scorecard** (0–5 for UX polish, telemetry, performance, accessibility): UX 4/5, telemetry 5/5, performance 4/5, accessibility 4/5
- **Outstanding Risks** with mitigation owners: Performance impact with high resource volumes (mitigation: config throttling, owner: Performance-Optimizer)
- **Rollback Plan** if promotion fails (config toggle `resourcePinballEnabled: false`, feature flag in `resourceConfig.ts`)
