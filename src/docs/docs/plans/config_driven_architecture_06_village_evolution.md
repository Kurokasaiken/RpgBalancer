# Implementation Plan 06: Village Evolution System
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** Medium  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Duration:** 3 weeks

---

## Executive Summary

Build a village evolution system that provides living, evolving entities with full lifecycle management. This phase establishes the village entity system, building lifecycle, upgrade system, damage/repair mechanics, and integration with the rendering system for visual feedback.

**Key Deliverables:**
- Village entity system with hierarchy
- Building lifecycle management
- Upgrade system with config-driven levels
- Damage/repair system
- Village → render integration
- Comprehensive unit tests
- Documentation

---

## Objectives

### Primary Objectives
1. Create village entity system with proper hierarchy
2. Implement building lifecycle management
3. Build upgrade system with config-driven levels
4. Implement damage/repair system
5. Integrate village system with rendering

### Success Criteria
- Village entity system functional (buildings, residents, resources, events)
- Building lifecycle operational (locked → discovered → construction → levels → damage → destroyed → rebuilt)
- Upgrade system with config-driven levels
- Damage/repair system functional
- Village → render integration operational
- Unit test coverage > 80%
- Zero breaking changes to existing village systems

---

## Architecture

### Village Entity System
**Purpose:** Manage village entities with proper hierarchy and relationships.

**Entity Hierarchy:**
```
Village
├── Buildings
│   ├── Blacksmith
│   ├── Woodmill
│   ├── Farm
│   └── ...
├── Residents
│   ├── Workers
│   ├── Specialists
│   └── ...
├── Resources
│   ├── Wood
│   ├── Stone
│   └── ...
└── Events
    ├── Quests
    ├── Encounters
    └── ...
```

**Interface:**
```typescript
interface VillageEntity {
  id: string;
  type: 'building' | 'resident' | 'resource' | 'event';
  parentId?: string;
  children: VillageEntity[];
  state: EntityState;
  metadata: EntityMetadata;
}

interface VillageSystem {
  createVillage(seed: number): Village;
  addEntity(village: Village, entity: VillageEntity): void;
  removeEntity(village: Village, entityId: string): void;
  getEntity(village: Village, entityId: string): VillageEntity | undefined;
  queryEntities(village: Village, filter: EntityFilter): VillageEntity[];
}
```

### Building Lifecycle
**Purpose:** Manage building states and transitions.

**Lifecycle States:**
```
Locked
↓ (discovered)
Discovered
↓ (construction started)
Construction
↓ (construction complete)
Level 1
↓ (upgrade)
Level 2
↓ (damage)
Damaged
↓ (destroyed)
Destroyed
↓ (rebuild)
Rebuilt
↓ (restored)
Level 1
```

**Interface:**
```typescript
interface BuildingLifecycle {
  state: BuildingState;
  transitions: BuildingTransition[];
  requirements: BuildingRequirements;
  timeline: BuildingTimeline;
}

interface BuildingLifecycleManager {
  transition(building: Building, targetState: BuildingState): void;
  canTransition(building: Building, targetState: BuildingState): boolean;
  getTransitionTime(building: Building, targetState: BuildingState): number;
  cancelTransition(building: Building): void;
}
```

### Upgrade System
**Purpose:** Provide config-driven building upgrades.

**Upgrade Configuration:**
```json
{
  "id": "blacksmith",
  "levels": [
    {
      "level": 1,
      "visual": "small_blacksmith",
      "capacity": 5,
      "production": { "iron": 1 }
    },
    {
      "level": 2,
      "visual": "medium_blacksmith",
      "capacity": 10,
      "production": { "iron": 2 }
    }
  ]
}
```

**Interface:**
```typescript
interface BuildingLevel {
  level: number;
  visual: string;
  capacity: number;
  production: ResourceProduction;
  requirements: UpgradeRequirements;
}

interface UpgradeSystem {
  getLevels(buildingId: string): BuildingLevel[];
  upgrade(building: Building, targetLevel: number): void;
  canUpgrade(building: Building, targetLevel: number): boolean;
  getUpgradeCost(building: Building, targetLevel: number): ResourceCost;
}
```

### Damage/Repair System
**Purpose:** Manage building damage and repair mechanics.

**Damage Types:**
- Structural damage (from events/attacks)
- Wear damage (from time/usage)
- Environmental damage (from weather)

