<!-- markdownlint-disable MD022 MD031 MD032 -->

# World Presentation Runtime Contract

## Metadata
- Status: `trusted`
- Area: `world-presentation`
- Canonical Name: `World Presentation Runtime`
- Primary Files:
  - `src/engine/world/presentation/types.ts`
  - `src/engine/world/presentation/buildWorldPresentationModel.ts`
  - `src/engine/world/presentation/WorldPresentationRuntime.ts`
  - `src/engine/world/presentation/OutputComposer.ts`
  - `src/engine/world/presentation/PresentationRandom.ts`
  - `src/engine/world/presentation/effects/ThreatPresenceEffect.ts`
  - `src/engine/world/presentation/config/threatPresenceEffectConfig.ts`
  - `src/engine/world/presentation/config/presentationEffectRegistry.ts`
  - `src/ui/idleVillage/hooks/useWorldPresentationRuntime.ts`
  - `src/ui/idleVillage/config/presentationConfig.ts`
  - `src/ui/idleVillage/components/presentation/PresentationDirectorShell.tsx`
- Runtime/Test Pages:
  - `/world-presentation-director`
  - `tests/unit/idleVillage/buildWorldPresentationModel.test.ts`
  - `tests/unit/idleVillage/WorldPresentationRuntime.replay.test.ts`
  - `tests/unit/idleVillage/WorldPresentationRuntime.translation.test.ts`
  - `tests/unit/idleVillage/WorldPresentationRuntime.demo.test.ts`
- Last Certified: `2026-07-22`
- Foundation Verification: `WORLD-PRESENTATION-RUNTIME-FOUNDATION` safeguard suite passed
- Last Updated By: `Cascade`
- Verification: `WORLD-PRESENTATION-RUNTIME-DEMO` deterministic progression verified (tick 0/5/15/30); `WORLD-PRESENTATION-RUNTIME-FOUNDATION` unit tests 22/22 pass, build:check e kanban:lint green
- Related Contracts:
  - `[WorldSurface Component Contract](../COMPONENT_MASTER_INDEX.md)`

## 1. Purpose

Define the canonical runtime contract that translates a `WorldState` snapshot into a deterministic, JSON-serializable `PresentationOutput` consumed by `WorldSurfaceRenderer`.

This contract covers the foundation runtime loop (`WorldState → PresentationOutput`) and the first semantic visual verb `show_threat_presence` implemented by `ThreatPresenceEffect`.

## 2. Source of Truth

**Canonical State Sources:**
- `WorldStateSnapshot` — read-only gameplay truth passed to `buildWorldPresentationModel`
- `PresentationRules` — config-driven visual state mappings in `types.ts`
- `PresentationManifest` — scenario manifest in `presentationConfig.ts`
- `ThreatPresenceEffectConfig` — validated Zod config for the threat verb

**Non-Authoritative Sources:**
- Renderer props (derived from `PresentationOutput`)
- Test harness fixtures (reference only)
- Inline hardcoded values (forbidden)

## 3. Canonical Runtime Contract

### Deve
- Convert `WorldState` into a `WorldPresentationModel` using `buildWorldPresentationModel(worldState, rules)`.
- Filter `activeEvents` to only those with `lifecycle.state === 'active'`.
- Produce a deterministic `PresentationOutput` from `WorldPresentationRuntime.update(tick, seed, options)`.
- Allow pure effects to register/unregister via `WorldPresentationRuntime.register(effect)` / `unregister(id)`.
- Compose effect overrides with `OutputComposer.compose(base, overrides[])` using shallow merge and array concatenation.
- Validate `PresentationOutput` with Zod (`PresentationOutputSchema`) before returning.
- Provide a seeded `PresentationRandom` fork per effect namespace.
- Map `PresentationOutput` to `WorldSurfaceRenderer` props in `useWorldPresentationRuntime`.
- Support visual states: `default`, `threat_manifesting`, `threatened`, `corrupted`.
- Emit the threat presence visual verb through `ThreatPresenceEffect` with deterministic phases:
  - tick 0..4: `default` (safe), no marker, no override
  - tick 5..14: `threat_manifesting`, partial vignette tint/opacity, static marker
  - tick 15+: `threatened`, full vignette tint/opacity, persistent marker
- Use config-driven values for colors, opacities, phase ticks, marker position/appearance and visual state ids.
- Keep `PresentationOutput` JSON-serializable (no DOM refs, no class instances, no functions).

### Non deve
- Mutate `WorldState`.
- Create world truth or gameplay state.
- Use `Math.random`, `Date.now` or `requestAnimationFrame` delta in the runtime core.
- Contain hardcoded gameplay/UI values in components.
- Introduce `SequenceScheduler` or timeline editing in Foundation/DEMO scope.

## 4. Visual Contract

### Required Visual Elements
- Base world surface rendered by `WorldSurfaceRenderer` using the active visual state.
- `visualStateOverrides` applied on top of the active state (tint, opacity, visibility, animation).
- `runtimeObjects` rendered as dynamic markers on the world surface.
- Threat marker static at configured origin (`north` default `{ x: 624, y: 120 }`) during manifesting/threatened phases.
- Vignette layer tint/opacity indicating threat intensity.

