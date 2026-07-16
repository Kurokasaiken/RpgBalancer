# Rendering System Implementation Plan
## Transforming Skin System into Blizzard-Style Layered Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** High  
**Related Docs:** `art_direction_plan.md`, `skinConfigRegistry.ts`, `skinCssVariables.ts`

---

## Executive Summary

The current skin system is a **Design System** (preset → CSS variables → component → result). It successfully solves skin diversity, token management, binding, scope, and governance. However, it does not solve the **physical construction** of visual objects.

The **WanderlustMedalOverlay** demonstrates the Blizzard philosophy with 12 layers (bronze body, texture, bevel, rim, inner ring, field, portrait, glass, patina, scratches, AO, gem). Each layer adds depth and richness.

The **V9PanelShell** follows web philosophy with only 4 layers (background, border, shadow, header). The border is a line, not a physical object.

**Solution:** Transform the system from a Design System into a **Rendering System** with Material, Frame, and Layer libraries.

---

## Current Architecture Analysis

### What Works Well
- ✅ **Skin Presets:** `base`, `wanderlust`, `minimal_frontier`, `resident_slotrack_signature`
- ✅ **CSS Variables:** Comprehensive token coverage (`--skin-surface-bg`, `--skin-title-color`, etc.)
- ✅ **Scope System:** `.skin-scope` with role-based styling
- ✅ **Binding:** `applySkinCssVariables()` with global application
- ✅ **Governance:** Registry schema with Zod validation
- ✅ **Component Themes:** Per-preset component theme mapping

### What's Missing
- ❌ **Material Library:** No physical material definitions (obsidian, stone, bronze, wood)
- ❌ **Frame Library:** No frame objects (bronze, imperial, stone, simple)
- ❌ **Layer Recipes:** No construction recipes for components
- ❌ **Decorative Packs:** No Explorer/Imperial/Nature decoration layers
- ❌ **Corner Library:** No corner variants (square, bevel, leaf, bronze)
- ❌ **Divider Library:** No divider styles (diamond, leaves, imperial, runic)
- ❌ **Overlay Library:** No texture overlays (dust, fog, scratches, patina)
- ❌ **Light Sources:** No lighting presets (north, south, sun, torch, moon)
- ❌ **Complexity Levels:** No frame complexity tiers (simple/medium/hero/legendary)
- ❌ **Visual Recipes:** No composition recipes (village panel, quest panel, reward panel)

### The Gap
**Current:**
```
Preset → CSS Variables → Component → Result
```

**Target:**
```
Preset → Material Library → Frame Library → Layer Recipes → Component → Result
```

---

## Proposed Architecture

### 1. Material Library

**Purpose:** Define physical materials with base color, lighting, AO, texture, noise, specular, and vignette.

**Materials:**
- `obsidian` - Deep black with azure light leak
- `stone` - Alpine stone with natural texture
- `bronze` - Sun-bronze with metallic highlights
- `darkWood` - Timber with grain texture
- `crystal` - Prismatic with refraction
- `cloth` - Woven fabric with weave pattern
- `parchment` - Aged paper with grain
- `iron` - Dark iron with rust patina
- `leather` - Tooled leather with grain

**Material Definition Schema:**
```typescript
interface MaterialDefinition {
  id: string;
  name: string;
  baseColor: string;
  radialLighting: string; // radial-gradient(...)
  ao: string; // ambient occlusion
  highlight: string; // specular highlight
  texture: string; // noise/feTurbulence
  noise: string; // organic noise overlay
  specular: string; // reflection intensity
  vignette: string; // edge darkening
  complexity: 'simple' | 'medium' | 'rich' | 'hero';
}
```

**Usage:**
```tsx
<Surface material="obsidian">
  {/* Automatically applies 5-6 layers */}
</Surface>
```

### 2. Frame Library

**Purpose:** Define frame objects with outer bevel, metal body, highlight, AO, inner line, decorative corners, and glow hooks.

