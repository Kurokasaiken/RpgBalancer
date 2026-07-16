# Implementation Plan 04: Physics System
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** Medium  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Duration:** 2 weeks

---

## Executive Summary

Build a unified physics engine that provides consistent physics behavior across all components. This phase consolidates existing physics hooks (useHeavyDrag, useDragPhysicsEngine) into a single unified system with physics profiles, component integration, and performance optimization.

**Key Deliverables:**
- PhysicsProfile system with predefined profiles
- Unified useComponentPhysics hook
- Physics engine unification
- Render integration for physics feedback
- Performance optimization
- Comprehensive unit tests
- Documentation

---

## Objectives

### Primary Objectives
1. Create PhysicsProfile system for consistent physics definitions
2. Build unified useComponentPhysics hook
3. Unify existing physics engines into single system
4. Integrate physics with rendering for visual feedback
5. Implement performance optimization

### Success Criteria
- PhysicsProfile system with 5+ predefined profiles
- Unified useComponentPhysics hook functional
- Existing physics engines consolidated
- Physics → render integration operational
- Performance optimization implemented
- Unit test coverage > 80%
- Zero breaking changes to existing physics behavior

---

## Architecture

### PhysicsProfile System
**Purpose:** Define physics behavior through configuration profiles.

**Profiles:**
- `light` - Low mass, high elasticity, magnetic snap
- `medium` - Balanced mass and elasticity, elastic snap
- `heavy` - High mass, low elasticity, no snap
- `static` - Infinite mass, no interaction
- `token` - Very light, high elasticity, elastic snap

**Interface:**
```typescript
interface PhysicsProfile {
  id: string;
  name: string;
  mass: number;
  elasticity: number;
  friction: number;
  interaction: 'heavy' | 'light' | 'static';
  drag: boolean;
  hover: boolean;
  snap: 'magnetic' | 'elastic' | 'none';
  rotation: boolean;
  shadow: boolean;
  depth: boolean;
}
```

### Unified Physics Engine
**Purpose:** Consolidate existing physics engines into single unified system.

**Current State:**
- `useHeavyDrag` - Heavy drag behavior
- `useDragPhysicsEngine` - General drag physics
- Scattered physics hooks

**Target State:**
- Single `useComponentPhysics` hook
- Single physics engine implementation
- Consistent behavior across all components

**Interface:**
```typescript
interface PhysicsEngine {
  applyPhysics(
    profile: PhysicsProfile,
    element: HTMLElement
  ): PhysicsState;
  updatePhysics(
    state: PhysicsState,
    input: PhysicsInput
  ): PhysicsState;
  resetPhysics(state: PhysicsState): PhysicsState;
}
```

### Physics → Render Integration
**Purpose:** Provide visual feedback for physics interactions.

**Visual Feedback:**
- Shadow based on depth/height
- Rotation based on movement
- Scale based on hover/press
- Glow based on snap
- Particle effects on collision

**Interface:**
```typescript
interface PhysicsRenderIntegration {
  getShadow(depth: number): CSSProperties;
  getRotation(angle: number): CSSProperties;
  getScale(state: 'hover' | 'press' | 'normal'): CSSProperties;
  getGlow(snapState: 'magnetic' | 'elastic' | 'none'): CSSProperties;
  getParticles(collision: boolean): ParticleEffect;
}
```

### Performance Optimization
**Purpose:** Optimize physics calculations for performance.

**Optimizations:**
- Physics state caching
- RequestAnimationFrame for updates
- Debounced collision detection
- Lazy physics initialization
- Simplified calculations for static objects

**Interface:**
```typescript
interface PhysicsPerformanceOptimizer {
  cacheState(profileId: string, state: PhysicsState): void;
  getCachedState(profileId: string): PhysicsState | undefined;
  scheduleUpdate(callback: () => void): void;
  debounceCollision(callback: () => void): void;
  measurePerformance(): PerformanceMetrics;
}
```

---

## Implementation Phases

### Phase 4.1: PhysicsProfile System (Days 1-2)

**Objective:** Create PhysicsProfile system with predefined profiles.

**Tasks:**
1. Create `src/game/physics/physicsProfiles.ts`
   - Define PhysicsProfile interface
   - Implement light profile
   - Implement medium profile
   - Implement heavy profile
   - Implement static profile
   - Implement token profile
   - Create profile registry

2. Create `src/game/physics/__tests__/physicsProfiles.test.ts`
   - Test all profile definitions
   - Test profile registry
   - Test profile validation
   - Test profile defaults

**Deliverables:**
- `src/game/physics/physicsProfiles.ts` (200+ lines)
- `src/game/physics/__tests__/physicsProfiles.test.ts` (150+ lines)
- 5 predefined physics profiles

