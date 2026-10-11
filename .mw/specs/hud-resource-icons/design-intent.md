# Design intent — hud-resource-icons

## Why this asset exists

The `/game` top-right ribbon (`ResourceReadout`) shows gold, food and wood with
thin stroke SVG glyphs (`HudGlyph`). They read as wireframe placeholders next to
the painted lacquer/brass material of the `hang` plaques. This asset set replaces
the three resource glyphs with painted medallion icons.

## What it teaches

Resources are *things in the world*, not interface symbols: a coin is minted
metal, food is bread and grain, wood is cut timber. The medallion frame keeps
them inside the HUD material system — the same sun-bronze that rims the plaques.

## Pillar

Empire material register inside the shared HUD chrome: Baroque Sun-Bronze rim,
deep teal lacquer disc, emblem painted in warm light. Split rendering applies:
the emblem is the focal point (sharp, lit), the bronze rim is matter (worn,
darker).

## Contract

- One 1024×512…512×512 square image per resource: `hud-icon-gold`,
  `hud-icon-food`, `hud-icon-wood`.
- Circular medallion centred, filling ~90% of the frame, on solid black — the
  pipeline crops a circle with alpha and exports WebP.
- Read at 18–22px: emblem must survive downscale (one dominant shape, no
  filigree detail that turns to noise).
