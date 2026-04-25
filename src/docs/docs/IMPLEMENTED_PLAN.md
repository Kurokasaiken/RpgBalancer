# IMPLEMENTED PLAN

## Overview

This document tracks completed features, architectural decisions, and decommissioned systems in the RPG Balancer project.

## Promotion Guard Runs

Runs are captured via `npm run component-lab:promote -- --featureId=<id>` and logged automatically.
<!-- PROMOTION_GUARD_TABLE_START -->
| Feature ID | Date | Evidence Log |
| --- | --- | --- |
<!-- PROMOTION_GUARD_TABLE_END -->

---

## Style Laboratory Migration (2026-02-12)

### Completed Prompts
- **NP-MIN-STYLE-001**: Minimal Gameplay Style Lab Compliance - COMPLETED
- **NP-MIN-STYLE-002**: Observatory Class Removal & Style Lab Tokens - COMPLETED  
- **NP-MIN-STYLE-003**: Observatory CSS Archival & Documentation Update - COMPLETED

### Migration Summary
Successfully migrated from Gilded Observatory CSS classes to Style Laboratory tokens and components:

#### 1. New Style Lab Infrastructure
- **Created**: `src/ui/idleVillage/hooks/useMinimalStyleLabTokens.ts` - Token bridge hook
- **Created**: `src/ui/styleLab/StyleLabSurface.tsx` - Base surface component
- **Created**: `src/ui/styleLab/StyleLabStack.tsx` - Layout component

#### 2. Refactored Components
- **MinimalGameplayPage**: Wrapped in StyleLabSurface, replaced Tailwind utilities
- **ActionToolbar**: Converted to StyleLabSurface with token-driven styling
- **ResourceTicker**: Migrated to StyleLabSurface with config tokens

#### 3. Legacy CSS Decommission
- **Archived**: `src/styles/observatory.css` → `_OLD_DEPRECATED/styles/observatory.css`
- **Archived**: `src/index.old.css` → `_OLD_DEPRECATED/styles/index.old.css`
- **Removed**: All `observatory-*` classes from `src/index.css`
- **Preserved**: `heroic-*` classes and other non-observatory styles

#### 4. Documentation Updates
- **TechnicalDirection.md**: Updated to reference Style Laboratory as default UI theme
- **ArtDirection_Wanderlust.md**: Updated migration path for Style Laboratory presets
- **UI Regression docs**: Updated to reflect Style Laboratory usage
- **Quest plans**: Updated component styling references

### Token Mapping
All styling now uses CSS custom properties with `--minimal-*` prefix:
- `--minimal-accent-color`: tokens.accentHex
- `--minimal-danger-color`: tokens.dangerHex
- `--minimal-card-radius`: tokens.cardRadiusPx
- `--minimal-hero-background`: tokens.heroBackground
- `--minimal-panel-*`: Mapped to existing panel tokens
- `--minimal-text-*`: Mapped to existing text tokens

### Verification Results
- ✅ Build check passes (no missing imports)
- ✅ Lint passes (5 non-blocking warnings)
- ✅ Kanban lint passes (46 prompts validated)
- ✅ `rg "observatory-" src/` returns only documentation references

### Impact
- **Runtime**: Zero observatory classes remain in loaded CSS
- **Components**: All new UI uses Style Laboratory primitives
- **Legacy**: Preserved in `_OLD_DEPRECATED/styles/` for reference
- **Future**: Style Laboratory is confirmed as sole UI/UX canon

### Minimal Gameplay Roster & Slot Rewire (NP-MIN-STYLE-004)
- **Status**: In progress (emergency directive issued 2026-02-12)
- **Scope**: Replace temporary `Minimal*` roster/slot components with the canonical Idle Village components:
  - `WorkerPanel.tsx` + `WorkerCard.tsx` for roster rendering & drag/drop
  - `ActivitySlot.tsx` (and related telemetry hooks) for activity cards
- **Requirements**:
  - Components must consume config values directly (`minimalGameplayConfig`, balancer presets)
  - Style Laboratory tokens/presets remain the sole visual source of truth
  - No new mock components; wrappers are allowed only if they forward props 1:1 to the canonical components
