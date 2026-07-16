# Implementation Plan 05: Seed / Procedural Variation
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** Medium  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Duration:** 2 weeks

---

## Executive Summary

Build a deterministic seed system that provides procedural variation for both gameplay and visual elements. This phase establishes a hierarchical seed structure (World → Village → Entity → Component → Visual) that ensures consistent, reproducible variation while maintaining randomness for diversity.

**Key Deliverables:**
- Hierarchical seed system with 5 levels
- Deterministic RNG implementation
- Visual variation pipeline (scratches, patina, decorations)
- Gameplay variation pipeline (loot, events, triggers)
- Seed validation system
- Comprehensive unit tests
- Documentation

---

## Objectives

### Primary Objectives
1. Implement hierarchical seed system with 5 levels
2. Build deterministic RNG for consistent results
3. Create visual variation pipeline for materials
4. Create gameplay variation pipeline for systems
5. Establish seed validation system

### Success Criteria
- Hierarchical seed system functional (5 levels)
- Deterministic RNG with consistent results
- Visual variation pipeline operational
- Gameplay variation pipeline operational
- Seed validation comprehensive
- Unit test coverage > 80%
- Zero breaking changes to existing RNG usage

---

## Architecture

### Hierarchical Seed System
**Purpose:** Provide structured, hierarchical seeds for consistent variation.

**Seed Hierarchy:**
```
World Seed (base)
├── Village Seed (derived from world)
├── Entity Seed (derived from village)
├── Component Seed (derived from entity)
└── Visual Seed (derived from component)
```

**Interface:**
```typescript
interface SeedHierarchy {
  world: number;
  village: number;
  entity: number;
  component: number;
  visual: number;
}

interface SeedDerivation {
  deriveSeed(parentSeed: number, context: string): number;
  deriveHierarchy(baseSeed: number, contexts: string[]): SeedHierarchy;
}
```

### Deterministic RNG
**Purpose:** Provide consistent random number generation from seeds.

**Requirements:**
- Same seed = same sequence of random numbers
- Different seed = different but consistent sequence
- No global state (pure functions)
- Support for multiple RNG algorithms

**Interface:**
```typescript
interface DeterministicRNG {
  seed: number;
  next(): number;
  nextFloat(): number;
  nextInt(min: number, max: number): number;
  nextBoolean(): boolean;
  nextChoice<T>(choices: T[]): T;
  shuffle<T>(array: T[]): T[];
  reset(): void;
}
```

### Visual Variation Pipeline
**Purpose:** Generate visual imperfections from seeds.

**Variation Types:**
- Scratches - Surface damage patterns
- Patina - Oxidation and aging
- Decorations - Position and type
- Texture variations - Noise patterns
- Color shifts - Subtle hue changes

**Interface:**
```typescript
interface VisualVariationPipeline {
  generateScratches(seed: number, count: number): Scratch[];
  generatePatina(seed: number, intensity: number): PatinaPattern;
  generateDecorations(seed: number, positions: Position[]): Decoration[];
  generateTextureVariation(seed: number): TexturePattern;
  generateColorShift(seed: number, baseColor: string): string;
}
```

### Gameplay Variation Pipeline
**Purpose:** Generate gameplay variation from seeds.

**Variation Types:**
- Loot tables - Item drops
- Event triggers - Random events
- Entity stats - Stat variations
- Spawn patterns - Entity placement
- Quest variations - Quest parameters

**Interface:**
```typescript
interface GameplayVariationPipeline {
  generateLoot(seed: number, table: LootTable): Loot[];
  generateEvent(seed: number, events: Event[]): Event;
  generateStatVariation(seed: number, baseStats: Stats): Stats;
  generateSpawnPattern(seed: number, area: Area): SpawnPoint[];
  generateQuestVariation(seed: number, baseQuest: Quest): Quest;
}
```

### Seed Validation
**Purpose:** Validate seed structure and derivation.

