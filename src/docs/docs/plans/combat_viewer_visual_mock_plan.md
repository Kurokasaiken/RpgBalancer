# Combat Viewer Visual Mock Plan

## 1. Purpose

Design and implement a LoL-inspired 2D vector visual layer for the 1v1 Combat Viewer, retaining the config-first balancing philosophy. The mock will prototype the full visual language (sprites, FX, stage, timeline) before productionizing assets.

## 2. Visual References & Research

| Source | Observations | Takeaways |
|--------|--------------|-----------|
| League of Legends 2D promo art & client UI | Layered vector gradients, gold/obsidian frames, rim lighting, sharp silhouettes, particles for impact. | Use layered SVG groups: base shape + rim highlight + particle overlay. Combine blur + drop shadow for “magical metal” feel. |
| Capybara Go idle combat | Clear idle/attack loops, simplified shapes, readable silhouettes at small size. | Keep idle loops short (≤1s) and use squash/stretch to sell impact. |
| TFT/LoR HUDs | Phase badges, initiative pips, neon traces showing targeting. | Build timeline badges + targeting beams using gradient strokes stored in config. |

## 3. Phases

### Phase 0 – Research & Moodboard

**Goals**: finalize art direction, gather palette & animation cues.

- Compile moodboard (LoL HUD, TFT arenas, Capybara Go). Store references under `docs/moodboards/combat_viewer_visual/`.
- Define palette tokens (obsidian, gilt, arcane teal) referencing `src/styles/color-palette.css`.
- Document animation principles: squash/stretch factors, easing (LoL uses cubic-bezier(0.6, 0, 0.2, 1)), vignette intensity.
- Deliverable: `docs/moodboards/combat_viewer_visual/README.md` summarizing references.

**Research streams & best practices**:

