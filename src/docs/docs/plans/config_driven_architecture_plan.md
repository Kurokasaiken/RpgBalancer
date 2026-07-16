# Config Driven Component-Based Game Architecture
## Implementation Plan

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft Architecture Proposal  
**Priority:** Foundation before content scaling  
**Scope:** Entire game architecture  
**Related Docs:** `rendering_system_implementation_plan.md`, `art_direction_plan.md`, `component_freezing_certification_plan_v2.md`

---

## Executive Summary

Transform the entire game architecture into a **config-driven, component-based system** where every game element is defined primarily by configuration. This enables:

- **Single-line instantiation** of any game element
- **Self-describing components** with built-in contracts
- **Consistent behavior** across all contexts
- **Independent layers** for rendering, physics, localization, skin, animations, and interactions
- **JSON/config-based content** creation
- **AI-friendly** content generation without implementation knowledge
- **Future modding support**

**Core Principle:** "Content is data. Code is capability."

---

## Vision

### Current Problem
```tsx
// ❌ Hardcoded, component-specific
<AncientWoodMill
  specialAnimation
  customParticles
  uniqueLogic
/>
```

### Target State
```tsx
// ✅ Config-driven, universal
<GameComponent entityId="building.woodmill.ancient" />
```

Which loads:
```json
{
  "id": "building.woodmill.ancient",
  "type": "building",
  "render": {
    "primitive": "wood-structure",
    "material": "old-oak",
    "upgradeChain": "woodmill"
  },
  "physics": {
    "interaction": "heavy",
    "drag": "disabled"
  },
  "i18n": {
    "namespace": "buildings",
    "key": "woodmill.ancient"
  }
}
```

---

## Master Implementation Roadmap

### Dependency Graph
```
Architecture Docs (Plan 00)
        |
        v
Component Runtime Contract System (Plan 01)
        |
        v
Rendering System ─┬─ Physics System ─┬─ Seed System (Plans 02-05)
                  └──────────────────┘
                         |
                         v
Content Systems (Village / POI / UI, Plans 06-07)
                         |
                         v
Frozen Kit Migration & Modding Pipeline (Plans 08-09)
                         |
                         v
AI Production Pipeline (Plan 10)
```

### Plan Index
1. **Plan 00 – Architecture Foundation & ADRs** (`config_driven_architecture_00_architecture_foundation.md`): publish ADR-001 … ADR-006, dependency graph, governance gates.
2. **Plan 01 – Component Runtime** (`config_driven_architecture_01_component_runtime.md`): registry, factory, default resolver, validation, runtime context.
3. **Plan 02 – Rendering Primitive System** (`config_driven_architecture_02_rendering_primitives.md`): primitives, materials, primitive→material pipeline, skin integration.
4. **Plan 03 – Material Engine** (`config_driven_architecture_03_material_engine.md`): complexity levels, layer system, binding, optimization, validation.
5. **Plan 04 – Physics System** (`config_driven_architecture_04_physics_system.md`): physics profiles, unified engine, `useComponentPhysics`, render feedback.
6. **Plan 05 – Seed / Procedural Variation** (`config_driven_architecture_05_seed_system.md`): hierarchical seeds, deterministic RNG, visual/gameplay variation, validation.
7. **Plan 06 – Village Evolution System** (`config_driven_architecture_06_village_evolution.md`): village entities, building lifecycle, upgrades, damage/repair, integration.
8. **Plan 07 – POI World Map System** (`config_driven_architecture_07_poi_world_map.md`): POI contracts, configs, map marker primitives, physics + seed integration, migration.
9. **Plan 08 – Frozen Kit Migration** (`config_driven_architecture_08_frozen_kit_migration.md`): migrate trusted/frozen components into new runtime with evidence + docs.
10. **Plan 09 – Modding Layer** (`config_driven_architecture_09_modding_layer.md`): mod registry, loader, validator, sandbox, UI, telemetry.
11. **Plan 10 – AI Production Pipeline** (`config_driven_architecture_10_ai_production_pipeline.md`): prompt runner, config scaffolder, validation harness, runtime preview, freeze automation.