**Frames:**
- `bronze` - Classic bronze frame with ornate corners
- `imperial` - Baroque sun-bronze with eagle motifs
- `stone` - Rough stone with natural cracks
- `simple` - Minimal single-line frame
- `parchment` - Aged paper edge with deckle
- `guild` - Crafted wood with rivets
- `hero` - Ornate gold with runic inscriptions
- `reward` - Gem-encrusted with sparkle effects
- `glass` - Crystal with refraction
- `none` - No frame (for inset panels)

**Frame Definition Schema:**
```typescript
interface FrameDefinition {
  id: string;
  name: string;
  outerBevel: string; // bevel gradient
  metalBody: string; // metal gradient
  highlight: string; // top highlight
  ao: string; // ambient occlusion
  innerLine: string; // pinstripe
  decorativeCorners: CornerId;
  glowHooks: string; // glow animation
  complexity: 'simple' | 'medium' | 'rich' | 'hero';
  cssLayers: FrameLayer[]; // actual CSS layer definitions
}
```

**Usage:**
```tsx
<Frame variant="bronze">
  <Surface material="obsidian">
    {/* Content */}
  </Surface>
</Frame>
```

### 3. Layer Recipes

**Purpose:** Define construction recipes for component types.

**Recipes:**
- `panel` - Background, AO, frame, highlight, inset, dust, decoration
- `button` - Base, AO, frame, pressed shadow, highlight, text glow
- `reward` - Panel, gold accents, runes, particles, glow, sparkles
- `tooltip` - Glass surface, border, shadow, text
- `modal` - Backdrop, container, frame, header, content
- `card` - Surface, frame, portrait, stats, actions
- `hud` - Glass, border, glow, minimal frame
- `capsule` - Inset, border, minimal frame

**Recipe Definition Schema:**
```typescript
interface LayerRecipe {
  id: string;
  name: string;
  layers: LayerDefinition[];
  defaultFrame?: FrameId;
  defaultMaterial?: MaterialId;
  defaultDecoration?: DecorationPackId;
  complexity: 'simple' | 'medium' | 'rich' | 'hero';
}
```

**Usage:**
```tsx
<Recipe type="panel" frame="bronze" material="obsidian" decoration="explorer">
  {/* Content */}
</Recipe>
```

### 4. Decorative Pack Library

**Purpose:** Add thematic decoration layers without changing component structure.

**Packs:**
- `none` - No decoration
- `explorer` - Compass, rope, paper, rivets
- `imperial` - Filigree, eagle, sun, bronze
- `village` - Wood, thatch, tools, lanterns
- `nature` - Leaves, moss, roots, vines
- `magic` - Runes, sparkles, particles, glow
- `ancient` - Cracks, patina, weathering, age
- `boss` - Dark aura, spikes, chains, menacing
- `quest` - Map fragments, compass, journal
- `legendary` - All effects combined

**Decoration Definition Schema:**
```typescript
interface DecorationPack {
  id: string;
  name: string;
  theme: 'explorer' | 'imperial' | 'village' | 'nature' | 'magic' | 'ancient' | 'boss' | 'quest' | 'legendary';
  layers: DecorationLayer[];
  complexity: 'simple' | 'medium' | 'rich' | 'hero';
}
```

### 5. Corner Library

**Purpose:** Define corner styles independent of frame.

**Corners:**
- `square` - 90° sharp corners
- `bevel` - 45° beveled corners
- `rounded` - Rounded corners (current)
- `leaf` - Organic leaf shapes
- `bronze` - Ornate bronze corners
- `imperial` - Baroque eagle corners
- `rune` - Runic inscribed corners
- `stone` - Natural stone corners
- `none` - No corner decoration

**Corner Definition Schema:**
```typescript
interface CornerDefinition {
  id: string;
  name: string;
  shape: 'square' | 'bevel' | 'rounded' | 'leaf' | 'ornate';
  clipPath: string; // CSS clip-path
  decoration?: string; // SVG or CSS decoration
}
```

### 6. Divider Library

**Purpose:** Define divider styles for section separation.

