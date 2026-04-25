# Implementation Plan – Skin-Ready Component Architecture

## 1. Objective & References
- Transform Idle Village UI components into **skin-ready, fully interchangeable surfaces** for the Wanderlust vertical slice, without touching simulation logic.
- References (mandatory):
  - `src/docs/docs/PROJECT_PHILOSOPHY.md` – config-first, zero hardcoding.
  - `src/docs/docs/plans/art_direction_plan.md` – Wilderness/Empire pillars, split-rendering rules.
  - `.windsurf/plans/style-lab-flexibility-1a9890.md` – token extensibility, accessibility sliders.
  - `.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md` – metallic/glass token palette (invoke when detailing preset overrides).
  - `material-canvas-v2.html` – medal surface reference for Halo/Capsule glow (use as asset source, not inline CSS).
  - `src/docs/docs/QA/test-route-drag-guidelines.md` – required for `/test` harness work.

## 2. Success Criteria
1. **Skin Registry** supports runtime swap (Wilderness ⇄ Empire) with zero recompile and per-component overrides.
2. **Wrapper Components** expose uniform `skinPreset`, `pillar`, `styleLabOverrides`, `interactionPhysics` props.
3. **Persistence** via `PersistenceService.saveData('style-lab-skin-preset', ...)` with schema validation (Zod).
4. **Testing**: unit + RTL + Playwright VRT for every component; `npm run build:check` + `npm run kanban:lint` for every prompt derived from this plan.
5. **Parallel Workstreams**: at least four independent tracks (registry, wrappers, new components, integration/VRT) without file conflicts.

## 3. Global Requirements
- **Config-first**: all skin values loaded from `src/ui/idleVillage/skins/*.ts`, no inline hex/box-shadow in components.
- **Style Lab**: mount `StyleLabSurface` + `useStyleLabTokens` in wrappers, respect typography/density/motion tokens from style-lab-flexibility plan.
- **Interchangeable skins**: wrappers must accept `skinPresetId`, `pillar` and read token bundle from registry (see §4). Provide fallback to `Minimal Frontier` if preset missing.
- **Telemetry**: every new visual surface emits `trackTelemetryEvent('skin_rendered', { component, preset, pillar, context })` to keep parity with MG-03 prompts.
- **Persistence**: `SkinPreferencesSchema = z.object({ presetId: string, pillar: StyleLabPillar, overrides?: SkinOverrideSchema });` saved via `PersistenceService`. No localStorage direct access.
- **Testing discipline**: each phase adds unit + integration tests plus `/test` harness validation per QA guide (real pointer drag, screenshot diff, evidence log `test-results/skin-ready-<phase>-<date>.log`).

### 3.1 Wanderlust Balancer Skin Mandate
- `balancer-skin.css` (root file) is now the **default skin** for high-density information surfaces: **Balancer Dashboard**, **Spell Creator**, and **Roster/Character surfaces**. Import it immediately after `base.css` for any page exposing those modules.
- Certified components rendered inside these pages **must** expose the expected DOM structure described in `balancer-skin.css` comments (`.card`, `.card-overlay`, `.plaques`, etc.) so the ornamental layering works without inline overrides.
- When binding via Style Lab/registry, set `data-style-lab-pillar` to one of `frontier | wilderness | empire`; the CSS already includes a relaxed selector (`[data-style-lab-pillar*="wilderness"]`, etc.) to support runtime pillar switching without repaint glitches.
- Animations (`wl-basalt-breathe`, `wl-shimmer`, `wl-val-max`) are part of the skin contract; do **not** disable them unless the user selects `motionLevel = 'reduced'`. In that case, toggle them via CSS class `motion-reduced` on the `.card` root.
- Resource requirements:
  - Provide `bg.png` (or equivalent) through `--bg-texture` so designers can swap backgrounds per preset.
  - Keep functional logic untouched—only wrap existing components in the `.card` hierarchy and spread `skinDataAttributes` so data attributes continue to drive telemetry/tests.

## 4. Skin Config System (Phase 1 – can run in parallel with wrapper scaffolding)
### 4.1 Registry + Schema
Create `src/ui/idleVillage/skins/skinConfigRegistry.ts` exporting:
```ts
export const SKIN_CONFIG_REGISTRY: Record<SkinPresetId, SkinPresetConfig> = {
  wanderlust: {
    palette: {...},
    typographyScale: 1.1,
    densityMode: 'compact',
    interactionPhysics: { mass: 1.2, damping: 18, stiffness: 160, shadowDepth: 'deep', bloomIntensity: 1.4, audioProfile: 'obsidian' },
    componentThemes: {
      roster: 'wanderlust.roster.heavy-frame',
      slotRack: 'wanderlust.slot.floating',
      timeStrip: 'wanderlust.time.mechanical',
      hud: 'wanderlust.hud.glass',
      capsule: 'wanderlust.capsule.ornate',
      halo: 'wanderlust.halo.glowing',
    }
  },
  minimal_frontier: { ...baseline tokens... }
};
```
Add `SkinPresetConfigSchema` to `src/ui/idleVillage/skins/skinSchemas.ts` (Zod) covering palette, density, interactionPhysics, componentThemes. Include `styleLabOverrides?: StyleLabOverrideSchema` linking to `.windsurf/plans/style-lab-flexibility-1a9890.md` fields (colorFilters, motionLevel, etc.).

