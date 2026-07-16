# Implementation Plan 02: Rendering Primitive System
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** High  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Related Plan:** `rendering_system_implementation_plan.md`  
**Duration:** 3 weeks

---

## Executive Summary

Build the rendering primitive library and material system that forms the visual foundation of the config-driven architecture. This phase establishes the rendering layer that separates visual appearance from gameplay logic, enabling the "Content is data. Code is capability" principle.

**Key Deliverables:**
- Render primitive library with 8+ primitives
- Material system with 8+ materials
- Primitive → material pipeline
- Integration with existing skin system
- Test harness for visual verification
- Comprehensive unit tests
- Documentation

---

## Objectives

### Primary Objectives
1. Create a library of reusable render primitives
2. Build a material system for physical material definitions
3. Implement primitive → material composition pipeline
4. Integrate with existing skin system for backward compatibility
5. Create test harness for visual verification

### Success Criteria
- 8+ render primitives implemented (bronze frame, obsidian surface, wood panel, etc.)
- 8+ materials implemented (bronze, iron, wood, stone, glass, jade, obsidian, parchment)
- Primitive → material pipeline functional
- Integration with existing skin system maintained
- Visual test harness operational
- Unit test coverage > 80%
- Zero breaking changes to existing components

---

## Architecture

### Render Primitive Library
**Purpose:** Define reusable visual building blocks that know only how they appear and react.

**Primitives:**
- `BronzeFramePrimitive` - Ornate bronze frame with bevels and highlights
- `ObsidianSurfacePrimitive` - Deep black surface with azure light leak
- `WoodPanelPrimitive` - Timber panel with grain texture
- `GlassLayerPrimitive` - Crystal layer with refraction
- `PortraitWindowPrimitive` - Portrait frame with decorative elements
- `MapMarkerPrimitive` - Map location marker
- `TokenPrimitive` - Game token with base and decoration
- `CardPrimitive` - Card base with frame and surface

**Interface:**
```typescript
interface RenderPrimitive {
  id: string;
  name: string;
  category: 'frame' | 'surface' | 'layer' | 'marker' | 'token' | 'card';
  render: (props: PrimitiveProps) => JSX.Element;
  defaultMaterial?: MaterialId;
  supportedMaterials: MaterialId[];
  complexity: 'simple' | 'medium' | 'rich' | 'hero';
}
```

### Material System
**Purpose:** Define physical materials with base color, lighting, AO, texture, noise, specular, and vignette.

**Materials:**
- `bronze` - Sun-bronze with metallic highlights
- `iron` - Dark iron with rust patina
- `wood` - Timber with grain texture
- `stone` - Alpine stone with natural texture
- `glass` - Crystal with refraction
- `jade` - Prismatic green stone
- `obsidian` - Deep black with azure light leak
- `parchment` - Aged paper with grain

**Interface:**
```typescript
interface MaterialDefinition {
  id: string;
  name: string;
  baseColor: string;
  radialLighting: string;
  ao: string;
  highlight: string;
  texture: string;
  noise: string;
  specular: string;
  vignette: string;
  complexity: 'simple' | 'medium' | 'rich' | 'hero';
}
```

### Primitive → Material Pipeline
**Purpose:** Compose primitives with materials to create visual components.

**Pipeline Stages:**
1. Select primitive based on component type
2. Apply material to primitive
3. Generate CSS layers from material definition
4. Apply layers to primitive structure
5. Render final component

**Interface:**
```typescript
interface PrimitiveMaterialPipeline {
  compose(
    primitiveId: PrimitiveId,
    materialId: MaterialId,
    overrides?: Partial<MaterialDefinition>
  ): ComposedPrimitive;
  generateCSS(material: MaterialDefinition): CSSLayer[];
  applyLayers(
    primitive: RenderPrimitive,
    layers: CSSLayer[]
  ): JSX.Element;
}
```

### Skin System Integration
**Purpose:** Maintain backward compatibility with existing skin system.

**Integration Points:**
- Map skin presets to material combinations
- Map skin presets to primitive selections
- Preserve CSS variable system
- Extend skin config with rendering defaults

