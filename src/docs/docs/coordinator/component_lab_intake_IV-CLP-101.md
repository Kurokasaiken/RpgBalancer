# IV-CLP-101 – Night Threat HUD Intake

> **Source status**: The authoritative plan now lives in-repo at `.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#night-threat-hud`. This intake mirrors that subsection so Component Lab agents can execute without leaving the workspace.

## 1. Candidate Metadata

| Field | Value |
| --- | --- |
| **Component ID** | `IV-CLP-101` |
| **Component Name** | Night Threat HUD – tactical alert bar & danger badges |
| **Plan Reference** | `.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#night-threat-hud` |
| **Priority Stream** | `MG` – Minimal Gameplay must ship this before MG→VS promotion |
| **Owning Squad** | Component Lab Coordinator · Minimal Gameplay stream |
| **Intake Date** | 2026-02-15 |
| **Status** | candidate |
| **Backlog Row** | `src/docs/docs/coordinator/strategy_tasks.md#idle-village-component-lab` (IV-CLP-101) + `agent_assignments.md` Kanban entry |

## 2. Problem Statement & KPIs

- **Narrative**: Minimal Gameplay lacks a reusable, config-first Night Threat HUD that mirrors Sandbox visibility (danger bands, countdown, mitigation tips). Designers currently edit `VillageSandbox.tsx` internals to tweak copy/thresholds, blocking iteration and telemetry coverage on the MG surface.
- **Pain**: Night threat state changes are opaque in Minimal Gameplay; tooltips/audio cues differ between Sandbox/TestRoster and MG, and there is no persistence for user toggles. Without an intake, extraction (IV-CLP-201) cannot proceed.
- **Success KPIs** (from plan):
  1. HUD visuals update within **≤500 ms** of each `nightCycle` tick emitted by `useMapContext` / Minimal store.
  2. Tooltip coverage exists for every danger band (low, medium, high, fatal) with config-driven copy.
  3. Audio cue + mitigation tip toggles persist via `PersistenceService` key `night-threat-hud-prefs` (restored on reload).
  4. Telemetry events (`night_threat_hud_viewed`, `night_threat_threshold_crossed`, `night_threat_tip_clicked`) fire with `{ dangerLevel, day, residentsAtRisk }` payloads.
- **Guardrails**:
  - Config-first only: read thresholds/copy/audio cues from `minimalGameplayConfig.ui.nightThreat` (extend schema if fields missing) and future `nightThreatConfig` module; no inline constants.
  - Style Lab compliance: use Minimal Frontier preset tokens (`StyleLabSurface variant="toolbar"`, `tokens.accentHex` → `--night-threat-glow`).
  - Telemetry via shared `trackTelemetryEvent`; never emit custom window events.
  - Persistence through `PersistenceService` (async) – no direct `localStorage` usage.
  - Extraction must keep Sandbox + Minimal parity; do not regress existing Night Threat overlays.

## 3. Dependency & Config Matrix

| Category | Files / Modules | Notes |
| --- | --- | --- |
| **Balancer / Engine Data** | `src/balancing/config/idleVillage/minimalGameplayConfig.ts` (`ui.nightThreat`), `src/balancing/config/idleVillage/minimalConfig.ts`, `src/balancing/config/idleVillage/transformations.ts` (night threat derivation), `DEFAULT_IDLE_VILLAGE_CONFIG` for Sandbox parity | Provides countdown label, initial days, danger bands, spy mitigation copy, severity palettes. Extend config modules rather than hardcoding.
| **Hooks / Controllers** | `useMinimalGameplayStore`, `useMapContext` (night cycle state), `useSandboxInteractionMode`, future `useNightThreatStatus` hook | Data hydration + tick listeners. Intake mandates splitting logic hook vs. Style Lab view.
| **Assets** | Style Lab tokens (`src/ui/styleLab/presets/minimalFrontier.ts`), audio cues defined via `useAudioCueConfig`, optional HUD icons in `public/assets/idleVillage/icons/` | Reference assets through config keys; document licensing if new audio files appear.
| **Persistence Keys** | `night-threat-hud-prefs` (new) stored via `PersistenceService` | Persists mute, tooltip preference, mitigation tip state. Retention: session-long; safe to keep indefinitely.
| **Telemetry Providers** | `trackTelemetryEvent` (`src/analytics/telemetry/telemetryProvider.ts`), `sandboxDiagnostics` for lab logging | Standard component_lab events + dedicated night threat events (see §5).

## 4. Style Laboratory & Visual Guardrails

- **Preset**: Minimal Frontier.
- **Surface Tokens**: Use `StyleLabSurface` / `StyleLabStack` with `minimalGameplayConfig.ui.tokens` for toolbar background, glow accents (`tokens.accentHex`, `tokens.dangerHex`), and typography scale (base 14px).
- **Motion / Micro-interactions**: Glow/pulse animation defined via config (e.g., `nightThreatConfig.motion.glowDurationMs`), easing pulled from Style Lab motion tokens. No bespoke CSS values.
- **Accessibility**: Maintain ≥4.5:1 contrast for badge text, provide `aria-live="polite"` updates when danger level escalates, ensure tooltip buttons are keyboard-focusable with Style Lab focus rings.

