# REND-SYS-P2 — Sprite batching + optimization

## Context
Phase P2 of Rendering System. Implements sprite batching and rendering optimizations to improve performance for large numbers of sprites.

## Objectives
- Create sprite batching system
- Implement rendering optimizations (culling, instancing)
- Add performance monitoring
- Add unit tests for rendering optimizations

## Scope

### Files to Create
- `src/engine/rendering/spriteBatching.ts` — Sprite batching implementation
- `src/engine/rendering/renderingOptimizer.ts` — Rendering optimizations
- `tests/unit/rendering/spriteBatching.test.ts` — Unit tests

### Files to Modify
- (None — standalone phase)

### Out of Scope
- UI integration (deferred to P3)
- Telemetry integration (deferred to P4)

## Guardrails

### Invariants
- **Config-first**: All rendering parameters in Zod schema
- **Persistence**: Use `PersistenceService` for any state (though this phase is rendering-only)
- **i18n**: Any user-facing strings must use `common` namespace
- **No standalone CSS**: Skin tokens only (not applicable to this phase)

### Constraints
- Rendering optimizations must not break existing rendering
- Batching must be configurable, not hardcoded
- Tests must cover all rendering scenarios

## Implementation Plan

### Step 1: Define Rendering Config Schema
Create Zod schema for rendering parameters:
- `RenderingConfig` — batch size, culling thresholds, instancing parameters
- Validation helpers for config values

### Step 2: Implement Sprite Batching
Create `spriteBatching.ts` with:
- `batchSprites(sprites, config)` — batch sprites for efficient rendering
- Config-driven batch size and parameters
- Edge case handling (empty batches, max batch size)

### Step 3: Implement Rendering Optimizations
Create `renderingOptimizer.ts` with:
- `cullInvisibleSprites(sprites, viewport)` — cull sprites outside viewport
- `instanceSprites(sprites, config)` — instance identical sprites
- Config-driven optimization parameters

### Step 4: Add Unit Tests
Create comprehensive tests in `spriteBatching.test.ts`:
- Batching correctness tests (known inputs/outputs)
- Optimization tests (culling, instancing)
- Config sensitivity tests (changing parameters changes behavior)
- Edge case tests (empty batches, max batch size)

### Step 5: Verify Integration
- Ensure rendering optimizations work with existing rendering
- Test with realistic rendering scenarios
- Validate config integration

## Safeguards

### Pre-Execution
- Verify `REND-SYS-P1` is marked as `Completato` in Kanban
- Run `npm run lint -- src/engine/rendering` (120s timeout)
- Run `npm run test -- tests/unit/rendering/` (300s timeout)

### Post-Execution
- Run `npm run lint -- src/engine/rendering` (120s timeout)
- Run `npm run test -- tests/unit/rendering/spriteBatching.test.ts` (300s timeout)
- Run `npm run build:check` (180s timeout)
- Run `npm run kanban:lint` (30s timeout)

### Evidence Log
Create `test-results/rend-sys-p2-<date>.log` with:
- Lint results
- Test results (all tests passing)
- Build check output
- Kanban lint output
- Rendering optimization summary

## Dependencies
- **blocked_by**: REND-SYS-P1 (Rendering foundation)

## Execution Hint
**verified** — This task touches invariants (config-first, performance) and requires careful optimization to avoid breaking existing rendering.

## Notes
- Rendering optimizations must not break existing rendering
- Config must be easily tunable for performance
- Performance monitoring is critical for validation
