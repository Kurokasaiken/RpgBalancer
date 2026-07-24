# WL-LORE-DROP-F3 — UI hooks (lore cards, rarity badges)

## Context
Phase F3 of Wanderlust Lore Drop Prototype. Creates UI hooks and components for displaying lore cards and rarity badges, with i18n support and skin token styling.

## Objectives
- Create useLoreDrop hook for lore drop state
- Create LoreCard component for displaying lore
- Add rarity badges for lore items
- Add i18n strings for lore UI

## Scope

### Files to Create
- `src/ui/wanderlust/hooks/useLoreDrop.ts` — Lore drop state hook
- `src/ui/wanderlust/components/LoreCard.tsx` — Lore card component
- `src/ui/wanderlust/components/RarityBadge.tsx` — Rarity badge component

### Files to Modify
- `public/locales/en/wanderlust.json` — Add i18n strings for lore UI

### Out of Scope
- Telemetry integration (deferred to F4)

## Guardrails

### Invariants
- **Config-first**: All UI thresholds and labels in config
- **Persistence**: Use existing lore state from F1
- **i18n**: All UI strings must use `wanderlust` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- UI must be responsive and accessible
- Lore cards must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create useLoreDrop Hook
Create `useLoreDrop.ts` with:
- Hook for accessing lore drop state from store
- Computed values for rarity, quality
- Actions for collecting/viewing lore

### Step 2: Create LoreCard Component
Create `LoreCard.tsx` with:
- Display lore content (title, description, rarity)
- Visual indicator (color/icon based on rarity)
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Create RarityBadge Component
Create `RarityBadge.tsx` with:
- Display rarity tier (common, uncommon, rare, legendary)
- Visual indicator (color based on rarity)
- Skin token styling (no standalone CSS)

### Step 4: Add i18n Strings
Add to `wanderlust.json`:
- Rarity tier labels
- Lore action labels
- Lore messages

### Step 5: Add Unit Tests
Create comprehensive tests:
- Hook tests (state access, computed values)
- Component tests (rendering, accessibility)
- i18n coverage tests

### Step 6: Verify Integration
- Ensure UI displays lore state accurately
- Verify skin token styling works correctly
- Test with realistic lore drop scenarios

## Safeguards

### Pre-Execution
- Verify `WL-LORE-DROP-F2` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/wanderlust/hooks src/ui/wanderlust/components` (120s timeout)
- Run `npm run test -- tests/unit/wanderlust/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/wanderlust/hooks src/ui/wanderlust/components` (120s timeout)
- Run `npm run test -- tests/unit/wanderlust/useLoreDrop.test.ts tests/unit/wanderlust/LoreCard.test.tsx tests/unit/wanderlust/RarityBadge.test.tsx` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-drop-f3-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- UI component summary

## Dependencies
- **blocked_by**: WL-LORE-DROP-F2 (Lore drop mechanics + config)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens) and requires UI component development with proper accessibility and styling.

## Notes
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
- Accessibility support (ARIA labels) is critical
