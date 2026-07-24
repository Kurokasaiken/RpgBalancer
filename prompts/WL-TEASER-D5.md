# WL-TEASER-D5 — Polish & controls

## Context
Phase D5 of Wanderlust Triumph Steam Concept Slice (WL-TEASER-001). Implements polish features and controls (keyboard/auto-play/timer overlay, window.__teaserController).

## Objectives
- Add keyboard controls
- Add auto-play feature
- Add timer overlay
- Add window.__teaserController
- Verify polish and controls

## Scope

### Files to Modify
- `src/ui/teaser/**` — Add polish and controls

### Out of Scope
- New teaser features (only polish)

## Guardrails

### Invariants
- **@trailer-only exemption**: No PersistenceService, no real engine, all mocked
- **Reuse existing components**: Reuse existing components with mocked props only
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- This is trailer-only code, no real gameplay integration
- 55s deterministic sequence, no random physics
- Reuse existing components with mocked props only

## Implementation Plan

### Step 1: Add Keyboard Controls
- Add keyboard navigation
- Config-driven keyboard shortcuts
- Accessibility support

### Step 2: Add Auto-Play Feature
- Add auto-play toggle
- Config-driven auto-play parameters
- Smooth auto-play transitions

### Step 3: Add Timer Overlay
- Add timer overlay display
- Config-driven timer parameters
- Skin token styling

### Step 4: Add window.__teaserController
- Add global controller for teaser
- Expose control API
- Config-driven controller parameters

### Step 5: Verify Integration
- Ensure all polish features work correctly
- Test with realistic teaser scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-TEASER-D4` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/teaser` (120s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/teaser` (120s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-teaser-d5-<date>.log` with:
- Lint results
- Build check output
- Kanban lint output
- Polish and controls summary

## Dependencies
- **blocked_by**: WL-TEASER-D4 (Consequence, legacy, outro)

## Execution Hint
**atomic** — This task is trailer-only code with @trailer-only exemption (no PersistenceService, no real engine, all mocked).

## Notes
- @trailer-only exemption applies per handoff notes
- Reuse existing components with mocked props only
- 55s deterministic sequence, no random physics
- Skin tokens are mandatory, no standalone CSS
- window.__teaserController for external control
