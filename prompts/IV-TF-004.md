# IV-TF-004 — UI hooks (fatigue badges, rest actions)

## Context
Phase 004 of Idle Village Tick & Fatigue System. Creates UI hooks and components for displaying fatigue badges and rest actions, with i18n support and skin token styling.

## Objectives
- Create useFatigue hook for fatigue state management
- Create FatigueBadge component for displaying fatigue
- Add rest actions for fatigue recovery
- Add i18n strings for fatigue UI

## Scope

### Files to Create
- `src/ui/idleVillage/hooks/useFatigue.ts` — Fatigue state hook
- `src/ui/idleVillage/components/FatigueBadge.tsx` — Fatigue badge component

### Files to Modify
- `public/locales/en/idleVillage.json` — Add i18n strings for fatigue UI

### Out of Scope
- Modifier integration (deferred to TF-005)

## Guardrails

### Invariants
- **Config-first**: All UI thresholds and labels in config
- **Persistence**: Use existing fatigue state from TF-003
- **i18n**: All UI strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- UI must be responsive and accessible
- Fatigue badges must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create useFatigue Hook
Create `useFatigue.ts` with:
- Hook for accessing fatigue state from resident store
- Computed values for fatigue level, thresholds
- Actions for rest/recovery

### Step 2: Create FatigueBadge Component
Create `FatigueBadge.tsx` with:
- Display current fatigue level
- Visual indicator (color/icon based on fatigue level)
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Add i18n Strings
Add to `idleVillage.json`:
- Fatigue level labels
- Rest action labels
- Fatigue messages

### Step 4: Add Unit Tests
Create comprehensive tests:
- Hook tests (state access, computed values)
- Component tests (rendering, accessibility)
- i18n coverage tests

### Step 5: Verify Integration
- Ensure UI displays fatigue state accurately
- Verify skin token styling works correctly
- Test with realistic fatigue scenarios

## Safeguards

### Pre-Execution
- Verify `IV-TF-003` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/idleVillage/hooks src/ui/idleVillage/components` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage/hooks src/ui/idleVillage/components` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/useFatigue.test.ts tests/unit/idleVillage/FatigueBadge.test.tsx` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/iv-tf-004-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- UI component summary

## Dependencies
- **blocked_by**: IV-TF-003 (Resident fatigue state + recovery)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens) and requires UI component development with proper accessibility and styling.

## Notes
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
- Accessibility support (ARIA labels) is critical