All downstream work must cite the relevant plan ID and ADR(s) as part of reviews and Kanban lint.

## Architecture Overview

### Layer 1: Game Component Runtime
```
GameComponentRuntime
├── ComponentRegistry
├── ComponentFactory
├── ComponentContract
├── RenderSystem
├── PhysicsSystem
├── InteractionSystem
├── LocalizationSystem
├── SkinSystem
├── SeedSystem
└── ValidationSystem
```

### Layer 2: Component Categories
- **Character**: PG, NPCs, enemies
- **Building**: Structures, upgrades, evolution
- **POI**: Map markers, locations
- **Resource**: Items, tokens, currency
- **UI**: Panels, cards, HUD elements

### Layer 3: Independent Systems
- **Rendering**: Primitives → Materials → Visual Effects
- **Physics**: Mass, elasticity, friction, interaction profiles
- **Localization**: i18n contracts per component
- **Skin**: Theme presets with visual recipes
- **Seed**: Deterministic procedural variation
- **Interaction**: Click, drag, hover, drop contracts

---

## Game Component Contract

Every component MUST have a contract:

```typescript
interface GameComponentContract {
  id: string;
  version: string;
  category: "character" | "building" | "poi" | "resource" | "ui";
  
  defaults: {
    context: any;
    size: any;
    state: any;
  };
  
  render?: RenderContract;
  physics?: PhysicsContract;
  interaction?: InteractionContract;
  localization?: I18nContract;
  skin?: SkinContract;
  seed?: SeedContract;
  performance?: PerformanceContract;
  modding?: ModContract;
}
```

---

## Default Context System

### Problem
Every component presumes someone passes data to it.

### Solution
Every component must work in isolation.

```tsx
<GameComponent id="poi.magic.forest"/>
```

Must automatically know:
- Default dimensions
- Default skin
- Language
- Default physics
- Default animations
- Fallback images
- Placeholder behavior

### Implementation: ComponentDefaultResolver
Resolution order:
1. Explicit Props
2. Runtime Context
3. Component Defaults
4. Global Defaults
5. Fallback Safe Mode

---

## Seed System

### Current State
RNG only for Monte Carlo simulations.

### Target: Global Seed Hierarchy
```
World Seed
├── Village Seed
├── Entity Seed
├── Component Seed
└── Visual Seed
```

### Example
```typescript
World: 928372
Building: woodmill_001
Seed: 928372-woodmill_001
```

### Uses
**Gameplay:**
- World generation
- Loot tables
- Event triggers

**Visual:**
- Scratches
- Imperfections
- Patina patterns
- Decoration positions
- Texture variations

### Critical Requirement
Imperfections must be **Random + Deterministic**:
- Same object = same imperfection
- Same seed = same visual result
- Different seed = different but consistent result

---

## Rendering Architecture

### Layer Separation
```
Logic
↓
Component Definition
↓
Render Primitive
↓
Material System
↓
Visual Effects
```

### Example: Building
```
BuildingComponent
↓
BuildingPrimitive
↓
WoodMaterial
↓
WeatheringLayer
↓
DamageLayer
```

---

## Render Primitive Library

### Location
`src/rendering/primitives/`

### Primitives
- `BronzeFramePrimitive`
- `ObsidianSurfacePrimitive`
- `WoodPanelPrimitive`
- `GlassLayerPrimitive`
- `PortraitWindowPrimitive`
- `MapMarkerPrimitive`
- `TokenPrimitive`
- `CardPrimitive`

### Principle
Primitives know ONLY:
- How they appear
- How they react

Primitives do NOT know:
- Gameplay logic
- Domain rules
- Business logic

---

## Material System

### Current State
`WanderlustSurface` is beautiful but too specific.

### Transformation
Transform `WanderlustSurface` → `SurfacePrimitive`

