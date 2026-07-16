# Implementation Plan 01: Component Runtime
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** High  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Duration:** 2 weeks

---

## Executive Summary

Build the core runtime infrastructure for the config-driven component system. This phase establishes the foundation for all subsequent phases by implementing the ComponentRegistry, ComponentFactory, ComponentDefaultResolver, and ValidationSystem.

**Key Deliverables:**
- ComponentRegistry for centralized component management
- ComponentFactory for component instantiation
- ComponentDefaultResolver for automatic context resolution
- ValidationSystem for contract validation
- Runtime context system
- Comprehensive unit tests
- Documentation

---

## Objectives

### Primary Objectives
1. Create a centralized registry for all game components
2. Build a factory system for component instantiation
3. Implement automatic default resolution for isolated component behavior
4. Establish validation system for component contracts
5. Create runtime context management

### Success Criteria
- Components can be registered and retrieved from registry
- Components can be instantiated with single-line calls
- Components work in isolation with automatic defaults
- All component contracts are validated before registration
- Runtime context is properly managed and propagated
- Unit test coverage > 80%
- Zero breaking changes to existing systems

---

## Architecture

### Component Registry
**Purpose:** Centralized storage and retrieval of component contracts.

**Responsibilities:**
- Register component contracts
- Retrieve component contracts by ID
- Validate contracts before registration
- Prevent duplicate registrations
- Provide registry queries (by category, by type)

**Interface:**
```typescript
interface ComponentRegistry {
  register(contract: GameComponentContract): void;
  get(id: string): GameComponentContract | undefined;
  getByCategory(category: ComponentCategory): GameComponentContract[];
  getAll(): GameComponentContract[];
  has(id: string): boolean;
  unregister(id: string): void;
}
```

### Component Factory
**Purpose:** Instantiate components from contracts.

**Responsibilities:**
- Create component instances from contracts
- Apply runtime context
- Apply overrides
- Handle component lifecycle
- Provide component pooling for performance

**Interface:**
```typescript
interface ComponentFactory {
  create(
    entityId: string,
    overrides?: Partial<GameComponentContract>
  ): ComponentInstance;
  createBatch(
    entityIds: string[],
    overrides?: Partial<GameComponentContract>
  ): ComponentInstance[];
  pool(instance: ComponentInstance): void;
  getPooled(entityId: string): ComponentInstance | undefined;
}
```

### Component Default Resolver
**Purpose:** Provide automatic defaults for isolated component behavior.

**Resolution Order:**
1. Explicit Props (highest priority)
2. Runtime Context
3. Component Defaults
4. Global Defaults
5. Fallback Safe Mode (lowest priority)

**Interface:**
```typescript
interface ComponentDefaultResolver {
  resolve(
    contract: GameComponentContract,
    runtimeContext: RuntimeContext,
    explicitProps?: Partial<GameComponentContract>
  ): ResolvedComponentConfig;
}
```

### Validation System
**Purpose:** Validate component contracts before registration.

**Validation Rules:**
- Required fields present
- Field types correct
- Value ranges valid
- References to other components valid
- i18n keys exist
- Render primitives exist
- Physics profiles valid

**Interface:**
```typescript
interface ValidationSystem {
  validate(contract: GameComponentContract): ValidationResult;
  validateBatch(contracts: GameComponentContract[]): ValidationResult[];
  getSchema(category: ComponentCategory): z.ZodSchema;
}
```

### Runtime Context
**Purpose:** Provide context for component resolution.

**Context Properties:**
- Current scene/map
- Device capabilities
- User preferences
- Performance settings
- Language/locale
- Skin preset

**Interface:**
```typescript
interface RuntimeContext {
  scene: string;
  device: DeviceCapabilities;
  preferences: UserPreferences;
  performance: PerformanceSettings;
  locale: string;
  skinPreset: string;
}
```

---

## Implementation Phases

### Phase 1.1: Schema Definitions (Days 1-2)

**Objective:** Define TypeScript interfaces and Zod schemas.

**Tasks:**
1. Create `src/game/runtime/schemas.ts`
   - Define GameComponentContract interface
   - Define all sub-interfaces (RenderContract, PhysicsContract, etc.)
   - Create Zod schemas for validation
   - Export types and schemas

2. Create `src/game/runtime/types.ts`
   - Export all TypeScript types
   - Create type guards
   - Create utility types

