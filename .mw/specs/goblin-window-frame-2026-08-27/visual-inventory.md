# Visual Inventory — Goblin Invasion Window Frame

## Frame layers (outer → inner)

| ID | Element | Bounds | Z | Material | Implementation |
|---|---|---|---|---|---|
| V001 | Outer shadow | 0..W, 0..H, spread 24px | -1 | soft black | CSS `box-shadow` |
| V002 | Base bronze slab | 0,0,520,420, rx=24 | 1 | Baroque Sun-Bronze gradient + noise | SVG rect + `feTurbulence` |
| V003 | Oxidation streaks | top/bottom edges | 2 | dark teal + brown patina | SVG paths `mix-blend-mode` |
| V004 | Outer bevel highlight | top/left 1-2px | 3 | Solar Triumph white-gold | SVG stroke |
| V005 | Inner bevel shadow | 6-12px inset | 4 | deep brown-black | SVG rect stroke + inset shadow |
| V006 | Corner bosses | four corners, 18×18 | 5 | raised bronze | SVG rounded squares with highlight/shadow |
| V007 | Micro nicks | 4-6 small V cuts along edges | 6 | dark void | SVG `path` triangles |
| V008 | Scratch field | random 2-3 strokes | 7 | semi-transparent light | SVG `path` with blur |
| V009 | Inner rim light | top/left inset 1px | 8 | warm white | CSS border |
| V010 | Diorama aperture | RIM 26 inset, rx=16 | 9 | dark field | `div` with gradient |

## Content layers (inside aperture)

| ID | Element | Bounds | Z | Material | Implementation |
|---|---|---|---|---|---|
| V011 | Background book | inner, 100% | 10 | painted landscape | `<img>` |
| V012 | Goblin group (no border) | inner, 100% | 11 | transparent PNG | `<img>` |
| V013 | Goblin group (border) | inner, 100% | 12 | transparent PNG | `<img>` with `clip-path` |
| V014 | Golden god ray | -20%,-10%,70%,140% | 13 | warm light | CSS gradient + blur |
| V015 | Dust / ash / ember | inner | 14 | atmospheric particles | Canvas 2D |
| V016 | Glass reflections | inner | 15 | sheen + edge | CSS gradients + box-shadow |
| V017 | Vignette | inner | 16 | dark falloff | CSS radial-gradient |
