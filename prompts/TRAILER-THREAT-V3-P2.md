# TRAILER-THREAT-V3-P2 — Static-to-static transition (Expanded ↔ Compact)

## Context
Phase P2 of Trailer Threat Iter V3. Implements static-to-static transition between Expanded and Compact states.

## Objectives
- Add static-to-static transition logic
- Add i18n strings if needed
- Verify transition rendering

## Scope

### Files to Modify
- `src/ui/idleVillage/trailer/ThreatPresence.tsx` — Add transition logic
- `src/ui/idleVillage/trailer/TrailerThreatIter.tsx` — Add transition logic
- `public/locales/en/idleVillage.json` — Add i18n strings if needed

### Out of Scope
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

### Step 1: Add Transition Logic
Modify `ThreatPresence.tsx` and `TrailerThreatIter.tsx` to:
- Add Expanded ↔ Compact transition
- Config-driven transition timing
- Smooth frame transitions

### Step 2: Add i18n Strings (if needed)
Add to `idleVillage.json` if any user-facing strings are needed

### Step 3: Verify Integration
- Ensure transition works correctly
- Test with realistic trailer scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `TRAILER-THREAT-V3-P1` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/idleVillage/trailer` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage/trailer` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/trailer-threat-v3-p2-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Transition summary

## Dependencies
- **blocked_by**: TRAILER-THREAT-V3-P1 (4 static frames)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no i18n for copy, no gameplay state).

## Notes
- @trailer-only exemption applies per handoff notes
- Config-first for timing/animation values
- Skin tokens are mandatory, no standalone CSS