**Safeguards:**
- `npm run lint -- src/game/physics/`
- `npm run test -- src/game/physics/__tests__/physicsProfiles.test.ts`
- `npm run build:check`

---

### Phase 4.2: Unified Physics Engine (Days 3-5)

**Objective:** Build unified physics engine consolidating existing systems.

**Tasks:**
1. Create `src/game/physics/PhysicsEngine.ts`
   - Implement PhysicsEngine class
   - Implement applyPhysics
   - Implement updatePhysics
   - Implement resetPhysics
   - Implement collision detection
   - Implement snap logic

2. Consolidate existing physics hooks
   - Analyze useHeavyDrag
   - Analyze useDragPhysicsEngine
   - Extract common logic
   - Migrate to unified engine
   - Deprecate old hooks

3. Create `src/game/physics/__tests__/PhysicsEngine.test.ts`
   - Test physics application
   - Test physics updates
   - Test physics reset
   - Test collision detection
   - Test snap logic

**Deliverables:**
- `src/game/physics/PhysicsEngine.ts` (400+ lines)
- Consolidated physics logic
- `src/game/physics/__tests__/PhysicsEngine.test.ts` (300+ lines)
- Deprecated old hooks

**Safeguards:**
- `npm run lint -- src/game/physics/`
- `npm run test -- src/game/physics/__tests__/PhysicsEngine.test.ts`
- `npm run build:check`

---

### Phase 4.3: useComponentPhysics Hook (Days 6-7)

**Objective:** Create unified useComponentPhysics hook.

**Tasks:**
1. Create `src/game/physics/useComponentPhysics.ts`
   - Implement useComponentPhysics hook
   - Integrate with PhysicsEngine
   - Integrate with PhysicsProfile
   - Handle component lifecycle
   - Handle event listeners

2. Create `src/game/physics/__tests__/useComponentPhysics.test.tsx`
   - Test hook initialization
   - Test physics application
   - Test event handling
   - Test cleanup
   - Test profile switching

**Deliverables:**
- `src/game/physics/useComponentPhysics.ts` (300+ lines)
- `src/game/physics/__tests__/useComponentPhysics.test.tsx` (250+ lines)
- Unified physics hook

**Safeguards:**
- `npm run lint -- src/game/physics/`
- `npm run test -- src/game/physics/__tests__/useComponentPhysics.test.tsx`
- `npm run build:check`

---

### Phase 4.4: Physics → Render Integration (Days 8-9)

**Objective:** Integrate physics with rendering for visual feedback.

**Tasks:**
1. Create `src/game/physics/physicsRenderIntegration.ts`
   - Implement getShadow
   - Implement getRotation
   - Implement getScale
   - Implement getGlow
   - Implement getParticles

2. Integrate with rendering system
   - Connect physics state to render props
   - Update primitives with physics feedback
   - Add visual effects for interactions

3. Create `src/game/physics/__tests__/physicsRenderIntegration.test.ts`
   - Test shadow generation
   - Test rotation generation
   - Test scale generation
   - Test glow generation
   - Test particle generation

**Deliverables:**
- `src/game/physics/physicsRenderIntegration.ts` (250+ lines)
- Integrated visual feedback
- `src/game/physics/__tests__/physicsRenderIntegration.test.ts` (200+ lines)

**Safeguards:**
- `npm run lint -- src/game/physics/`
- `npm run test -- src/game/physics/__tests__/physicsRenderIntegration.test.ts`
- `npm run build:check`

---

### Phase 4.5: Performance Optimization (Days 10-11)

**Objective:** Implement performance optimization for physics system.

**Tasks:**
1. Create `src/game/physics/performanceOptimizer.ts`
   - Implement state caching
   - Implement requestAnimationFrame scheduling
   - Implement debounced collision detection
   - Implement lazy initialization
   - Implement performance measurement

2. Integrate optimization into physics engine
   - Add caching to PhysicsEngine
   - Add scheduling to useComponentPhysics
   - Add debouncing to collision detection
   - Add lazy initialization to profiles

3. Create `src/game/physics/__tests__/performanceOptimizer.test.ts`
   - Test state caching
   - Test scheduling
   - Test debouncing
   - Test lazy initialization
   - Test performance measurement

**Deliverables:**
- `src/game/physics/performanceOptimizer.ts` (300+ lines)
- Optimized physics engine
- `src/game/physics/__tests__/performanceOptimizer.test.ts` (250+ lines)

**Safeguards:**
- `npm run lint -- src/game/physics/`
- `npm run test -- src/game/physics/__tests__/performanceOptimizer.test.ts`
- `npm run build:check`

