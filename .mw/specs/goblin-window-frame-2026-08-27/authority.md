# Authority — Goblin Invasion Window Frame

## What is authoritative for visual intent?
- User request: "piccole imperfezioni, renderlo + realistico tipo blizzard AAA".
- Reference style: Blizzard-style layered UI frames (Hearthstone, Diablo IV reward chests).

## What is authoritative for art direction?
- `src/docs/docs/plans/art_direction_plan.md` — Solar Triumph, Baroque Sun-Bronze, no grey/brown shadows, deep teal shadows, Rude Beauty.
- `src/docs/docs/visual_design_philosophy.md` — 8–12 layers, organic imperfections, multi-stop gradients, subtle breathing.

## What is authoritative for code?
- `src/ui/idleVillage/components/GoblinInvasionWindow.tsx` — existing component.
- `src/ui/designSystem/primitives/MatericFrame.tsx` — frozen frame kit.
- `src/ui/wanderlust-surface/WanderlustSurface.tsx` — approved surface primitive.

## Candidate reuse
- `MatericFrame` for bevel/molding (if it supports Baroque Sun-Bronze).
- `WanderlustSurface` for panel base.
- Custom SVG for ornaments and nicks.

## What may not be invented?
- No gem-studs unless explicitly requested.
- No sci-fi/exoskeleton/pipes.
- No standalone `.css` files.
