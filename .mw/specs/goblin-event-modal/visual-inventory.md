# Visual Inventory — Goblin Event Modal

## Reference

- Source: `public/mockups/external/goblin-event-lab/reference.png`
- Viewport: 1086 × 1448 px
- Classification: **B** (reference only)

## Layer inventory

| ID | Name | Z | Bounds (%) | Material | Implementation |
|----|------|---|------------|----------|----------------|
| V001 | Base sky / solar glow | 0 | full card | Azure gradient | CSS `linear-gradient` + token `solarGradient` |
| V002 | Hero illustration | 0 | x:11, y:18, w:77.9 | Painted totem + sky | RASTER_CROP `goblin-invasion-hero.png` |
| V003 | Top banner | 10 | x:11, y:8.3, w:77.9, h:9.7 | Parchment/timber | CSS `linear-gradient` + `clip-path` |
| V004 | Title "INVASION" | 20 | center y:14.5 | Carved dark ink | REACT_I18N |
| V005 | Lower panel | 20 | x:13.8, y:53.9, w:72.3, h:24.5 | Dark glass/parchment | CSS `linear-gradient` |
| V006 | Panel header | 30 | center y:55.5 | Parchment ink | REACT_I18N |
| V007 | Body text | 30 | center y:57.3 | Parchment | REACT_I18N |
| V008 | Warning text | 30 | center y:60.1 | Crimson ink | REACT_I18N |
| V009 | Arrival medallion | 30 | center y:67-70 | Gold/green | CSS/SVG |
| V010 | Primary button | 30 | x:25.8, y:81.5, w:48.4, h:7.6 | Red/gold plate | CSS + `clip-path` |
| V011 | Carved outer frame | 40 | full card | Timber + gold | SVG with `feTurbulence` |
| V012 | Reference overlay | 50 | full card | Mockup image | `version === 1` only |

## Excluded from scope

- Enemy stat column
- Target stat column
- Secondary "VIEW DEFENSES" button
- Baked text in any asset