---

### Phase 4.6: Integration & Documentation (Days 12-14)

**Objective:** Integrate all systems and create documentation.

**Tasks:**
1. Create `src/game/physics/index.ts`
   - Export all public APIs
   - Create convenience functions
   - Create default instances

2. Integration testing
   - Test full workflow (profile → engine → hook → render)
   - Test performance
   - Test error handling
   - Test backward compatibility

3. Create documentation
   - Physics System Guide
   - API Reference
   - Migration Guide
   - Performance Guide

**Deliverables:**
- `src/game/physics/index.ts` (100+ lines)
- Integration test suite (200+ lines)
- Physics System Guide (1500+ words)
- API Reference (1000+ words)
- Migration Guide (500+ words)
- Performance Guide (500+ words)

**Safeguards:**
- `npm run lint -- src/game/physics/`
- `npm run test -- src/game/physics/`
- `npm run build:check`
- `npm run kanban:lint`

---

## File Structure

```
src/game/physics/
├── physicsProfiles.ts                # Physics profile definitions
├── PhysicsEngine.ts                   # Unified physics engine
├── useComponentPhysics.ts            # Unified physics hook
├── physicsRenderIntegration.ts       # Physics → render integration
├── performanceOptimizer.ts            # Performance optimization
├── index.ts                           # Public API exports
└── __tests__/
    ├── physicsProfiles.test.ts
    ├── PhysicsEngine.test.ts
    ├── useComponentPhysics.test.tsx
    ├── physicsRenderIntegration.test.ts
    ├── performanceOptimizer.test.ts
    └── integration.test.ts

docs/guides/
├── physics_system_guide.md            # Physics System Guide
├── physics_migration_guide.md         # Migration Guide
└── physics_performance_guide.md       # Performance Guide
```

---

## Key Code Examples

### PhysicsProfile Usage
```typescript
import { PhysicsProfiles } from '@/game/physics';

// Get predefined profile
const pgCardProfile = PhysicsProfiles.light;
// Returns: { id: 'light', mass: 0.5, elasticity: 0.8, snap: 'magnetic', ... }

// Get building profile
const buildingProfile = PhysicsProfiles.static;
// Returns: { id: 'static', mass: 999, drag: false, snap: 'none', ... }
```

### useComponentPhysics Hook
```typescript
import { useComponentPhysics } from '@/game/physics';

const MyComponent = () => {
  const { physicsState, handlers } = useComponentPhysics({
    profile: 'light',
    onSnap: (target) => console.log('Snapped to', target),
    onCollision: (other) => console.log('Collided with', other)
  });

  return (
    <div
      {...handlers}
      style={{
        transform: `translate(${physicsState.x}px, ${physicsState.y}px) rotate(${physicsState.rotation}deg)`,
        boxShadow: physicsState.shadow
      }}
    >
      Content
    </div>
  );
};
```

### Physics Engine Direct Usage
```typescript
import { PhysicsEngine } from '@/game/physics';

const engine = new PhysicsEngine();

// Apply physics to element
const state = engine.applyPhysics(lightProfile, element);

// Update physics with input
const updatedState = engine.updatePhysics(state, {
  velocity: { x: 10, y: 5 },
  acceleration: { x: 0, y: 0.5 }
});

// Reset physics
const resetState = engine.resetPhysics(state);
```

### Physics → Render Integration
```typescript
import { PhysicsRenderIntegration } from '@/game/physics';

const renderIntegration = new PhysicsRenderIntegration();

// Get shadow based on depth
const shadow = renderIntegration.getShadow(physicsState.depth);
// Returns: { boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }

// Get rotation
const rotation = renderIntegration.getRotation(physicsState.angle);
// Returns: { transform: `rotate(${angle}deg)` }

// Get scale for hover
const scale = renderIntegration.getScale('hover');
// Returns: { transform: 'scale(1.05)' }

// Get glow for magnetic snap
const glow = renderIntegration.getGlow('magnetic');
// Returns: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }
```

---

## Success Criteria

### Functional Requirements
- ✅ PhysicsProfile system with 5+ predefined profiles
- ✅ Unified useComponentPhysics hook functional
- ✅ Existing physics engines consolidated
- ✅ Physics → render integration operational
- ✅ Performance optimization implemented
- ✅ Unit test coverage > 80%
- ✅ Zero breaking changes to existing physics behavior

### Non-Functional Requirements
- ✅ Performance < 2ms for physics update
- ✅ Performance < 1ms for collision detection
- ✅ Performance < 0.5ms for state caching
- ✅ Memory usage < 10MB for physics system
- ✅ Zero runtime errors in normal operation
- ✅ 60 FPS with 100+ physics objects