**Validation Rules:**
- Seed must be valid number
- Seed must be in valid range
- Derivation context must be valid string
- Hierarchy must be properly derived
- RNG state must be valid

**Interface:**
```typescript
interface SeedValidator {
  validateSeed(seed: number): ValidationResult;
  validateDerivation(parentSeed: number, context: string): ValidationResult;
  validateHierarchy(hierarchy: SeedHierarchy): ValidationResult;
  validateRNG(rng: DeterministicRNG): ValidationResult;
}
```

---

## Implementation Phases

### Phase 5.1: Hierarchical Seed System (Days 1-2)

**Objective:** Implement hierarchical seed system with derivation logic.

**Tasks:**
1. Create `src/game/seed/seedHierarchy.ts`
   - Define SeedHierarchy interface
   - Implement deriveSeed function
   - Implement deriveHierarchy function
   - Implement seed validation
   - Create seed utilities

2. Create `src/game/seed/__tests__/seedHierarchy.test.ts`
   - Test seed derivation
   - Test hierarchy derivation
   - Test seed validation
   - Test seed utilities
   - Test consistency (same input = same output)

**Deliverables:**
- `src/game/seed/seedHierarchy.ts` (200+ lines)
- `src/game/seed/__tests__/seedHierarchy.test.ts` (150+ lines)
- Hierarchical seed system functional

**Safeguards:**
- `npm run lint -- src/game/seed/`
- `npm run test -- src/game/seed/__tests__/seedHierarchy.test.ts`
- `npm run build:check`

---

### Phase 5.2: Deterministic RNG (Days 3-4)

**Objective:** Build deterministic RNG implementation.

**Tasks:**
1. Create `src/game/seed/deterministicRNG.ts`
   - Implement DeterministicRNG class
   - Implement next() method
   - Implement nextFloat() method
   - Implement nextInt() method
   - Implement nextBoolean() method
   - Implement nextChoice() method
   - Implement shuffle() method
   - Implement reset() method

2. Create `src/game/seed/__tests__/deterministicRNG.test.ts`
   - Test deterministic behavior
   - Test all RNG methods
   - Test reset functionality
   - Test consistency across calls
   - Test different seeds produce different sequences

**Deliverables:**
- `src/game/seed/deterministicRNG.ts` (300+ lines)
- `src/game/seed/__tests__/deterministicRNG.test.ts` (250+ lines)
- Deterministic RNG functional

**Safeguards:**
- `npm run lint -- src/game/seed/`
- `npm run test -- src/game/seed/__tests__/deterministicRNG.test.ts`
- `npm run build:check`

---

### Phase 5.3: Visual Variation Pipeline (Days 5-7)

**Objective:** Create visual variation pipeline for materials.

**Tasks:**
1. Create `src/game/seed/visualVariationPipeline.ts`
   - Implement generateScratches
   - Implement generatePatina
   - Implement generateDecorations
   - Implement generateTextureVariation
   - Implement generateColorShift

2. Integrate with material system
   - Connect visual pipeline to materials
   - Add seed support to material definitions
   - Update material rendering with variations

3. Create `src/game/seed/__tests__/visualVariationPipeline.test.ts`
   - Test scratch generation
   - Test patina generation
   - Test decoration generation
   - Test texture variation
   - Test color shift
   - Test consistency (same seed = same result)

**Deliverables:**
- `src/game/seed/visualVariationPipeline.ts` (400+ lines)
- Integrated with material system
- `src/game/seed/__tests__/visualVariationPipeline.test.ts` (300+ lines)
- Visual variation pipeline functional

**Safeguards:**
- `npm run lint -- src/game/seed/`
- `npm run test -- src/game/seed/__tests__/visualVariationPipeline.test.ts`
- `npm run build:check`

---

### Phase 5.4: Gameplay Variation Pipeline (Days 8-9)

**Objective:** Create gameplay variation pipeline for systems.