**Repair Types:**
- Quick repair (partial restoration)
- Full repair (complete restoration)
- Rebuild (from destroyed state)

**Interface:**
```typescript
interface BuildingDamage {
  type: 'structural' | 'wear' | 'environmental';
  amount: number;
  maxAmount: number;
  source: string;
  timestamp: number;
}

interface DamageRepairSystem {
  applyDamage(building: Building, damage: BuildingDamage): void;
  applyRepair(building: Building, repairType: RepairType): void;
  getDamageState(building: Building): DamageState;
  canRepair(building: Building, repairType: RepairType): boolean;
  getRepairCost(building: Building, repairType: RepairType): ResourceCost;
}
```

### Village → Render Integration
**Purpose:** Connect village state to rendering for visual feedback.

**Visual Feedback:**
- Building state visual (construction progress, damage overlay)
- Level visual (different visuals per level)
- Activity visual (production indicators)
- Upgrade visual (upgrade progress)

**Interface:**
```typescript
interface VillageRenderIntegration {
  getBuildingVisual(building: Building): BuildingVisual;
  getConstructionProgress(building: Building): number;
  getDamageOverlay(building: Building): DamageOverlay;
  getActivityIndicator(building: Building): ActivityIndicator;
  getUpgradeProgress(building: Building): number;
}
```

---

## Implementation Phases

### Phase 6.1: Village Entity System (Days 1-3)

**Objective:** Create village entity system with hierarchy.

**Tasks:**
1. Create `src/game/village/villageEntitySystem.ts`
   - Define VillageEntity interface
   - Define Village interface
   - Implement VillageSystem class
   - Implement entity CRUD operations
   - Implement entity queries
   - Implement entity hierarchy

2. Create `src/game/village/__tests__/villageEntitySystem.test.ts`
   - Test village creation
   - Test entity addition
   - Test entity removal
   - Test entity queries
   - Test entity hierarchy

**Deliverables:**
- `src/game/village/villageEntitySystem.ts` (300+ lines)
- `src/game/village/__tests__/villageEntitySystem.test.ts` (250+ lines)
- Village entity system functional

**Safeguards:**
- `npm run lint -- src/game/village/`
- `npm run test -- src/game/village/__tests__/villageEntitySystem.test.ts`
- `npm run build:check`

---

### Phase 6.2: Building Lifecycle (Days 4-6)

**Objective:** Implement building lifecycle management.

**Tasks:**
1. Create `src/game/village/buildingLifecycle.ts`
   - Define BuildingLifecycle interface
   - Define BuildingState enum
   - Implement BuildingLifecycleManager class
   - Implement state transitions
   - Implement transition validation
   - Implement transition timeline

2. Create `src/game/village/__tests__/buildingLifecycle.test.ts`
   - Test state transitions
   - Test transition validation
   - Test transition timeline
   - Test transition cancellation
   - Test invalid transitions

**Deliverables:**
- `src/game/village/buildingLifecycle.ts` (350+ lines)
- `src/game/village/__tests__/buildingLifecycle.test.ts` (300+ lines)
- Building lifecycle functional

**Safeguards:**
- `npm run lint -- src/game/village/`
- `npm run test -- src/game/village/__tests__/buildingLifecycle.test.ts`
- `npm run build:check`

---

### Phase 6.3: Upgrade System (Days 7-9)

**Objective:** Build config-driven upgrade system.

**Tasks:**
1. Create upgrade config in `src/balancing/config/village/upgrades.ts`
   - Define upgrade schema
   - Create upgrade configs for buildings
   - Implement Zod validation

2. Create `src/game/village/upgradeSystem.ts`
   - Implement UpgradeSystem class
   - Implement level retrieval
   - Implement upgrade logic
   - Implement upgrade validation
   - Implement cost calculation

3. Create `src/game/village/__tests__/upgradeSystem.test.ts`
   - Test level retrieval
   - Test upgrade logic
   - Test upgrade validation
   - Test cost calculation
   - Test config validation

**Deliverables:**
- `src/balancing/config/village/upgrades.ts` (200+ lines)
- `src/game/village/upgradeSystem.ts` (300+ lines)
- `src/game/village/__tests__/upgradeSystem.test.ts` (250+ lines)
- Upgrade system functional

