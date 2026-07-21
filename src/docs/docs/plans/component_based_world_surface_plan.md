<!-- markdownlint-disable MD013 MD060 -->
# Component-Based World Surface with Semantic Grouping — Implementation Plan

**Task ID:** `IV-WORLD-SURFACE-COMPONENT-001`  
**Status:** `draft`  
**Date:** 2026-07-21  
**Owner:** Strategia / Coordinator  
**Estimated Duration:** 2-3 weeks  

> This plan evolves `world_surface_runtime_implementation_plan.md` and aligns with `world_presentation_runtime_rfc.md` v1.4 and `world_presentation_runtime_implementation_plan.md` v1.1.

---

## 0. Executive Summary

The existing `WorldSurfaceRuntime` is built around **layers as content buckets**: every forest, mountain, or settlement lives inside a monolithic image layer (`forests.png`, `mountains.png`). Dynamic events ("burn all flammable forests in Eldoria") force us to either stack ad-hoc layers on top or duplicate assets.

This plan formalizes the alternative proposed in the ChatGPT critique: the **WorldComponent** becomes the atomic unit of content, **WorldGroup** becomes a query-driven logical collection, and **WorldLayer** becomes a pure z-order / compositing pass.

**Verdict on the critique:** valid and superior for the target architecture. Adopted with three guard-rails: deterministic querying, batch rendering, and a migration path from the layer-centric manifest v1.

---

## 1. Critique Evaluation

### 1.1 Strengths

- **Decouples content from rendering order.** A component can belong to `vegetation`, `eldoria`, and `flammable` simultaneously without layer duplication.
- **Event-driven by query.** "Set state = burning on `region = eldoria AND tag = flammable`" resolves at runtime; events do not hardcode asset paths.
- **AI-friendly.** Prompts can target semantics (`flammable`, `northern`) instead of filenames.
- **Aligns with `WorldPresentationRuntime`.** Effects and sequences can target `groupId` or `query` and produce `componentOverrides`; the renderer resolves them.
- **Eliminates the "Eldoria overlay" problem.** No need to author a separate `eldoria_burning.png`; the runtime composes per-component states.

### 1.2 Risks

- **Performance:** thousands of independent components can out-DOM or out-draw a batched layer atlas.
- **Migration cost:** existing `manifest.json` v1 and `WorldSurfaceRenderer` must be supported or migrated.
- **Over-abstraction:** if every blade of grass becomes a component, authoring becomes unmanageable.

### 1.3 Mitigations

- Renderer **batches components by `layerId` + `materialId` + `shaderId`**; instancing is the default, not one DOM node per component.
- Provide an **automatic migration** from manifest v1 (each old layer becomes one or more `WorldComponent`s plus a default `WorldGroup`).
- Authoring guideline: a component is a **visually meaningful object** (tree, hut, mountain peak), not a pixel. Tile grids can be single components with repeatable/tiling assets.

---

## 2. Objectives

1. Define `WorldComponent` as the atomic unit of world content.
2. Define `WorldGroup` as deterministic, query-driven collections.
3. Redefine `WorldLayer` as pure rendering pass (z-order, blend mode, compositing).
4. Evolve `WorldSurfaceManifest` to v2 (component + group + layer driven).
5. Update `WorldSurfaceRenderer` to render component batches while preserving `PresentationOutput` as the only cross-layer contract.
6. Extend `PresentationOutput` with `componentOverrides` and `groupOverrides` so `WorldPresentationRuntime` can target semantics.
7. Provide a deterministic query engine and unit tests.
8. Maintain backward compatibility with manifest v1 during migration.
9. Deliver a test harness at `/world-surface-components`.

---

## 3. Principles

- **Config-first:** every component, group, layer, and query is JSON/Zod-driven; no hardcoded gameplay or visual values in components.
- **Deterministic:** component queries are pure functions; same manifest + same seed → same resolved set.
- **Layers are not content:** layers define z-order and compositing; they do not own geometry or assets.
- **Groups are not runtime state:** groups are resolved queries; runtime state lives on the component (`runtime.state`, `runtime.effects`).
- **PresentationOutput is the contract:** `WorldPresentationRuntime` never talks directly to the renderer.
- **No standalone CSS:** visual themes come from `skinConfigRegistry` presets.
- **i18n:** all user-facing labels (`group.nameKey`, `state.nameKey`, `layer.labelKey`) use `idleVillage` namespace.
- **JSDoc:** every exported function, interface, and schema gets JSDoc.

---

## 4. Core Concepts

### 4.1 WorldComponent

The atomic visual object on the map.

