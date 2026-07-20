# Wanderlust / Base World Surface

Runtime asset pack for the base world variant.

## Layout

- `layers/` — PNG files consumed by the renderer at runtime.
- `source/` — Source PSD/AI/Blender exports. Never touch `layers/` directly.
- `source/exports/` — Exported variants at different resolutions.
- `manifest.json` — Single source of truth for layer order, parallax, animations, anchors, visual groups and camera bounds.
- `preview.png` — Thumbnail shown in the Test Hub.

## Layer naming convention

- Format: `NN_english_name.png`
- Zero-padded two digits (`05_`, not `5_`).
- English, `snake_case`, no accents, no spaces.
- Z-range:
  - `01-49`: base surface (water, terrain, ground features)
  - `50-79`: midground (mountains, forests, structures)
  - `80-89`: atmosphere (clouds, fog, particles)
  - `90-99`: overlays (vignette, UI-only layers)

## Runtime vs source

`layers/` contains exported/flattened PNGs.
`source/` is the artist pipeline. Any edit must happen in `source/` and be re-exported.