### 4.2 Persistence Hook
New hook `useSkinPreferences()` under `src/ui/idleVillage/hooks/` that:
1. Loads saved preset via `PersistenceService.loadData('style-lab-skin-preset')`.
2. Validates with Zod.
3. Exposes `{ presetId, pillar, overrides, setPreset }` for wrappers/TestRosterPage.
4. Emits `skin_preset_changed` telemetry when switching pillars.

### 4.3 Testing
- Unit: `SkinConfigRegistry.test.ts` ensures schema validity + fallback logic.
- Integration: mock `PersistenceService` to ensure save/load cycle.
- Parallelization: this track touches only `/skins/*` + new hook; can run concurrently with wrapper implementation.

## 5. Component Workstreams (Phase 2 – wrappers)
For each component we specify tasks, config contracts, and tests.

### 5.1 VillageRosterSectionSkin
**Files**: `src/ui/idleVillage/components/VillageRosterSectionSkin.tsx`, `.../skins/rosterSkinConfig.ts`.
**Requirements**:
1. Wrap existing `VillageRosterSection` but pass-through logic props unmodified.
2. Accept `skinConfig?: RosterSkinConfig` OR derive from registry via `skinPresetId`.
3. Apply Style Lab tokens using CSS variables (`data-skin-preset`, `data-skin-frame`, `data-style-lab-pillar`).
4. Provide slot for `PgCard` skins via existing `pgCardSkinId` prop; do not break `useMinimalStyleLabTokens` contract.
5. Telemetry: `trackTelemetryEvent('village_roster_skin_rendered', { presetId, pillar, slotCount })`.
**Config structure** (`rosterSkinConfig.ts`):
```ts
export interface RosterSkinConfig {
  frame: 'minimal' | 'ornate' | 'heavy';
  accent: 'subtle' | 'glowing';
  borderToken: StyleLabTokenKey;
  backgroundToken: StyleLabTokenKey;
  haloPreset: 'none' | 'soft';
}
```
**Tests**:
- RTL: ensures class/tokens switch when `skinConfig.frame` changes.
- Unit: snapshot for `styleLabOverrides.colors` applying custom CSS vars.
- Integration: `tests/unit/idleVillage/VillageRosterSection.skin.test.tsx` verifying compatibility with `PgCard` drag.

### 5.2 ResidentSlotRackSkin
**Files**: `ResidentSlotRackSkin.tsx`, `slotRackSkinConfig.ts`.
**Tasks**:
1. Provide container-level `data-slot-skin` attribute for QA screenshot diff.
2. Use `interactionPhysics` tokens from registry to configure Framer Motion springs (`mass/damping/stiffness`).
3. Accept `slotSkinConfig` describing medal style; feed into `SlottedMedal` via props (className/ext tokens) but keep `SlottedMedal` logic untouched.
4. Add `useEffect` hooking to `useSlotSounds` to select audio profile from config.
**Tests**: drag micro-interaction test under `/tests/unit/idleVillage/ResidentSlotRack.skin.integration.test.tsx` to ensure pointer events unaffected.

### 5.3 TimeEngineStripSkin
**Files**: extend `TimeEngineStrip.tsx`, add `timeEngineSkinConfig.ts`.
**Tasks**:
1. Introduce `skinPresetId` prop; backfill `TestRosterPage` to pass value.
2. Support `clockStyle` tokens (digital/analog/arcane) controlling glyph set + animation.
3. Connect `wanderlustConfig.accentGlow` to CSS variable consumed by canvas blur.
4. Provide telemetry `time_engine_skin_rendered`.
**Tests**: RTL verifying progress bar gradient matches config; Playwright screenshot for analog vs digital modes.

### 5.4 ActiveHUDSkin
**Files**: `ActiveHUDSkin.tsx`, `activeHUDSkinConfig.ts`.
**Tasks**:
1. Add `valueChangeConfig` that listens to HUD value streams and triggers `FramerMotion` animation specified (pulse/slide/glow) while respecting `motionLevel` from registry.
2. Provide accessible color tokens from art direction (Ivory text, Sun-Bronze border) via Style Lab tokens.
3. Add hook `useValueChangeTelemetry` to emit `active_hud_value_change` events.
**Tests**: RTL verifying ARIA labels unaffected; story-level snapshot for growth/decay color transitions.