### Configuration
```json
{
  "material": "bronze",
  "edge": {
    "type": "eroded"
  },
  "wear": {
    "level": 0.4
  },
  "patina": {
    "enabled": true
  }
}
```

### Materials
- `bronze` - Sun-bronze with metallic highlights
- `iron` - Dark iron with rust patina
- `wood` - Timber with grain texture
- `stone` - Alpine stone with natural texture
- `glass` - Crystal with refraction
- `jade` - Prismatic green stone
- `obsidian` - Deep black with azure light leak
- `parchment` - Aged paper with grain

---

## Physics Architecture

### Objective
Every component can have physics, not just drag.

### Contract
```typescript
interface PhysicsProfile {
  mass: number;
  elasticity: number;
  friction: number;
  
  interaction: "heavy" | "light" | "static";
  drag: boolean;
  hover: boolean;
  snap: "magnetic" | "elastic" | "none";
}
```

### Examples
```typescript
// PG Card
{
  mass: 4,
  elasticity: 0.2,
  snap: "magnetic"
}

// Token
{
  mass: 0.5,
  elasticity: 0.8
}

// Building
{
  mass: 999,
  drag: false
}
```

---

## Physics Engine Unification

### Current State
- `useHeavyDrag`
- `useDragPhysicsEngine`
- Custom hooks scattered throughout

### Target
Unified `useComponentPhysics()` hook

### Input
`physicsProfile` from component contract

### Output
- Movement
- Rotation
- Shadow
- Depth
- Hover state
- Snap behavior

---

## UI Architecture

### Current State
React as primary framework with mixed concerns.

### Target
React as renderer only.

### New Structure
```
src/
├── game/
│   ├── entities/
│   ├── systems/
│   └── configs/
├── rendering/
│   ├── primitives/
│   ├── materials/
│   └── shaders/
├── components/
│   ├── runtime/
│   └── contracts/
└── ui/
    ├── screens/
    └── panels/
```

---

## Village System

### New Macro System
Objective: Living village with evolving entities.

### Entity Hierarchy
```
Village
├── Buildings
├── Residents
├── Resources
└── Events
```

### Building Lifecycle
```
Locked
↓
Discovered
↓
Construction
↓
Level 1
↓
Upgrade
↓
Level 2
↓
Damaged
↓
Destroyed
↓
Rebuilt
```

### Configuration
```json
{
  "id": "blacksmith",
  "levels": [
    {
      "level": 1,
      "visual": "small_blacksmith"
    },
    {
      "level": 2,
      "visual": "large_blacksmith"
    }
  ]
}
```

### Renderer Independence
The renderer knows NOTHING about gameplay.
It only reads: `building.currentLevel`

---

## POI System

### Transformation
POI = map marker → `PointOfInterestComponent`

### Supported Features
- Marker display
- Discovery state
- Danger level
- Reward tier
- Quest association
- Visual state

### Example
```json
{
  "id": "enchanted.valley",
  "type": "poi",
  "danger": 3,
  "rewardTier": 5,
  "visual": {
    "marker": "ancient_tree"
  }
}
```

---

## Localization Architecture

### Current State
Good system, needs integration into contract.

### Integration
Every component includes:
```json
{
  "i18n": {
    "namespace": "poi",
    "key": "enchanted.valley"
  }
}
```

### Forbidden Pattern
Never hardcode strings:
```tsx
// ❌ Forbidden
"Enchanted Valley"

// ✅ Required
t('poi.enchanted.valley')
```

---

## Frozen Component Governance 2.0

### Current State
Correct system, needs extension.

### New States
```
Draft
↓
Prototype
↓
Candidate
↓
Trusted
↓
Frozen
↓
Deprecated
```

### Frozen Component Requirements
Every frozen component must have:
- Contract
- Config Schema
- Runtime Test
- Visual Snapshot
- Performance Budget
- Documentation
- Migration Notes

---

## Modding Architecture

### Principle
Design for modding from day one.

### Forbidden Pattern
Never hardcode:
```typescript
// ❌ Forbidden
switch(componentType) {
  case 'building': ...
  case 'character': ...
}
```