**Deliverables:**
- `src/game/runtime/schemas.ts` (200+ lines)
- `src/game/runtime/types.ts` (100+ lines)
- Zod schemas for all contracts
- Type guards for all contracts

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run build:check`

---

### Phase 1.2: Component Registry (Days 3-4)

**Objective:** Implement centralized component registry.

**Tasks:**
1. Create `src/game/runtime/ComponentRegistry.ts`
   - Implement ComponentRegistry class
   - Implement registration logic
   - Implement retrieval logic
   - Implement validation on registration
   - Implement duplicate prevention

2. Create `src/game/runtime/__tests__/ComponentRegistry.test.ts`
   - Test registration
   - Test retrieval
   - Test duplicate prevention
   - Test validation
   - Test queries

**Deliverables:**
- `src/game/runtime/ComponentRegistry.ts` (300+ lines)
- `src/game/runtime/__tests__/ComponentRegistry.test.ts` (200+ lines)
- 100% test coverage for registry

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run test -- src/game/runtime/__tests__/ComponentRegistry.test.ts`
- `npm run build:check`

---

### Phase 1.3: Component Factory (Days 5-6)

**Objective:** Implement component instantiation factory.

**Tasks:**
1. Create `src/game/runtime/ComponentFactory.ts`
   - Implement ComponentFactory class
   - Implement creation logic
   - Implement override application
   - Implement context application
   - Implement pooling system

2. Create `src/game/runtime/__tests__/ComponentFactory.test.ts`
   - Test component creation
   - Test override application
   - Test context application
   - Test pooling
   - Test batch creation

**Deliverables:**
- `src/game/runtime/ComponentFactory.ts` (400+ lines)
- `src/game/runtime/__tests__/ComponentFactory.test.ts` (300+ lines)
- 100% test coverage for factory

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run test -- src/game/runtime/__tests__/ComponentFactory.test.ts`
- `npm run build:check`

---

### Phase 1.4: Component Default Resolver (Days 7-8)

**Objective:** Implement automatic default resolution.

**Tasks:**
1. Create `src/game/runtime/ComponentDefaultResolver.ts`
   - Implement ComponentDefaultResolver class
   - Implement resolution order logic
   - Implement explicit props priority
   - Implement runtime context application
   - Implement component defaults
   - Implement global defaults
   - Implement fallback safe mode

2. Create `src/game/runtime/__tests__/ComponentDefaultResolver.test.ts`
   - Test resolution order
   - Test explicit props priority
   - Test runtime context application
   - Test component defaults
   - Test global defaults
   - Test fallback safe mode

**Deliverables:**
- `src/game/runtime/ComponentDefaultResolver.ts` (350+ lines)
- `src/game/runtime/__tests__/ComponentDefaultResolver.test.ts` (250+ lines)
- 100% test coverage for resolver

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run test -- src/game/runtime/__tests__/ComponentDefaultResolver.test.ts`
- `npm run build:check`

---

### Phase 1.5: Validation System (Days 9-10)

**Objective:** Implement contract validation system.

**Tasks:**
1. Create `src/game/runtime/ValidationSystem.ts`
   - Implement ValidationSystem class
   - Implement required field validation
   - Implement type validation
   - Implement range validation
   - Implement reference validation
   - Implement i18n key validation
   - Implement render primitive validation
   - Implement physics profile validation

2. Create `src/game/runtime/__tests__/ValidationSystem.test.ts`
   - Test required field validation
   - Test type validation
   - Test range validation
   - Test reference validation
   - Test i18n key validation
   - Test render primitive validation
   - Test physics profile validation

**Deliverables:**
- `src/game/runtime/ValidationSystem.ts` (400+ lines)
- `src/game/runtime/__tests__/ValidationSystem.test.ts` (300+ lines)
- 100% test coverage for validation

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run test -- src/game/runtime/__tests__/ValidationSystem.test.ts`
- `npm run build:check`

---

### Phase 1.6: Runtime Context (Days 11-12)

**Objective:** Implement runtime context management.

**Tasks:**
1. Create `src/game/runtime/RuntimeContext.ts`
   - Define RuntimeContext interface
   - Implement context provider
   - Implement context consumer
   - Implement context updates
   - Implement context persistence

2. Create `src/game/runtime/__tests__/RuntimeContext.test.ts`
   - Test context creation
   - Test context updates
   - Test context consumption
   - Test context persistence

**Deliverables:**
- `src/game/runtime/RuntimeContext.ts` (200+ lines)
- `src/game/runtime/__tests__/RuntimeContext.test.ts` (150+ lines)
- 100% test coverage for context

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run test -- src/game/runtime/__tests__/RuntimeContext.test.ts`
- `npm run build:check`

---

### Phase 1.7: Integration & Documentation (Days 13-14)

**Objective:** Integrate all systems and create documentation.

**Tasks:**
1. Create `src/game/runtime/index.ts`
   - Export all public APIs
   - Create convenience functions
   - Create default instances

2. Create integration tests
   - Test full workflow (register → create → resolve)
   - Test error handling
   - Test performance

3. Create documentation
   - Component Runtime Guide
   - API Reference
   - Usage Examples
   - Migration Guide