### 5.5 New Components (Phase 2b)
#### ActivityCapsule
- Files: `components/ActivityCapsule.tsx`, `skins/activityCapsuleSkinConfig.ts`.
- Requirements: show POI detail (activity + resident list) with `skinConfig.capsuleStyle` controlling layout; `slotDisplay` toggles between inline cards and stacked column.
- Hook into `useIdleVillageConfig` for data (no hardcoding) and `useSkinPreferences` for tokens.
- Telemetry `activity_capsule_rendered` + optional `onCollect` event.
- Tests: RTL verifying config-driven layout; Playwright VRT for Wilderness vs Empire variant.

#### ActionHalo
- Files: `components/ActionHalo.tsx`, `skins/actionHaloSkinConfig.ts`.
- Requirements: map overlay around POI icons; `haloStyle` + `ringWidth` map to CSS custom props; `interactionPhysics` mass influences pulse amplitude.
- Provide `aria-live` for active halos to satisfy accessibility.
- Tests: unit verifying `progress` arcs clamp; visual regression for pulse states.

## 6. Integration Plan (Phase 3)
### 6.1 TestRosterPage wiring
1. Import wrappers instead of base components.
2. Replace local state with `useSkinPreferences()` (persist toggle UI in Style Lab drawer, referencing style-lab-flexibility plan toggles for typography/density).
3. Wire `VerticalSliceTestSection` under `/test` route for QA; include toggles for preset/pillar/motion level to validate runtime swapping.
4. Ensure compliance with `src/docs/docs/QA/test-route-drag-guidelines.md`: update Playwright spec `tests/e2e/idleVillage/testRosterPgCardSkin.spec.ts` capturing mid-drag screenshot for both pillars.

### 6.2 Vertical Slice Test Section
Create `src/ui/idleVillage/components/VerticalSliceTestSection.tsx` bundling all skin-enabled components inside `StyleLabSurface variant="card"`. Provide knobs for preset/pillar, hooking into `Style Lab Demo` page for designer preview.

### 6.3 Telemetry + Diagnostics
- Extend `sandboxDiagnostics` to include skin preset info in logs.
- Add `window.__STYLE_LAB_SKIN_DEBUG__` toggles to dump registry tokens for QA.

## 7. Testing & Evidence Matrix
| Layer | Tests | Notes |
| --- | --- | --- |
| Registry & Hooks | `SkinConfigRegistry.test.ts`, `useSkinPreferences.test.ts` | Validate schema + persistence |
| Wrappers | RTL per component + story-level screenshot tests | Ensure tokens applied, ARIA unaffected |
| Integration | `tests/unit/idleVillage/ResidentSlotRack.skin.integration.test.tsx`, `TestRosterPage.skin.integration.test.tsx` | Cover drag + HUD value changes |
| E2E & VRT | `tests/e2e/idleVillage/testRosterPgCardSkin.spec.ts`, `tests/vrt/idleVillage/skinVerticalSlice.spec.ts` | Use QA drag guidelines, Pixelmatch baseline |
| Performance | `npm run test -- tests/perf/skinSwitch.bench.ts` (new) | Ensure preset switch < 50ms |

Every batch produces `test-results/skin-ready-<phase>-<YYYY-MM-DD>.log` capturing lint/test/build outputs.

## 8. Parallel Workstreams
1. **Skin Registry & Persistence** (files under `/skins`, `/hooks`).
2. **Legacy Wrapper Extraction** (VillageRosterSection + ResidentSlotRack) – shares base components but different files; coordinate to avoid overlapping edits.
3. **Time/HUD Enhancements** – touches minimal components, can run concurrently once registry ready.
4. **New Components (Capsule/Halo)** – independent surfaces referencing config + telemetry module.
5. **Integration + QA** – after wrappers land, focus on TestRosterPage + vertical slice + Playwright.

Use dependency notation in Kanban: `Skin-Registry` → `Wrappers` → `Integration`. Each prompt must list specific file targets per this plan.

## 9. Files & Deliverables Recap
- Skin registry + schemas + overrides.
- Wrapper components and configs for roster, slot rack, time strip, HUD.
- New ActivityCapsule + ActionHalo components and configs.
- VerticalSliceTestSection + Storybook/StyleLab entries.
- Persistence hook + telemetry updates.
- Full suite of unit/RTL/E2E/VRT tests + evidence logs.

## 10. Key Principles (Enforced)
1. **Zero Logic Changes** – wrappers only decorate; existing hooks (e.g., `useResidentSlotController`) remain unchanged.
2. **Config-First** – no inline values; everything originates from registry tokens referencing art direction palette.
3. **Progressive Enhancement** – components function without skin config, fallback to Minimal Frontier tokens.
4. **Test-Driven** – no merge without unit + integration + build:check + kanban:lint evidence.
5. **Telemetry & Persistence** – track preset usage, persist user choice via `PersistenceService`.

Following this plan guarantees fully interchangeable skins, regression-safe rollout, and a parallelizable workflow aligned with RPG Balancer philosophy.
