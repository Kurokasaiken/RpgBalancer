# Identity — hud-resource-icons

## Silhouette

A perfect circle: a worn bronze-rimmed medallion, the emblem painted inside its
dark disc. The rim is a physical object (rolled edge, highlights on the lit
side), not a vector ring.

## Materials

- Rim: Baroque Sun-Bronze — warm, hammered, worn at the edges.
- Field: deep cool teal lacquer (the plaque material), almost black in shadow.
- Emblem: painted matter — struck gold, baked crust, split timber.

## Colors

- Palette: deep cool teal shadows (never grey or brown), Solar Triumph warm
  light on the emblem, prismatic dust allowed as a faint glint.
- The medallion must read on the dark `--skin-surface-base` ribbon — rim
  brighter than the field, emblem brighter than the rim's shadow side.

## Kill list

- No text, no runes, no watermark.
- No flat vector shading, no gradients-as-fill digital look.
- No grey, no mud-brown, no grim darkness.
- No symmetry ornamentation around the medallion (the circle is the shape).
- No sci-fi, no modern UI, no bevelled plastic.

## Purpose

`HudGlyph` renders these as `size`-squared images inside the HUD ribbons; the
same files serve any future resource readout (settlement panels, tooltips).