**Dividers:**
- `simple` - Single line
- `double` - Double line
- `diamond` - Line with diamond center
- `leaves` - Line with leaf decoration
- `imperial` - Line with eagle motif
- `runic` - Line with runic inscription
- `compass` - Line with compass rose
- `goldFade` - Gold gradient fade
- `stoneCrack` - Natural stone crack
- `none` - No divider

**Divider Definition Schema:**
```typescript
interface DividerDefinition {
  id: string;
  name: string;
  style: 'line' | 'decoration' | 'gradient' | 'organic';
  css: string; // CSS for the divider
  animation?: string; // optional animation
}
```

### 7. Overlay Library

**Purpose:** Add optional texture overlays for organic imperfections.

**Overlays:**
- `none` - No overlay
- `dust` - Floating dust particles
- `fog` - Atmospheric fog
- `lightLeak` - Light leak from edges
- `scratches` - Surface scratches
- `patina` - Oxidation patina
- `noise` - Organic noise texture
- `paperGrain` - Paper texture
- `crystalReflections` - Prismatic reflections

**Overlay Definition Schema:**
```typescript
interface OverlayDefinition {
  id: string;
  name: string;
  type: 'texture' | 'animation' | 'filter';
  css: string; // CSS for the overlay
  opacity: number; // default opacity
  blendMode: string; // CSS blend-mode
}
```

### 8. Light Sources

**Purpose:** Define lighting presets for consistent illumination.

**Light Sources:**
- `north` - Cold teal light (arctic)
- `south` - Warm gold light (desert)
- `sun` - White light (solar triumph)
- `torch` - Orange light (fire)
- `moon` - Blue light (night)
- `ambient` - Neutral ambient light

**Light Source Definition Schema:**
```typescript
interface LightSource {
  id: string;
  name: string;
  color: string;
  intensity: number;
  direction: 'north' | 'south' | 'east' | 'west' | 'top';
  shadowColor: string;
  shadowIntensity: number;
}
```

### 9. Frame Complexity

**Purpose:** Control layer count based on narrative importance.

**Complexity Levels:**
- `simple` - 3 layers (base, border, shadow)
- `medium` - 6 layers (base, texture, gradient, AO, border, shadow)
- `rich` - 12 layers (full Blizzard-style)
- `legendary` - 18+ layers (hero showcase, boss, reward)

**Complexity Rules:**
- Layer 1-5: Always (base, texture, gradient, AO, border)
- Layer 6-8: Important panels (medium)
- Layer 9-12: Hero components (rich)
- Layer 13-18: Legendary moments (legendary)

**Visual Richness Rule:**
> "Visual richness follows narrative importance. Every layer added must increase the perceived value of the element. Frequent components remain simple; reward, choice, and memorable moments can accumulate more layers, depth, and detail."

### 10. Visual Recipes

**Purpose:** Pre-configured compositions for common UI patterns.

**Recipes:**
- `villagePanel` - Frame Bronze Rich + Surface Obsidian + Lighting Torch + Decoration Explorer + Divider Diamond + Inset Imperial
- `questPanel` - Frame Imperial Rich + Surface Stone + Lighting Sun + Decoration Quest + Divider Runic + Inset Guild
- `inventoryPanel` - Frame Simple Medium + Surface Wood + Lighting Ambient + Decoration Village + Divider Simple + Inset Parchment
- `rewardPanel` - Frame Hero Rich + Surface Crystal + Lighting Sun + Decoration Legendary + Divider GoldFade + Inset Glass
- `bossPanel` - Frame Boss Rich + Surface Obsidian + Lighting Torch + Decoration Boss + Divider StoneCrack + Inset Iron
- `dialoguePanel` - Frame Imperial Medium + Surface Parchment + Lighting Ambient + Decoration Ancient + Divider Simple + Inset None
- `characterSheet` - Frame Hero Rich + Surface Bronze + Lighting Sun + Decoration Imperial + Divider Diamond + Inset Gold
- `tooltip` - Frame Glass Simple + Surface Crystal + Lighting Ambient + Decoration None + Divider None + Inset None
- `window` - Frame Imperial Medium + Surface Obsidian + Lighting North + Decoration Imperial + Divider Double + Inset Stone
- `card` - Frame Bronze Medium + Surface Parchment + Lighting Ambient + Decoration Explorer + Divider Simple + Inset Wood
- `popup` - Frame Simple Simple + Surface Obsidian + Lighting Ambient + Decoration None + Divider None + Inset None