### Required Pattern
Always use Registry:
```typescript
// ✅ Required
ComponentRegistry.register(modConfig)
```

### Example
```json
// mods/my_building.json
{
  "id": "custom.building",
  "type": "building",
  "render": { ... },
  "physics": { ... }
}
```

Loaded via:
```typescript
ComponentRegistry.register(modConfig)
```

---

## Performance Strategy

### Target Metrics
- 200 PG cards on screen
- 50 POI markers
- 20 buildings visible
- HUD elements
- Quest panel
- Log panel

### Rendering Rules
**Bulk (CSS):**
- Cards
- Panels

**Hero (SVG):**
- Important POI
- Medallions

**Heavy (Canvas):**
- Drag operations
- Complex effects

### Performance Budget
- < 16ms per frame (60 FPS)
- < 50MB memory for rendering system
- Layer caching for complex materials
- Lazy loading for off-screen components
- Complexity scaling based on device

---

## AI First Development Workflow

### Workflow
Every new element must follow:

1. **Create Config**
   - Define component contract
   - Specify render primitive
   - Specify material
   - Specify physics profile
   - Specify i18n keys

2. **Generate Contract**
   - Auto-generate TypeScript interfaces
   - Auto-generate Zod schemas
   - Auto-generate validation

3. **Generate Component Wrapper**
   - Auto-generate React component
   - Auto-generate hooks
   - Auto-generate tests

4. **Automatic Testing**
   - Contract validation
   - Render verification
   - Physics verification
   - Integration tests

5. **Freeze**
   - Visual snapshot
   - Performance benchmark
   - Documentation
   - Trusted status

### AI Input Example
```
Create new building:
Name: Ancient Observatory
Tier: Epic
Material: Bronze + Glass
Gameplay: Research building
```

### AI Output
- Config JSON
- Locale keys
- Visual primitive
- Component wrapper
- Tests
- Documentation

---

## Implementation Phases

### Phase 00: Architecture Foundation & ADRs
**Objective:** Publish the architectural "constitution" (ADR-001 … ADR-006), dependency graph, and governance rules that gate every downstream phase.

**Deliverables:**
- ADR repository under `/docs/architecture/ADR/`
- Dependency graph + architecture handbook
- Kanban/lint enforcement for ADR references & frozen governance
- AI-first workflow + frozen component criteria documentation

**Duration:** 1 week

**Related Plan:** `config_driven_architecture_00_architecture_foundation.md`

---

### Phase 1: Component Runtime
**Objective:** Build core runtime infrastructure.

**Tasks:**
1. ComponentRegistry implementation
2. ComponentFactory implementation
3. ComponentDefaultResolver implementation
4. ValidationSystem implementation
5. Runtime context system

**Deliverables:**
- `src/game/runtime/ComponentRegistry.ts`
- `src/game/runtime/ComponentFactory.ts`
- `src/game/runtime/ComponentDefaultResolver.ts`
- `src/game/runtime/ValidationSystem.ts`
- Unit tests for all runtime components
- Documentation

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_01_component_runtime.md`

---

### Phase 2: Rendering Primitive System
**Objective:** Build primitive library and material system.

**Tasks:**
1. Create render primitive library
2. Create material system
3. Create primitive → material pipeline
4. Integrate with existing skin system
5. Create primitive test harness

**Deliverables:**
- `src/rendering/primitives/` library
- `src/rendering/materials/` system
- Primitive → material pipeline
- Integration with skin system
- Test harness
- Documentation

**Duration:** 3 weeks

**Related Plan:** `config_driven_architecture_02_rendering_primitives.md`

---

### Phase 3: Material Engine
**Objective:** Enhance material system with advanced features.

**Tasks:**
1. Material complexity levels
2. Material layer system
3. Material → primitive binding
4. Material performance optimization
5. Material validation

**Deliverables:**
- Enhanced material engine
- Complexity level system
- Layer system
- Performance optimization
- Validation system
- Documentation

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_03_material_engine.md`

