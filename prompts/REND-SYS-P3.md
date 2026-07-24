# REND-SYS-P3 — UI hooks (rendering settings)

## Context
Phase P3 of Rendering System. Creates UI hooks and components for rendering settings (quality, performance mode), with i18n support and skin token styling.

## Objectives
- Create useRenderingSettings hook for rendering configuration
- Create RenderingSettings component for UI
- Add rendering quality presets
- Add i18n strings for rendering UI

## Scope

### Files to Create
- `src/ui/common/hooks/useRenderingSettings.ts` — Rendering settings hook
- `src/ui/common/components/RenderingSettings.tsx` — Rendering settings component

### Files to Modify
- `public/locales/en/common.json` — Add i18n strings for rendering UI

### Out of Scope
- Telemetry integration (deferred to P4)

## Guardrails

### Invariants
- **Config-first**: All UI thresholds and labels in config
- **Persistence**: Use `PersistenceService` for rendering settings
- **i18n**: All UI strings must use `common` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- UI must be responsive and accessible
- Rendering settings must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create useRenderingSettings Hook
Create `useRenderingSettings.ts` with:
- Hook for accessing rendering settings from store
- Computed values for quality, performance mode
- Actions for updating rendering settings

### Step 2: Create RenderingSettings Component
Create `RenderingSettings.tsx` with:
- Display current rendering settings (quality, performance mode)
- Controls for adjusting rendering settings
- Quality presets (low, medium, high, ultra)
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Add i18n Strings
Add to `common.json`:
- Rendering quality labels
- Performance mode labels
- Rendering settings messages

### Step 4: Add Unit Tests
Create comprehensive tests:
- Hook tests (state access, computed values)
- Component tests (rendering, accessibility)
- i18n coverage tests

### Step 5: Verify Integration
- Ensure UI displays rendering settings accurately
- Verify skin token styling works correctly
- Test with realistic rendering scenarios

## Safeguards

### Pre-Execution
- Verify `REND-SYS-P2` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/common/hooks src/ui/common/components` (120s timeout)
- Run `npm run test -- tests/unit/common/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/common/hooks src/ui/common/components` (120s timeout)
- Run `npm run test -- tests/unit/common/useRenderingSettings.test.ts tests/unit/common/RenderingSettings.test.tsx` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/rend-sys-p3-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- UI component summary

## Dependencies
- **blocked_by**: REND-SYS-P2 (Sprite batching + optimization)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens, PersistenceService) and requires UI component development with proper accessibility and styling.

## Notes
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
- PersistenceService integration is mandatory for settings