**Visual Recipe Definition Schema:**
```typescript
interface VisualRecipe {
  id: string;
  name: string;
  frame: FrameId;
  frameComplexity: ComplexityLevel;
  material: MaterialId;
  lighting: LightSourceId;
  decoration: DecorationPackId;
  divider: DividerId;
  inset: MaterialId;
  overlay?: OverlayId;
  corner: CornerId;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Objective:** Establish core infrastructure for Rendering System.

**Tasks:**
1. Create schema definitions in `src/ui/idleVillage/rendering/schemas.ts`
   - MaterialDefinition, FrameDefinition, LayerRecipe, etc.
   - Zod validation schemas
   - TypeScript types

2. Create Material Library in `src/ui/idleVillage/rendering/materialLibrary.ts`
   - Implement base materials: obsidian, stone, bronze, wood
   - Each material with 5-6 layers (base, texture, gradient, AO, highlight, vignette)
   - CSS generation functions

3. Create Frame Library in `src/ui/idleVillage/rendering/frameLibrary.ts`
   - Implement base frames: bronze, simple, stone
   - Each frame with 7-8 layers (outer bevel, metal body, highlight, AO, inner line, corners, glow)
   - CSS generation functions

4. Create Layer Recipe System in `src/ui/idleVillage/rendering/layerRecipes.ts`
   - Implement base recipes: panel, button, tooltip
   - Recipe composition logic
   - Layer stacking order

5. Integration with existing skin system
   - Extend `skinConfigRegistry.ts` to include rendering defaults
   - Map skin presets to material/frame combinations
   - Backward compatibility with existing CSS variables

**Deliverables:**
- Schema definitions with Zod validation
- Material Library with 4 base materials
- Frame Library with 3 base frames
- Layer Recipe System with 3 base recipes
- Integration with existing skin system
- Unit tests for all libraries
- Documentation update

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/`
- `npm run test -- src/ui/idleVillage/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 2: Component Integration (Week 3-4)

**Objective:** Integrate Rendering System into existing components.

**Tasks:**
1. Create React components for Rendering System
   - `<Surface material="obsidian">` component
   - `<Frame variant="bronze">` component
   - `<Recipe type="panel">` component
   - `<Decoration pack="explorer">` component

2. Refactor V9PanelShell to use Rendering System
   - Replace inline styles with Frame + Surface components
   - Apply bronze frame + obsidian material
   - Add layer recipe for panel construction
   - Maintain backward compatibility

3. Refactor Button components to use Rendering System
   - Replace inline styles with Recipe component
   - Apply button recipe with pressed states
   - Add hover/active animations

4. Refactor Modal components to use Rendering System
   - Replace inline styles with Frame + Surface
   - Apply modal recipe with backdrop
   - Add overlay support

5. Create Design System playground
   - Page to test all materials, frames, recipes
   - Interactive controls for complexity levels
   - Visual comparison before/after

**Deliverables:**
- React components for Rendering System
- Refactored V9PanelShell with Rendering System
- Refactored Button components with Rendering System
- Refactored Modal components with Rendering System
- Design System playground page
- RTL tests for all components
- Documentation update

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/ src/ui/idleVillage/components/`
- `npm run test -- src/ui/idleVillage/rendering/ src/ui/idleVillage/components/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 3: Library Expansion (Week 5-6)

**Objective:** Expand libraries with additional materials, frames, and decorations.

**Tasks:**
1. Expand Material Library
   - Add: crystal, cloth, parchment, iron, leather
   - Each with full layer definitions
   - Complexity levels (simple/medium/rich)

2. Expand Frame Library
   - Add: imperial, parchment, guild, hero, reward, glass
   - Each with full layer definitions
   - Corner decorations

3. Create Corner Library
   - Implement all corner variants
   - CSS clip-path definitions
   - SVG decorations for ornate corners

4. Create Divider Library
   - Implement all divider variants
   - CSS and SVG definitions
   - Animation support

5. Create Overlay Library
   - Implement texture overlays
   - Noise, dust, fog, scratches
   - Blend modes and opacity control

6. Create Light Source Library
   - Implement lighting presets
   - Shadow definitions
   - Intensity controls

**Deliverables:**
- Material Library with 9 materials
- Frame Library with 9 frames
- Corner Library with 8 corners
- Divider Library with 9 dividers
- Overlay Library with 8 overlays
- Light Source Library with 6 sources
- Unit tests for all libraries
- Documentation update

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/`
- `npm run test -- src/ui/idleVillage/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 4: Visual Recipes & Decoration (Week 7-8)

**Objective:** Implement visual recipes and decoration packs.

**Tasks:**
1. Create Decoration Pack Library
   - Implement all decoration packs
   - Explorer, Imperial, Village, Nature, Magic, Ancient, Boss, Quest, Legendary
   - Each with thematic layer definitions

2. Create Visual Recipe System
   - Implement all visual recipes
   - Village Panel, Quest Panel, Inventory Panel, Reward Panel, Boss Panel, etc.
   - Recipe composition logic

3. Integrate Visual Recipes into components
   - Add recipe prop to Panel component
   - Add recipe prop to Card component
   - Add recipe prop to Modal component
   - Automatic layer application

4. Implement Complexity Level System
   - Add complexity prop to components
   - Dynamic layer selection based on complexity
   - Performance optimization for simple/medium

5. Create Recipe Builder Tool
   - UI to build custom recipes
   - Visual preview of layer stack
   - Export/import recipe definitions

**Deliverables:**
- Decoration Pack Library with 9 packs
- Visual Recipe System with 11 recipes
- Complexity Level System
- Recipe Builder Tool
- Integration with existing components
- RTL tests for all recipes
- Documentation update

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/`
- `npm run test -- src/ui/idleVillage/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 5: Art Direction Integration (Week 9)

**Objective:** Integrate Rendering System with Art Direction Plan.

**Tasks:**
1. Update Art Direction Plan
   - Add Rendering System rules
   - Define layer philosophy
   - Add complexity guidelines
   - Add visual richness rule

2. Create Pillar-Specific Recipes
   - Wilderness pillar recipes (rude beauty, organic)
   - Empire pillar recipes (solar triumph, monumental)
   - Material selection per pillar
   - Frame selection per pillar

3. Create Artist-Style Recipes
   - Ruan Jia style (clean, sculptural)
   - Jaime Jones style (impasto, textured)
   - Sparth style (monumental, asymmetric)
   - Jeff Easley style (heroic, weight)

4. Integrate with Skin Presets
   - Map skin presets to pillar recipes
   - Wanderlust → Wilderness/Empire recipes
   - Minimal Frontier → simple recipes
   - Base → balanced recipes

5. Create Art Direction Validation
   - Validate recipes against art direction rules
   - Check material appropriateness
   - Check frame appropriateness
   - Check complexity appropriateness

**Deliverables:**
- Updated Art Direction Plan with Rendering System rules
- Pillar-specific recipes (Wilderness, Empire)
- Artist-style recipes (Ruan Jia, Jaime Jones, Sparth, Jeff Easley)
- Skin preset integration
- Art direction validation system
- Documentation update

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/ docs/plans/`
- `npm run test -- src/ui/idleVillage/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 6: Performance & Optimization (Week 10)

**Objective:** Optimize Rendering System for performance.

**Tasks:**
1. Implement Layer Caching
   - Cache generated CSS for materials
   - Cache generated CSS for frames
   - Cache generated CSS for recipes
   - Invalidation strategy

2. Implement Lazy Loading
   - Lazy load complex materials
   - Lazy load complex frames
   - Lazy load decoration packs
   - Priority loading for visible components

3. Implement Complexity Scaling
   - Automatic complexity reduction on low-end devices
   - FPS-based complexity adjustment
   - User preference for complexity level
   - Performance monitoring

4. Implement CSS Optimization
   - Minimize CSS output
   - Remove unused layers
   - Merge similar layers
   - Use CSS custom properties efficiently

5. Performance Testing
   - Benchmark rendering performance
   - Measure FPS impact
   - Test on low-end devices
   - Profile memory usage

**Deliverables:**
- Layer caching system
- Lazy loading system
- Complexity scaling system
- CSS optimization
- Performance benchmarks
- Documentation update

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/`
- `npm run test -- src/ui/idleVillage/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 7: Documentation & Examples (Week 11)

**Objective:** Create comprehensive documentation and examples.

**Tasks:**
1. Create Rendering System Guide
   - Architecture overview
   - Material Library guide
   - Frame Library guide
   - Layer Recipe guide
   - Visual Recipe guide
   - Best practices

2. Create Component Migration Guide
   - How to migrate existing components
   - Before/after examples
   - Common patterns
   - Troubleshooting

3. Create Recipe Examples
   - Village Panel example
   - Quest Panel example
   - Reward Panel example
   - Boss Panel example
   - Step-by-step breakdown

4. Create Art Direction Examples
   - Wilderness pillar examples
   - Empire pillar examples
   - Artist style examples
   - Complexity level examples

5. Update Existing Documentation
   - Update skin system documentation
   - Update component documentation
   - Update style guide
   - Update onboarding guide

**Deliverables:**
- Rendering System Guide
- Component Migration Guide
- Recipe Examples
- Art Direction Examples
- Updated existing documentation
- Documentation validation

**Safeguards:**
- `npm run lint -- docs/`
- `npm run build:check`
- `npm run kanban:lint`

### Phase 8: Testing & Validation (Week 12)

**Objective:** Comprehensive testing and validation.

**Tasks:**
1. Unit Testing
   - Test all material definitions
   - Test all frame definitions
   - Test all layer recipes
   - Test all visual recipes
   - Test all decoration packs

2. Integration Testing
   - Test component integration
   - Test skin preset integration
   - Test pillar integration
   - Test complexity scaling
   - Test performance optimization

3. Visual Regression Testing
   - Screenshot tests for all materials
   - Screenshot tests for all frames
   - Screenshot tests for all recipes
   - Screenshot tests for all components
   - Cross-browser testing

4. Accessibility Testing
   - Test keyboard navigation
   - Test screen reader compatibility
   - Test color contrast
   - Test focus indicators

5. User Testing
   - Test with real users
   - Gather feedback on visual quality
   - Gather feedback on performance
   - Iterate based on feedback

**Deliverables:**
- Comprehensive unit test suite
- Integration test suite
- Visual regression test suite
- Accessibility test suite
- User testing report
- Bug fixes and iterations

**Safeguards:**
- `npm run lint -- src/ui/idleVillage/rendering/`
- `npm run test -- src/ui/idleVillage/rendering/`
- `npm run build:check`
- `npm run kanban:lint`

---

## File Structure

```
src/ui/idleVillage/rendering/
├── schemas.ts                    # TypeScript types + Zod schemas
├── materialLibrary.ts            # Material definitions
├── frameLibrary.ts               # Frame definitions
├── cornerLibrary.ts              # Corner definitions
├── dividerLibrary.ts             # Divider definitions
├── overlayLibrary.ts             # Overlay definitions
├── lightSourceLibrary.ts         # Light source definitions
├── decorationLibrary.ts          # Decoration pack definitions
├── layerRecipes.ts               # Layer recipe definitions
├── visualRecipes.ts              # Visual recipe definitions
├── components/
│   ├── Surface.tsx               # Surface component
│   ├── Frame.tsx                 # Frame component
│   ├── Recipe.tsx                # Recipe component
│   ├── Decoration.tsx            # Decoration component
│   └── index.ts                  # Component exports
├── hooks/
│   ├── useRenderingSystem.ts     # Main hook
│   ├── useMaterial.ts            # Material hook
│   ├── useFrame.ts               # Frame hook
│   └── useRecipe.ts              # Recipe hook
├── utils/
│   ├── cssGenerator.ts           # CSS generation utilities
│   ├── layerStacker.ts            # Layer stacking utilities
│   ├── complexityScaler.ts       # Complexity scaling utilities
│   └── cacheManager.ts            # Cache management
└── __tests__/
    ├── schemas.test.ts
    ├── materialLibrary.test.ts
    ├── frameLibrary.test.ts
    ├── layerRecipes.test.ts
    ├── visualRecipes.test.ts
    └── components.test.tsx

