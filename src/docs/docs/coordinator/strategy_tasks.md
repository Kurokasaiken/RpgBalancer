# Strategy Task Intake

|Task ID|Descrizione / Link piano|Origine (Strategia)|File / Aree impattate|Stato|Priorità / KPI|Note coordinator|
|-------|------------------------|-------------------|----------------------|-----|--------------|----------------|
|MG-01|Minimal Gameplay – Hook & HUD reale (`minimal_gameplay_vertical_slice_plan.md` §MG-01)|Phase 12 vertical slice plan|src/ui/idleVillage/MinimalWireframePage.tsx → MinimalGameplayPage, src/balancing/config/idleVillage/minimalConfig.ts, src/store/useMinimalGameplay.ts, tests/unit/idleVillage/MinimalGameplayPage.test.tsx|pending|KPI: HUD dati reali, zero magic numbers, lint/test/build pass|Prereq per tutte le milestone successive|
|MG-02|Minimal Gameplay – Clock & Loop Controls (`minimal_gameplay_vertical_slice_plan.md` §MG-02)|Phase 12 vertical slice plan|src/ui/idleVillage/components/minimal/ClockWidget.tsx (nuovo), src/ui/idleVillage/MinimalGameplayPage.tsx, src/store/useMinimalGameplay.ts, src/balancing/config/idleVillage/minimalConfig.ts|pending|KPI: pause/resume/reset funzionanti, telemetry tick/pause, loop configurabile|Dipende da MG-01 completato|
|MG-03|Minimal Gameplay – Roster & Resource Warnings (`minimal_gameplay_vertical_slice_plan.md` §MG-03)|Phase 12 vertical slice plan|src/ui/idleVillage/components/WorkerPanel.tsx, WorkerCard.tsx, MinimalGameplayPage.tsx, src/store/useMinimalGameplay.ts, src/balancing/config/idleVillage/minimalConfig.ts|pending|KPI: roster reale con warning configurabili, drag token pronto|Richiede MG-01 e MG-02 per dati e loop|
|IV-P12|Idle Village Phase 12 – Core Systems & UI rollout (`src/docs/docs/plans/idle_village_phase12_task_breakdown.md`)|Master Plan Phase 12|src/engine/game/idleVillage/*, src/ui/idleVillage/**, src/balancing/config/idleVillage/**, tests/{unit,e2e}/idleVillage/**, docs/plans/idle_village_phase12_task_breakdown.md|pending|KPI: Phase 12 vertical slice playable, config-first, lint/test/build pass per subphase|Coordinator generating prompt batches for phases 12.1–12.10|
|(es. WS6.3-S1)|Punch Club minimal UI – sezione Visione #3|village_sandbox_refactor_plan.md|VillageSandbox.tsx, PunchClubPage.tsx|pending|KPI: tempo carico < 2s|Attende risorse UI|
|WS6.3-S2|Spec `useSandboxInteractionMode` + picker mobile|village_sandbox_refactor_plan.md §WS6.3 / strategy/idle_village_punch_club_vision.md §5|src/ui/idleVillage/hooks/useSandboxInteractionMode.ts (nuovo), useSandboxDragController.ts, VillageSandbox.tsx|pending|KPI: tap-to-assign < 3 tocchi su mobile QA|Richiede definizione KPI UX|
|GT-1|Annotare Punch Club come laboratorio interno (no marketing) in MASTER_PLAN + market research|strategy/idle_village_punch_club_vision.md §3|docs/MASTER_PLAN.md, docs/plans/MARKET_RESEARCH_ANALYSIS.md|pending|KPI: zero riferimenti Punch Club nei piani marketing pubblici|—|
|GT-2|Creare `go_to_market_steam_first.md` con calendario marketing e KPI|MARKET_RESEARCH_ANALYSIS.md / PROFIT_LEVERS_IDLE_VILLAGE.md|docs/strategy/go_to_market_steam_first.md (nuovo), profili marketing correlati|pending|KPI: doc linkato da Master Plan + PROFIT_LEVERS|—|
|GT-3|Formalizzare checklist playtest Punch Club mobile-first|strategy/idle_village_punch_club_vision.md §5|strategy/idle_village_punch_club_vision.md (nuova sezione) o nuovo doc punch_club_playtest.md|pending|KPI: metriche per sessione (tempo ciclo, #tap, gold/food) definite|Richiede template logging|
|GM-REG|Gameplay Modifier Registry Spec (`/.windsurf/plans/gameplay-modifier-system-8c890c.md`)|gameplay-modifier-system plan|docs/plans/idle_village_modifiers_plan.md (nuovo)|pending|KPI: schema + cataloghi completi, telemetry/test requirements definiti|Master task per rollout registry|
|GM-MP|Core Plan Updates per Gameplay Modifier System|gameplay-modifier-system plan|MASTER_PLAN.md, docs/plans/idle_village_progression_system_plan.md, docs/plans/idle_village_tick_fatigue_plan.md, /.windsurf/plans/style-lab-flexibility-1a9890.md|pending|KPI: sezioni aggiornate, nessun numero magico, link al registry|Dipende da GM-REG|
|GM-BLD|Builder & Tooling Guidelines per Modifier Registry|gameplay-modifier-system plan|docs/idle_village/builder_tooling.md (nuovo o esistente), docs/plans/idle_village_modifiers_plan.md (appendici), docs/idle_village/* config notes|pending|KPI: checklist tooling completa, serializzazione config-first, zero inline numbers|Dipende da GM-REG|
|GM-MIG|Gameplay Modifier Migration & Telemetry Appendix|gameplay-modifier-system plan|docs/plans/idle_village_modifiers_plan.md (appendice), docs/reports/* (sezione telemetry), analytics docs|pending|KPI: lista migrazioni + eventi telemetry documentati, test plan definito|Dipende da GM-REG|
|GM-ENG|Gameplay Modifier Engine Implementation|gameplay-modifier-system plan|src/balancing/modifiers/gameplayModifierEngine.ts, src/balancing/config/idleVillage/gameplayModifierRegistry.ts, tests/unit/balancing/gameplayModifierEngine.test.ts|pending|KPI: deterministic evaluation order + stacking verified by tests|Dipende da GM-REG|
|GM-UI|Style Lab Stat Modifier Visualization Alignment|gameplay-modifier-system plan|src/ui/styleLab/components/StatModifierDisplay.tsx, src/ui/idleVillage/components/**, /.windsurf/plans/style-lab-flexibility-1a9890.md|pending|KPI: registry metadata rendered with config-driven tokens, tests updated|Dipende da GM-REG e GM-MP|
|GM-TEL|Gameplay Modifier Telemetry & Logging Pipeline|gameplay-modifier-system plan|src/analytics/idleVillage/modifierTelemetry.ts, telemetryProvider.ts, docs/plans/idle_village_modifiers_plan.md (appendice) |pending|KPI: modifier_applied/removed/stack_changed events emitted + documented|Dipende da GM-REG|
|PC-M1|Landing Punch Club mobile-first + redirect automatico su device mobili|strategy/idle_village_punch_club_vision.md §1, §5|src/ui/punchClub/MobileLanding.tsx, App.tsx router, tests/punch-club-landing.spec.ts|✅ 2026-01-04|KPI: /punch-club caricabile in <2s su mobile, redirect da homepage mobile attivo|Hero KPI + redirect condizionale + opt-out via PersistenceService + Playwright smoke|
|PC-M2|Distribuzione mobile PWA/Testflight-like + telemetria export|strategy/idle_village_punch_club_vision.md §3-§5|public/manifest.webmanifest, src/service-worker.ts, scripts/mobilePlaytestLogger.ts, tests/punch-club-touch-mode.spec.ts, docs/tests/PLAYWRIGHT_GUIDE.md|pending|KPI: install success ≥90 %, cold start <3 s, 100 % sessioni con export JSON log|Richiede guida playtester aggiornata + smoke Playwright install prompt|
|KS-064|Mobile PWA Accessibility Fix (Ufficiale)|village_sandbox_refactor_plan.md|public/manifest.json, public/index.html, src/ui/balancing/Balancer.tsx, tests/fixtures/villageSandbox.ts|✅ 2026-01-08|KPI: PWA scope completo, icone/screenshot validi, build:check pass|Evidence: test-results/ks-064-mobile-pwa-completion-2026-01-08.log|
|KS-030|Phase E – Spec & validation plan per drag/drop mappa (desktop-first)|strategy/idle_village_punch_club_vision.md §5.2 / village_sandbox_refactor_plan.md §WS6|src/ui/idleVillage/hooks/useSandboxDragController.ts, src/ui/idleVillage/components/LocationCard.tsx, tests/phaseE-dragdrop.spec.ts|✅ 2026-01-08|KPI: 0 hardcode, feedback latency <50 ms, Playwright phaseE suite green|Evidence: test-results/ks-030-phase-e-validation-2026-01-08.log (validation + telemetry + tests) |
|PC-M3|Punch Club PWA “link generico” con consenso log e tagging sessione|strategy/idle_village_punch_club_vision.md §5.3 / punch_club_playtest.md|App router `/punch-club`, `punch_club_playtest.md`, picker telemetry pipeline, scripts/mobilePlaytestLogger.ts|pending|KPI: share link servito <2 s, consenso log obbligatorio, session tag presente nel log entro 5 s|Richiede smoke Playwright desktop/mobile + update guida tester|
|KS-080|STS Numeric Simulator Spec & Telemetry Plan (`docs/archmage/STS_NumericSimulator_Spec.md`)|Richieste operative recenti 9 gen 2026 @Archmage strategy doc|docs/archmage/STS_NumericSimulator_Spec.md, src/docs/docs/strategy/Archmage: trascend the trascendence.md, docs/archmage/MTG_Weaknesses_MasterGameplay.md, src/docs/docs/coordinator/agent_assignments.md|✅ 2026-01-09|KPI: spec approvata + telemetria mana/agency/pacing definita|Evidence: test-results/KS-080-spec-2026-01-09.log (lint + build:check)|
|IV-POI-QA-GATE|Manual QA Gatekeeping & Evidence Log|ACTIVITY_CAPSULE_TESTING_PLAN.md §213-216 (IV-POI-QA-GATE depends on all above)|test-results/iv-poi-manual-qa-<date>.log (evidence log), src/docs/docs/coordinator/agent_assignments.md (update)|pending|KPI: Owner explicit confirmations for Keyboard/ARIA/Drop/Skin deliverables, dedicated evidence log, Kanban updated only after "implementazione corretta" feedback|Depends on IV-POI-QA-CHECKLIST completion (ready)
|IV-PS0|Idle Village Production Scaling System – Phase P0|idle_village_progression_system_plan.md §3.5-4 / MASTER_PLAN.md|src/engine/game/idleVillage/ProductionEngine.ts, src/balancing/config/idleVillage/{types.ts,defaultConfig.ts}, tests/unit/idleVillage/ProductionEngine.test.ts, docs/reports/village_base_production_system_implementation_2026-01-15.md|✅ 2026-01-15|KPI: productionScaling config-first, 20/20 tests green, build+lint pass|Evidence: test-results/iv-production-scaling-2026-01-15.log (build/test/lint suite)|
|KS-005|Kanban lint integration & policy doc|docs/docs/coordinator/agent_assignments.md §Istruzioni, docs/strategy/idle_village_punch_club_vision.md §5.1, README.md §Contributing|scripts/prepromptGuard.sh, .github/workflows/ci.yml, docs/docs/coordinator/agent_assignments.md, docs/docs/strategy/idle_village_punch_club_vision.md, README.md|pending|KPI: kanban:lint passa su CI, policy documentata|Integra lint in workflow per evitare duplicati prompt|
|NP-040|Idle Village Scenario Task Planner Documentation – Complete doc scenario planner Phase E + strategy task entry + evidence log|idle_village_plan.md §12.17 (Phase E implementation)|docs/plans/idle_village_scenario_planner_phase_e.md (nuovo), strategy_tasks.md (entry), evidence log|✅ 2026-01-13|KPI: 13/13 scenari documentati con implementazione details, evidence log completo|Evidence: test-results/np-040-scenario-planner-doc-2026-01-13.log|
|AM-1|Spell-creature lifecycle implementation|docs/archmage/GameplayPillars.md|src/balancing/spell/, src/ui/archmage/|pending|KPI: lifecycle stages balanced|New Archmage priority|
|AM-2|Mental palace expansion systems|docs/archmage/GameplayPillars.md|src/balancing/palace/, src/ui/archmage/|pending|KPI: room stats config-driven|New Archmage priority|
|AM-3|Expedition duel mechanics|docs/archmage/GameplayPillars.md|src/engine/combat/, src/ui/archmage/|pending|KPI: creature combats <50ms latency|New Archmage priority|
|E2E-VRT-001|Physical E2E Testing System – Visual Regression + Real Interactions|docs/plans/physical_e2e_testing_plan.md|Dockerfile.visual-tests, tests/visual/*, tests/utils/physicalInteraction.ts, playwright.config.ts, .github/workflows/visual-regression.yml|pending|KPI: 63 baseline screenshots, 100% visual regression detection, <5min CI execution, Docker consistency|6 phases, 32h total, covers Idle Village + STS + Balancer + Mobile|
|NP-078|Idle Village Visual Baseline Wave 2 – Phase 12 map visual regression baseline capture|E2E-VRT-001 / idle_village_plan.md §12 (Phase 12)|tests/visual/idleVillage/phase12-baseline.spec.ts, tests/visual/idleVillage/phase12-interactions.spec.ts, tests/utils/visualInteraction/idleVillageMap.ts, docs/visual/idle_village_phase12_baseline.md|pending|KPI: 25 baseline screenshots for Phase 12 map, 100% visual regression detection, interaction coverage for drag-drop/mini-cards/ActivitySlot, baseline stability across 3 runs|Visual regression for Phase 12 map with ActivitySlot mini-cards and Active HUD|
|NP-079|STS Intent Overlay Visual Regression – Visual regression testing for STS intent overlay system|E2E-VRT-001 / NP-001 STS Intent Overlay|tests/visual/sts/intent-overlay-baseline.spec.ts, tests/visual/sts/intent-overlay-interactions.spec.ts, tests/utils/visualInteraction/stsIntentOverlay.ts, docs/visual/sts_intent_overlay_baseline.md|pending|KPI: 15 baseline screenshots for intent overlay, 100% visual regression detection, interaction coverage for hover/click/keyboard, overlay positioning accuracy|Visual regression for STS intent overlay with hover states and keyboard navigation|
|NP-076|Punch Club Telemetry Log Ingest CLI – CLI tool for ingesting and processing Punch Club session logs|punch_club_playtest.md §4 / mobile playtest telemetry pipeline|scripts/cli/logIngestCLI.ts, src/analytics/punchClubLogProcessor.ts, docs/tools/punch_club_log_ingest_guide.md, tests/unit/punchClub/LogIngestCLI.test.ts|pending|KPI: CLI processes 10k log lines <2s, validates JSON schema 100%, generates CSV/JSON reports, supports filtering by date/session|CLI tool for playtest log processing and analytics export|
|NP-097|Balancer Stress Report Generator – CLI tool for generating comprehensive stress test reports from Monte Carlo simulations|Phase 10.5 marginal utility analysis / StressTestArchetypeGenerator|scripts/balancer/stressReportGenerator.ts, src/balancing/analytics/StressReportGenerator.ts, docs/analytics/balancer_stress_report_generator.md, tests/unit/balancer/StressReportGenerator.test.ts|pending|KPI: Report generation <5s for 10k simulations, JSON/CSV/Markdown export, 100% data validation, automated KPI calculations|CLI tool for balancer stress test analysis and reporting|
|WL-STY-010|Idle Village ActivityCapsule Skin Override (resident_slotrack_signature) – convert capsule-detail-window mock into config tokens|`.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md` §WL-STY-002 / `capsule-detail-window.html`|src/ui/idleVillage/skins/activityCapsuleSkinConfig.ts, src/ui/idleVillage/components/ActivityCapsule.tsx, src/balancing/config/idleVillage/testHarnessConfig.ts, tests/unit/idleVillage/ActivityCapsule.skin.test.tsx|pending|KPI: Capsule renders matching mock on `/test`, 100% config-driven tokens, tests covering CSS vars + telemetry|Depends on Style Lab flexibility plan + capsule-detail mock, prerequisite for POI detail window rollout|
|WL-STY-011|Idle Village Activity Capsule Detail Skin & Harness Integration – apply capsule-detail-window frame to ActivityCardDetail/TestRosterPage|`.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md` §WL-STY-005 / `capsule-detail-window.html`|src/ui/idleVillage/components/ActivityCardDetail.tsx, src/ui/idleVillage/components/DetailPanelCard.tsx, src/ui/idleVillage/TestRosterPage.tsx, src/ui/idleVillage/skins/activityCapsuleDetailSkinConfig.ts (nuovo), tests/unit/idleVillage/ActivityCardDetail.skin.test.tsx, tests/e2e/idleVillage/testRosterPgCards.spec.ts|pending|KPI: Detail window matches mock, config-first tokens, `/test` harness click-through verified via Playwright + RTL|Depends on WL-STY-010 capsule override + Style Lab flexibility tokens|
|IV-DRAG-FIX|Idle Village Drag Assignment Fix – Fix automatic resident assignment to only occur on valid slot drop or click|User request drag assignment behavior fix|src/ui/idleVillage/hooks/useSandboxDragController.ts, src/ui/idleVillage/hooks/useSandboxInteractionMode.ts, tests/unit/idleVillage/useSandboxDragController.test.ts|pending|KPI: Assignment only on valid slot drop or click, no auto-assignment to random slots, drag feedback preserved|Fix handleLocationResidentDrop to prevent auto-assignment to any free slot|

## Idle Village Component Lab

All Component Lab candidates must use the shared intake template (`component_lab_intake_template.md`) before being converted into prompts. Priorities follow the MG (Minimal Gameplay) and VS (Village Sandbox) streams.

|Task ID|Descrizione / Link piano|Origine (Strategia)|File / Aree impattate|Stato|Priorità / KPI|Note coordinator|
|-------|------------------------|-------------------|----------------------|-----|--------------|----------------|
|IV-CLP-101|Night Threat HUD – tactical alert bar & warning badges (`/.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#night-threat-hud`)|Component Lab – Candidate Intake|src/ui/idleVillage/components/NightThreatHUD.tsx, src/balancing/config/idleVillage/nightThreatConfig.ts, src/ui/styleLab/presets/minimalFrontier.ts, tests/unit/idleVillage/NightThreatHUD.test.tsx|pending|MG – threat update latency ≤50 ms tick, telemetry `component_lab_viewed`/`interacted`|Template: [Component Lab Intake](component_lab_intake_template.md#1-candidate-metadata) (§1–§6)|
|IV-CLP-102|Expedition List – mission roster + risk chips (`/.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#expedition-list`)|Component Lab – Candidate Intake|src/ui/idleVillage/components/ExpeditionList.tsx, src/balancing/config/idleVillage/expeditionsConfig.ts, src/ui/styleLab/structures/StyleLabSurface.tsx, tests/unit/idleVillage/ExpeditionList.test.tsx|pending|MG – list hydration under 150 ms, telemetry coverage 100%|Template: [Component Lab Intake](component_lab_intake_template.md#2-problem-statement--kpis) + dependency matrix|
|IV-CLP-103|Combat Replay UI – timeline + playback controls (`/.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#combat-replay-ui`)|Component Lab – Candidate Intake|src/ui/idleVillage/components/CombatReplayPanel.tsx, src/engine/game/idleVillage/CombatReplayEngine.ts, src/ui/styleLab/motion/presets.ts, tests/unit/idleVillage/CombatReplayPanel.test.tsx|pending|VS – replay scrubber accuracy ±1 tick, evidence log export|Template: [Component Lab Intake](component_lab_intake_template.md#5-telemetry-instrumentation-contract) + Playwright baseline|
|IV-CLP-104|Minimal Game Over Modal polish (`/.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#game-over-modal`)|Component Lab – Candidate Intake|src/ui/idleVillage/components/MinimalGameOverModal.tsx, src/ui/styleLab/tokens/minimalGameplayTokens.ts, src/analytics/telemetry/telemetryProvider.ts, tests/unit/idleVillage/MinimalGameOverModal.test.tsx|pending|MG – modal accessibility AA, telemetry `component_lab_promoted` ready|Template: [Component Lab Intake](component_lab_intake_template.md#6-testing--evidence-requirements) + promotion scorecard|
|IV-CLP-105|Resource Pinball Monitor – animated resource flow (`/.windsurf/workflows/idle-village-component-lab-plan-21fd14.md#resource-pinball`)|Component Lab – Candidate Intake|src/ui/idleVillage/components/ResourcePinballMonitor.tsx, src/balancing/config/idleVillage/resourcePinballConfig.ts, public/assets/idleVillage/pinball/, tests/unit/idleVillage/ResourcePinballMonitor.test.tsx|pending|VS – animation never stalls, Style Lab motion tokens enforced|Template: [Component Lab Intake](component_lab_intake_template.md#4-style-laboratory--visual-guardrails) + persistence key checklist|

## KS-081 STS Agent Checklist

### Pre-Task Setup

- [ ] Review KS-080 spec and current STS documentation
- [ ] Check completed KS-081 tasks for patterns and dependencies
- [ ] Verify current component documentation coverage
- [ ] Run `npm run lint -- docs` and `npm run build:check`
- [ ] Review telemetry contract for required events

### Component Development

- [ ] Follow STS naming conventions (STS prefix)
- [ ] Implement accessibility features (high contrast, screen reader)
- [ ] Add telemetry events for user interactions
- [ ] Use STS hooks (useSTSHighContrast, useSTSLiveRegion)
- [ ] Follow retro terminal aesthetic guidelines

### Documentation Requirements

- [ ] Component API documentation (props, hooks, events)
- [ ] Integration examples and usage patterns
- [ ] Accessibility implementation notes
- [ ] Performance considerations and benchmarks
- [ ] Troubleshooting guide for common issues

### Testing Requirements

- [ ] Unit tests for component logic
- [ ] Integration tests for STS workflow
- [ ] Accessibility tests (WCAG compliance)
- [ ] Performance tests (rendering, memory)
- [ ] Telemetry event validation

### Post-Task Completion

- [ ] Update component documentation
- [ ] Add to STS documentation coverage matrix
- [ ] Update prompt map with completion status
- [ ] Run safeguard suite (lint, build:check, kanban:lint)
- [ ] Create evidence log with test results

### Quality Gates

- __Documentation Coverage__: ≥ 80% for new components
- __Accessibility__: 100% WCAG 2.2 AA compliance
- __Performance__: < 100ms render time
- __Telemetry__: All user interactions tracked
- __Code Quality__: Zero lint errors, minimal warnings

> Quando la discussione Strategia definisce un nuovo task, aggiungi una riga qui. Il coordinator aggiornerà `Stato` e `Note` quando il task viene convertito in prompt operativo o bloccato.
