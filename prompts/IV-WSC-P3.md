# IV-WSC-P3 — UI hooks (surface viewer)

## Context
Phase P3 of World Surface Controller. Creates UI hooks and components for world surface viewer, with i18n support and skin token styling.

## Objectives
- Create useWorldSurfaceViewer hook for surface viewing
- Create WorldSurfaceViewer component for UI
- Add surface navigation controls
- Add i18n strings for surface UI

## Scope

### Files to Create
- `src/ui/idleVillage/hooks/useWorldSurfaceViewer.ts` — World surface viewer hook
- `src/ui/idleVillage/components/WorldSurfaceViewer.tsx` — World surface viewer component

### Files to Modify
- `public/locales/en/idleVillage.json` — Add i18n strings for surface UI

### Out of Scope
- Telemetry integration (deferred to P4)

## Guardrails

### Invariants
- **Config-first**: All UI thresholds and labels in config
- **Persistence**: Use existing surface state from P2
- **i18n**: All UI strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- UI must be responsive and accessible
- World surface viewer must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create useWorldSurfaceViewer Hook
Create `useWorldSurfaceViewer.ts` with:
- Hook for accessing world surface state from store
- Computed values for surface position, biome, entities
- Actions for surface navigation

### Step 2: Create WorldSurfaceViewer Component
Create `WorldSurfaceViewer.tsx` with:
- Display world surface (position, biome, entities)
- Controls for surface navigation (pan, zoom)
- Surface information display
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Add i18n Strings
Add to `idleVillage.json`:
- Surface viewer labels
- Navigation control labels
- Surface information messages

### Step 4: Add Unit Tests
Create comprehensive tests:
- Hook tests (state access, computed values)
- Component tests (rendering, accessibility)
- i18n coverage tests

### Step 5: Verify Integration
- Ensure UI displays world surface state accurately
- Verify skin token styling works correctly
- Test with realistic surface scenarios

## Safeguards

### Pre-Execution
- Verify `IV-WSC-P2` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/idleVillage/hooks src/ui/idleVillage/components` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage/hooks src/ui/idleVillage/components` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/useWorldSurfaceViewer.test.ts tests/unit/idleVillage/WorldSurfaceViewer.test.tsx` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-wsc-p3-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- UI component summary

## Dependencies
- **blocked_by**: IV-WSC-P2 (Surface state management + persistence)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens) and requires UI component development with proper accessibility and styling.

## Notes
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
- Accessibility support (ARIA labels) is critical
