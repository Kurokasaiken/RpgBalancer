# WL-LORE-001-A — Lore config schema + sample entries

## Context
Phase A of Lore System (WL-LORE-001). Implements the lore config schema and sample lore entries.

## Objectives
- Create lore config schema
- Create sample lore entries
- Create narrative config schema
- Add unit tests for config validation

## Scope

### Files to Create
- `src/balancing/config/lore/loreConfig.ts` — Lore config schema
- `src/balancing/config/lore/loreEntries.ts` — Sample lore entries
- `src/balancing/config/narrative/narrativeConfig.ts` — Narrative config schema

### Files to Modify
- (None — standalone phase)

### Out of Scope
- LoreDiscoveryService (deferred to B)
- LoreStore (deferred to C)

## Guardrails

### Invariants
- **Config-first**: All lore strings in config (no hardcoded flavor text)
- **i18n**: Any user-facing strings must use `idleVillage` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- All lore strings must be in config
- Config must be validated with Zod schemas
- Sample entries must be diverse and representative

## Implementation Plan

### Step 1: Define Lore Config Schema
Create `loreConfig.ts` with:
- Zod schema for lore configuration
- Lore entry structure (id, title, content, category, rarity)
- Lore discovery parameters
- Validation helpers for config values

### Step 2: Create Sample Lore Entries
Create `loreEntries.ts` with:
- 12+ sample lore entries covering different categories
- Entries for: history, creatures, locations, characters, items
- Varied rarity levels (common, uncommon, rare, legendary)
- Validation against lore config schema

### Step 3: Define Narrative Config Schema
Create `narrativeConfig.ts` with:
- Zod schema for narrative configuration
- Narrative pacing parameters
- Narrative trigger parameters
- Validation helpers for config values

### Step 4: Add Unit Tests
Create comprehensive tests:
- Config validation tests (known valid/invalid configs)
- Lore entry validation tests
- Narrative config validation tests

### Step 5: Verify Integration
- Ensure all configs validate correctly
- Test with realistic lore scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Run `npm run lint -- src/balancing/config/lore src/balancing/config/narrative` (120s timeout)
- Run `npm run test -- tests/unit/balancing/config/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/balancing/config/lore src/balancing/config/narrative` (120s timeout)
- Run `npm run test -- tests/unit/balancing/config/lore/` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/wl-lore-001-a-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Lore config summary

## Dependencies
- **blocked_by**: none (foundation phase)

## Execution Hint
**verified** — This task touches invariants (config-first, i18n) and requires careful config schema design to ensure all lore strings are in config.

## Notes
- All lore strings must be in config (no hardcoded flavor text)
- Sample entries must be diverse and representative
- Config must be easily tunable for lore parameters