## 5. Telemetry Instrumentation Contract

| Event ID | Trigger | Payload Schema |
| --- | --- | --- |
| `component_lab_viewed` | HUD mounted/toggled on in TestRoster/Component Lab harness | `{ componentId: 'IV-CLP-101', presetId, context: 'component_lab', timestamp }` |
| `component_lab_interacted` | User toggles audio/tooltip or inspects mitigation tip | `{ componentId: 'IV-CLP-101', actionType, dangerLevel, presetId, timestamp }` |
| `component_lab_error` | Config/persistence load failure | `{ componentId: 'IV-CLP-101', errorCode, message, recoveryHint, timestamp }` |
| `component_lab_promoted` | Promotion to Minimal Gameplay complete | `{ componentId: 'IV-CLP-101', evidenceLog, checklistVersion }` |
| `night_threat_hud_viewed` | HUD rendered with latest danger state | `{ dangerLevel, day, residentsAtRisk, source: 'minimalGameplay', timestamp }` |
| `night_threat_threshold_crossed` | Danger band transition (e.g., medium → high) | `{ previousLevel, nextLevel, day, mitigationAssigned, timestamp }` |
| `night_threat_tip_clicked` | Designer toggles mitigation tips or spy guidance | `{ dangerLevel, tipId, spySlotId, timestamp }` |

All telemetry must run through `trackTelemetryEvent` and include `presetId`/context tags when applicable.

## 6. Testing & Evidence Requirements

- **Unit / RTL**:
  - `tests/unit/idleVillage/NightThreatHUD.test.tsx` – rendering, danger band transitions, telemetry mocks, Style Lab token enforcement.
  - `tests/unit/idleVillage/useNightThreatStatus.test.ts` – hook logic (countdown, persistence restore, danger thresholds).
  - `tests/unit/idleVillage/nightThreatFixtures.test.ts` (once fixtures are finalized) – deterministic fixture loader for TestRoster/lab harness.
- **Integration / Visual / Playwright**:
  - `tests/visual/idleVillage/night-threat-hud.spec.ts` – screenshot baseline for each danger band + mitigation tooltip state.
  - Add coverage to `tests/integration/idleVillage/minimalGameplayFlow.test.tsx` to ensure HUD updates after night cycle ticks.
  - Optional Playwright smoke via TestRoster toggle once IV-CLP-003 mounts the component.
- **Evidence Log Pattern**: `test-results/iv-clp-101-component-lab-<YYYY-MM-DD>.log` capturing scoped lint (`src/ui/idleVillage`, `scripts/idleVillage`), targeted tests above, `npm run build:check`, `npm run kanban:lint`, and telemetry payload samples.
- **Telemetry Snapshots**: Attach JSON snippets for each event to the evidence log for analytics validation.

## 7. Backlog & Kanban Hooks

- **Strategy Task Link**: `src/docs/docs/coordinator/strategy_tasks.md` row `IV-CLP-101` (update "Note coordinator" to point here).
- **Coordinator Kanban Note**: `src/docs/docs/coordinator/agent_assignments.md` entry "IV-CLP-101 – Night Threat HUD Intake" should reference this intake and MG priority.
- **Dependencies**: Blocks IV-CLP-201 (extraction) and any Minimal promotion. Depends on IV-CLP-002 (dependency mapper CLI) outputs to confirm import graph.

## 8. Intake Checklist

- [x] Metadata completed with plan link + owner.
- [x] Dependency matrix references config-first modules, hooks, assets, persistence, telemetry.
- [x] Style Lab preset + token usage defined.
- [x] Telemetry contract documented (component_lab + night threat specific events).
- [x] Testing scope + evidence log format captured.
- [x] Backlog/Kanban linkage recorded.

## 9. Promotion Readiness Notes

| Criterion | Status (0–5) | Notes |
| --- | --- | --- |
| **UX polish** | 2 | Need Style Lab glow + tooltip polish migrated from Sandbox.
| **Telemetry** | 1 | Event list defined; wiring/tests pending.
| **Performance** | 1 | 500 ms tick SLA unverified; requires bench in hook tests.
| **Accessibility** | 2 | Sandbox tooltips already localized but Minimal view lacks `aria-live` + focus outlines.

### Outstanding Risks

1. _Config drift_: `minimalGameplayConfig` currently lacks explicit danger-band copy/audio fields; extend schema during extraction.
2. _Telemetry debt_: Night-threat events exist in plan but not in analytics dashboards; coordinate with telemetry team before promotion.
3. _Persistence failures_: `PersistenceService` integration must handle async errors; include retry/fallback behavior in hook tests.

### Rollback Plan

- Keep the Night Threat HUD flag-scoped inside Component Lab/TestRoster until promotion guard passes. If regressions occur, disable the toggle via lab config without touching `MinimalGameplayPage`.
- Maintain deterministic fixtures under `scripts/idleVillage/nightThreatFixtures.ts` so Sandbox UI can revert instantly while MG surface is fixed.
