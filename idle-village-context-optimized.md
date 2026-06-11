# Idle Village Project - Context Summary for Claude

## QUICK START - What is this project?

**Project Name**: RPG Balancer - Idle Village (Phase 12)
**Type**: Idle Incremental RPG with village management, quests, and worker placement
**Tech Stack**: React, TypeScript, Node.js 20.19.6, @dnd-kit, Zod, PersistenceService
**Theme**: Gilded Observatory (obsidian backgrounds, slate borders, ivory text, teal accents, gold highlights)
**Art Direction**: "DNA Prismatic Wanderlust" - Solar Triumph, Rude Beauty, Noble Heroic Realism

## CORE ARCHITECTURE PRINCIPLES

### 1. Config-First Design (MANDATORY)
- **Single Source of Truth**: All game values in `src/balancing/config/idleVillage/**`
- **No Magic Numbers**: Zero hardcoded values in UI/engine components
- **Transformations Only**: UI reads config → transforms → displays (no fallback logic)
- **Component Reuse**: Use existing components from `src/ui/idleVillage/components/**`
- **Telemetry**: Always use `trackTelemetryEvent` with proper payloads

### 2. Character-to-Resident Architecture (CANONICAL)
- **Primary Entity**: Character (combat domain, full stats, PersistenceService)
- **Projection**: Resident (village-specific subset of Character data)
- **Source Hierarchy**: 
  1. Character Storage (primary)
  2. Character → Resident Conversion (single canonical path)
  3. Village Resident Store (derived)
  4. Page Consumption (read-only, no transformation)
- **Forbidden Patterns**: 
  - ❌ Page-specific Character → Resident conversion
  - ❌ Multiple competing sources (TEST_ROSTER_HEROES + localStorage)
  - ❌ Scattered fallback logic
  - ❌ Test fixture leakage in production

### 3. Documentation Governance
- **Runtime Truth First**: No documentation closure before runtime verification
- **Hierarchy**: Runtime Truth → Trusted Documentation → Candidate → Draft
- **Update Process**: Implement → Verify → Update COMPONENT_MASTER_INDEX → Promote to trusted

---

## PHASE 12: IDLE VILLAGE MASTER PLAN

### Vision
Build the first complete playable version of the meta-game:
- Village with humble buildings/jobs and a house with cap limit
- Dispatch-style quest system with multiple outcomes (perfect/success/partial/fail/deadly)
- Idle combat engine integration for high-risk quests
- Worker placement inspired by German boardgames (limited slots, time as resource)
- High risk/high reward loop: injury and death available from start
- Injured characters still useful as workers (especially in advanced buildings)

### Design Pillars
1. **Config-First Idle Game**: Quest, jobs, buildings, costs/rewards in config
2. **Unified Combat & Stats**: All combat uses idle combat engine + weight-based stats
3. **High Risk, High Reward**: Quests pay more but with structural injury/death risks
4. **Worker Placement & Time as Resource**: Limited slots, time = resource
5. **Sfruttare i Feriti**: Injured characters still valuable as workers
6. **Founder Archetype & Difficulty**: Choose founder archetype, difficulty affects potential

### Core Systems

#### 12.1 Time & Activity Engine (PARTIAL)
- **Status**: Partially implemented
- **Components**: `tickIdleVillage`, `advanceTime`, `resolveJob/Quest`, `applyFatigueInjuryForActivity`
- **Gaps**: Hardcoded fatigueGain, UI manages ticking instead of SandboxEngine, Trial of Fire not integrated
- **Goal**: Global time system + scheduled activity queue
- **Key Types**: `IdleTimeUnit`, `ActivityKind` (job/quest/training/shop), `ScheduledActivity`, `VillageState`

#### 12.3 Jobs & Worker Placement (PARTIAL)
- **Status**: Partially implemented
- **Components**: Jobs configured in `defaultConfig.ts`, `resolveJob` deterministic rewards
- **Gaps**: No slot modifiers, stat scaling, fatigue config-driven, no shared controller
- **Goal**: Config-driven jobs + worker placement model
- **Config**: `jobsConfig.ts` with buildingId, slotMax, duration, relevantStats, baseReward, fatigueGain