```ts
interface WorldComponent {
  id: string;                    // unique within manifest
  type: string;                  // e.g. "vegetation", "mountain", "settlement"
  tags: string[];                // e.g. ["forest", "flammable", "animated"]

  spatial: {
    position: { x: number; y: number };
    bounds?: { x: number; y: number; width: number; height: number };
    depth: number;               // parallax factor, 0..1
    zIndex: number;              // within-layer draw order
  };

  visual: {
    assetId: string;             // references asset pack / atlas
    materialId?: string;         // material preset
    shaderId?: string;           // optional shader / effect
    variant?: string;            // active variant id
    defaultVariant: string;
  };

  membership: {
    regions?: string[];          // e.g. ["eldoria"]
    biomes?: string[];           // e.g. ["forest"]
    groups?: string[];           // static group membership (optional)
  };

  runtime?: {
    state?: string;              // e.g. "default" | "burning" | "corrupted"
    animation?: string;
    effects?: string[];          // active effect ids
  };

  layerId: string;               // which render pass owns draw order
}
```

### 4.2 WorldGroup

A deterministic query that resolves to a set of component ids at runtime.

```ts
interface WorldGroup {
  id: string;
  nameKey: string;               // i18n key
  filter: WorldQuery;
}
```

### 4.3 WorldQuery

A small, deterministic query language over component metadata.

```ts
type WorldQuery =
  | { op: 'and' | 'or'; clauses: WorldQuery[] }
  | { op: 'not'; clause: WorldQuery }
  | WorldQueryClause;

type WorldQueryClause =
  | { field: 'id' | 'type' | 'biome' | 'region' | 'tag' | 'state' | 'layerId' | 'groupId'; op: 'eq'; value: string }
  | { field: 'type' | 'biome' | 'region' | 'tag' | 'state' | 'layerId' | 'groupId'; op: 'in'; value: string[] }
  | { field: 'tag' | 'region' | 'biome' | 'state'; op: 'contains'; value: string }
  | { field: 'depth' | 'zIndex'; op: 'gt' | 'gte' | 'lt' | 'lte'; value: number };
```

### 4.4 WorldLayer (v2)

Pure compositing pass.

```ts
interface WorldLayer {
  id: string;
  zIndex: number;                // global compositing order
  blendMode?: string;            // default "normal"
  passType?: 'opaque' | 'transparent' | 'effect' | 'overlay';
  labelKey?: string;             // i18n
}
```

### 4.5 WorldSurfaceManifest v2

```ts
interface WorldSurfaceManifest {
  version: '2.0.0';
  world: string;
  variant: string;

  coordinateSystem: { /* unchanged */ };
  resolutionHint: { /* unchanged */ };
  assetPolicy: { /* unchanged */ };
  camera: { /* unchanged */ };

  components: WorldComponent[];
  groups: WorldGroup[];
  layers: WorldLayer[];

  visualStates?: WorldSurfaceVisualState[];   // now applies per-component overrides
  anchors?: WorldSurfaceAnchor[];             // unchanged
  regions?: WorldSurfaceRegion[];             // metadata only, not content
}
```

---

## 5. Data Contract

### 5.1 Zod Schemas

New schemas:

- `WorldComponentSchema`
- `WorldGroupSchema`
- `WorldQuerySchema`
- `WorldLayerV2Schema`
- `WorldSurfaceManifestV2Schema`

Location: `src/engine/world/model/` and `src/ui/idleVillage/config/worldSurfaceConfig.ts`.

### 5.2 PresentationOutput Extension

`PresentationOutput` (RFC §10) stays JSON-serializable and is extended with:

```ts
interface PresentationOutput {
  // existing fields
  activeVisualStateId?: string;
  runtimeObjects?: RuntimeObject[];
  visualStateOverrides?: VisualStateOverride[];
  camera?: CameraOutput;
  layerOffsets?: Record<string, { x: number; y: number }>;
  layerScales?: Record<string, number>;

  // new
  componentOverrides?: ComponentOverride[];
  groupOverrides?: GroupOverride[];
}

interface ComponentOverride {
  componentId: string;
  ops: VisualOp[];              // tint, set_opacity, set_variant, set_state, etc.
}

interface GroupOverride {
  groupId: string;              // or a WorldQuery literal
  ops: VisualOp[];
  ordering?: 'unsorted' | 'byDistance' | 'byZIndex';
}
```

The renderer resolves `groupOverrides` into `componentOverrides` before drawing.

---

## 6. Pipeline

```text
WorldState
    |
    v
buildWorldPresentationModel(worldState, presentationRules)
    |
    v
WorldPresentationModel
    |
    v
WorldPresentationRuntime
    |
    +---- PresentationEffects  (e.g. ThreatPresenceEffect)
    +---- PresentationSequence (e.g. show_threat_presence)
    |
    v
PresentationOutput
    |
    +---- componentOverrides
    +---- groupOverrides
    |
    v
WorldSurfaceRenderer
    |
    +---- WorldComponentQueryEngine resolves groupOverrides
    +---- batches components by layer + material + shader
    |
    v
DOM / Canvas / WebGL
```