**Deliverables:**
- `src/game/runtime/index.ts` (100+ lines)
- Integration test suite (200+ lines)
- Component Runtime Guide (1000+ words)
- API Reference (500+ words)
- Usage Examples (500+ words)
- Migration Guide (500+ words)

**Safeguards:**
- `npm run lint -- src/game/runtime/`
- `npm run test -- src/game/runtime/`
- `npm run build:check`
- `npm run kanban:lint`

---

## File Structure

```
src/game/runtime/
├── schemas.ts                          # TypeScript interfaces + Zod schemas
├── types.ts                            # Type exports and guards
├── ComponentRegistry.ts                # Registry implementation
├── ComponentFactory.ts                 # Factory implementation
├── ComponentDefaultResolver.ts        # Default resolver implementation
├── ValidationSystem.ts                # Validation system implementation
├── RuntimeContext.ts                  # Runtime context implementation
├── index.ts                            # Public API exports
└── __tests__/
    ├── schemas.test.ts
    ├── ComponentRegistry.test.ts
    ├── ComponentFactory.test.ts
    ├── ComponentDefaultResolver.test.ts
    ├── ValidationSystem.test.ts
    ├── RuntimeContext.test.ts
    └── integration.test.ts

docs/guides/
└── component_runtime_guide.md         # Component Runtime Guide
```

---

## Key Code Examples

### Component Registration
```typescript
import { ComponentRegistry } from '@/game/runtime';

const registry = new ComponentRegistry();

// Register a component
registry.register({
  id: 'building.woodmill.ancient',
  version: '1.0.0',
  category: 'building',
  defaults: {
    context: 'village',
    size: { width: 200, height: 150 },
    state: 'level-1'
  },
  render: {
    primitive: 'wood-structure',
    material: 'old-oak'
  },
  physics: {
    mass: 999,
    interaction: 'static',
    drag: false
  },
  i18n: {
    namespace: 'buildings',
    key: 'woodmill.ancient'
  }
});
```

### Component Creation
```typescript
import { ComponentFactory } from '@/game/runtime';

const factory = new ComponentFactory(registry);

// Create component instance
const woodmill = factory.create('building.woodmill.ancient');

// Create with overrides
const upgradedWoodmill = factory.create('building.woodmill.ancient', {
  defaults: {
    state: 'level-2'
  }
});

// Create batch
const buildings = factory.createBatch([
  'building.woodmill.ancient',
  'building.blacksmith.basic',
  'building.farm.small'
]);
```

### Default Resolution
```typescript
import { ComponentDefaultResolver } from '@/game/runtime';

const resolver = new ComponentDefaultResolver();

// Resolve with runtime context
const resolved = resolver.resolve(
  contract,
  {
    scene: 'village',
    device: { type: 'desktop', performance: 'high' },
    preferences: { complexity: 'rich' },
    performance: { maxLayers: 12 },
    locale: 'en',
    skinPreset: 'wanderlust'
  },
  {
    // Explicit props override everything
    defaults: {
      size: { width: 300, height: 200 }
    }
  }
);
```

### Validation
```typescript
import { ValidationSystem } from '@/game/runtime';

const validator = new ValidationSystem();

// Validate single contract
const result = validator.validate(contract);
if (!result.valid) {
  console.error('Validation failed:', result.errors);
}

// Validate batch
const results = validator.validateBatch(contracts);
const invalid = results.filter(r => !r.valid);
if (invalid.length > 0) {
  console.error(`${invalid.length} contracts failed validation`);
}
```

---

## Success Criteria

### Functional Requirements
- ✅ ComponentRegistry with registration, retrieval, and queries
- ✅ ComponentFactory with creation, overrides, and pooling
- ✅ ComponentDefaultResolver with 5-level resolution order
- ✅ ValidationSystem with comprehensive validation rules
- ✅ RuntimeContext with context management
- ✅ Zero breaking changes to existing systems
- ✅ Unit test coverage > 80%

### Non-Functional Requirements
- ✅ Performance < 1ms for component registration
- ✅ Performance < 5ms for component creation
- ✅ Performance < 2ms for default resolution
- ✅ Memory usage < 10MB for runtime system
- ✅ Zero runtime errors in normal operation
- ✅ Comprehensive error messages for validation failures

### Integration Requirements
- ✅ Compatible with existing skin system
- ✅ Compatible with existing i18n system
- ✅ Compatible with existing component system
- ✅ Ready for Phase 2 (Rendering Primitive System)
- ✅ Ready for Phase 4 (Physics System)

---

## Risks & Mitigations

### Risk 1: Breaking Existing Components
**Risk:** New runtime system could break existing component usage.

**Mitigation:**
- Maintain backward compatibility
- Use feature flags for new system
- Provide migration guide
- Test extensively with existing components
- Rollback plan if issues arise