#### 12.4 Quest System (PARTIAL)
- **Status**: Partially implemented
- **Components**: Config quest + spawn loop present
- **Gaps**: No EffectivePower calculation, multiple outcome distribution, dynamic variance categories, no combat bridge
- **Goal**: Quest system evaluating party match with multi-outcome resolution
- **Config**: `questConfig.ts` with level, tags, dangerRating, duration, min/maxPartySize, outcome profiles
- **Difficulty/Reward Variance**: Independent categories with multipliers and color bands (green/yellow/red)

#### 12.5 Combat Integration (NOT IMPLEMENTED)
- **Status**: Not implemented
- **Goal**: Resolve combat quests using idle combat engine
- **Flow**: Generate enemies → build Combatant[] → run idle combat loop → produce CombatOutcome → override quest outcome

#### 12.6 Injury & Death System (PARTIAL)
- **Status**: Partially implemented
- **Components**: Trial of Fire + heroization, HP recovery, auto-resched exist
- **Gaps**: No injury levels (light/moderate/severe) in config/UI, no building bonuses for injured
- **Goal**: Coherent injury/death system with high risk/high reward theme
- **Levels**: Light/moderate/severe with stat penalties, recovery times, compatibility

#### 12.7 Village Map & Expansion (PARTIAL)
- **Status**: Partially implemented
- **Components**: IdleVillageMapPage v0.1 with mapSlots projection
- **Gaps**: VillageSandbox no map medallions/density, no upgrade/expansion loop
- **Goal**: Compact village map + first expansion form
- **Initial Map**: 1 house, 2 job sites, 1 training ground, 1 shop, 3-4 quest nodes

#### 12.8 Economy (NOT IMPLEMENTED)
- **Status**: Not implemented
- **Goal**: Simple but meaningful economy
- **Resources**: Gold (food/equip/spell/hiring), Food (daily upkeep), Materials (building/upgrade)
- **Food Upkeep**: Each character consumes food per interval, shortage = malus (more fatigue, more injury)

---

## COMPLETED FEATURES (Phase 12)

### 12.15 Quest Risk Display (✅ COMPLETE)
- **Component**: `QuestRiskDisplay` with proportional yellow/red vertical stripes
- **Config**: `riskDisplayConfig.ts` with Style Laboratory colors, smoothing curves
- **Integration**: `QuestTelemetryPanel` with optional risk assessment section
- **Telemetry**: `quest_risk_rendered` event with complete payload
- **Tests**: Comprehensive RTL test suite

### 12.11 Phase E: Resident Drop Feedback (✅ COMPLETE)
- **Config**: `dropFeedbackConfig.ts` with visual styles, animations, messages
- **Hook**: `useDropFeedback.ts` integrated with `useResidentDropValidation`
- **UI**: `DropFeedbackUI.tsx` with overlay, tooltip, indicator, container
- **Telemetry**: `drop_feedback_shown/clicked/dismissed` events
- **Tests**: RTL test suite for hook, UI, telemetry, integration

### 12.11.b NP-141: Drop Timeline Telemetry Panel (✅ COMPLETE)
- **Analytics**: `src/analytics/idleVillageDropTimeline.ts` with normalization, metrics, export
- **Hook**: `useDropTimelineData.ts` with PersistenceService, auto-refresh, telemetry
- **Config**: `DEFAULT_DROP_TIMELINE_PANEL_CONFIG` in `dropTimelinePanelConfig.ts`
- **UI**: `DropTimelinePanel.tsx` with filters, timeline sessions, export JSON/CSV
- **Tests**: RTL suite with mock hook, states, interactions, refresh/reset/export

### 12.17 NP-038: Crew Scheduler Time Travel Tool (✅ COMPLETE)
- **Config**: Time travel configuration in `CrewSchedulerConfig`
- **Hook**: `useCrewSchedulerTimeTravel` with snapshot management, navigation
- **UI**: `CrewSchedulerTimeTravelSlider` with timeline navigation
- **Integration**: Automatic snapshot capture on key operations
- **Tests**: Comprehensive unit tests for hook functionality

### 12.9.f SlottedMedal Failed State Support (✅ COMPLETE)
- **State Mapping**: `resolveSlotState()` maps engine status to UI state
- **Visual Feedback**: Shake + fade animations with 1.2s duration
- **Audio Feedback**: Failure sounds based on type (injury/death/mission_failure)
- **Telemetry**: `slot_activity_failed` events with complete payload
- **Integration**: `ResidentSlotRack` accepts optional `getSlotActivityState` prop