**Interface:**
```typescript
interface SkinRenderingIntegration {
  mapPresetToMaterials(presetId: string): MaterialMapping;
  mapPresetToPrimitives(presetId: string): PrimitiveMapping;
  extendSkinConfig(config: SkinConfig): ExtendedSkinConfig;
}
```

---

## Implementation Phases

### Phase 2.1: Schema Definitions (Days 1-2)

**Objective:** Define TypeScript interfaces and Zod schemas for rendering system.

**Tasks:**
1. Create `src/rendering/schemas.ts`
   - Define RenderPrimitive interface
   - Define MaterialDefinition interface
   - Define CSSLayer interface
   - Define ComposedPrimitive interface
   - Create Zod schemas for validation
   - Export types and schemas

2. Create `src/rendering/types.ts`
   - Export all TypeScript types
   - Create type guards
   - Create utility types

**Deliverables:**
- `src/rendering/schemas.ts` (200+ lines)
- `src/rendering/types.ts` (100+ lines)
- Zod schemas for all rendering contracts
- Type guards for all rendering contracts

**Safeguards:**
- `npm run lint -- src/rendering/`
- `npm run build:check`

---

### Phase 2.2: Material Library (Days 3-5)

**Objective:** Implement material library with 8 base materials.

**Tasks:**
1. Create `src/rendering/materialLibrary.ts`
   - Implement MaterialDefinition for bronze
   - Implement MaterialDefinition for iron
   - Implement MaterialDefinition for wood
   - Implement MaterialDefinition for stone
   - Implement MaterialDefinition for glass
   - Implement MaterialDefinition for jade
   - Implement MaterialDefinition for obsidian
   - Implement MaterialDefinition for parchment
   - Each material with 5-6 layers (base, texture, gradient, AO, highlight, vignette)
   - CSS generation functions

2. Create `src/rendering/__tests__/materialLibrary.test.ts`
   - Test all material definitions
   - Test CSS generation
   - Test layer composition
   - Test material validation

**Deliverables:**
- `src/rendering/materialLibrary.ts` (400+ lines)
- `src/rendering/__tests__/materialLibrary.test.ts` (300+ lines)
- 8 materials with full layer definitions
- CSS generation for all materials

**Safeguards:**
- `npm run lint -- src/rendering/`
- `npm run test -- src/rendering/__tests__/materialLibrary.test.ts`
- `npm run build:check`

---

### Phase 2.3: Render Primitive Library (Days 6-9)

**Objective:** Implement render primitive library with 8 primitives.

**Tasks:**
1. Create `src/rendering/primitives/` directory
   - Implement BronzeFramePrimitive
   - Implement ObsidianSurfacePrimitive
   - Implement WoodPanelPrimitive
   - Implement GlassLayerPrimitive
   - Implement PortraitWindowPrimitive
   - Implement MapMarkerPrimitive
   - Implement TokenPrimitive
   - Implement CardPrimitive
   - Each primitive as React component
   - Each primitive with material support

2. Create `src/rendering/primitives/index.ts`
   - Export all primitives
   - Create primitive registry
   - Create primitive lookup functions

3. Create `src/rendering/__tests__/primitives.test.tsx`
   - Test all primitives render
   - Test primitive + material composition
   - Test primitive props
   - Test primitive validation

**Deliverables:**
- `src/rendering/primitives/` directory (8 primitives, 200+ lines each)
- `src/rendering/primitives/index.ts` (100+ lines)
- `src/rendering/__tests__/primitives.test.tsx` (400+ lines)
- 8 primitives with material support

**Safeguards:**
- `npm run lint -- src/rendering/`
- `npm run test -- src/rendering/__tests__/primitives.test.tsx`
- `npm run build:check`

---

### Phase 2.4: Primitive → Material Pipeline (Days 10-12)

**Objective:** Implement composition pipeline for primitives and materials.

**Tasks:**
1. Create `src/rendering/pipeline.ts`
   - Implement PrimitiveMaterialPipeline class
   - Implement compose function
   - Implement CSS generation
   - Implement layer application
   - Implement validation

2. Create `src/rendering/__tests__/pipeline.test.ts`
   - Test primitive + material composition
   - Test CSS generation
   - Test layer application
   - Test validation
   - Test error handling

