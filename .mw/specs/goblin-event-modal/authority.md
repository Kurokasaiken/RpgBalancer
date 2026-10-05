# Authority Resolution — Goblin Event Modal

## Authoritative sources

| Source | File | What it governs |
|--------|------|-----------------|
| Reference mockup | `public/mockups/external/goblin-event-lab/reference.png` | Layout, proportions, visual hierarchy, materials. Text is **not** authoritative. |
| Art direction | `src/docs/docs/plans/art_direction_plan.md` | Prismatic Wanderlust DNA, Solar Triumph, deep teal shadows, no grey/brown. |
| Visual philosophy | `src/docs/docs/visual_design_philosophy.md` | 8–12 layer rule, organic imperfections, multi-stop gradients, config-first. |
| Token contract | `src/balancing/config/idleVillage/goblinEventModalTokens.ts` | Zod-validated colors, spacing, typography, effects. |
| i18n | `public/locales/en/idleVillage.json` + `it-IT/idleVillage.json` | All user-facing strings, namespace `idleVillage`. |
| Component | `src/ui/idleVillage/trailer/GoblinEventModalV17.tsx` | Production React component. |

## Reusable primitives checked

- `src/ui/idleVillage/skins/primitives/SkinButton.tsx` — pattern for notched action buttons.
- `src/ui/idleVillage/skins/primitives/SkinTitle.tsx` — pattern for uppercase header styling.
- Existing `GoblinEventModalV17` i18n key scaffold.

## What is invented

- CSS/SVG carved frame, banner, and panel; no whole-frame, whole-banner, whole-panel or whole-button assets.
- Arrival medallion built from SVG/CSS.

## What is not invented

- No enemy-strength or target-stat columns.
- No secondary `VIEW DEFENSES` button.
- No dismiss/close control.
- No sci-fi, skull or grimdark elements.
- No grey/brown shadows or hardcoded values outside the token contract.