### 12.12 Active HUD Notifications (✅ COMPLETE)
- **Component**: `ActiveHUDNotifications` with comprehensive notification system
- **Hook**: `useActiveHUDNotifications` for state monitoring
- **Config**: `hudNotificationConfig.ts` with notification types, priorities, styling
- **Types**: Activity, resource, resident, system notifications
- **Telemetry**: `hud_notification_generated/dismissed` events
- **Tests**: 95%+ coverage unit tests

### 12.13 Active HUD Telemetry (✅ COMPLETE)
- **Hook**: `useActiveHUDTelemetry` for HUD state monitoring
- **Events**: `hud_rendered`, `hud_empty_state`, `hud_overflow_shown`, `hud_card_selected`
- **Performance**: Performance.mark instrumentation, <16ms render target
- **Integration**: Window handlers for component interactions
- **Tests**: 95%+ coverage unit tests

### 12.14 Theater View Sync (✅ COMPLETE)
- **Component**: `TheaterOverlay` using `ActivitySlotMiniCard` (same as HUD/map)
- **Telemetry**: `theater_opened/closed/slot_selected/resident_dropped` events
- **Parity**: Same component, variants, progress, status across map/theater/HUD
- **Drop Feedback**: Highlight on valid drag, amber ring on overlay
- **Tests**: 21 comprehensive test cases

### 12.16 Risk Stripe Calibration Tool (✅ COMPLETE)
- **Component**: `RiskStripeCalibrator` with tabbed interface
- **Hook**: `useRiskCalibration` with undo/redo and persistence
- **Config**: `riskCalibrationConfig.ts` with smoothing curves, KPI targets, color palettes
- **Features**: Smoothing curve configuration, KPI target management, color palette control
- **Tests**: Comprehensive RTL test coverage

### 12.15 Activity Analytics (✅ COMPLETE)
- **Hook**: `useActivityAnalytics` for real-time data collection
- **Engine**: `IdleVillageAnalyticsEngine` for comprehensive analytics
- **Store**: `IdleVillageActivityStore` with persistent storage
- **Metrics**: Activity performance, resident efficiency, resource analytics, village-wide metrics
- **Tests**: Unit tests for hook, engine, storage, integration

### 12.17 Resident Relationship Graph (✅ COMPLETE)
- **Component**: `ResidentRelationshipGraph` with force-directed visualization
- **Hook**: `useResidentRelationshipGraph` for graph generation
- **Config**: `residentRelationshipGraphConfig.ts` with weights, thresholds, force layout
- **Relationship Types**: Shared activities, quest bonds, stat tag overlap, fatigue compatibility
- **Tests**: 300+ line test suite

### 12.12 Crew Fatigue Dashboard (✅ COMPLETE)
- **Component**: `CrewFatigueDashboard` with mini-charts
- **Hook**: `useCrewFatigueData` for data aggregation
- **Config**: `fatigueDashboardConfig.ts` with thresholds, colors, charts
- **Levels**: RESTED (0-30%), NORMAL (31-60%), TIRED (61-80%), EXHAUSTED (81-95%), CRITICAL (96-100%)
- **Tests**: Unit and integration tests

### 12.16 Resident Assignment Undo UX (✅ COMPLETE)
- **Hook**: `useResidentUndo` with stack-based undo/redo
- **UI**: `ResidentUndoPanel` with visual timeline
- **Config**: `residentUndoConfig.ts` for timeline, shortcuts, badges
- **Shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+Shift+Z (batch undo)
- **Telemetry**: `resident_undo_performed` event tracking
- **Tests**: Unit, integration, and performance tests

### 18. POI System Architecture (PARTIAL)
- **Viewer Mode**: ✅ COMPLETE - POI visualization with "Ambra Selvatica" skin
- **Drop Mode**: ⏳ PLANNED - Drag & drop from WorkerPanel to POI slots
- **Dependencies**: IV-POI-COVERAGE (complete), IV-POI-DROP (blocked), IV-POI-ARIA-LIVE (independent)
- **Integration**: TestRosterPage with ActivityCapsule, skin system, telemetry

---