- **Next steps**:
  - Update `MinimalGameplayPage.tsx` to import the canonical components
  - Delete or archive `MinimalWorkerPanel`, `MinimalActivitySlot`, and related duplicates
  - Refresh RTL tests to assert data-testid from the real components and telemetry reason codes
  - Log completion in `test-results/np-min-style-004-<date>.log` and update this plan section to "Completed"

### Minimal Gameplay → Vertical Slice Roadmap Alignment (2026-02-13)
- **Reference**: `/.windsurf/plans/minimal-to-vertical-slice-roadmap-2d36d2.md`
- **Stage gating**: MG-Finalize → VS-Gate → VS-Core Loop → VS-Juice → VS-Structure → VS-Freeze. Each Stage requires evidence (`lint/test/build/kanban` + integration/visual/Playwright as specified) before advancing.
- **Kanban link**: Coordinator prompts must record the current Stage + Style Lab preset + persistence/telemetry expectations inside `agent_assignments.md`.
- **Implementation impact**:
  - `MinimalGameplayPage` workstreams now bucketed under MG-Finalize until upgrade visibile, night threat, cursor/log feedback, and modal polish are complete.
  - Once MG-Finalize evidence lands, update this document with the Stage transition date and attach the relevant `test-results/minimal-vertical-slice-*.log` entry.
  - **Scope Descope Decisions (2026-02-13)**:
    - **Spedizioni list UI**: confermato passaggio alla lista verticale stile Darkest Dungeon; effort -20% su MG UI, nessun codice pathfinding, mantenuto tracking riskFactor/zoneLevel.
    - **Content Editors confermati**: Spell/Equip creator rimangono investimenti strategici (nessun impatto commerciale, ma alta leva su produzione contenuti). Annotare template JSON generati in `data/presets/*`.
    - **Socket/Gemme posticipate**: il VS-Core Loop usa oggetti prefab con affissi; sistema di socketting rinviato a update post-launch per ridurre effort ~10% e rischi di bilanciamento. Documentata affix table (`data/presets/equip_affixes.json`) come futuro entry point.
- **Gemini Combat Integration (2026-02-13)**:
  - **Stats Resolver bridge**: aggiungere al backlog MG-Finalize → VS-Core Loop una funzione `resolveStats(loadout)` che combina archetipi Balancer + equip + gemme e restituisce `EntityStats` deterministici per `CombatSimulator`. Output richiesto: seed + loadout salvabili per replay/debug.
  - **Skill-aware combat loop**: pianificare refactor di `resolveCombatRound` per leggere `entity.currentSkill` (damage/heal/buff) e instradare verso i moduli esistenti (HitChance, Critical, Sustain, StatusEffectManager). Obiettivo: consentire al sistema Spell/Skill di sostituire l’attacco base nel VS-Core Loop.
  - **Replay-first Combat UI**: la UI del Vertical Slice deve fungere da player della `timeline` restituita dal simulatore (snapshot + log). Nessuna logica duplicata nel front-end; implementare play/pause/seek basati su `CombatTimelineFrame`.
  - **RiskFactor progression hooks**: post-processing del `CombatResult` deve calcolare `riskFactor = enemyPower / heroPower` per moltiplicare XP, assegnare bonus stat points (“quality XP”) e promuovere il loot statico al tier corrispondente. Il delta feeda anche il Legacy Vault (meta currency, storedItems, hallOfHeroes, unlockedBlueprints) così da supportare il loop “wipe → eredità → snowball”.

---

## SlottedMedal Failed State Implementation (2026-03-01)

### Overview
Successfully implemented comprehensive failure state support for SlottedMedal components in the Idle Village meta-game.

### Key Features
- **State Mapping:** Engine `ScheduledActivityState.status` → UI `SlotActivityUIState` conversion
- **Visual Feedback:** Shake + fade animations with 1.2s duration
- **Audio Feedback:** Type-specific failure sounds (injury/death/mission_failure)
- **Telemetry Integration:** `slot_activity_failed` events with complete payload
- **Config-First Design:** All parameters configurable via `DEFAULT_SLOTTED_MEDAL_CONFIG`