Rules:

- `WorldPresentationRuntime` never mutates `WorldState`.
- `WorldSurfaceRenderer` never mutates `WorldState` or `PresentationOutput`.
- `PresentationOutput` remains the single contract.

---

## 7. File Structure

```text
src/
├── engine/
│   └── world/
│       ├── model/
│       │   ├── WorldComponent.ts          // schema + types
│       │   ├── WorldGroup.ts              // schema + types
│       │   ├── WorldQuery.ts              // query grammar
│       │   ├── WorldSurfaceManifestV2.ts  // v2 manifest schema
│       │   └── WorldSurfaceVisualState.ts // extended with component ops
│       ├── systems/
│       │   ├── WorldComponentQueryEngine.ts
│       │   ├── WorldSurfaceComponentResolver.ts
│       │   └── manifestV1ToV2Migration.ts
│       └── presentation/
│           ├── PresentationOutput.ts      // extended type
│           └── effects/
│               └── ThreatPresenceEffect.ts // updated to target groups
├── ui/
│   └── idleVillage/
│       ├── config/
│       │   ├── worldSurfaceConfig.ts       // Zod schemas + v2 types
│       │   └── worldSurfaceComponentConfig.ts // default groups/layers
│       ├── hooks/
│       │   └── useWorldSurface.ts          // load + validate v2 manifest
│       ├── components/
│       │   ├── WorldSurfaceRenderer.tsx    // component batch renderer
│       │   ├── WorldSurfaceComponent.tsx   // single component renderer
│       │   ├── WorldSurfaceComponentBatch.tsx
│       │   └── WorldSurfaceComponentDebugPanel.tsx
│       └── pages/
│           └── WorldSurfaceComponentTestPage.tsx
├── public/
│   └── assets/
│       └── world/
│           └── wanderlust/
│               └── base/
│                   ├── manifest.v2.json
│                   ├── manifest.json        // v1 kept for migration
│                   └── source/
└── tests/
    └── unit/
        └── idleVillage/
            ├── WorldComponentQueryEngine.test.ts
            ├── WorldSurfaceManifestV2.test.ts
            ├── WorldSurfaceRenderer.components.test.tsx
            └── WorldPresentationRuntime.groupOverrides.test.ts
```

---

## 8. Step-by-step

### Phase 1 — Schemas & Query Engine (3-4 days)

1. Define `WorldComponentSchema`, `WorldGroupSchema`, `WorldQuerySchema`, `WorldLayerV2Schema` in `src/engine/world/model/`.
2. Define `WorldSurfaceManifestV2Schema` in `src/ui/idleVillage/config/worldSurfaceConfig.ts`.
3. Implement `WorldComponentQueryEngine` (`resolve(manifest, query): string[]`) with deterministic ordering.
4. Add `resolveGroup(manifest, groupId)` and `resolveGroupsForComponent(manifest, componentId)` helpers.
5. Unit tests for query engine: `eq`, `in`, `contains`, `and`, `or`, `not`, numeric ranges.

**Safeguards:**

```bash
npm run lint -- src/engine/world
npm run test -- tests/unit/idleVillage/WorldComponentQueryEngine.test.ts
npm run build:check
npm run kanban:lint
```

### Phase 2 — Manifest Migration (2-3 days)

1. Write `manifestV1ToV2Migration.ts`:
   - Convert each `surfaceLayer` to one `WorldComponent` with `visual.assetId = layer.file` and `layerId = layer.id`.
   - Generate default `WorldGroup`s per `type`/`biome`/`region` inferred from tags/conditions.
   - Preserve `camera`, `coordinateSystem`, `anchors`, `regions`.
2. Update `useWorldSurface.ts` to detect `version` and auto-migrate v1 → v2 in memory (no file mutation).
3. Add migration unit tests.

### Phase 3 — Renderer Componentization (4-5 days)

1. Implement `WorldSurfaceComponent` primitive (DOM/CSS first; WebGL/instancing deferred).
2. Implement `WorldSurfaceComponentBatch`: groups components by `layerId`, then `materialId`/`shaderId` for efficient rendering.
3. Update `WorldSurfaceRenderer.tsx` to accept `components` + `layers` + `componentOverrides`.
4. Ensure parallax and z-order still work.
5. Test page `/world-surface-components` with:
   - component visibility toggle
   - layer visibility toggle
   - group highlight via query
   - state switch (`default` / `corrupted` / `burning`)

### Phase 4 — Runtime Integration (3-4 days)

