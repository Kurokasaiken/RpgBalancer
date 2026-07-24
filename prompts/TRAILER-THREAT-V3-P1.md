# TRAILER-THREAT-V3-P1 — 4 static frames

## Context
Phase P1 of Trailer Threat Iter V3. Implements 4 static frames for the threat presence display.

## Objectives
- Create ThreatPresence component with 4 static frames
- Create TrailerThreatIter component
- Add trailer config
- Verify static frame rendering

## Scope

### Files to Create
- `src/ui/idleVillage/trailer/ThreatPresence.tsx` — Threat presence component
- `src/ui/idleVillage/trailer/TrailerThreatIter.tsx` — Trailer threat iter component
- `src/balancing/config/idleVillage/trailerConfig.ts` — Trailer config

### Files to Modify
- (None — standalone phase)

### Out of Scope
- Static-to-static transition (deferred to P2)
- Optional polish (deferred to P3)

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

### Step 1: Define Trailer Config Schema
Create `trailerConfig.ts` with:
- Zod schema for trailer configuration
- Timing parameters for threat frames
- Animation parameters
- Validation helpers for config values

### Step 2: Create ThreatPresence Component
Create `ThreatPresence.tsx` with:
- 4 static frames for threat presence
- Frame transitions based on config
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Create TrailerThreatIter Component
Create `TrailerThreatIter.tsx` with:
- Main component for threat iteration
- Integration with ThreatPresence
- Config-driven timing
- Skin token styling (no standalone CSS)

### Step 4: Verify Integration
- Ensure 4 static frames render correctly
- Test with realistic trailer scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Run `npm run lint -- src/ui/idleVillage/trailer` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage/trailer src/balancing/config/idleVillage` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/trailer-threat-v3-p1-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Static frame summary

## Dependencies
- **blocked_by**: none (foundation phase)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no i18n for copy, no gameplay state).

## Notes
- @trailer-only exemption applies per handoff notes
- Config-first for timing/animation values
- Skin tokens are mandatory, no standalone CSS
