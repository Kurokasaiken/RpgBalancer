# TRAILER-THREAT-V3-P3 — Optional polish (timer visual, easing, audio, map reactions)

## Context
Phase P3 of Trailer Threat Iter V3. Implements optional polish features for the threat presence display.

## Objectives
- Add timer visual
- Add easing functions
- Add audio support
- Add map reactions
- Verify polish features

## Scope

### Files to Modify
- `src/ui/idleVillage/trailer/**` — Add polish features

### Out of Scope
- New trailer features (only polish)

## Guardrails

### Invariants
- **@trailer-only exemption**: No PersistenceService, no i18n for copy, no gameplay state
- **Config-first**: All timing/animation values in config
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- This is trailer-only code, no real gameplay integration
- Config must be easily tunable for timing/animation values
- Skin tokens are mandatory, no standalone CSS

## Implementation Plan

### Step 1: Add Timer Visual
- Add countdown timer display
- Config-driven timer parameters
- Skin token styling

### Step 2: Add Easing Functions
- Add easing functions for transitions
- Config-driven easing parameters
- Smooth animations

### Step 3: Add Audio Support
- Add audio for threat presence
- Config-driven audio parameters
- Optional audio (can be disabled)

### Step 4: Add Map Reactions
- Add map reactions to threat presence
- Config-driven reaction parameters
- Visual feedback on map

### Step 5: Verify Integration
- Ensure all polish features work correctly
- Test with realistic trailer scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `TRAILER-THREAT-V3-P2` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/idleVillage/trailer` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage/trailer` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/trailer-threat-v3-p3-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Polish summary

## Dependencies
- **blocked_by**: TRAILER-THREAT-V3-P2 (Static-to-static transition)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no i18n for copy, no gameplay state).

## Notes
- @trailer-only exemption applies per handoff notes
- Config-first for timing/animation values
- Skin tokens are mandatory, no standalone CSS
- Polish features are optional but recommended