## ART DIRECTION: "DNA PRISMATIC WANDERLUST"

### Core Philosophy
Antitesi del dark fantasy. Energia cinetica, libertà, e trionfo solare. Il mondo non è "sporco", è materico. La povertà non è "miseria", è rude bellezza.

### Two Pillars of the World

#### A. The Wilderness (Heart of the Project)
- **Mood**: Rude Bellezza, avventura, potenziale inespresso
- **Geography**: Valli montane (Dolomiti style), fiumi cristallini, praterie lussureggianti
- **Materials**: Legno grezzo (Timber), Pietra alpina, Paglia dorata (Golden Thatch)
- **Sky Color**: Azure Vibrante (Azzurro terso e intenso)

#### B. The Empire (Vertical South)
- **Mood**: Solar Triumph, monumentalità barocca, nobiltà pesante
- **Geography**: Deserti basaltici, architetture colossali sospese
- **Materials**: Basalto Nero venato, Bronzo Barocco (Sun-Bronze), Sete iridescenti
- **Sky Color**: Indaco profondo / Vuoto Prismatico

### Technical Pillars

#### 🧱 Split-Rendering
- **Focal Point (Faces/Icons)**: Iper-pulito, scultoreo, stile Ruan Jia. Pelle impeccabile, subsurface scattering, zero pennellate
- **Body and Matter**: Materico, "croccante", stile Jaime Jones/Jeff Easley. Pennellate d'olio larghe, impasto spesso e visibile

#### 🎨 Palette and Shadows
- **SSoT Rule**: Le ombre non sono mai grigie o marroni
- **Shadow Color**: Deep & Cool Teal / Smeraldo / Turchese
- **Light**: Bianco accecante (Solar Triumph), lens flare prismatici, polvere dorata
- **Primary Pigments**: Blu Oltremare, Verde Veronese, Rosso Cinabro, Ambra

### Artistic Stack (Specific Roles)
- **Ruan Jia**: Faces - Bellezza scultorea, pulizia digitale, luce divina sulla pelle
- **Jaime Jones**: Matter - Pennellate larghe, impasto d'olio, texture di legno e pietra
- **Sparth**: Silhouette - Monumentalità, architetture asimmetriche, scala eroica
- **Araki**: Chroma/Pose - Saturazione Azure/Veronese, pose "Alta Moda" (Vogue aesthetic)
- **Justin Gerard**: Creatures - Whimsy (estro), mistero della foresta, forme grottesche ma vibranti
- **Jeff Easley**: Monsters/Armor - Peso del bronzo, mostri leggendari, eroicismo anni '80 modernizzato

### UI Components Wanderlust

#### ActionCardBase - Narrative Detail
- **Wilderness Pillar**: Legno grezzo impasto, paglia dorata, pietra alpina, verde foresta, animazioni leggere
- **Empire Pillar**: Basalto nero venato, bronzo barocco, sete iridescenti, sun-bronze, animazioni ponderate

#### ActionHalo - Map Call
- **Wilderness Pillar**: Anelli verdi pulse leggero, glow organico, 48-60px, vitale/naturale
- **Empire Pillar**: Anelli bronze pulse forte, glow imponente, 56-72px, maestoso/imperiale

### Kill List (Enemies of DNA)
1. **NO GRIM**: Niente sporcizia fine a se stessa, niente miseria, niente teschi o decadenza
2. **NO MUD**: Niente colori fangosi, terra marrone o nebbia grigia
3. **NO SYMMETRY**: Architettura e pose asimmetriche e dinamiche
4. **NO FLAT DESIGN**: Niente superfici lisce digitali (tranne i volti), tutto deve avere "peso" tattile

---

## COMPONENT MASTER INDEX (Trusted Contracts)

### Time Engine Contract
- **Status**: trusted
- **Source**: `src/docs/docs/idle_village/trusted/time_engine_trusted.md`
- **Runtime**: `/minimal-gameplay`
- **Last Certified**: 2026-04-25
- **Notes**: Single tick source, INT-TIME-DAYNIGHT-001 completed, dual-layer verified

