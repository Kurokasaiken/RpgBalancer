# Art Direction – Wanderlust DNA

## Source of Truth

The canonical art bible already lives in **`src/docs/docs/plans/art_direction_plan.md`** (a.k.a. “DNA Prismatic Wanderlust – Art Direction Bible v0.10”). This file summarizes how Archmage should consume it and how it coexists with the current Gilded Observatory UI kit.

- Full bible: `src/docs/docs/plans/art_direction_plan.md`
- Rendered copies (for distribution): `public/docs/plans/art_direction_plan.md`, `dist/docs/plans/art_direction_plan.md`

## Key Tenets (see bible §1‑§6)

1. **Dual Pillars** – Wilderness (rude beauty, Dolomiti valleys, Golden Thatch) vs Empire (solar baroque, basalt deserts, Sun-Bronze).
2. **Split Rendering** – Faces = Ruan Jia polish, bodies/matter = Jaime Jones/Jeff Easley impasto.
3. **Palette Doctrine** – No grey/brown shadows; default shadows = deep teal/emerald. Light = “Solar Triumph” white with prismatic dust.
4. **Prompt Guardrails** – Zone-based instructions, material specificity (“Baroque Sun-Bronze”), anti-sci-fi kill list.
5. **Kill List** – No grim, no mud, no symmetry, no flat digital planes (except faces).

Use the original document for full prompt templates, artist references, and pigment tables.

## Relationship to Style Laboratory

- **Current State**: UI components use Style Laboratory tokens and components (`StyleLabSurface`, `StyleLabStack`, `useMinimalStyleLabTokens`). Legacy Gilded Observatory classes have been archived in `_OLD_DEPRECATED/styles/`.
- **Wanderlust Integration**: When Wanderlust UI assets are production-ready, they should be implemented as new Style Laboratory presets under `src/ui/styleLab/presets/` rather than replacing the existing system.
- **Migration Path**: Update this file with specific Wanderlust preset names and component examples when ready.

## Implementation Hooks

- When creating moodboards, reference `docs/moodboards/` and append Wanderlust tags.
- For AI prompt authoring, copy from §5 of the bible instead of improvising (avoids drift).
- If a feature requires bespoke art direction (e.g., Mental Palace districts), add a child spec under this directory that cites which Wanderlust pillar it extends.