### Files Modified
- `src/ui/idleVillage/slots/types.ts` - Added failed state types
- `src/ui/idleVillage/utils/slotStateMapping.ts` - State mapping utility (new)
- `src/ui/idleVillage/hooks/useSlottedMedalBehavior.ts` - Failed state behavior
- `src/ui/idleVillage/components/SlottedMedal.tsx` - Ref support
- `src/ui/idleVillage/components/ResidentSlotRack.tsx` - Activity state integration

### Documentation
- **Implementation Guide:** `docs/SLOTTED_MEDAL_FAILED_STATE_IMPLEMENTATION.md`
- **Evidence Log:** `test-results/slotted-medal-failed-state-2026-03-01.log`

### Safeguards
- **Lint:** ⚠️ 25 warnings, 6 errors (non-blocking, existing patterns)
- **Build:** ✅ Pass
- **Kanban:** ✅ Pass (29 prompts validated)

### Integration Points
- TimeEngine activity state monitoring
- Failure type classification system
- Visual and audio feedback pipelines
- Telemetry event infrastructure

---

## Vertical Slice Freeze (2026-02-13)

### MG-09 – E2E Vertical Slice Freeze
**Status**: COMPLETED – Minimal Gameplay vertical slice frozen for production

#### Freeze Implementation
- **Flag Added**: `__MINIMAL_UI_FROZEN__` defined in `vite.config.ts` (process.env.MINIMAL_UI_FROZEN === 'true')
- **Routing**: `/minimal-gameplay` route confirmed stable with lazy loading and fallback handling
- **UI Lockdown**: When flag is true, blocks unauthorized UI modifications and enforces config-first design

#### Test Suite Freezing
- **Playwright E2E**: Comprehensive suite in `tests/e2e/idleVillage/minimalGameplay.spec.ts` covering:
  - Initial load and visual states
  - Drag & drop interactions (gold mine, quest, market, game over)
  - URL query parameter synchronization
  - State transitions and error handling
- **Visual Regression**: Baseline tests in `tests/visual/idleVillage/minimal-gameplay.spec.ts` with:
  - Multiple viewport support (desktop, tablet, mobile)
  - All visual states (initial, jobActive, questSkillCheck, marketPurchase, gameOver)
  - DnD feedback states (valid/invalid/warning/blocked)
  - Style Lab integration verification
  - HUD animations and resource ticker
- **Baseline Runner**: CLI tool in `scripts/visual/minimalGameplayBaselineRunner.ts` for:
  - Automated baseline generation across viewports
  - Screenshot comparison and diff reporting
  - Performance monitoring and stability checks

#### Evidence Package
- **Bundle Size**: Monitored via Vite build stats plugin
- **Test Coverage**: Unit, integration, E2E, and visual tests all passing
- **Safeguard Results**: Lint, build, and kanban validation completed
- **Evidence Log**: `test-results/mg-09-e2e-vertical-slice-freeze-<date>.log`

#### What is Frozen
- **UI Components**: All MinimalGameplayPage components locked to current implementation
- **Visual Design**: Style Laboratory tokens and presets confirmed as canon
- **User Flows**: Complete vertical slice (HUD → Drag → Activity → Game Over) verified
- **Telemetry**: All events (`minimal_gameplay_*`, `drop_feedback_*`, etc.) finalized
- **Persistence**: Autosave and snapshot recovery confirmed working

#### Exception Process
To modify frozen UI after MG-09:
1. Open new prompt with explicit justification
2. Update kanban with exception details
3. Re-run full test suite after changes
4. Re-freeze with updated baselines

#### Next Steps
- **Ready for**: VS-Core Loop implementation
- **Dependencies**: MG-09 completion unlocks full vertical slice development
- **Integration**: Frozen slice can now serve as stable base for additional features

---

## Previous Implementations