docs/plans/
└── rendering_system_implementation_plan.md  # This file

docs/guides/
├── rendering_system_guide.md     # Rendering System guide
├── component_migration_guide.md  # Migration guide
└── recipe_examples.md            # Recipe examples
```

---

## Success Criteria

### Functional Requirements
- ✅ Material Library with 9+ materials
- ✅ Frame Library with 9+ frames
- ✅ Corner Library with 8+ corners
- ✅ Divider Library with 9+ dividers
- ✅ Overlay Library with 8+ overlays
- ✅ Light Source Library with 6+ sources
- ✅ Decoration Pack Library with 9+ packs
- ✅ Layer Recipe System with 10+ recipes
- ✅ Visual Recipe System with 11+ recipes
- ✅ React components for all libraries
- ✅ Integration with existing skin system
- ✅ Integration with art direction plan
- ✅ Complexity level system
- ✅ Performance optimization

### Non-Functional Requirements
- ✅ Zero breaking changes to existing components
- ✅ Backward compatibility with CSS variables
- ✅ Performance < 16ms per frame (60 FPS)
- ✅ Memory usage < 50MB for rendering system
- ✅ Unit test coverage > 80%
- ✅ Visual regression tests for all components
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### Art Direction Requirements
- ✅ Follows Blizzard-style layering philosophy
- ✅ Supports Wilderness pillar (rude beauty)
- ✅ Supports Empire pillar (solar triumph)
- ✅ Supports artist styles (Ruan Jia, Jaime Jones, Sparth, Jeff Easley)
- ✅ Visual richness follows narrative importance
- ✅ Organic imperfections in materials
- ✅ Complex gradient systems
- ✅ Subtle animations (breathing, flicker, pulse)

---

## Risks & Mitigations

### Risk 1: Performance Degradation
**Risk:** Adding 12+ layers per component could degrade performance.

**Mitigation:**
- Implement layer caching
- Implement lazy loading
- Implement complexity scaling
- Use CSS custom properties efficiently
- Benchmark performance continuously
- Provide complexity level controls

### Risk 2: Breaking Changes
**Risk:** Refactoring existing components could break functionality.

**Mitigation:**
- Maintain backward compatibility with CSS variables
- Use feature flags for new rendering system
- Provide migration guide
- Test extensively before rollout
- Rollback plan if issues arise

### Risk 3: Complexity Overload
**Risk:** Too many options could overwhelm developers.

**Mitigation:**
- Provide sensible defaults
- Provide visual recipes for common patterns
- Provide recipe builder tool
- Document best practices
- Limit options per complexity level

### Risk 4: Art Direction Drift
**Risk:** Rendering System could deviate from art direction.

**Mitigation:**
- Integrate art direction validation
- Map recipes to pillars
- Map recipes to artist styles
- Review recipes against art direction plan
- Continuous art direction review

### Risk 5: Maintenance Burden
**Risk:** Maintaining 10+ libraries could be burdensome.

**Mitigation:**
- Automate CSS generation
- Use schema validation
- Use unit tests
- Use visual regression tests
- Document patterns clearly

---

## Dependencies

### Internal Dependencies
- Existing skin system (`skinConfigRegistry.ts`, `skinCssVariables.ts`)
- Existing component system (`src/ui/idleVillage/components/`)
- Art direction plan (`docs/plans/art_direction_plan.md`)
- Style Lab system (`src/ui/styleLab/`)

### External Dependencies
- React (already in project)
- Zod (already in project)
- CSS custom properties (browser support)
- CSS clip-path (browser support)
- CSS filters (browser support)

### Blocked By
- None (can start immediately)

### Blocking
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 depends on Phase 3 completion
- Phase 5 depends on Phase 4 completion
- Phase 6 depends on Phase 5 completion
- Phase 7 depends on Phase 6 completion
- Phase 8 depends on Phase 7 completion

---

## Timeline

- **Phase 1:** Week 1-2 (Foundation)
- **Phase 2:** Week 3-4 (Component Integration)
- **Phase 3:** Week 5-6 (Library Expansion)
- **Phase 4:** Week 7-8 (Visual Recipes & Decoration)
- **Phase 5:** Week 9 (Art Direction Integration)
- **Phase 6:** Week 10 (Performance & Optimization)
- **Phase 7:** Week 11 (Documentation & Examples)
- **Phase 8:** Week 12 (Testing & Validation)

**Total Duration:** 12 weeks

---

## Next Steps

1. **Review and Approve:** Review this implementation plan and approve for execution.
2. **Phase 1 Execution:** Begin Phase 1 (Foundation) with schema definitions and core libraries.
3. **Weekly Reviews:** Conduct weekly reviews to track progress and adjust plan as needed.
4. **Continuous Integration:** Run safeguards after each phase to ensure quality.
5. **Documentation Updates:** Update documentation continuously throughout implementation.

---

## Appendix: Key Code Examples

### Material Definition Example

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

### Frame Definition Example

```typescript
const bronzeFrame: FrameDefinition = {
  id: 'bronze',
  name: 'Bronze',
  outerBevel: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
  metalBody: 'linear-gradient(180deg, #dfb857 0%, #8b6f47 100%)',
  highlight: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 30%)',
  ao: 'inset 0 0 10px rgba(0,0,0,0.5)',
  innerLine: '1px solid rgba(255,255,255,0.2)',
  decorativeCorners: 'bronze',
  glowHooks: '0 0 10px rgba(223,184,87,0.3)',
  complexity: 'rich',
  cssLayers: [
    { property: 'box-shadow', value: '0 0 0 1px rgba(223,184,87,0.5)' },
    { property: 'box-shadow', value: 'inset 0 0 10px rgba(0,0,0,0.5)' },
    // ... more layers
  ],
};
```

### Layer Recipe Example

```typescript
const panelRecipe: LayerRecipe = {
  id: 'panel',
  name: 'Panel',
  layers: [
    { type: 'background', material: 'obsidian' },
    { type: 'texture', value: 'noise' },
    { type: 'gradient', value: 'radial' },
    { type: 'ao', value: 'inset' },
    { type: 'frame', variant: 'bronze' },
    { type: 'highlight', value: 'top' },
    { type: 'inset', material: 'obsidian' },
    { type: 'dust', value: 'light' },
    { type: 'decoration', pack: 'explorer' },
  ],
  defaultFrame: 'bronze',
  defaultMaterial: 'obsidian',
  defaultDecoration: 'explorer',
  complexity: 'rich',
};
```

### Visual Recipe Example

```typescript
const villagePanelRecipe: VisualRecipe = {
  id: 'villagePanel',
  name: 'Village Panel',
  frame: 'bronze',
  frameComplexity: 'rich',
  material: 'obsidian',
  lighting: 'torch',
  decoration: 'explorer',
  divider: 'diamond',
  inset: 'obsidian',
  overlay: 'dust',
  corner: 'bronze',
};
```

### Component Usage Example

```tsx
// Before (current)
<div style={{
  background: 'var(--skin-surface-bg)',
  border: '1px solid var(--skin-surface-border)',
  borderRadius: 'var(--skin-surface-radius)',
  boxShadow: 'var(--skin-drag-lift-shadow)',
}}>
  {/* Content */}
</div>

// After (Rendering System)
<Recipe type="villagePanel">
  {/* Content */}
</Recipe>

// Or with custom configuration
<Frame variant="bronze" complexity="rich">
  <Surface material="obsidian">
    <Decoration pack="explorer">
      {/* Content */}
    </Decoration>
  </Surface>
</Frame>
```

---

**End of Implementation Plan**