### Risk 2: Performance Degradation
**Risk:** Registry and factory overhead could slow down component creation.

**Mitigation:**
- Implement efficient data structures (Map, Set)
- Implement component pooling
- Cache validation results
- Benchmark performance continuously
- Optimize hot paths

### Risk 3: Validation Complexity
**Risk:** Validation rules could become too complex to maintain.

**Mitigation:**
- Use Zod schemas for declarative validation
- Keep validation rules simple and composable
- Document validation rules clearly
- Provide validation error helpers
- Review validation rules regularly

### Risk 4: Context Conflicts
**Risk:** Runtime context could conflict with component defaults.

**Mitigation:**
- Clear resolution order (explicit → context → defaults → global → fallback)
- Document resolution order clearly
- Provide context override mechanisms
- Test context resolution thoroughly
- Provide context debugging tools

---

## Dependencies

### Internal Dependencies
- Existing skin system (`skinConfigRegistry.ts`)
- Existing i18n system (`react-i18next`)
- Existing component system (`src/ui/idleVillage/components/`)

### External Dependencies
- Zod (already in project)
- TypeScript (already in project)

### Blocked By
- None (can start immediately)

### Blocking
- Phase 2 (Rendering Primitive System) depends on Phase 1 completion
- Phase 3 (Material Engine) depends on Phase 1 completion
- Phase 4 (Physics System) depends on Phase 1 completion
- Phase 5 (Seed System) depends on Phase 1 completion
- Phase 6 (Village Evolution) depends on Phase 1 completion
- Phase 7 (Modding Architecture) depends on Phase 1 completion
- Phase 8 (Frozen Kit Migration) depends on Phase 1 completion

---

## Timeline

- **Phase 1.1:** Days 1-2 (Schema Definitions)
- **Phase 1.2:** Days 3-4 (Component Registry)
- **Phase 1.3:** Days 5-6 (Component Factory)
- **Phase 1.4:** Days 7-8 (Component Default Resolver)
- **Phase 1.5:** Days 9-10 (Validation System)
- **Phase 1.6:** Days 11-12 (Runtime Context)
- **Phase 1.7:** Days 13-14 (Integration & Documentation)

**Total Duration:** 2 weeks (14 working days)

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 1.1 Execution:** Begin Phase 1.1 (Schema Definitions) with interfaces and schemas.
3. **Daily Standups:** Conduct daily standups to track progress and address blockers.
4. **Continuous Integration:** Run safeguards after each phase to ensure quality.
5. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Test Coverage Requirements

### ComponentRegistry Tests
- [ ] Register valid contract
- [ ] Register invalid contract (should fail)
- [ ] Register duplicate contract (should fail)
- [ ] Get existing contract
- [ ] Get non-existent contract (should return undefined)
- [ ] Get by category
- [ ] Get all contracts
- [ ] Has existing contract
- [ ] Has non-existent contract
- [ ] Unregister existing contract
- [ ] Unregister non-existent contract (should fail)

### ComponentFactory Tests
- [ ] Create component from existing contract
- [ ] Create component from non-existent contract (should fail)
- [ ] Create component with overrides
- [ ] Create component with runtime context
- [ ] Create batch of components
- [ ] Pool component instance
- [ ] Get pooled component
- [ ] Get non-existent pooled component (should return undefined)

### ComponentDefaultResolver Tests
- [ ] Resolve with explicit props (highest priority)
- [ ] Resolve with runtime context
- [ ] Resolve with component defaults
- [ ] Resolve with global defaults
- [ ] Resolve with fallback safe mode (lowest priority)
- [ ] Resolution order test (explicit → context → defaults → global → fallback)
- [ ] Resolve with missing props (should use defaults)
- [ ] Resolve with invalid props (should use fallback)

### ValidationSystem Tests
- [ ] Validate valid contract
- [ ] Validate contract with missing required field
- [ ] Validate contract with invalid type
- [ ] Validate contract with invalid range
- [ ] Validate contract with invalid reference
- [ ] Validate contract with missing i18n key
- [ ] Validate contract with missing render primitive
- [ ] Validate contract with invalid physics profile
- [ ] Validate batch of contracts
- [ ] Get schema for category

### RuntimeContext Tests
- [ ] Create context with all properties
- [ ] Create context with partial properties
- [ ] Update context property
- [ ] Consume context property
- [ ] Persist context to storage
- [ ] Restore context from storage

### Integration Tests
- [ ] Full workflow: register → create → resolve
- [ ] Error handling: invalid contract registration
- [ ] Error handling: non-existent component creation
- [ ] Performance: 1000 component registrations
- [ ] Performance: 1000 component creations
- [ ] Performance: 1000 default resolutions