**Safeguards:**
- `npm run lint -- src/game/village/ src/balancing/config/village/`
- `npm run test -- src/game/village/__tests__/upgradeSystem.test.ts`
- `npm run build:check`

---

### Phase 6.4: Damage/Repair System (Days 10-12)

**Objective:** Implement damage and repair system.

**Tasks:**
1. Create `src/game/village/damageRepairSystem.ts`
   - Define BuildingDamage interface
   - Define RepairType enum
   - Implement DamageRepairSystem class
   - Implement damage application
   - Implement repair logic
   - Implement repair validation
   - Implement cost calculation

2. Create `src/game/village/__tests__/damageRepairSystem.test.ts`
   - Test damage application
   - Test repair logic
   - Test repair validation
   - Test cost calculation
   - Test damage state
   - Test multiple damage sources

**Deliverables:**
- `src/game/village/damageRepairSystem.ts` (350+ lines)
- `src/game/village/__tests__/damageRepairSystem.test.ts` (300+ lines)
- Damage/repair system functional

**Safeguards:**
- `npm run lint -- src/game/village/`
- `npm run test -- src/game/village/__tests__/damageRepairSystem.test.ts`
- `npm run build:check`

---

### Phase 6.5: Village → Render Integration (Days 13-14)

**Objective:** Integrate village system with rendering.

**Tasks:**
1. Create `src/game/village/villageRenderIntegration.ts`
   - Implement getBuildingVisual
   - Implement getConstructionProgress
   - Implement getDamageOverlay
   - Implement getActivityIndicator
   - Implement getUpgradeProgress

2. Integrate with rendering system
   - Connect village state to building visuals
   - Connect lifecycle to construction progress
   - Connect damage to damage overlay
   - Connect production to activity indicators
   - Connect upgrades to upgrade progress

3. Create `src/game/village/__tests__/villageRenderIntegration.test.ts`
   - Test building visual retrieval
   - Test construction progress
   - Test damage overlay
   - Test activity indicator
   - Test upgrade progress

**Deliverables:**
- `src/game/village/villageRenderIntegration.ts` (300+ lines)
- Integrated with rendering system
- `src/game/village/__tests__/villageRenderIntegration.test.ts` (250+ lines)
- Village → render integration operational

**Safeguards:**
- `npm run lint -- src/game/village/`
- `npm run test -- src/game/village/__tests__/villageRenderIntegration.test.ts`
- `npm run build:check`

---

### Phase 6.6: Integration & Documentation (Days 15-21)

**Objective:** Integrate all systems and create documentation.

**Tasks:**
1. Create `src/game/village/index.ts`
   - Export all public APIs
   - Create convenience functions
   - Create default instances

2. Integration testing
   - Test full workflow (entity → lifecycle → upgrade → damage/repair → render)
   - Test village creation and evolution
   - Test performance
   - Test error handling

3. Create documentation
   - Village System Guide
   - API Reference
   - Configuration Guide
   - Integration Guide

**Deliverables:**
- `src/game/village/index.ts` (100+ lines)
- Integration test suite (300+ lines)
- Village System Guide (2000+ words)
- API Reference (1000+ words)
- Configuration Guide (500+ words)
- Integration Guide (500+ words)

**Safeguards:**
- `npm run lint -- src/game/village/`
- `npm run test -- src/game/village/`
- `npm run build:check`
- `npm run kanban:lint`

---

## File Structure

```
src/game/village/
├── villageEntitySystem.ts            # Village entity system
├── buildingLifecycle.ts              # Building lifecycle management
├── upgradeSystem.ts                  # Upgrade system
├── damageRepairSystem.ts             # Damage/repair system
├── villageRenderIntegration.ts      # Village → render integration
├── index.ts                          # Public API exports
└── __tests__/
    ├── villageEntitySystem.test.ts
    ├── buildingLifecycle.test.ts
    ├── upgradeSystem.test.ts
    ├── damageRepairSystem.test.ts
    ├── villageRenderIntegration.test.ts
    └── integration.test.ts

src/balancing/config/village/
└── upgrades.ts                       # Upgrade configurations

docs/guides/
├── village_system_guide.md           # Village System Guide
├── village_configuration_guide.md    # Configuration Guide
└── village_integration_guide.md      # Integration Guide
```

---

## Key Code Examples