### POI Standard Contract
- **Status**: trusted
- **Source**: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md`
- **Runtime**: dedicated page
- **Last Certified**: 2026-04-22
- **Notes**: ActivityCapsule family, RT-POI-S-001 completed, 100% compliant

### POI Detail Contract
- **Status**: trusted
- **Source**: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`
- **Runtime**: dedicated page
- **Last Certified**: 2026-04-25
- **Notes**: PoiDetailSkinWrapper, TEST-POI-D-ALIGN-001 completed, integration verified

### Day/Night Contract
- **Status**: trusted
- **Source**: `src/docs/docs/idle_village/trusted/daynight_trusted.md`
- **Runtime**: `/minimal-gameplay`
- **Last Certified**: 2026-04-24
- **Notes**: RT-DAYN-001 audit completed - fully compliant

### Roster/Drag Contract
- **Status**: trusted
- **Source**: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md`
- **Runtime**: `/test`
- **Last Certified**: 2026-04-25
- **Notes**: VillageRosterSection, DragContext, statMatching, INT-DRAG-POI-ASSIGNMENT-001 completed

### Character-to-Resident Contract
- **Status**: trusted
- **Source**: `src/docs/docs/idle_village/trusted/character_resident_trusted.md`
- **Runtime**: `/test`, `/minimal-gameplay`
- **Last Certified**: 2026-04-24
- **Notes**: Canonical Character -> Resident conversion architecture, bootstrap pipeline verified

### Frozen Kits (Candidate Status)
- **outcomeKit**: `/minimal-outcome` - OutcomeModal canonico, 4 esiti, CSS vars, telemetria
- **marketKit**: `/minimal-market` - MarketActionCard canonico, 6 item, acquisto interattivo
- **integrationQuestFlowKit**: `/minimal-integration-quest-flow` - Composizione QuestCard→SkillCheck→OutcomeModal

---

## KEY FILE LOCATIONS

### Configuration
- `src/balancing/config/idleVillage/` - All village configuration (jobs, quests, buildings, etc.)
- `src/balancing/config/idleVillage/defaultConfig.ts` - Default configuration
- `src/balancing/config/idleVillage/jobsConfig.ts` - Job definitions
- `src/balancing/config/idleVillage/questConfig.ts` - Quest definitions
- `src/balancing/config/idleVillage/villageBuildingsConfig.ts` - Building definitions

### Engine
- `src/engine/game/idleVillage/IdleVillageEngine.ts` - Main engine with tickIdleVillage
- `src/engine/game/idleVillage/TimeEngine.ts` - Time management with advanceTime
- `src/engine/game/idleVillage/QuestResolver.ts` - Quest resolution logic

### UI Components
- `src/ui/idleVillage/components/` - Reusable UI components
- `src/ui/idleVillage/hooks/` - React hooks (useResidentDropValidation, useMapContext, etc.)
- `src/ui/idleVillage/frozen/kits/` - Frozen canonical kits (outcomeKit, marketKit, etc.)

### Trusted Documentation
- `src/docs/docs/idle_village/trusted/` - All trusted contracts
- `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` - Component index

---

## IMPORTANT RULES FOR CLAUDE

1. **ALWAYS use config-first design**: Never hardcode values in UI/engine
2. **Follow Character-to-Resident architecture**: Single canonical conversion path, no page-level transformations
3. **Check trusted contracts**: Before modifying components, check COMPONENT_MASTER_INDEX for trusted contracts
4. **Use existing components**: Reuse components from `src/ui/idleVillage/components/`
5. **Add JSDoc comments**: All functions and interfaces must have JSDoc
6. **Test thoroughly**: Unit tests, integration tests, E2E tests
7. **Telemetry integration**: Always use `trackTelemetryEvent` with proper payloads
8. **PersistenceService**: Always use async PersistenceService, never direct localStorage
9. **Gilded Observatory theme**: Use Style Laboratory tokens, obsidian backgrounds, slate borders, ivory text, teal accents, gold highlights
10. **Art direction**: Follow "DNA Prismatic Wanderlust" - Solar Triumph, Rude Beauty, Noble Heroic Realism

---

## NODE.JS VERSION
- **Required**: Node.js 20.19.6 (specified in .nvmrc)
- **Activation**: `source ~/.nvm/nvm.sh && nvm use`
- **Why**: Node 20+ has structuredClone native, required for ESLint and other tools

---

*Generated from idle-village-context.md (4374 lines condensed to ~400 lines for Claude)*
*Last Updated: 2026-06-09*
