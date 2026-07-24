# WL-LORE-DROP-F5 — In-game smoke test

## Context
Phase F5 of Lore Drop Prototype (WL-LORE-DROP-001). Performs manual QA on `/minimal-gameplay` to verify lore drop functionality.

## Objectives
- Perform manual smoke test on `/minimal-gameplay`
- Verify lore drops appear correctly
- Verify lore discovery works as expected
- Document any issues found

## Scope

### Files to Modify
- (None — manual QA phase)

### Out of Scope
- New lore features (only testing)

## Guardrails

### Invariants
- **Manual QA**: This is a manual testing phase
- **Documentation**: Document all findings

### Constraints
- Must test on `/minimal-gameplay` route
- Must verify all lore drop scenarios
- Must document all issues found

## Implementation Plan

### Step 1: Prepare Test Environment
- Navigate to `/minimal-gameplay` route
- Ensure all prerequisites are met (F1-F3 completed)

### Step 2: Test Lore Drop Scenarios
- Test quest completion → lore drop
- Test location visit → lore drop
- Test curio interaction → lore drop
- Verify lore appears in LoreBook
- Verify lore is marked as discovered

### Step 3: Document Findings
- Document all successful scenarios
- Document any issues found
- Document any edge cases

### Step 4: Run Safeguards
- Run `npm run lint` (120s timeout)
- Run `npm run build:check` (180s timeout)

## Safeguards

### Pre-Execution
- Verify `WL-LORE-DROP-F3` is marked as `Completato` in Kanban

### Post-Execution
- Run `npm run lint` (120s timeout)
- Run `npm run build:check` (180s timeout)

### Evidence Log
Create `test-results/wl-lore-drop-f5-<date>.log` with:
- Lint results
- Build check output
- Manual QA findings
- Test scenario results

## Dependencies
- **blocked_by**: WL-LORE-DROP-F3 (Wire into QuestChronicle)

## Execution Hint
**manual** — This task is manual QA and requires in-game testing.

## Notes
- Manual QA on `/minimal-gameplay` route
- Document all findings thoroughly
- Report any issues found