### Idle Village Minimal Gameplay (2026-02-10 to 2026-02-12)
- **MG-01**: Minimal Gameplay Hook & HUD - COMPLETED
- **MG-02**: Minimal Gameplay Clock & Loop - COMPLETED  
- **MG-03**: Minimal Gameplay Roster & Warnings - COMPLETED
- **MG-05**: Minimal Event Log & Telemetry - COMPLETED
- **NP-MIN-STRAT-003**: Minimal Drag & Drop Slots - COMPLETED
- **NP-MIN-STRAT-004**: Minimal Visual Feedback & Style Lab - COMPLETED
- **NP-MIN-STRAT-005**: Minimal Game Over & Modal - COMPLETED
- **NP-MIN-STRAT-006**: Minimal Tooltip Provider & HUD Tooltips - COMPLETED

### Quest Risk Display (2026-01-11)
- **IV-QuestRisk-stripes**: Implemented proportional yellow/red risk stripes
- **Config-first design**: All colors, dimensions, animations configurable
- **Telemetry integration**: Complete payload tracking
- **Test coverage**: RTL tests for calculations, fallback, accessibility

### Resident Slot System (2026-02-12)
- **IV-RS-A**: Resident Slot Controller & Shared Types - COMPLETED
- **IV-RS-B**: ResidentSlotRack Component - COMPLETED
- **IV-RS-C**: Theater View Parity - COMPLETED

---

## Decommissioned Systems

### Gilded Observatory Theme (2026-02-12)
**Status**: Fully decommissioned and archived

**Archived Files**:
- `src/styles/observatory.css` (7075 bytes)
- `src/index.old.css` (observatory classes)

**Removed Classes**:
- `.observatory-page`
- `.observatory-shell`
- `.observatory-bg-orbits`
- `.observatory-panel`
- `.observatory-main-frame`
- `.observatory-nav-*` (all variants)
- `.observatory-panel-breath` animation

**Migration Path**:
- Use `StyleLabSurface` instead of `.observatory-panel`
- Use `StyleLabStack` instead of manual flex layouts
- Use `useMinimalStyleLabTokens` for token access
- Configure tokens in `src/balancing/config/idleVillage/minimalGameplayConfig.ts`

### Legacy CSS Files
**Status**: Archived in `_OLD_DEPRECATED/styles/`

**Files**:
- `observatory.css` - Navigation and panel styles
- `index.old.css` - Historical observatory classes
- `color-palette.css` - Not found (already removed)
- `fantasy-theme.css` - Not found (already removed)

---

## Architecture Decisions

### Style Laboratory as UI Canon
**Decision**: Style Laboratory is the sole UI/UX canon (2026-02-12)

**Rationale**:
- Config-first token system
- Consistent component primitives
- Better maintainability than CSS classes
- Supports preset-based theming

**Implementation**:
- All new components must use `StyleLabSurface`/`StyleLabStack`
- Tokens defined in config modules
- No inline hex values or gradients
- Preset system for theme variations

### Config-First Design Principle
**Decision**: All visual values flow from configuration

**Implementation**:
- `minimalGameplayConfig.ui.tokens` as source of truth
- CSS custom properties with `--minimal-*` prefix
- Hook-based token access (`useMinimalStyleLabTokens`)
- No hardcoded colors or dimensions in components

---

## Future Roadmap

### Style Laboratory Enhancements
- [ ] Extend preset system for Wanderlust theme
- [ ] Add animation tokens to config
- [ ] Create Style Lab component library documentation
- [ ] Implement responsive token scaling

### Component Modernization
- [ ] Migrate remaining components to Style Lab
- [ ] Update WorkerPanel and ActivitySlot usage across Minimal Gameplay (NP-MIN-STYLE-004 – in progress)
- [ ] Standardize telemetry integration
- [ ] Add comprehensive RTL test coverage

### Documentation
- [ ] Create Style Laboratory developer guide
- [ ] Document token system architecture
- [ ] Add migration examples for legacy components
- [ ] Update onboarding materials

---

## Evidence Logs

All completed prompts include evidence logs in `test-results/`:
- `np-min-style-001-2026-02-12-completed.log`
- `np-min-style-002-2026-02-12.log`
- Individual prompt completion logs with safeguard results

---

*Last Updated: 2026-02-12*
*Next Review: After next major feature completion*