**Deliverables:**
- `src/rendering/pipeline.ts` (300+ lines)
- `src/rendering/__tests__/pipeline.test.ts` (250+ lines)
- Working composition pipeline
- CSS generation system

**Safeguards:**
- `npm run lint -- src/rendering/`
- `npm run test -- src/rendering/__tests__/pipeline.test.ts`
- `npm run build:check`

---

### Phase 2.5: Skin System Integration (Days 13-14)

**Objective:** Integrate rendering system with existing skin system.

**Tasks:**
1. Create `src/rendering/skinIntegration.ts`
   - Implement mapPresetToMaterials
   - Implement mapPresetToPrimitives
   - Implement extendSkinConfig
   - Maintain backward compatibility

2. Update `src/ui/idleVillage/skins/skinConfigRegistry.ts`
   - Add rendering defaults to skin presets
   - Add material mappings
   - Add primitive mappings
   - Preserve existing functionality

3. Create `src/rendering/__tests__/skinIntegration.test.ts`
   - Test preset → material mapping
   - Test preset → primitive mapping
   - Test backward compatibility
   - Test skin config extension

**Deliverables:**
- `src/rendering/skinIntegration.ts` (200+ lines)
- Updated `src/ui/idleVillage/skins/skinConfigRegistry.ts`
- `src/rendering/__tests__/skinIntegration.test.ts` (200+ lines)
- Full backward compatibility

**Safeguards:**
- `npm run lint -- src/rendering/ src/ui/idleVillage/skins/`
- `npm run test -- src/rendering/__tests__/skinIntegration.test.ts`
- `npm run build:check`

---

### Phase 2.6: Test Harness (Days 15-16)

**Objective:** Create visual test harness for rendering system.

**Tasks:**
1. Create `src/pages/rendering-test-harness.tsx`
   - Test page for all primitives
   - Test page for all materials
   - Test page for primitive + material combinations
   - Interactive controls for testing
   - Visual comparison tools

2. Create `src/rendering/__tests__/visual.test.tsx`
   - Visual regression tests
   - Screenshot tests
   - Cross-browser tests

**Deliverables:**
- `src/pages/rendering-test-harness.tsx` (400+ lines)
- `src/rendering/__tests__/visual.test.tsx` (200+ lines)
- Visual test harness
- Visual regression tests

**Safeguards:**
- `npm run lint -- src/rendering/ src/pages/`
- `npm run test -- src/rendering/__tests__/visual.test.tsx`
- `npm run build:check`

---

### Phase 2.7: Documentation (Days 17-18)

**Objective:** Create comprehensive documentation for rendering system.

**Tasks:**
1. Create Rendering System Guide
   - Architecture overview
   - Primitive library guide
   - Material system guide
   - Pipeline guide
   - Integration guide
   - Best practices

2. Create Component Migration Guide
   - How to migrate existing components
   - Before/after examples
   - Common patterns
   - Troubleshooting

3. Create API Reference
   - Primitive API
   - Material API
   - Pipeline API
   - Integration API

**Deliverables:**
- Rendering System Guide (2000+ words)
- Component Migration Guide (1000+ words)
- API Reference (1000+ words)
- Code examples

**Safeguards:**
- `npm run lint -- docs/`
- `npm run build:check`
- `npm run kanban:lint`

---

### Phase 2.8: Integration & Validation (Days 19-21)

**Objective:** Integrate all systems and validate end-to-end.

**Tasks:**
1. Create `src/rendering/index.ts`
   - Export all public APIs
   - Create convenience functions
   - Create default instances

2. Integration testing
   - Test full workflow (primitive → material → render)
   - Test skin system integration
   - Test performance
   - Test error handling

3. Performance optimization
   - Benchmark rendering performance
   - Optimize CSS generation
   - Optimize layer composition
   - Implement caching if needed

**Deliverables:**
- `src/rendering/index.ts` (100+ lines)
- Integration test suite (300+ lines)
- Performance benchmarks
- Optimization implementations

