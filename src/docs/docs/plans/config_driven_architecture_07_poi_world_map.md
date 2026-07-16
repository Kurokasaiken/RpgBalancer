# Implementation Plan 07: POI World Map System
## Config Driven Component-Based Game Architecture

**Strategist:** Cascade  
**Date:** 2026-07-15  
**Status:** Draft  
**Priority:** High  
**Parent Plan:** `config_driven_architecture_plan.md`  
**Duration:** 2 weeks

---

## Executive Summary

Convert the existing POI (Point of Interest) experience into a config-driven world map system built on the new component runtime, rendering primitives, physics hooks, and deterministic seed framework. The goal is for every map marker to be a `PointOfInterestComponent` that expresses discovery state, quest hooks, danger level, rewards, and visual evolution without bespoke React logic.

**Key Deliverables:**
- POI component contract + schema with discovery/quest/danger/reward states
- Map marker primitive integration plus animations/physics interactions
- Config library for POI definitions, map layouts, and quest hooks
- Seed-aware procedural styling (scratches, glow, patina per POI)
- Test harness for POI states (locked → discovered → resolved)
- Documentation + migration guide from legacy POI implementation

---

## Objectives

1. Define `PointOfInterestComponent` contract inside the component runtime with discovery, quest, danger, reward sub-contracts.
2. Build config packs (`/data/presets/idleVillage/poi/*.json`) for base POIs and AI-generated variants.
3. Integrate map marker primitives + physics to handle hover, drag, depth, snap, and focus states.
4. Wire deterministic seed usage to create subtle visual variation per POI (layered scratches, light leaks, icon offsets).
5. Provide validation + test harness to ensure POIs render under missing data, invalid data, localization swaps, and skin changes.
6. Migrate existing POI usage (Idle Village map, Wanderlust overlays, telemetry) to the new component.

---

## Architecture

### Component Contract

`GameComponentContract` extension:
- `type: "world"`
- Contracts: `render`, `physics`, `interaction`, `localization`, `seed`, `performance`, `modding`
- Key props: `poiId`, `coordinates`, `discoveryState`, `dangerLevel`, `questState`, `rewardPreview`, `mapLayer`, `iconPreset`

### Config Packs

```
data/presets/idleVillage/poi/
├── poi_forest.json
├── poi_ruins.json
└── poi_shardspire.json
```

Each config references material + primitive combos, discovery gating, quest chains, and telemetry IDs.

### Rendering Integration
- Use `MapMarkerPrimitive` + `PortraitWindowPrimitive` + overlays for quest/danger badges.
- Map markers adopt materials from Plan 02 + Plan 03 (e.g., obsidian rim with bronze halo).
- Physics: hover lifts marker, drag to reveal details, snap to grid.

### Seed Usage
- `visualSeed` derives from world → region → POI ID.
- Controls procedural scratches, glows, icon offsets.
- Ensures deterministic screenshots + modding compatibility.

---

## Implementation Phases

### Phase 7.1: Contract & Schema (Days 1-2)
- Create `src/game/components/contracts/PointOfInterestContract.ts`.
- Extend Zod schemas in `src/game/runtime/schemas.ts` with POI shape.
- Define enums for `discoveryState`, `dangerLevel`, `questState`.
- Safeguards: `npm run lint -- src/game/runtime/`; `npm run test -- componentContract` scope; `npm run build:check`.

### Phase 7.2: Config Packs (Days 3-4)
- Create `/data/presets/idleVillage/poi/` JSON configs with examples from spec.
- Add TypeScript loaders + validators.
- Include AI-ready template for future POIs.
- Safeguards: lint presets + schema tests.

### Phase 7.3: Component Implementation (Days 5-7)
- Implement `PointOfInterestComponent` in `src/game/components/poi/`.
- Compose map marker primitive + frame + overlays.
- Integrate `useComponentPhysics` for hover/drag + inertial focus.
- Hook deterministic seed pipeline for visual variation.
- Create telemetry events (`poi_viewed`, `poi_engaged`).
- Safeguards: lint + unit tests + `npm run build:check`.

### Phase 7.4: Test Harness & Validation (Days 7-8)
- Build `POIComponentTestPage` listing states (locked, discovered, active quest, danger spike).
- Add schema validation + default resolver tests.
- Ensure localization + skin switching.
- Safeguards: `npm run test -- POIComponentTestPage`; `npm run lint`.

### Phase 7.5: Migration & Integration (Days 9-10)
- Replace legacy POI usages (Idle Village map, Wanderlust overlays).
- Update telemetry + analytics references.
- Provide migration checklist for downstream teams.
- Safeguards: regression tests, smoke tests on Idle Village map.

### Phase 7.6: Documentation & Sign-off (Days 11-14)
- Create `docs/guides/poi_world_map_guide.md` with component contract, config examples, AI prompts.
- Update `COMPONENT_MASTER_INDEX` with POI entry referencing new runtime path.
- Provide before/after visual comparison + performance budget results.
- Safeguards: lint docs + `npm run kanban:lint`.

---

## File Structure

```
src/game/components/poi/
├── PointOfInterestComponent.tsx
├── poiContract.ts
├── poiDefaults.ts
├── poiRenderer.tsx
├── __tests__/
│   ├── PointOfInterestComponent.test.tsx
│   ├── poiContract.test.ts
│   └── poiDefaults.test.ts
└── index.ts

data/presets/idleVillage/poi/
├── template.poi.json
├── poi_forest.json
└── poi_ruins.json

docs/guides/
└── poi_world_map_guide.md
```

---

## Success Criteria

- `PointOfInterestComponent` renders via `<GameComponent id="poi.magicForest" />` with zero manual props.
- Config packs validated + AI templates available.
- Seed-based visual variation reproducible.
- Map interactions (hover, drag, focus) powered by unified physics.
- Legacy POI flows fully migrated; no duplicate implementations.
- Documentation + COMPONENT_MASTER_INDEX updated.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Config drift from gameplay | Inconsistent POI behavior | Schema validation + runtime tests |
| Performance regressions | Map stutter with many POIs | Complexity caps, primitive reuse, memoization |
| Seed collisions | Visual duplication | Include POI ID + region salt in derivation |
| Migration gaps | Old POI code lingering | Migration checklist + CI check for legacy imports |

---

## Dependencies

- Plan 00 (Architecture foundation)
- Plan 01 (Component runtime)
- Plan 02 (Rendering primitives)
- Plan 03 (Material engine)
- Plan 04 (Physics system)
- Plan 05 (Seed/procedural)
- Plan 06 (Village evolution) for integration with map/village state

---

## Timeline

| Phase | Days |
| --- | --- |
| 7.1 Contract & Schema | 2 |
| 7.2 Config Packs | 2 |
| 7.3 Component Implementation | 3 |
| 7.4 Test Harness & Validation | 2 |
| 7.5 Migration & Integration | 2 |
| 7.6 Documentation & Sign-off | 3 |

Total: **2 weeks**.

---

## Next Steps

1. Define POI contract + schema + defaults.
2. Build config packs + AI templates.
3. Implement component with primitives/physics/seed integration.
4. Create test harness + migrate legacy POI flows.
5. Document + update master index.