**Tasks:**
1. Create `src/game/seed/gameplayVariationPipeline.ts`
   - Implement generateLoot
   - Implement generateEvent
   - Implement generateStatVariation
   - Implement generateSpawnPattern
   - Implement generateQuestVariation

2. Integrate with game systems
   - Connect gameplay pipeline to loot system
   - Connect gameplay pipeline to event system
   - Connect gameplay pipeline to stat system
   - Add seed support to game entities

3. Create `src/game/seed/__tests__/gameplayVariationPipeline.test.ts`
   - Test loot generation
   - Test event generation
   - Test stat variation
   - Test spawn pattern
   - Test quest variation
   - Test consistency (same seed = same result)

**Deliverables:**
- `src/game/seed/gameplayVariationPipeline.ts` (350+ lines)
- Integrated with game systems
- `src/game/seed/__tests__/gameplayVariationPipeline.test.ts` (250+ lines)
- Gameplay variation pipeline functional

**Safeguards:**
- `npm run lint -- src/game/seed/`
- `npm run test -- src/game/seed/__tests__/gameplayVariationPipeline.test.ts`
- `npm run build:check`

---

### Phase 5.5: Seed Validation (Days 10-11)

**Objective:** Establish comprehensive seed validation system.

**Tasks:**
1. Create `src/game/seed/seedValidator.ts`
   - Implement validateSeed
   - Implement validateDerivation
   - Implement validateHierarchy
   - Implement validateRNG
   - Create Zod schemas for validation

2. Create `src/game/seed/__tests__/seedValidator.test.ts`
   - Test seed validation
   - Test derivation validation
   - Test hierarchy validation
   - Test RNG validation
   - Test error messages

**Deliverables:**
- `src/game/seed/seedValidator.ts` (250+ lines)
- Zod schemas for validation
- `src/game/seed/__tests__/seedValidator.test.ts` (200+ lines)
- Seed validation comprehensive

**Safeguards:**
- `npm run lint -- src/game/seed/`
- `npm run test -- src/game/seed/__tests__/seedValidator.test.ts`
- `npm run build:check`

---

### Phase 5.6: Integration & Documentation (Days 12-14)

**Objective:** Integrate all systems and create documentation.

**Tasks:**
1. Create `src/game/seed/index.ts`
   - Export all public APIs
   - Create convenience functions
   - Create default instances

2. Integration testing
   - Test full workflow (hierarchy → RNG → visual → gameplay)
   - Test consistency across systems
   - Test performance
   - Test error handling

3. Create documentation
   - Seed System Guide
   - API Reference
   - Visual Variation Guide
   - Gameplay Variation Guide

**Deliverables:**
- `src/game/seed/index.ts` (100+ lines)
- Integration test suite (200+ lines)
- Seed System Guide (1500+ words)
- API Reference (1000+ words)
- Visual Variation Guide (500+ words)
- Gameplay Variation Guide (500+ words)

**Safeguards:**
- `npm run lint -- src/game/seed/`
- `npm run test -- src/game/seed/`
- `npm run build:check`
- `npm run kanban:lint`

---

## File Structure

```
src/game/seed/
├── seedHierarchy.ts                  # Hierarchical seed system
├── deterministicRNG.ts               # Deterministic RNG
├── visualVariationPipeline.ts        # Visual variation pipeline
├── gameplayVariationPipeline.ts     # Gameplay variation pipeline
├── seedValidator.ts                  # Seed validation
├── index.ts                          # Public API exports
└── __tests__/
    ├── seedHierarchy.test.ts
    ├── deterministicRNG.test.ts
    ├── visualVariationPipeline.test.ts
    ├── gameplayVariationPipeline.test.ts
    ├── seedValidator.test.ts
    └── integration.test.ts

docs/guides/
├── seed_system_guide.md              # Seed System Guide
├── visual_variation_guide.md         # Visual Variation Guide
└── gameplay_variation_guide.md        # Gameplay Variation Guide
```

---

## Key Code Examples