1. **Riot UI language (LoL / TFT / Legends of Runeterra)**
   - Layered metallic frames: combine a matte obsidian base (#050509) with thin gilded rims (#c9a227) and inner teal glow (#8db3a5) to preserve the Gilded Observatory vibe while nodding to Riot’s HUD.
   - VFX cues: rim lighting + particle bursts on impact; bevelled glyphs for phase/timeline icons; use additive blend gradients for targeting beams.
   - Layout references: TFT “combat recap” cards show how to stack avatar, HP bar, status icons, and turn badge in <220px width—mirror that density for our idle slots.
2. **Idle brawler readability (Capybara Go, AFK Arena)**
   - Silhouette first: keep color blocking high contrast between fighters and stage (dark backdrop, saturated characters).
   - Animation loops: run idle cycles ≤800 ms with subtle breathing; add anticipation frames (squash back 8–10% scale) before attacks for clarity.
   - Impact readability: overlay white flash + screen shake <120 ms, plus floating combat text with drop shadow for legibility.
3. **Vector stage composition**
   - Depth via parallax: 3 layers (background gradient, rune grid mid-layer, fog/particle foreground) with slight translateZ to fake depth.
   - Spotlighting: apply radial gradient mask under active actor (LoL champion select style) to guide focus.

**Outputs**:

- Reference board (PNG/MD) with annotations highlighting color, typography, animation cues.
- Palette & typography tokens documented in the moodboard README.
- Checklist of animation principles (anticipation ratio, easing curves, FX durations) feeding Phase 2 scripts.

### Phase 1 – Sprite & FX Config (Config-First)

**Research findings**:

- LoL uses layered assets (base figure + highlights + FX). We mirror via config-driven sprite sets.
- Need states: `idle`, `windup`, `attack`, `hit`, `defeated`, `statusFx`.

**Tasks**:

1. Create `src/balancing/config/combatSprites.ts` exporting typed `CombatSpriteRegistry`.
2. Schema per entry: `{ id, archetypeTags, svgPath, tint, fx: { trail, slash, shield } }`.
3. Extend `BalancerConfig` typings to reference sprite ids per archetype or stat block.
4. Provide placeholder vector assets (SVG). Use JSON references, no inline constants in UI.
5. **Integration outline:**
   - Add optional `spriteId?: string` to `ArchetypeTemplate` so designers can bind explicit visuals (fallback = tag matching).
   - Expose resolved sprite metadata through `useCombatPlayback` frames (e.g., `frame.actors[].spriteId`) so the viewer doesn’t perform lookups ad hoc.
   - Persist last-used sprite overrides in BalancerConfigStore to keep the experience deterministic across sessions.

#### Integration Steps (Archetype ↔ Sprite Registry)
1. **Type updates**
   - Extend `ArchetypeTemplate` and related DTOs (`ArchetypeInstance`, config schemas) with optional `spriteId`.
   - Update Zod schemas + storage adapters to accept/persist the field.
2. **Config plumbing**
   - When loading archetypes, resolve `spriteId` (explicit) or fall back to `getCombatSpriteByTags`.
   - Store the resolved sprite metadata on the entity config or memoized map for quick lookup.
3. **Playback propagation**
   - `useCombatPlayback` augments each `CombatActorState` with `spriteId` and `palette` so visual layers receive ready-to-use info.
   - Include sprite data in timeline snapshots if exported.
4. **UI consumption**
   - Combat Viewer reads `actor.spriteId` to load the proper SVG set and FX references.
   - Future editors (archetype builder) expose a dropdown sourced from `COMBAT_SPRITE_REGISTRY` to assign overrides.
5. **Persistence**
   - BalancerConfigStore saves any sprite overrides; when configs sync from file/remote, ensure migrations supply defaults to avoid missing visuals.

### Phase 2 – Timeline → Animation Mapping

**Research findings**:

- LoL sequences chain micro actions (anticipation → strike → resolve). Duration ratios ~20/50/30.
- Capybara Go idle fights rely on deterministic loops; we can map phases to animation states.

**Tasks**:

1. Author `mapFrameToAnimations(frame: CombatTimelineFrame)` returning ordered `AnimationScript[]` with (actorId, state, duration, fxId, targetIds).
2. Extend combat log payload to tag critical hits, dodges, shields for targeted FX.
3. Support multi-hit combos by splitting action events when `payload.damageBreakdown` > 1 entry.

### Phase 3 – Arena Layout & Vector Stage

**Research findings**:

- LoL/TFT arenas use layered parallax planes, glowing runes, vignette edges.
- Idle viewers benefit from fixed camera with slight perspective.

**Tasks**:

1. Build `CombatStage` component (SVG + div). Layers: backdrop gradient, rune grid, shadow plane, fog overlay.
2. Layout uses CSS grid for teams: `grid-template-columns: repeat(teamSize, minmax(160px,1fr))` (future multi-unit readiness).
3. Add dynamic lighting: radial-gradient spotlight per active actor.
4. Config-driven positions via `stageSlots` array stored in new config file.

### Phase 4 – Animator & State Machine

**Research findings**:

- LoL ability VFX rely on scripting engine; we can replicate with declarative hooks.
- Need deterministic sync with `useCombatPlayback` speed.

**Tasks**:

1. Create `useCombatAnimator(playback)` that converts AnimationScript queue → `actorStateMap` (state, elapsed, fx).
2. Build `CombatAvatar` reading `actorStateMap` + sprite config to render layered SVG with CSS custom properties for tint/brightness.
3. Implement FX components: `SlashFx`, `ShieldFx`, `HitSparks` using vector paths + filter animations (keyframes defined in CSS, triggered via state toggle).
4. Add `TargetBeam` component drawing `<svg line>` from attacker slot to defender slot; color-coded (hit vs crit vs block).

### Phase 5 – HUD, Controls & Telemetry Overlay

**Research findings**:

- TFT timeline uses iconography + micro charts; LoR uses hexagonal badges.
- For readability, combine timeline slider with per-phase markers.

**Tasks**:

1. Replace `TimelineControls` with stacked HUD: scrubber + turn badges + mini heatmap of damage per turn.
2. Add `PhaseBadge` components showing icons (prep, initiative, action, resolve) pulled from config.
3. Integrate contextual log overlay near actors (floating text, status icons) timed to animation states.
4. Expand metrics card with win probability delta, TTK sparkline.

### Phase 6 – QA, Export & Docs

- Snapshot tests for `mapFrameToAnimations` given fixtures.
- Visual regression (Chromatic/Storybook) for avatars and stage.
- Export pipeline: button to `Download SVG frame` or JSON timeline for reviews.
- Update documentation (`COMBAT_SYSTEM_DESIGN.md` Section 8 + new plan).

## 4. Dependencies

- Completed Phase 1 backend work (timeline frames + useCombatPlayback) already merged.
- Requires final decision on asset delivery format (inline SVG vs external). Default: importable SVG modules.
- Optional: GSAP for complex tweening (evaluate bundle size; CSS custom properties may suffice).

## 5. Milestones & Estimates

| Milestone | Estimate |
|-----------|----------|
| Phase 0 + 1 | 1.5d |
| Phase 2 | 1d |
| Phase 3 | 1.5d |
| Phase 4 | 2d |
| Phase 5 | 1d |
| Phase 6 | 0.5d |
| **Total** | ~7.5d |

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset scope creep | Delays due to new archetype skins | Limit pilot to 4 archetype tags (Tank, DPS, Assassin, Support) with recolors. |
| Performance (SVG filters) | FPS drops on lower-end devices | Provide `lowFx` flag to disable heavy filters; cache gradients. |
| Out-of-sync animations | Visual confusion | Animator hook consumes same frame index from `useCombatPlayback`; tests validate deterministic sequences. |

## 7. Deliverables

- Config modules (`combatSprites`, `combatStageSlots`).
- Hooks (`useCombatAnimator`, `mapFrameToAnimations`).
- UI components (CombatStage, CombatAvatar, FX, HUD upgrades).
- Updated docs (plan, COMBAT_SYSTEM_DESIGN, 1v1 tasks).
- Moodboard assets.
