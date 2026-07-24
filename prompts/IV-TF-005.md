# IV-TF-005 — Modifier integration + tests

## Context
Phase 005 of Idle Village Tick & Fatigue System. Integrates fatigue system with gameplay modifier engine (GM-ENG) and creates comprehensive end-to-end tests for the complete fatigue system.

## Objectives
- Integrate fatigue with gameplay modifier engine
- Create fatigue modifier for gameplay effects
- Add comprehensive end-to-end tests
- Verify complete fatigue system flow

## Scope

### Files to Create
- `src/balancing/modifiers/fatigueModifier.ts` — Fatigue modifier implementation
- `tests/unit/idleVillage/fatigueSystem.test.ts` — End-to-end fatigue tests

### Files to Modify
- (Integration with existing GM-ENG system)

### Out of Scope
- New fatigue features (only integration and testing)

## Guardrails

### Invariants
- **Config-first**: All modifier effects in Zod schema
- **Persistence**: Use existing fatigue state from TF-003
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Modifier integration must not break existing GM-ENG logic
- Tests must cover complete fatigue system flow
- All safeguards must pass before marking task complete

## Implementation Plan

### Step 1: Create Fatigue Modifier
Create `fatigueModifier.ts` with:
- Fatigue modifier definition (effects on gameplay)
- Integration with GM-ENG modifier registry
- Config-driven modifier effects

### Step 2: Integrate with GM-ENG
- Register fatigue modifier with GM-ENG
- Ensure modifier applies correctly based on fatigue state
- Test modifier effects on gameplay

### Step 3: Add End-to-End Tests
Create comprehensive tests in `fatigueSystem.test.ts`:
- Complete fatigue flow tests (tick → fatigue → recovery → modifier)
- Integration tests with GM-ENG
- Edge case tests (max fatigue, zero fatigue, modifier stacking)
- Config validation tests

### Step 4: Verify Integration
- Ensure fatigue system works end-to-end
- Test with realistic gameplay scenarios
- Validate modifier integration

## Safeguards

### Pre-Execution
- Verify `IV-TF-002` and `GM-ENG` are marked as `Completato` in Kanban
- Run `npm run lint -- src/balancing/modifiers src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/modifiers src/engine/game/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/fatigueSystem.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-tf-005-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Fatigue system integration summary

## Dependencies
- **blocked_by**: IV-TF-002 (Tick engine fatigue application), GM-ENG (Gameplay Modifier Engine)

## Execution Hint
**verified** — This task touches invariants (config-first, modifier integration) and requires careful integration with GM-ENG while maintaining backward compatibility.

## Notes
- GM-ENG integration must not break existing modifier logic
- End-to-end tests are critical for validating complete fatigue system
- Config-driven modifier effects are mandatory