### Village Entity System Usage
```typescript
import { VillageSystem } from '@/game/village';

const villageSystem = new VillageSystem();

// Create village
const village = villageSystem.createVillage(928372);

// Add building
const blacksmith = {
  id: 'blacksmith_001',
  type: 'building',
  state: 'discovered',
  metadata: { buildingType: 'blacksmith' }
};
villageSystem.addEntity(village, blacksmith);

// Query buildings
const buildings = villageSystem.queryEntities(village, {
  type: 'building'
});
```

### Building Lifecycle Usage
```typescript
import { BuildingLifecycleManager } from '@/game/village';

const lifecycleManager = new BuildingLifecycleManager();

// Start construction
lifecycleManager.transition(blacksmith, 'construction');

// Check if can upgrade
const canUpgrade = lifecycleManager.canTransition(blacksmith, 'level-2');

// Upgrade to level 2
lifecycleManager.transition(blacksmith, 'level-2');

// Apply damage
lifecycleManager.transition(blacksmith, 'damaged');
```

### Upgrade System Usage
```typescript
import { UpgradeSystem } from '@/game/village';

const upgradeSystem = new UpgradeSystem();

// Get levels for building
const levels = upgradeSystem.getLevels('blacksmith');
// Returns: [{ level: 1, visual: 'small_blacksmith', ... }, ...]

// Upgrade to level 2
upgradeSystem.upgrade(blacksmith, 2);

// Get upgrade cost
const cost = upgradeSystem.getUpgradeCost(blacksmith, 3);
// Returns: { wood: 100, stone: 50, iron: 20 }
```

### Damage/Repair System Usage
```typescript
import { DamageRepairSystem } from '@/game/village';

const damageSystem = new DamageRepairSystem();

// Apply damage
damageSystem.applyDamage(blacksmith, {
  type: 'structural',
  amount: 50,
  maxAmount: 100,
  source: 'goblin_attack',
  timestamp: Date.now()
});

// Get damage state
const damageState = damageSystem.getDamageState(blacksmith);
// Returns: { currentDamage: 50, maxDamage: 100, isCritical: false }

// Repair
damageSystem.applyRepair(blacksmith, 'full');

// Get repair cost
const repairCost = damageSystem.getRepairCost(blacksmith, 'full');
// Returns: { wood: 20, stone: 10 }
```

### Village → Render Integration Usage
```typescript
import { VillageRenderIntegration } from '@/game/village';

const renderIntegration = new VillageRenderIntegration();

// Get building visual
const visual = renderIntegration.getBuildingVisual(blacksmith);
// Returns: { primitive: 'wood-structure', material: 'old-oak', level: 2 }

// Get construction progress
const progress = renderIntegration.getConstructionProgress(blacksmith);
// Returns: 0.75 (75% complete)

// Get damage overlay
const overlay = renderIntegration.getDamageOverlay(blacksmith);
// Returns: { type: 'cracks', intensity: 0.5, color: '#8b0000' }

// Get activity indicator
const activity = renderIntegration.getActivityIndicator(blacksmith);
// Returns: { type: 'production', resource: 'iron', rate: 2 }
```

---

## Success Criteria

### Functional Requirements
- ✅ Village entity system functional (buildings, residents, resources, events)
- ✅ Building lifecycle operational (full state machine)
- ✅ Upgrade system with config-driven levels
- ✅ Damage/repair system functional
- ✅ Village → render integration operational
- ✅ Unit test coverage > 80%
- ✅ Zero breaking changes to existing village systems

### Non-Functional Requirements
- ✅ Performance < 1ms for entity queries
- ✅ Performance < 0.5ms for state transitions
- ✅ Performance < 1ms for upgrade operations
- ✅ Performance < 1ms for damage/repair operations
- ✅ Memory usage < 20MB for village system
- ✅ Zero runtime errors in normal operation
- ✅ Support for 100+ village entities

### Integration Requirements
- ✅ Compatible with Phase 1 (Component Runtime)
- ✅ Compatible with Phase 2 (Rendering Primitives)
- ✅ Compatible with Phase 3 (Material Engine)
- ✅ Compatible with Phase 4 (Physics System)
- ✅ Compatible with Phase 5 (Seed System)
- ✅ Compatible with existing village systems
- ✅ Ready for Phase 8 (Frozen Kit Migration)

---

## Risks & Mitigations

### Risk 1: State Synchronization
**Risk:** Village state could become desynchronized across systems.