### Seed Hierarchy Usage
```typescript
import { SeedHierarchy } from '@/game/seed';

const hierarchy = SeedHierarchy.deriveHierarchy(928372, [
  'village',
  'woodmill_001',
  'building',
  'visual'
]);

// Returns:
// {
//   world: 928372,
//   village: 123456,  // derived from world + 'village'
//   entity: 789012,   // derived from village + 'woodmill_001'
//   component: 345678, // derived from entity + 'building'
//   visual: 901234    // derived from component + 'visual'
// }
```

### Deterministic RNG Usage
```typescript
import { DeterministicRNG } from '@/game/seed';

const rng = new DeterministicRNG(12345);

// Generate random numbers
const num1 = rng.next();      // Always returns same value for seed 12345
const num2 = rng.nextFloat(); // Always returns same value
const num3 = rng.nextInt(1, 100); // Always returns same value
const bool = rng.nextBoolean(); // Always returns same value

// Reset to initial state
rng.reset();
const num1Again = rng.next(); // Same as first num1
```

### Visual Variation Usage
```typescript
import { VisualVariationPipeline } from '@/game/seed';

const pipeline = new VisualVariationPipeline();

// Generate scratches
const scratches = pipeline.generateScratches(visualSeed, 5);
// Returns: [{ x: 10, y: 20, length: 15, angle: 45 }, ...]

// Generate patina
const patina = pipeline.generatePatina(visualSeed, 0.4);
// Returns: { pattern: 'oxidation', intensity: 0.4, color: '#8b7355' }

// Generate decorations
const decorations = pipeline.generateDecorations(visualSeed, [
  { x: 50, y: 50 },
  { x: 100, y: 100 }
]);
// Returns: [{ position: { x: 50, y: 50 }, type: 'rivet' }, ...]
```

### Gameplay Variation Usage
```typescript
import { GameplayVariationPipeline } from '@/game/seed';

const pipeline = new GameplayVariationPipeline();

// Generate loot
const loot = pipeline.generateLoot(gameplaySeed, lootTable);
// Returns: [{ itemId: 'sword', quantity: 1 }, { itemId: 'gold', quantity: 50 }]

// Generate stat variation
const stats = pipeline.generateStatVariation(gameplaySeed, baseStats);
// Returns: { str: 12, dex: 8, int: 15 } // ±10% variation from base

// Generate spawn pattern
const spawns = pipeline.generateSpawnPattern(gameplaySeed, area);
// Returns: [{ x: 100, y: 200, entity: 'goblin' }, ...]
```

---

## Success Criteria

### Functional Requirements
- ✅ Hierarchical seed system with 5 levels
- ✅ Deterministic RNG with consistent results
- ✅ Visual variation pipeline operational
- ✅ Gameplay variation pipeline operational
- ✅ Seed validation comprehensive
- ✅ Unit test coverage > 80%
- ✅ Zero breaking changes to existing RNG usage

### Non-Functional Requirements
- ✅ Performance < 0.1ms for seed derivation
- ✅ Performance < 0.01ms for RNG next()
- ✅ Performance < 1ms for visual variation generation
- ✅ Performance < 1ms for gameplay variation generation
- ✅ Memory usage < 5MB for seed system
- ✅ Zero runtime errors in normal operation
- ✅ Consistency: same seed = same result (100% reliable)

### Integration Requirements
- ✅ Compatible with Phase 1 (Component Runtime)
- ✅ Compatible with Phase 2 (Rendering Primitives)
- ✅ Compatible with Phase 3 (Material Engine)
- ✅ Compatible with existing RNG usage
- ✅ Ready for Phase 6 (Village Evolution)
- ✅ Ready for Phase 8 (Frozen Kit Migration)

---

## Risks & Mitigations

### Risk 1: Inconsistent RNG
**Risk:** RNG might not be truly deterministic across platforms.