### Critical Visual Requirements
- The threat presence must be perceivable within 3 seconds without text (validated via screenshot/manual perception test).
- Marker must appear during `manifesting` and persist through `threatened`.
- Tint/opacity must intensify from `manifesting` to `threatened`.

### Fallback/Mock/Regression Definition
- **Fallback**: missing manifest or scenario → render empty/default state with localized message.
- **Mock**: placeholder renderer output or "Coming Soon" visual.
- **Regression**: non-deterministic output, hardcoded values, missing `PresentationOutput` validation, mutation of `WorldState`.

## 5. Data / Props Contract

### `PresentationOutput`
```typescript
{
  activeVisualStateId?: string;
  visualStateOverrides: PresentationVisualStateOverride[];
  runtimeObjects: RuntimeObject[];
  camera: { panX: number; panY: number; zoom: number };
  visibleLayerIds?: string[];
  layerScales?: Record<string, number>;
  layerOffsets?: Record<string, { x: number; y: number }>;
}
```

### `PresentationEffect`
```typescript
{
  id?: string;
  enabled?: (ctx: PresentationContext) => boolean;
  update(ctx: PresentationContext): Partial<PresentationOutput>;
}
```

### `ThreatPresenceEffectConfig` (key fields)
```typescript
{
  phaseTicks: { safeEnd, manifestingStart, manifestingEnd, threatenedStart };
  colors: { manifestingTint, threatenedTint, markerTint, markerGlow };
  opacities: { manifestingLayerOpacity, threatenedLayerOpacity, manifestingMarkerOpacity, threatenedMarkerOpacity };
  originPositions: Record<string, { x: number; y: number }>;
  markerVisual: { renderMode, scale, glow };
  layerTarget: string;
  visualStateIds: { safe, manifesting, threatened };
  markerId: string;
  markerType: string;
}
```

## 6. Integration Rules

### Config-First
- All timing, color, opacity and marker values live in `threatPresenceEffectConfig.ts`.
- New effects require a validated config module and registration in `presentationEffectRegistry.ts`.

### i18n
- All UI strings in `PresentationDirectorShell` and `PlaybackControls` use `idleVillage` namespace.
- New keys added to `public/locales/en/idleVillage.json` and `src/localization/i18n.types.ts`.

### Skin System
- UI components use `SkinScope`, `SkinBadge`, `SkinTitle`, `SkinButton` primitives.
- No standalone `.css` files for theming.

### Telemetry
- User interactions in the director shell must emit `trackTelemetryEvent` events (future scope, not blocking Foundation/DEMO).

## 7. Acceptance Criteria
- [x] `/world-presentation-director` route renders without errors.
- [x] Scenario selection produces correct `WorldPresentationModel`.
- [x] `WorldPresentationRuntime.replay.test.ts` passes (same scenario/seed/tick → same output).
- [x] `WorldPresentationRuntime.translation.test.ts` passes (`threat.active = true` → `threatened`).
- [x] `WorldPresentationRuntime.demo.test.ts` passes (tick 0/5/15/30 progression).
- [x] `buildWorldPresentationModel.test.ts` passes and verifies active event filtering.
- [x] `build:check` passes.
- [x] `kanban:lint` passes.
- [x] `PresentationOutput` is JSON-serializable.
- [x] No `WorldState` mutation in runtime or effect code.

## 8. Verification Results

### Compliance Status: DEMONSTRATED
**Verification Date**: 2026-07-22  
**Verification Harness**: `/world-presentation-director` + unit tests  
**Result**: `ThreatPresenceEffect` deterministic progression verified; runtime output stable and deterministic.

### Verified Components
- `buildWorldPresentationModel` active event filtering
- `WorldPresentationRuntime` effect registration and output composition
- `ThreatPresenceEffect` phase progression and marker/overrides generation
- `useWorldPresentationRuntime` adapter mapping to `WorldSurfaceRenderer`
- `PresentationDirectorShell` inspector UI

### Evidence
- `test-results/WORLD-PRESENTATION-RUNTIME-DEMO-2026-07-22.log`
- `test-results/build-check-2026-07-22.log`

## 9. Change Policy

Modifications to behavior, visual grammar, runtime contract or source-of-truth usage require:
1. code update
2. runtime verification (unit tests + `build:check`)
3. update of this trusted doc
4. update of test/evidence if necessary

## 10. Change Log

### 2026-07-22
- Created trusted documentation for World Presentation Runtime.
- Documented `WorldState → PresentationOutput` contract and `ThreatPresenceEffect` semantic verb.
- Listed canonical files, runtime/test pages, acceptance criteria and verification evidence.
- Marked as `candidate` pending full frozen-kit adoption and perception test completion.
- Promoted to `trusted` after `WORLD-PRESENTATION-RUNTIME-FOUNDATION` close-out; DEMO unit tests, build:check and kanban:lint passed.

---

**Contract Status**: `trusted` — Foundation + DEMO verified, ready for `WORLD-PRESENTATION-GOBLIN-ARRIVAL` integration.
