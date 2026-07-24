# WL-LORE-001-E — Gameplay integration (quest/curio/location)

## Context
Phase E of Lore System (WL-LORE-001). Integrates the lore system with gameplay systems (quest, curio, location).

## Objectives
- Integrate lore discovery with QuestChronicle
- Integrate lore discovery with locationDetailKit
- Add i18n strings for gameplay integration
- Add unit tests for gameplay integration

## Scope

### Files to Create
- `src/ui/idleVillage/hooks/useLoreDiscoveryForQuest.ts` — Quest lore discovery hook

### Files to Modify
- `src/ui/idleVillage/components/QuestChronicle.tsx` — Integrate lore discovery
- `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx` — Integrate lore discovery
- `src/balancing/config/idleVillage/defaultConfig.ts` — Add lore drop config
- `public/locales/en/idleVillage.json` — Add i18n strings

### Out of Scope
- New lore features (only integration)

## Guardrails

### Invariants
- **Config-first**: All integration parameters in config
- **Persistence**: Use existing LoreStore from C
- **i18n**: All UI strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only for component styling

### Constraints
- Integration must not break existing gameplay systems
- Lore discovery must respect existing triggers
- i18n coverage is mandatory for all UI strings

## Implementation Plan

### Step 1: Create Quest Lore Discovery Hook
Create `useLoreDiscoveryForQuest.ts` with:
- Hook for triggering lore discovery on quest completion
- Integration with LoreDiscoveryService from B
- Config-driven discovery parameters

### Step 2: Integrate with QuestChronicle
Modify `QuestChronicle.tsx` to:
- Show lore drops on quest completion
- Display discovered lore entries
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 3: Integrate with LocationDetailKit
Modify `locationDetailKit.tsx` to:
- Show lore drops on location visit
- Display discovered lore entries
- Skin token styling (no standalone CSS)
- Accessibility support (ARIA labels)

### Step 4: Add i18n Strings
Add to `idleVillage.json`:
- Lore discovery messages
- Quest chronicle labels
- Location detail labels

### Step 5: Add Unit Tests
Create comprehensive tests:
- Integration tests (quest → lore discovery)
- Integration tests (location → lore discovery)
- i18n coverage tests

### Step 6: Verify Integration
- Ensure lore discovery works with gameplay systems
- Test with realistic gameplay scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `WL-LORE-001-B` and `WL-LORE-001-D` are marked as `Completato` in Kanban
- Run `npm run lint -- src/ui/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/ui/idleVillage` (120s timeout)
- Run `npm run test -- tests/unit/idleVillage/` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-001-e-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Gameplay integration summary

## Dependencies
- **blocked_by**: WL-LORE-001-B (LoreDiscoveryService), WL-LORE-001-D (LoreBook UI)

## Execution Hint
**verified** — This task touches invariants (i18n, skin tokens) and requires careful integration with existing gameplay systems.

## Notes
- Integration must not break existing gameplay systems
- Skin tokens are mandatory, no standalone CSS
- i18n coverage is required for all UI strings