**Safeguards:**
- `npm run lint -- src/rendering/`
- `npm run test -- src/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

---

## File Structure

```
src/rendering/
├── schemas.ts                          # TypeScript interfaces + Zod schemas
├── types.ts                            # Type exports and guards
├── materialLibrary.ts                  # Material definitions
├── pipeline.ts                         # Primitive → material pipeline
├── skinIntegration.ts                 # Skin system integration
├── index.ts                            # Public API exports
├── primitives/
│   ├── BronzeFramePrimitive.tsx
│   ├── ObsidianSurfacePrimitive.tsx
│   ├── WoodPanelPrimitive.tsx
│   ├── GlassLayerPrimitive.tsx
│   ├── PortraitWindowPrimitive.tsx
│   ├── MapMarkerPrimitive.tsx
│   ├── TokenPrimitive.tsx
│   ├── CardPrimitive.tsx
│   └── index.ts
└── __tests__/
    ├── schemas.test.ts
    ├── materialLibrary.test.ts
    ├── primitives.test.tsx
    ├── pipeline.test.ts
    ├── skinIntegration.test.ts
    ├── visual.test.tsx
    └── integration.test.ts

src/pages/
└── rendering-test-harness.tsx          # Visual test harness

docs/guides/
├── rendering_system_guide.md           # Rendering System Guide
└── component_migration_guide.md        # Component Migration Guide
```

---

## Key Code Examples

### Material Definition
```typescript
const obsidianMaterial: MaterialDefinition = {
  id: 'obsidian',
  name: 'Obsidian',
  baseColor: '#060f16',
  radialLighting: 'radial-gradient(circle at 0% 0%, rgba(0,229,255,0.15) 0%, transparent 50%)',
  ao: 'inset 0 0 20px rgba(0,0,0,0.5)',
  highlight: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
  texture: 'url(#noise-filter)',
  noise: 'rgba(0,0,0,0.1)',
  specular: 'rgba(255,255,255,0.05)',
  vignette: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.3) 100%)',
  complexity: 'medium',
};
```

### Primitive Usage
```typescript
import { BronzeFramePrimitive } from '@/rendering/primitives';

<BronzeFramePrimitive material="obsidian">
  {/* Content */}
</BronzeFramePrimitive>
```

### Pipeline Composition
```typescript
import { PrimitiveMaterialPipeline } from '@/rendering/pipeline';

const pipeline = new PrimitiveMaterialPipeline();

// Compose primitive with material
const composed = pipeline.compose(
  'bronze-frame',
  'obsidian',
  {
    // Optional material overrides
    baseColor: '#0a1a20'
  }
);

// Render composed primitive
<composed.render />
```

### Skin Integration
```typescript
import { mapPresetToMaterials } from '@/rendering/skinIntegration';

// Map skin preset to materials
const materials = mapPresetToMaterials('wanderlust');
// Returns: { frame: 'bronze', surface: 'obsidian', inset: 'stone' }

// Use in component
<BronzeFramePrimitive material={materials.frame}>
  <ObsidianSurfacePrimitive material={materials.surface}>
    {/* Content */}
  </ObsidianSurfacePrimitive>
