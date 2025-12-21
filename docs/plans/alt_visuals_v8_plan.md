# Alt Visuals v8 – "Obsidian Meridian" Implementation Plan

## 1. Objectives

1. Deliver a new Alt Visuals v8 tab that fuses the cinematic pillars/"tar" storytelling of v6 with the goo-field dynamics of v7.
2. Use high-quality free assets (textures, HDRIs, overlays) to achieve a polished obsidian vs marble materials contrast.
3. Replace the existing v7 tab entirely once v8 is stable; keep v5/v6 tabs untouched.
4. Maintain config-first architecture: all theming/material references must live in shared config modules.
5. Provide a future-safe hook for a lightweight fallback, though the fallback itself is out of scope right now.

## 2. Asset Acquisition (AI handles download)

| Asset | Source | Usage | Notes |
| --- | --- | --- | --- |
| Obsidian Polished 4K (Albedo + Roughness + Normal) | ambientcg.com (Marble023) | Enemy columns + tar reflections | 4K PBR, CC0 |
| White Marble Veined (Albedo + Roughness + Normal) | polyhaven.com/marble_white | Player columns + star surface | CC0, tileable |
| Viscous Goo Alpha Texture | textures.com/liquidspills0066 | Tar puddle displacement mask | Free 1k download |
| Oil Puddle Normal Map | ambientcg.com/Liquid003 | Goo specular highlights | Tile to fill renderTexture |
| Celestial HDRI (studio_small_08) | polyhaven.com | Background environment gradient sampling | Use to drive subtle rim light |
| Gold Dust Particle PNG | pexels.com (ID 1146728) | Foreground particles | Use as sprite sheet |
| Blue Noise Tiles | momentsingraphics.de | Dithering + displacement jitter | Already CC0 |
| Film Grain LUT Overlay | lottiefiles free pack | Subtle cinematic grain | Convert to PNG sequence |

All downloads should be added under `public/assets/alt-visuals/v8/` with a manifest JSON describing filenames + licensing metadata (single source of truth).

## 3. Architecture & Modules

1. **Config:**
   - New `src/ui/testing/altVisualsV8Theme.ts` exporting `ALT_VISUALS_V8_THEME` (colors, filter strengths, timings, asset manifest keys, easing constants).
   - Extend `altVisualsAxis.ts` if needed for advanced axis metadata (e.g., column labels, rune glyphs).
2. **Assets manifest:** `public/assets/alt-visuals/v8/manifest.json` with entries:

   ```json
   {
     "columns": {
       "enemy": { "albedo": "obsidian_albedo.jpg", "normal": "obsidian_normal.jpg", "roughness": "obsidian_roughness.jpg" },
       "player": { "albedo": "marble_albedo.jpg", "normal": "marble_normal.jpg", "roughness": "marble_roughness.jpg" }
     },
     "goo": { "alpha": "goo_alpha.png", "normal": "goo_normal.png" },
     "background": { "hdri": "studio_small_08.hdr", "particles": "gold_dust.png", "grain": "film_grain.png" }
   }
   ```

3. **Component:** new `AltVisualsV8ObsidianField.tsx` (PIXI-based).
   - Mirrors v7 lifecycle (async init/destruction) but builds layered containers:
     - `backgroundLayer` (gradient rect + HDRI sample + particles).
     - `columnLayer` (PIXI.Mesh for each axis, textured with obsidian/marble materials driven by axis values).
     - `puddleLayer` (renderTexture using goo alpha + displacement/normal maps).
     - `starLayer` (player star mesh + glow filters).
     - `fxLayer` (bloom, RGB split, film grain sprite).
   - Timeline state machine: `enemyPhase -> puddleMorph -> playerAscend` using config durations.
4. **Filters:** use `@pixi/filter-glow`, `@pixi/filter-bloom`, `@pixi/filter-rgb-split`, `NoiseFilter`. Encapsulate filter creation in `createV8Filters(theme)` helper for reuse/testing.
5. **Fallback hook:** expose `useAltVisualsV8Quality()` (reads config to decide high vs future low mode). Implementation can always return `"high"` for now but keeps API ready.

## 4. Step-by-Step Tasks

1. **Setup**
   - Create `public/assets/alt-visuals/v8/` and download/upload listed assets.
   - Add manifest JSON + TypeScript types (`AltVisualsV8Assets`).
2. **Theme module**
   - Define palette, animation timings, column easing curves, filter strengths, camera shake constants.
3. **PIXI component**
   - Scaffold `AltVisualsV8ObsidianField.tsx` based on V7 but with modular builder functions:
     - `buildColumns(app, assets, axisValues)`
     - `buildPuddle(app, assets)`
     - `buildStar(app, assets, axisValues)`
     - `buildBackground(app, assets)`
     - `attachFilters(app, theme)`
   - Each builder returns teardown callbacks.
4. **Animation Controller**
   - Implement `advanceTimeline(deltaMs)` controlling:
     - Enemy column drop heights (easeOutBounce) seeded from axis enemy values.
     - Tar puddle ripple amplitude derived from safe%.
     - Player star bloom intensity derived from hero values + success state.
5. **State persistence & hooks**
   - Use same localStorage key to remember selected tab. When v8 is launched, set default to `'alt-v8'` and remove `'alt-v7'` entry.
6. **UI wiring**
   - Update `SkillCheckPreviewPage.tsx`: add new entry for v8, remove v7 entry.
   - Update copywriting to describe obsidian/marble concept.
7. **Testing & QA**
   - Lint/TS compile.
   - Storybook / Visual regression (if available) or manual video capture.
   - Playwright: extend tests to switch to Alt Visuals tab and assert `data-testid="alt-visuals-v8"` exists.
8. **Removal of v7 artifacts**
   - Delete `AltVisualsV7PixiField.tsx` after v8 is working.
   - Remove any constants/imports referencing v7.
   - Update docs/changelog to mention v8 replacing v7.

## 5. Risks & Mitigations

1. **Asset size/perf** – PBR textures may be heavy; plan to generate 2K + 1K variants and let config pick (future fallback).
2. **Filter cost** – Bloom + blur + RGB split stack: monitor GPU frame budget; expose config to disable filters if needed.
3. **PIXI lifecycle** – Ensure all filters/meshes are disposed in teardown (similar to v7 fix for `_cancelResize`).
4. **Testing** – Need at least one automated check to ensure alt visuals tab renders (Playwright) so removal of v7 doesn’t regress coverage.

## 6. Deliverables Checklist

- [ ] Assets downloaded under `public/assets/alt-visuals/v8/` with manifest + licensing info.
- [ ] `altVisualsV8Theme.ts` + types exported.
- [ ] `AltVisualsV8ObsidianField.tsx` implemented.
- [ ] `SkillCheckPreviewPage` updated (tab list, default selection, storage key migration).
- [ ] `AltVisualsV7PixiField.tsx` removed.
- [ ] Tests updated (lint, Playwright scenario for v8).
- [ ] Documentation/CHANGELOG entry explaining v8 rollout and rationale.

## 7. Notes

- Future fallback can reuse the manifest to swap textures (e.g., single-color gradients) and disable heavy filters.
- Keep naming consistent with “Gilded Observatory” theme.