**Mitigation:**
- Use well-tested RNG algorithm (Mulberry32, PCG, etc.)
- Test RNG consistency across platforms
- Provide fallback RNG implementations
- Document RNG behavior clearly
- Add consistency tests

### Risk 2: Seed Collisions
**Risk:** Different contexts might produce same derived seed.

**Mitigation:**
- Use robust seed derivation algorithm
- Include context hash in derivation
- Test for seed collisions
- Provide collision detection
- Add context salt if needed

### Risk 3: Visual Variation Performance
**Risk:** Visual variation generation could be slow.

**Mitigation:**
- Cache variation results
- Lazy generate variations
- Optimize generation algorithms
- Provide complexity controls
- Benchmark performance continuously

### Risk 4: Gameplay Balance Issues
**Risk:** Procedural variation could break game balance.

**Mitigation:**
- Constrain variation ranges
- Validate variation results
- Provide balance testing tools
- Document variation rules
- Add balance validation

---

## Dependencies

### Internal Dependencies
- Phase 1 (Component Runtime) - must be completed first
- Phase 2 (Rendering Primitive System) - must be completed first
- Phase 3 (Material Engine) - must be completed first

### External Dependencies
- TypeScript (already in project)

### Blocked By
- Phase 1 (Component Runtime) - must be completed first
- Phase 2 (Rendering Primitive System) - must be completed first
- Phase 3 (Material Engine) - must be completed first

### Blocking
- Phase 6 (Village Evolution) depends on Phase 5 completion
- Phase 8 (Frozen Kit Migration) depends on Phase 5 completion

---

## Timeline

- **Phase 5.1:** Days 1-2 (Hierarchical Seed System)
- **Phase 5.2:** Days 3-4 (Deterministic RNG)
- **Phase 5.3:** Days 5-7 (Visual Variation Pipeline)
- **Phase 5.4:** Days 8-9 (Gameplay Variation Pipeline)
- **Phase 5.5:** Days 10-11 (Seed Validation)
- **Phase 5.6:** Days 12-14 (Integration & Documentation)

**Total Duration:** 2 weeks (14 working days)

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 5.1 Execution:** Begin Phase 5.1 (Hierarchical Seed System) with derivation logic.
3. **Daily Standups:** Conduct daily standups to track progress and address blockers.
4. **Continuous Integration:** Run safeguards after each phase to ensure quality.
5. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Test Coverage Requirements

### SeedHierarchy Tests
- [ ] Seed derivation from parent
- [ ] Hierarchy derivation from base
- [ ] Seed validation
- [ ] Seed utilities
- [ ] Consistency (same input = same output)
- [ ] Different contexts produce different seeds
- [ ] Seed range validation
- [ ] Seed type validation

### DeterministicRNG Tests
- [ ] Deterministic behavior (same seed = same sequence)
- [ ] next() method
- [ ] nextFloat() method
- [ ] nextInt() method
- [ ] nextBoolean() method
- [ ] nextChoice() method
- [ ] shuffle() method
- [ ] reset() functionality
- [ ] Different seeds produce different sequences
- [ ] No global state (pure functions)

### VisualVariationPipeline Tests
- [ ] Scratch generation
- [ ] Patina generation
- [ ] Decoration generation
- [ ] Texture variation
- [ ] Color shift
- [ ] Consistency (same seed = same result)
- [ ] Different seeds produce different results
- [ ] Variation count constraints
- [ ] Variation intensity constraints

### GameplayVariationPipeline Tests
- [ ] Loot generation
- [ ] Event generation
- [ ] Stat variation
- [ ] Spawn pattern
- [ ] Quest variation
- [ ] Consistency (same seed = same result)
- [ ] Different seeds produce different results
- [ ] Variation range constraints
- [ ] Balance validation

### SeedValidator Tests
- [ ] Seed validation
- [ ] Derivation validation
- [ ] Hierarchy validation
- [ ] RNG validation
- [ ] Error messages
- [ ] Zod schema validation
- [ ] Invalid seed detection
- [ ] Invalid context detection