---

### Phase 4: Physics System
**Objective:** Build unified physics engine.

**Tasks:**
1. PhysicsProfile implementation
2. useComponentPhysics hook
3. Physics engine unification
4. Physics → render integration
5. Physics performance optimization

**Deliverables:**
- `src/game/physics/PhysicsProfile.ts`
- `src/game/physics/useComponentPhysics.ts`
- Unified physics engine
- Render integration
- Performance optimization
- Documentation

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_04_physics_system.md`

---

### Phase 5: Seed / Procedural Variation
**Objective:** Build deterministic seed system.

**Tasks:**
1. Seed hierarchy implementation
2. Deterministic RNG system
3. Seed → visual variation pipeline
4. Seed → gameplay variation pipeline
5. Seed validation

**Deliverables:**
- `src/game/seed/SeedSystem.ts`
- Deterministic RNG
- Visual variation pipeline
- Gameplay variation pipeline
- Validation system
- Documentation

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_05_seed_system.md`

---

### Phase 6: Village Evolution System
**Objective:** Build village lifecycle system.

**Tasks:**
1. Village entity system
2. Building lifecycle implementation
3. Upgrade system
4. Damage/repair system
5. Village → render integration

**Deliverables:**
- `src/game/village/VillageSystem.ts`
- Building lifecycle
- Upgrade system
- Damage/repair system
- Render integration
- Documentation

**Duration:** 3 weeks

**Related Plan:** `config_driven_architecture_06_village_evolution.md`

---

### Phase 7: POI World Map System
**Objective:** Convert all map markers into config-driven `PointOfInterestComponent` instances powered by rendering primitives, physics, and deterministic seeds.

**Tasks:**
1. Define POI contract + schema + defaults within the component runtime
2. Build POI config packs (`/data/presets/idleVillage/poi/`)
3. Implement POI component leveraging map marker primitives + physics
4. Integrate seed-based visual variation + telemetry hooks
5. Migrate existing POI usages and build test harnesses

**Deliverables:**
- POI contract + defaults + validation
- Config packs + AI templates for POIs
- `PointOfInterestComponent` with physics + seed integration
- Test harness + migration guide + documentation

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_07_poi_world_map.md`

---

### Phase 8: Frozen Kit Migration
**Objective:** Migrate existing components to new system.

**Tasks:**
1. PgCard migration
2. WorkerCard migration
3. POI migration
4. Token migration
5. Panel migration
6. Validation and testing

**Deliverables:**
- Migrated PgCard
- Migrated WorkerCard
- Migrated POI
- Migrated Token
- Migrated Panels
- Test suite
- Documentation

**Duration:** 4 weeks

**Related Plan:** `config_driven_architecture_08_frozen_kit_migration.md`

---

### Phase 9: Modding Layer
**Objective:** Provide a sandboxed modding pipeline (registry, loader, validator, UI) that plugs into the component runtime without compromising stability.

**Tasks:**
1. Build mod registry + manifest schema + directory loader
2. Implement validation (schema, security, compatibility, dependency)
3. Create sandbox/execution environment with resource limits
4. Develop mod management UI + telemetry hooks
5. Document mod submission + review workflow

**Deliverables:**
- `src/modding/` registry, loader, validator, sandbox
- Mod UI + CLI tools
- Telemetry + documentation + tests

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_09_modding_layer.md`

---

### Phase 10: AI Production Pipeline
**Objective:** Operationalize the AI-first workflow so designers can go from prompt → config → validation → runtime preview → freeze automatically.

**Tasks:**
1. Author AI pipeline guide + telemetry contract
2. Build prompt runner + config scaffolder scripts
3. Implement validation + runtime preview harness
4. Automate freeze checklist + COMPONENT_MASTER_INDEX updates
5. Instrument telemetry + dashboards for pipeline throughput

**Deliverables:**
- `scripts/ai/` toolchain (prompt runner, scaffolder, validator, freeze checklist)
- Runtime preview harness + evidence artifacts
- Documentation + telemetry dashboards