**Mitigation:**
- Single source of truth for village state
- Immutable state updates
- State change events
- Comprehensive testing
- Rollback mechanism

### Risk 2: Performance Degradation
**Risk:** Village system could be slow with many entities.

**Mitigation:**
- Efficient data structures (Map, Set)
- Entity indexing
- Lazy loading
- Query optimization
- Performance benchmarking

### Risk 3: Config Complexity
**Risk:** Upgrade configs could become too complex.

**Mitigation:**
- Keep configs simple and declarative
- Use schema validation
- Provide config builder tools
- Document config patterns
- Review configs regularly

### Risk 4: Visual Feedback Lag
**Risk:** Village → render integration could have lag.

**Mitigation:**
- Efficient state → visual mapping
- Cache visual calculations
- Use requestAnimationFrame
- Optimize render updates
- Provide fallback for low-end devices

---

## Dependencies

### Internal Dependencies
- Phase 1 (Component Runtime) - must be completed first
- Phase 2 (Rendering Primitive System) - must be completed first
- Phase 3 (Material Engine) - must be completed first
- Phase 4 (Physics System) - must be completed first
- Phase 5 (Seed System) - must be completed first

### External Dependencies
- React (already in project)
- Zod (already in project)
- TypeScript (already in project)

### Blocked By
- Phase 1 (Component Runtime) - must be completed first
- Phase 2 (Rendering Primitive System) - must be completed first
- Phase 3 (Material Engine) - must be completed first
- Phase 4 (Physics System) - must be completed first
- Phase 5 (Seed System) - must be completed first

### Blocking
- Phase 8 (Frozen Kit Migration) depends on Phase 6 completion

---

## Timeline

- **Phase 6.1:** Days 1-3 (Village Entity System)
- **Phase 6.2:** Days 4-6 (Building Lifecycle)
- **Phase 6.3:** Days 7-9 (Upgrade System)
- **Phase 6.4:** Days 10-12 (Damage/Repair System)
- **Phase 6.5:** Days 13-14 (Village → Render Integration)
- **Phase 6.6:** Days 15-21 (Integration & Documentation)

**Total Duration:** 3 weeks (21 working days)

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 6.1 Execution:** Begin Phase 6.1 (Village Entity System) with hierarchy and CRUD.
3. **Daily Standups:** Conduct daily standups to track progress and address blockers.
4. **Continuous Integration:** Run safeguards after each phase to ensure quality.
5. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Test Coverage Requirements

### VillageEntitySystem Tests
- [ ] Village creation from seed
- [ ] Entity addition
- [ ] Entity removal
- [ ] Entity retrieval
- [ ] Entity queries by type
- [ ] Entity queries by filter
- [ ] Entity hierarchy
- [ ] Entity parent-child relationships
- [ ] Entity metadata
- [ ] Entity state management

### BuildingLifecycle Tests
- [ ] State transition (locked → discovered)
- [ ] State transition (discovered → construction)
- [ ] State transition (construction → level-1)
- [ ] State transition (level-1 → level-2)
- [ ] State transition (level → damaged)
- [ ] State transition (damaged → destroyed)
- [ ] State transition (destroyed → rebuilt)
- [ ] Transition validation
- [ ] Transition timeline
- [ ] Transition cancellation
- [ ] Invalid transitions

### UpgradeSystem Tests
- [ ] Level retrieval
- [ ] Upgrade logic
- [ ] Upgrade validation
- [ ] Cost calculation
- [ ] Config validation
- [ ] Upgrade requirements
- [ ] Upgrade prerequisites
- [ ] Multiple upgrades
- [ ] Downgrade prevention

### DamageRepairSystem Tests
- [ ] Damage application (structural)
- [ ] Damage application (wear)
- [ ] Damage application (environmental)
- [ ] Multiple damage sources
- [ ] Damage state calculation
- [ ] Repair logic (quick)
- [ ] Repair logic (full)
- [ ] Repair logic (rebuild)
- [ ] Repair validation
- [ ] Repair cost calculation
- [ ] Damage threshold

### VillageRenderIntegration Tests
- [ ] Building visual retrieval
- [ ] Construction progress calculation
- [ ] Damage overlay generation
- [ ] Activity indicator generation
- [ ] Upgrade progress calculation
- [ ] Visual state mapping
- [ ] Level visual mapping
- [ ] Damage visual mapping
