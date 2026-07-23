# Wanderlust / Base World Surface — HD Asset Runtime Pack

Runtime asset pack for the base `wanderlust` world variant.

## Layout

- `layers/` — PNG files consumed by the renderer at runtime.
- `manifest.json` — Single source of truth for layer order, parallax, animations, anchors, visual groups and camera bounds.
- `preview.png` — Thumbnail shown in the Test Hub.
- `hd-photo-Map finale/` (repository root) — Authoritative HD cut-out source archive. Do not delete.

## Artist drop-in workflow

1. Work in the HD source archive `hd-photo-Map finale/`.
2. Export or copy the new/updated PNGs into `layers/`.
3. Normalize filenames:
   - Remove trailing spaces before `.png`.
   - Keep casing consistent with the manifest (`Frame.png`, not `frame.png`).
   - Avoid double spaces and special characters; keep names URL-safe.
4. Update `manifest.json` (`version`, `surfaceLayers`, `atmosphereLayers`):
   - Do not add files that are not needed at runtime.
   - Use `type: "ui_overlay"` for frame/border elements.
   - Assign `zIndex` values that preserve the intended depth order.
5. Run semantic validation: `npm run test -- tests/unit/idleVillage/validateWorldSurfaceAssets.test.ts`.
6. Run `npm run build:check` before committing.

## Naming convention

Filenames are taken from the HD source archive and normalized before they reach runtime:

- No trailing spaces before `.png`.
- Casing aligned with the manifest.
- Spaces inside names are URL-encoded automatically by the renderer.
- `Frame.png` and `Bordo.png` are `ui_overlay` layers at the top of the z-index stack.
- `map finale no frame no nuvole.png` is a reference composition and is **not** loaded at runtime.

## Runtime vs source

`layers/` is a runtime mirror of the current HD source. The manifest is the contract between the artist drop-in and the renderer; the renderer never hardcodes filenames.