**Duration:** 2 weeks

**Related Plan:** `config_driven_architecture_10_ai_production_pipeline.md`

---

## Success Criteria

### Functional Requirements
- ✅ Architecture foundation with ADR-001 … ADR-006 + dependency graph
- ✅ Component Runtime with registry, factory, defaults
- ✅ Rendering Primitive Library with 8+ primitives
- ✅ Material System with 8+ materials
- ✅ Physics System with unified engine
- ✅ Seed System with deterministic variation
- ✅ Village Evolution System with lifecycle
- ✅ POI World Map System powered by components/physics/seed
- ✅ Modding Layer with registry/loader/validation/sandbox/UI
- ✅ Frozen Kit Migration for all major components
- ✅ AI Production Pipeline automating prompt → config → preview → freeze

### Non-Functional Requirements
- ✅ Zero breaking changes to existing gameplay
- ✅ Performance < 16ms per frame (60 FPS)
- ✅ Memory usage < 100MB for runtime system
- ✅ Unit test coverage > 80%
- ✅ Config-first design (no hardcoded values)
- ✅ AI-friendly content generation
- ✅ Modding support from day one

### Architecture Requirements
- ✅ Single-line component instantiation
- ✅ Self-describing components
- ✅ Consistent behavior across contexts
- ✅ Independent layers (render, physics, i18n, skin, seed)
- ✅ JSON/config-based content
- ✅ Deterministic procedural variation
- ✅ Frozen component governance

---

## Risks & Mitigations

### Risk 1: Breaking Existing Gameplay
**Risk:** New architecture could break existing gameplay systems.

**Mitigation:**
- Maintain backward compatibility
- Use feature flags for new system
- Extensive testing before rollout
- Migration guide for existing components
- Rollback plan if issues arise

### Risk 2: Performance Degradation
**Risk:** Config-driven system could be slower than hardcoded.

**Mitigation:**
- Implement caching for config lookups
- Implement lazy loading for components
- Complexity scaling based on device
- Performance benchmarking throughout
- Optimization sprints

### Risk 3: Complexity Overload
**Risk:** Too many layers could overwhelm developers.

**Mitigation:**
- Provide sensible defaults
- Provide visual recipes
- Provide component generators
- Document best practices
- Limit options per complexity level

### Risk 4: AI Generation Quality
**Risk:** AI-generated content could be low quality.

**Mitigation:**
- Strict schema validation
- Contract validation
- Automatic testing
- Human review process
- Iterative improvement

### Risk 5: Modding Security
**Risk:** Mods could introduce security vulnerabilities.

**Mitigation:**
- Mod sandboxing
- Mod validation
- Mod signing
- Mod review process
- Security audit

---

## Dependencies

### Internal Dependencies
- Existing skin system (`skinConfigRegistry.ts`)
- Existing component system (`src/ui/idleVillage/components/`)
- Existing physics system (`useHeavyDrag`, `useDragPhysicsEngine`)
- Existing i18n system (`react-i18next`)
- Art direction plan (`docs/plans/art_direction_plan.md`)

### External Dependencies
- React (already in project)
- Zod (already in project)
- TypeScript (already in project)

### Blocked By
- None (can start immediately)

### Blocking
- Phase 1 depends on Phase 00 completion
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 depends on Phase 1 completion
- Phase 5 depends on Phase 1 completion
- Phase 6 depends on Phases 2, 4, 5 completion
- Phase 7 depends on Phases 1-5 completion (runtime + render + physics + seed)
- Phase 8 depends on Phases 1-7 completion (content migration)
- Phase 9 depends on Phases 1-8 completion (frozen components + runtime)
- Phase 10 depends on Phases 00-09 completion (full pipeline inputs)

---

## Timeline