1. Extend `PresentationOutput` in `src/engine/world/presentation/types.ts`.
2. Update `OutputComposer` to merge `componentOverrides` and `groupOverrides` deterministically.
3. Evolve `ThreatPresenceEffect` to emit a `groupOverride` targeting `region = eldoria AND tag = flammable`.
4. Add `WorldPresentationRuntime.groupOverrides.test.ts`:
   - scenario `fire_in_eldoria` → group override resolved to component ids → deterministic color/opacity per component.

### Phase 5 — Test Harness & Director (2-3 days)

1. `WorldSurfaceComponentTestPage.tsx`:
   - query builder UI (reuses `SkinInput`, `SkinSelect` primitives)
   - live highlight of resolved group
   - scenario selector
2. Update `TestHub.tsx` route `/world-surface-components`.
3. Add debug panel showing resolved groups and per-component overrides.

### Phase 6 — Governance Close-out (1-2 days)

1. Update `world_surface_runtime_implementation_plan.md` changelog: "superseded by component-based model for new work; v1 migration path preserved."
2. Update `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` with `WorldSurface Component Contract` row (status `candidate`).
3. Create `src/docs/docs/idle_village/trusted/world_surface_component_trusted.md` when runtime tests pass (trusted status).
4. Evidence log: `test-results/IV-WORLD-SURFACE-COMPONENT-<date>.log`.

---

## 9. Acceptance Criteria

### Functional

- A manifest v2 with 50+ components loads and renders at `/world-surface-components`.
- Query `region = eldoria AND tag = flammable` resolves deterministically to the expected component ids.
- `WorldPresentationRuntime` can set `groupOverride` on that query and the renderer tints only those components.
- Same manifest + seed + tick → same `PresentationOutput` (replay test).
- Manifest v1 still loads via in-memory migration (no broken existing pages).

### Non-functional

- `PresentationOutput` remains JSON-serializable.
- No `WorldState` mutation from renderer or runtime.
- No hardcoded visual/gameplay values in renderer components.
- All user-facing strings via i18n `idleVillage` namespace.
- No new standalone `.css` files.

### Performance

- Rendering 500 components at 1080p stays ≥ 30 FPS on target hardware (DOM batch path) or ≥ 60 FPS (WebGL/instancing path, deferred).
- Query resolution for 1000 components < 5ms.

---

## 10. Safeguards

Per ogni fase:

```bash
npm run lint -- src/engine/world src/ui/idleVillage
npm run test -- tests/unit/idleVillage/WorldComponentQueryEngine.test.ts tests/unit/idleVillage/WorldSurfaceManifestV2.test.ts tests/unit/idleVillage/WorldSurfaceRenderer.components.test.tsx tests/unit/idleVillage/WorldPresentationRuntime.groupOverrides.test.ts
npm run build:check
npm run kanban:lint
```

Timeout massimi:

- `kanban:lint`: 30s
- `npm run lint`: 120s
- `npm run test`: 300s
- `npm run build:check`: 180s

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| DOM batching still too slow with many components | High | Defer to instanced WebGL in Phase 3/4; complexity budget per component |
| Manifest v1 migration loses artist intent | Medium | Migration preserves layer → component mapping; manual review step in pipeline |
| Query language becomes too expressive | Medium | Start with `and/or/not/eq/in/contains/numeric`; freeze grammar before v1.0 |
| State explosion from dynamic groups | Medium | Groups are read-only queries; runtime state stays on components |
| Overlap with existing POI component model | Medium | Reuse `GameComponentContract` patterns from `config_driven_architecture_07_poi_world_map.md` where possible |

---

## 12. Governance & Documentation

### Plan updates

- `world_surface_runtime_implementation_plan.md` — mark as superseded/extended by this plan.
- `world_presentation_runtime_implementation_plan.md` — update references to `visualStateOverrides` to include `componentOverrides`/`groupOverrides`.
- `world_presentation_runtime_rfc.md` — v1.5: extend `PresentationOutput` contract (no semantic changes to RFC principles).

### Component index

- Add `WorldSurface Component Contract` row to `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` with status `candidate`.
- Promote to `trusted` after Phase 6 close-out and evidence log.

### Trusted doc

- Create `src/docs/docs/idle_village/trusted/world_surface_component_trusted.md` when Phase 6 completes.

---

## 13. Open Questions

1. Should tile-grids (repeating terrain) be one component with a tiling asset, or a grid of smaller components?
2. Should `WorldGroup` membership be pre-computed at load time or resolved on every query?
3. Do we keep the old `surfaceLayers` terminology in any form, or fully rename to `WorldLayer` v2?
4. How does the artist pipeline export component metadata? JSON sidecar or embedded in manifest?

---

## 14. Changelog

| Data | Autore | Modifica |
| --- | --- | --- |
| 2026-07-21 | Strategia | Draft v0.1: adottata architettura Component-Based World Surface with Semantic Grouping come evoluzione del piano World Surface Runtime. |