### Integration Requirements
- ✅ Compatible with Phase 1 (Component Runtime)
- ✅ Compatible with Phase 2 (Rendering Primitives)
- ✅ Compatible with existing drag systems
- ✅ Ready for Phase 6 (Village Evolution)
- ✅ Ready for Phase 8 (Frozen Kit Migration)

---

## Risks & Mitigations

### Risk 1: Breaking Existing Drag Behavior
**Risk:** Unified physics engine could break existing drag behavior.

**Mitigation:**
- Maintain backward compatibility
- Test extensively with existing drag systems
- Provide migration guide
- Feature flag for new system
- Rollback plan if issues arise

### Risk 2: Performance Degradation
**Risk:** Unified physics could be slower than specialized hooks.

**Mitigation:**
- Implement efficient caching
- Use requestAnimationFrame
- Benchmark performance continuously
- Optimize hot paths
- Provide performance controls

### Risk 3: Complexity Overload
**Risk:** Unified system could be too complex to maintain.

**Mitigation:**
- Keep physics profiles simple
- Document physics rules clearly
- Provide physics builder tools
- Review physics logic regularly
- Separate concerns clearly

### Risk 4: Visual Feedback Lag
**Risk:** Physics → render integration could have lag.

**Mitigation:**
- Use requestAnimationFrame for updates
- Optimize render calculations
- Debounce visual updates
- Cache visual calculations
- Provide fallback for low-end devices

---

## Dependencies

### Internal Dependencies
- Phase 1 (Component Runtime) - must be completed first
- Phase 2 (Rendering Primitive System) - must be completed first

### External Dependencies
- React (already in project)
- TypeScript (already in project)

### Blocked By
- Phase 1 (Component Runtime) - must be completed first
- Phase 2 (Rendering Primitive System) - must be completed first

### Blocking
- Phase 6 (Village Evolution) depends on Phase 4 completion
- Phase 8 (Frozen Kit Migration) depends on Phase 4 completion

---

## Timeline

- **Phase 4.1:** Days 1-2 (PhysicsProfile System)
- **Phase 4.2:** Days 3-5 (Unified Physics Engine)
- **Phase 4.3:** Days 6-7 (useComponentPhysics Hook)
- **Phase 4.4:** Days 8-9 (Physics → Render Integration)
- **Phase 4.5:** Days 10-11 (Performance Optimization)
- **Phase 4.6:** Days 12-14 (Integration & Documentation)

**Total Duration:** 2 weeks (14 working days)

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 4.1 Execution:** Begin Phase 4.1 (PhysicsProfile System) with definitions and registry.
3. **Daily Standups:** Conduct daily standups to track progress and address blockers.
4. **Continuous Integration:** Run safeguards after each phase to ensure quality.
5. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Test Coverage Requirements

### PhysicsProfile Tests
- [ ] Light profile definition valid
- [ ] Medium profile definition valid
- [ ] Heavy profile definition valid
- [ ] Static profile definition valid
- [ ] Token profile definition valid
- [ ] Profile registry functional
- [ ] Profile validation
- [ ] Profile defaults
- [ ] Profile mass values in range
- [ ] Profile elasticity values in range

### PhysicsEngine Tests
- [ ] Physics application
- [ ] Physics updates
- [ ] Physics reset
- [ ] Collision detection
- [ ] Snap logic (magnetic)
- [ ] Snap logic (elastic)
- [ ] Snap logic (none)
- [ ] Velocity calculation
- [ ] Acceleration calculation
- [ ] Friction application

### useComponentPhysics Tests
- [ ] Hook initialization
- [ ] Physics application
- [ ] Event handling (drag)
- [ ] Event handling (hover)
- [ ] Event handling (drop)
- [ ] Cleanup on unmount
- [ ] Profile switching
- [ ] State updates
- [ ] Callback execution

### PhysicsRenderIntegration Tests
- [ ] Shadow generation
- [ ] Rotation generation
- [ ] Scale generation (hover)
- [ ] Scale generation (press)
- [ ] Scale generation (normal)
- [ ] Glow generation (magnetic)
- [ ] Glow generation (elastic)
- [ ] Glow generation (none)
- [ ] Particle generation
- [ ] CSS property validity

### PerformanceOptimizer Tests
- [ ] State caching
- [ ] Cache hit
- [ ] Cache miss
- [ ] Cache invalidation
- [ ] RequestAnimationFrame scheduling
- [ ] Debounced collision detection
- [ ] Lazy initialization
- [ ] Performance measurement
- [ ] Memory usage measurement
