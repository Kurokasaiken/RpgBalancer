# Reconstruction Spec — Goblin Event Modal

## Component tree

```
GoblinEventModalV17
├── L0 — Sky / Solar glow          (CSS gradient)
├── L1 — Hero image                (RASTER_CROP)
├── L2 — Banner + title            (CSS + REACT_I18N)
├── L3 — Panel + header/body/warning/arrival (CSS + REACT_I18N)
├── L4 — Primary button            (CSS + REACT_I18N)
├── L5 — Carved frame              (SVG)
└── L6 — Reference overlay         (version === 1)
```

## Landmarks

See `landmarks.json` for measurable coordinates.

Key positions (percentage of 1086 × 1448):

| Name | x% | y% | w% | h% |
|------|----|----|----|----|
| card | 0 | 0 | 100 | 100 |
| hero | 11.0 | 18.0 | 77.9 | auto |
| banner | 11.0 | 8.3 | 77.9 | 9.7 |
| title | 50.0 | 14.5 | — | — |
| panel | 13.8 | 53.9 | 72.3 | 24.5 |
| panel header | 50.0 | 55.5 | — | — |
| body | 50.0 | 57.3 | — | — |
| warning | 50.0 | 60.1 | — | — |
| arrival medallion | 50.0 | 66-70 | — | — |
| primary button | 25.8 | 81.5 | 48.4 | 7.6 |

## Effects

| Effect | Where | Implementation |
|--------|-------|----------------|
| Solar glow | top-left | `radial-gradient` from `effects.solarGradient` |
| Sky gradient | full card background | `linear-gradient` from `palette.sky*` |
| Banner texture | top banner | CSS gradient + `clip-path` |
| Panel glass | lower panel | `linear-gradient` over `palette.panel` |
| Button bevel | primary button | `clip-path` + gradient |
| Frame wood grain | SVG frame | `feTurbulence` overlay + gradient |
| Frame gold accents | SVG frame | `linearGradient`/`radialGradient` from `palette.gold`/`palette.amber` |
| Text shadows | title, button, panel | CSS `text-shadow` from `palette.shadow` |

## Measurement vs token separation

- **Structural measurements**: `layout.*` percentages (position, size).
- **Semantic tokens**: `palette.*`, `typography.*`, `spacing.*`.
- **Material/effect parameters**: `effects.*`, SVG filter attributes.
