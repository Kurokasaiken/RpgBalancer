# Authority Resolution — GoblinEventModalV17

## Authoritative sources

| Source | File | What it governs |
|--------|------|-----------------|
| Mockup reference | `public/mockups/external/goblin-event-lab/goblin-invasion-mockup.png` | Visual intent, layout, proportions, materials, lighting. |
| Art direction | `src/docs/docs/plans/art_direction_plan.md` | Palette, Solar Triumph, deep teal shadows, no grey/brown, material names. |
| Visual design philosophy | `src/docs/docs/visual_design_philosophy.md` | 8–12 layer rule, gradient stops, organic imperfections, subtle animations. |
| Creature IP | `src/docs/docs/art-direction/creatures/registry.md` | Any creature in the mockup must pass the IP lifecycle. |
| Prompt engineering | `src/docs/docs/coordinator/prompt_writing_guide.md` | Generation prompts must use master/child pipeline and kill list. |
| Component tokens | `src/balancing/config/idleVillage/goblinEventModalTokens.ts` | All colors, spacing, typography, effects for this component. |
| i18n | `public/locales/en/idleVillage.json` + `it-IT/idleVillage.json` | All user-facing strings. |
| Skin/config system | `src/ui/idleVillage/skins/primitives/`, `skinConfigRegistry` | Reuse and theme. |

## Existing components to reuse

- `SkinButton` / `SkinTitle` primitives in `src/ui/idleVillage/skins/primitives/` (check compatibility).
- `GoblinEventModalV16` patterns for i18n keys and layout scaffolding.

## What may be invented

Nothing. No buttons, no labels, no states beyond what the mockup shows and the existing i18n keys support.

## What must not be invented

- No dismiss/close button (not in mockup).
- No extra stats beyond the three shown.
- No sci-fi, skull, or grimdark elements.
- No grey/brown shadows.
- No fewer than 6 visual layers.