</BronzeFramePrimitive>
```

---

## Success Criteria

### Functional Requirements
- ✅ 8 render primitives implemented
- ✅ 8 materials implemented
- ✅ Primitive → material pipeline functional
- ✅ Skin system integration maintained
- ✅ Visual test harness operational
- ✅ Unit test coverage > 80%
- ✅ Zero breaking changes to existing components

### Non-Functional Requirements
- ✅ Performance < 5ms for primitive rendering
- ✅ Performance < 2ms for material application
- ✅ Performance < 10ms for full composition
- ✅ Memory usage < 20MB for rendering system
- ✅ Zero runtime errors in normal operation
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### Integration Requirements
- ✅ Compatible with existing skin system
- ✅ Compatible with existing component system
- ✅ Ready for Phase 3 (Material Engine)
- ✅ Ready for Phase 6 (Village Evolution)
- ✅ Ready for Phase 8 (Frozen Kit Migration)

---

## Risks & Mitigations

### Risk 1: Breaking Existing Visuals
**Risk:** New rendering system could break existing component visuals.

**Mitigation:**
- Maintain backward compatibility with skin system
- Use feature flags for new rendering
- Provide migration guide
- Test extensively with existing components
- Rollback plan if issues arise

### Risk 2: Performance Degradation
**Risk:** Complex material layers could slow down rendering.

**Mitigation:**
- Implement CSS generation caching
- Implement layer composition caching
- Benchmark performance continuously
- Optimize hot paths
- Provide complexity controls

### Risk 3: Material Complexity
**Risk:** Material definitions could become too complex to maintain.

**Mitigation:**
- Keep material definitions declarative
- Use schema validation
- Document material patterns clearly
- Provide material builder tools
- Review material definitions regularly

### Risk 4: Primitive Proliferation
**Risk:** Too many primitives could overwhelm developers.

**Mitigation:**
- Provide sensible defaults
- Provide primitive composition patterns
- Document primitive use cases clearly
- Limit primitive count to essentials
- Provide primitive generators

---

## Dependencies

### Internal Dependencies
- Phase 1 (Component Runtime) - must be completed first
- Existing skin system (`skinConfigRegistry.ts`)
- Existing component system (`src/ui/idleVillage/components/`)

### External Dependencies
- React (already in project)
- Zod (already in project)
- TypeScript (already in project)

### Blocked By
- Phase 1 (Component Runtime) - must be completed first

### Blocking
- Phase 3 (Material Engine) depends on Phase 2 completion
- Phase 6 (Village Evolution) depends on Phase 2 completion
- Phase 8 (Frozen Kit Migration) depends on Phase 2 completion

---

## Timeline

- **Phase 2.1:** Days 1-2 (Schema Definitions)
- **Phase 2.2:** Days 3-5 (Material Library)
- **Phase 2.3:** Days 6-9 (Render Primitive Library)
- **Phase 2.4:** Days 10-12 (Primitive → Material Pipeline)
- **Phase 2.5:** Days 13-14 (Skin System Integration)
- **Phase 2.6:** Days 15-16 (Test Harness)
- **Phase 2.7:** Days 17-18 (Documentation)
- **Phase 2.8:** Days 19-21 (Integration & Validation)

**Total Duration:** 3 weeks (21 working days)

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 2.1 Execution:** Begin Phase 2.1 (Schema Definitions) with interfaces and schemas.
3. **Daily Standups:** Conduct daily standups to track progress and address blockers.
4. **Continuous Integration:** Run safeguards after each phase to ensure quality.
5. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Test Coverage Requirements

### Material Library Tests
- [ ] Bronze material definition valid
- [ ] Iron material definition valid
- [ ] Wood material definition valid
- [ ] Stone material definition valid
- [ ] Glass material definition valid
- [ ] Jade material definition valid
- [ ] Obsidian material definition valid
- [ ] Parchment material definition valid
- [ ] CSS generation for bronze
- [ ] CSS generation for iron
- [ ] CSS generation for wood
- [ ] CSS generation for stone
- [ ] CSS generation for glass
- [ ] CSS generation for jade
- [ ] CSS generation for obsidian
- [ ] CSS generation for parchment
- [ ] Layer composition for all materials
- [ ] Material validation

### Primitive Tests
- [ ] BronzeFramePrimitive renders
- [ ] ObsidianSurfacePrimitive renders
- [ ] WoodPanelPrimitive renders
- [ ] GlassLayerPrimitive renders
- [ ] PortraitWindowPrimitive renders
- [ ] MapMarkerPrimitive renders
- [ ] TokenPrimitive renders
- [ ] CardPrimitive renders
- [ ] Primitive + material composition
- [ ] Primitive props handling
- [ ] Primitive validation

### Pipeline Tests
- [ ] Primitive + material composition
- [ ] CSS generation
- [ ] Layer application
- [ ] Validation
- [ ] Error handling
- [ ] Performance benchmarks

### Skin Integration Tests
- [ ] Preset → material mapping
- [ ] Preset → primitive mapping
- [ ] Backward compatibility
- [ ] Skin config extension
- [ ] Existing skin presets work

### Visual Tests
- [ ] Visual regression for all primitives
- [ ] Visual regression for all materials
- [ ] Visual regression for compositions
- [ ] Cross-browser rendering
- [ ] Screenshot tests
