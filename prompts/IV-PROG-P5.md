# IV-PROG-P5 — Telemetry + UI integration

## Context
Phase P5 of Idle Village Progression System. Adds telemetry tracking for progression events and integrates progression system with UI components (ProgressionPanel).

## Objectives
- Add telemetry tracking for progression events (level up, power changes)
- Create ProgressionPanel UI component
- Integrate progression system with UI
- Add unit tests for telemetry and UI

## Scope

### Files to Create
- `src/analytics/idleVillage/progressionTelemetry.ts` — Telemetry event definitions
- `src/ui/idleVillage/components/ProgressionPanel.tsx` — Progression UI component
- `tests/unit/idleVillage/progressionTelemetry.test.ts` — Telemetry tests
- `tests/unit/idleVillage/ProgressionPanel.test.tsx` — UI tests

### Files to Modify
- `public/locales/en/idleVillage.json` — Add i18n strings for progression UI

### Out of Scope
- End-to-end tests (deferred to P6)
- Plan updates (deferred to P6)

## Guardrails

### Invariants
- **Config-first**: Telemetry event schemas must use Zod validation
- **Persistence**: Telemetry must use existing analytics infrastructure
- **i18n**: All UI strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only for UI styling

### Constraints
- Telemetry must not impact progression performance
- UI must be responsive and accessible
- Tests must cover all telemetry events and UI states

## Implementation Plan

### Step 1: Define Telemetry Events
Create `progressionTelemetry.ts` with:
- Zod schemas for progression events (level_up, power_change, reward_earned)
- Helper functions to emit telemetry events
- Integration with existing analytics infrastructure

### Step 2: Create ProgressionPanel
Create `ProgressionPanel.tsx` with:
- Display current level, XP, power
- Show progression bar/visualization
- Display next level requirements
- Skin token styling (no standalone CSS)

### Step 3: Add i18n Strings
Add to `idleVillage.json`:
- Level labels
- XP labels
- Power labels
- Progression messages

### Step 4: Add Unit Tests
Create comprehensive tests:
- Telemetry validation tests (schema validation, event emission)
- UI component tests (rendering, user interactions)
- Integration tests (progression → telemetry → UI)

### Step 5: Verify Integration
- Ensure telemetry events are emitted correctly
- Verify UI displays progression data accurately
- Test with realistic progression scenarios

## Safeguards

### Pre-Execution
- Verify `IV-PROG-P3` and `IV-PROG-P4` are marked as `Completato` in Kanban
- Run `npm run lint -- src/analytics/idleVillage src/ui/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/analytics/idleVillage src/ui/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/progressionTelemetry.test.ts tests/unit/idleVillage/ProgressionPanel.test.tsx` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-prog-p5-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Telemetry event summary
- UI component summary

## Dependencies
- **blocked_by**: IV-PROG-P3 (Effective power calculator), IV-PROG-P4 (Production scaling integration)

## Execution Hint
**verified** — This task touches invariants (config-first, i18n, skin tokens) and requires UI/telemetry integration with proper validation.

## Notes
- Telemetry must be additive, not modify progression logic
- UI must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings
