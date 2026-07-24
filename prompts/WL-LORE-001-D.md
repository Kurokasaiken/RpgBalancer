# WL-LORE-001-D — LoreBook UI components

## Context
Phase D of Lore System (WL-LORE-001). Implements the LoreBook UI components for displaying discovered lore.

## Objectives
- Create LoreBook component
- Create LoreEntryCard component
- Create FlavorText component
- Add unit tests for UI components
- Verify UI integration

## Scope

### Files to Create
- `src/ui/components/lore/LoreBook.tsx` — Main LoreBook component
- `src/ui/components/lore/LoreEntryCard.tsx` — Individual lore entry card
- `src/ui/components/lore/FlavorText.tsx` — Flavor text display component

### Files to Modify
- (None — standalone phase)

### Out of Scope
- Gameplay integration (deferred to E)

## Guardrails

### Invariants
- **Config-first**: All UI thresholds and labels in config
- **i18n**: All UI strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- UI must be responsive and accessible
- Components must use skin tokens, not standalone CSS
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create LoreBook Component
Create `LoreBook.tsx` with:
- Display all discovered lore entries
- Filter by category and rarity
- Search functionality
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 2: Create LoreEntryCard Component
Create `LoreEntryCard.tsx` with:
- Display individual lore entry
- Show title, content, category, rarity
- Read/unread status indicator
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Create FlavorText Component
Create `FlavorText.tsx` with:
- Display flavor text with proper formatting
- Support for markdown-like syntax
- Skin token styling (no standalone CSS)
- Accessibility support (screen reader friendly)

### Step 4: Add i18n Strings
Add to `idleVillage.json`:
- LoreBook labels
- Lore entry labels
- Flavor text messages

### Step 5: Add Unit Tests
Create comprehensive tests:
- Component tests (rendering, accessibility)
- i18n coverage tests
- Skin token integration tests

### Step 6: Verify Integration
- Ensure UI displays lore state from LoreStore
- Verify skin token styling works correctly
- Test with realistic UI scenarios

## Safeguards

### Pre-Execution
- Verify `WL-LORE-001-C` is marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/components/lore` (120s timeout)
- Run `npm run test -- tests/unit/components/lore/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/components/lore` (120s timeout)
- Run `npm run test -- tests/unit/components/lore/` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-001-d-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- UI component summary

## Dependencies
- **blocked_by**: WL-LORE-001-C (LoreStore with PersistenceService)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens) and requires UI component development with proper accessibility and styling.

## Notes
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
- Accessibility support (ARIA labels) is critical
