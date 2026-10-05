# Goblin Invasion Event Card — Visual Decomposition

## Golden reference

- `public/mockups/external/goblin-event-lab/goblin-invasion-mockup.png`
- Used as **visual contract only**. All text baked into the image is replaced by React/i18n.

## Component regions

| # | Region | Description | Technique | Asset / Notes |
|---|--------|-------------|-----------|---------------|
| 1 | **Card shell** | Outer 3:4 vertical card, padding, shadow, layout grid. | CSS container | `aspect-ratio: 3/4` on a modal/card primitive. |
| 2 | **Frame** | Hand-carved timber + Alpine stone border, braided thatch rope, golden corner braces, rough-hewn edges. | CSS/SVG + raster texture | Try CSS/SVG first. If the carved depth cannot be reproduced, generate a `frame` texture tile or corner pieces. |
| 3 | **Top banner** | Parchment/canvas strip with stitched/torn edges, carved rune-like lettering. | SVG shape + i18n text | Shape in SVG; font via CSS webfont or fantasy atom; color from tokens. |
| 4 | **Background sky/landscape** | Blue sky, clouds, distant mountains, forest canopy. | CSS gradient / SVG | Keep atmospheric. A subtle gradient or SVG scenery is preferred over a large raster. If the mockup landscape is essential, generate `background-landscape` as a wide asset. |
| 5 | **Goblin totem** | Central carved mask/standard with green war paint, red tattered banners, spears, rope, feathers. | Generated raster asset | This is the hero AI asset: `goblin-totem-hero.png` with transparent or contained background. |
| 6 | **Horizontal divider** | Ornate wooden/gold separator between artwork and info. | SVG | Reuse or create a small ornamental SVG. |
| 7 | **World event label** | "WORLD EVENT" centered with arrow ornaments. | React/i18n + CSS | Use i18n key; styling from tokens. |
| 8 | **Description panel** | Dark parchment panel with main event text. | CSS | Background color/texture from tokens. |
| 9 | **Stats row** | Three columns: Enemy strength, arrival countdown, target. | CSS grid + React/i18n | Numbers and labels from game state; icons/ornaments in SVG. |
| 10 | **Action buttons** | "PREPARE DEFENSES" (red/gold) and "VIEW DEFENSES" (blue). | CSS/SVG + React/i18n | Reuse button primitives from skin system; style variants. |
| 11 | **Dust motes / light** | Golden dust, solar flare, ambient glow. | CSS/SVG effects | Prefer CSS `filter`/`background-blend` and SVG feTurbulence; avoid heavy particles on Tauri. |
| 12 | **Shadows** | Deep teal/green directional shadows under frame and totem. | CSS `box-shadow` / `filter: drop-shadow` | Color: deep teal/emerald, never grey/brown. |

## Asset decisions

| Asset | Purpose | Generation method | Priority |
|-------|---------|-------------------|----------|
| `goblin-totem-hero` | Hero illustration | Short canonical prompt or IP-Adapter + paintover | P0 — blocks the card |
| `frame-texture` | Timber/stone repeatable texture | CSS/SVG first; fallback: generate tileable 512×512 texture | P1 — defines card character |
| `background-landscape` | Sky + distant mountains | CSS/SVG first; fallback: generate 1024×1024 background | P2 — nice to have |
| `top-banner-shape` | Parchment banner form | SVG | P0 — contains title |
| `ornaments` | Corners, dividers, arrows | SVG | P1 — reinforces style |

## Pipeline per ogni asset

```
Reference mockup
       │
       ▼
Decide: CSS/SVG / generated / paintover
       │
       ├── CSS/SVG  ──► implement in component
       ├── Generated ──► spec → canon gate → generate → art gate → export
       └── Paintover  ──► isolate region → inpaint/paint → export
```

## Constraints

- No baked text in final assets.
- No grey/brown shadows; deep teal/emerald only.
- No sci-fi / skull / gore elements.
- All user strings via i18n.
- All colors from extracted tokens.
- All assets respect Tauri/WebView budget: max edge ≤ 2048px, WebP where possible.