- **Phase 00:** 1 week (Architecture Foundation & ADRs)
- **Phase 01:** 2 weeks (Component Runtime)
- **Phase 02:** 3 weeks (Rendering Primitive System)
- **Phase 03:** 2 weeks (Material Engine)
- **Phase 04:** 2 weeks (Physics System)
- **Phase 05:** 2 weeks (Seed / Procedural Variation)
- **Phase 06:** 3 weeks (Village Evolution System)
- **Phase 07:** 2 weeks (POI World Map System)
- **Phase 08:** 4 weeks (Frozen Kit Migration)
- **Phase 09:** 2 weeks (Modding Layer)
- **Phase 10:** 2 weeks (AI Production Pipeline)

**Total Duration:** 25 weeks (~5.5 months)

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 00 Execution:** Begin Phase 00 (Architecture Foundation & ADRs) with contracts and schemas.
3. **Phase 1 Execution:** Begin Phase 1 (Component Runtime) with registry and factory.
4. **Weekly Reviews:** Conduct weekly reviews to track progress and adjust plan as needed.
5. **Continuous Integration:** Run safeguards after each phase to ensure quality.
6. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Key Code Examples

### Component Contract Example
```typescript
const woodmillContract: GameComponentContract = {
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
    material: 'old-oak',
    upgradeChain: 'woodmill'
  },
  
  physics: {
    mass: 999,
    interaction: 'static',
    drag: false
  },
  
  i18n: {
    namespace: 'buildings',
    key: 'woodmill.ancient'
  },
  
  seed: {
    visual: true,
    gameplay: false
  }
};
```

### Component Usage Example
```tsx
// Single-line instantiation
<GameComponent entityId="building.woodmill.ancient" />

// With overrides
<GameComponent 
  entityId="building.woodmill.ancient"
  level={2}
  damaged={true}
/>

// With custom context
<GameComponent 
  entityId="building.woodmill.ancient"
  context="map-view"
  size="small"
/>
```

### Seed System Example
```typescript
// World seed
const worldSeed = 928372;

// Village seed derived from world
const villageSeed = deriveSeed(worldSeed, 'village');

// Building seed derived from village
const buildingSeed = deriveSeed(villageSeed, 'woodmill_001');

// Visual seed derived from building
const visualSeed = deriveSeed(buildingSeed, 'visual');

// Deterministic visual variation
const scratches = generateScratches(visualSeed);
const patina = generatePatina(visualSeed);
const decorations = generateDecorations(visualSeed);

// Same seed = same result
const scratches2 = generateScratches(visualSeed);
assert(deepEqual(scratches, scratches2)); // ✅
```

### Physics Profile Example
```typescript
const pgCardPhysics: PhysicsProfile = {
  mass: 4,
  elasticity: 0.2,
  friction: 0.8,
  interaction: 'light',
  drag: true,
  hover: true,
  snap: 'magnetic'
};

const tokenPhysics: PhysicsProfile = {
  mass: 0.5,
  elasticity: 0.8,
  friction: 0.3,
  interaction: 'light',
  drag: true,
  hover: true,
  snap: 'elastic'
};

const buildingPhysics: PhysicsProfile = {
  mass: 999,
  elasticity: 0.0,
  friction: 1.0,
  interaction: 'static',
  drag: false,
  hover: false,
  snap: 'none'
};
```

### Mod Loading Example
```typescript
// Load mod
const modConfig = await loadMod('mods/my_building.json');

// Validate mod
const validationResult = validateMod(modConfig);
if (!validationResult.valid) {
  throw new Error(`Mod validation failed: ${validationResult.errors}`);
}

// Register mod components
modConfig.components.forEach(component => {
  ComponentRegistry.register(component);
});

// Use mod component
<GameComponent entityId="custom.building" />
```

---

## Related Documents

- **Rendering System Implementation Plan:** `docs/plans/rendering_system_implementation_plan.md`
- **Art Direction Plan:** `docs/plans/art_direction_plan.md`
- **Component Freezing Certification Plan:** `docs/plans/component_freezing_certification_plan_v2.md`
- **Documentation Governance:** `src/docs/docs/DOCUMENTATION_GOVERNANCE.md`
- **Project Invariants:** `.windsurf/rules/00-project-invariants.md`
