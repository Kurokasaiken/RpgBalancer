---
trigger: glob
globs: src/ui/**/*.tsx,src/pages/**/*.tsx
description: UI invariants for every React surface — default skin system, i18n, Gilded Observatory theme, and game-feel performance budget.
---

# UI Invariants (skin, i18n, theme, perf)

Applies to every React surface under `src/ui/**` and `src/pages/**`.

## Skin system (default-first)
- UI must use the default skin system, not bespoke styling.
- Read skin state via `useSkinPreferences` (`src/ui/idleVillage/hooks/useSkinPreferences.ts`).
- Default preset is `DEFAULT_SKIN_PRESET_ID` from
  `src/ui/idleVillage/skins/skinConfigRegistry.ts`; resolve slot-rack presets via
  `resolveSlotRackPresetId`.
- Skin visuals come from Style Lab tokens + `applySkinCssVariables`, never hardcoded colors.
- New skin semantic tokens (e.g. `--skin-status-wound`, `--skin-status-death`) must be registered in `src/ui/idleVillage/skins/skinConfigRegistry.ts` and in the canonical CSS token file (`src/ui/styleLab/tokens/gilded-observatory.css` or the active preset token file). Components cannot introduce ad-hoc CSS variables for colors.

## Localization
- Every user-facing string uses `useTranslation` (`react-i18next`), keyed into the
  `common` or `idleVillage` namespace. No inline literals in JSX.

## Theme
- Follow the Gilded Observatory theme: base classes from `src/index.css` and tokens
  from `src/ui/styleLab/tokens/gilded-observatory.css`. Reuse existing wrappers/atoms.

## Game-feel performance budget
- Target < 16ms/frame. Animate with `transform`/`opacity` only (GPU-friendly).
- Use refs for high-frequency updates; avoid layout-thrashing state updates.
- Layered feedback (visual + audio + tactile) where interactions warrant it.
- Reference: `docs/plans/ui_game_dev_system_prompt.md`.

## Drag & drop
- Use `@dnd-kit` with existing helpers (`useResidentDropValidation`, `DropFeedbackUI`);
  do not reintroduce native HTML5 drag handlers alongside dnd-kit.

## Visual component layering (Blizzard-Style)
- Every visual component must be composed of **at least 6 layers** (recommended 8-12) to create depth and material richness.
- Follow the "Visual Design Philosophy - Blizzard-Style Layered Components" core principles from `src/docs/docs/visual_design_philosophy.md`:
  - **Multi-Layer Architecture**: Base → Texture → Gradient → Highlight → Detail → Overlay → Accent → Animation → Shadow → Glow
  - **Organic Imperfections**: Use feTurbulence filters, scratches, patina, noise overlays (no perfect surfaces)
  - **Complex Gradient Systems**: Multi-stop gradients (6-8 stops), radial/linear/specular/vignette gradients
  - **Subtle Animations**: Breathing, flicker, pulse, drift, sweep (2-10s duration, never distracting)
  - **Config-First Design**: All visual parameters in config (color tokens, filter params, animation timing)
- Reference implementations: POI skin (`poiAmberSkinConfig.ts`), Wanderlust Medal (`WanderlustMedalOverlay.tsx`)
- HTML prototype first, then React integration with config extraction.
