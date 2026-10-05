# Visual Inventory — GoblinEventModalV17

## Reference

- Source: `public/mockups/external/goblin-event-lab/goblin-invasion-mockup.png`
- Viewport: 1086 × 1448 px
- Class: `B` (reference only, not a production asset)

## Global structure

| Layer | Z | Description |
|-------|---|-------------|
| L00 | 0 | Background sky / hero area |
| L01 | 1 | Totem hero asset |
| L02 | 2 | Lower parchment/glass panel (empty) |
| L03 | 3 | Action button textures |
| L04 | 4 | Frame (outer carved timber) with alpha |
| L05 | 5 | React/i18n text and icon overlays |

## Element inventory

| ID | Name | Bounds (px) | Z | Material | Class | Note |
|----|------|-------------|---|----------|-------|------|
| V001 | Outer frame | x:0..1086, y:0..1448 (mask) | 4 | Carved wood, rope, gold | `RASTER_CROP` | Full frame with transparent center. |
| V002 | Top banner | x:120..966, y:120..260 | 0 | Parchment, weathered | `PAINTOVER` | Blank banner; text is React. |
| V003 | Badge text | center x:543, y:140 | 5 | Parchment ink | `REACT_I18N` | "WORLD EVENT · THREAT" |
| V004 | Title text | center x:543, y:210 | 5 | Carved dark ink | `REACT_I18N` | "GOBLIN INVASION!" |
| V005 | Sky background | x:120..966, y:260..900 | 0 | Azure/teal gradient | `RASTER_CROP` | From hero asset. |
| V006 | Totem | x:240..846, y:260..900 | 1 | Painted goblin idol | `RASTER_CROP` | Hero focal asset. |
| V007 | Lower panel | x:150..936, y:780..1000 | 2 | Dark green parchment | `PAINTOVER` | Blank panel; text is React. |
| V008 | Warning body | center x:543, y:830 | 5 | Parchment ink | `REACT_I18N` | Body + warning lines. |
| V009 | Stat icon — enemy | x:220..300, y:980..1060 | 5 | Goblin swarm | `RASTER_CROP` | Small icon. |
| V010 | Stat icon — arrival | x:480..600, y:980..1060 | 5 | Hourglass/crest | `RASTER_CROP` | Central icon. |
| V011 | Stat icon — target | x:760..840, y:980..1060 | 5 | Castle/village | `RASTER_CROP` | Small icon. |
| V012 | Stat label — enemy | center x:270, y:985 | 5 | Parchment ink | `REACT_I18N` | "ENEMY FORCE" |
| V013 | Stat label — arrival | center x:543, y:985 | 5 | Parchment ink | `REACT_I18N` | "ARRIVAL IN" |
| V014 | Stat label — target | center x:816, y:985 | 5 | Parchment ink | `REACT_I18N` | "TARGET OBJECTIVE" |
| V015 | Stat value — enemy | center x:270, y:1020 | 5 | Parchment/gold ink | `REACT_I18N` | "3,200+ GOBLINS" |
| V016 | Stat value — arrival | center x:543, y:1020 | 5 | Parchment/gold ink | `REACT_I18N` | "2 DAYS REMAINING" |
| V017 | Stat value — target | center x:816, y:1020 | 5 | Parchment/gold ink | `REACT_I18N` | "YOUR VILLAGE" |
| V018 | Primary button | x:280..806, y:1080..1165 | 3 | Red/gold plate | `PAINTOVER` | Texture only; text is React. |
| V019 | Secondary button | x:300..786, y:1180..1240 | 3 | Blue/steel plate | `PAINTOVER` | Texture only; text is React. |
| V020 | Solar glow | radial from x:270, y:150 | 4 | Light bloom | `CSS` | `radial-gradient` overlay. |
| V021 | Vignette | full card | 4 | Dark border | `CSS` | `radial-gradient` shadow. |

## Non-invention rule

- No extra buttons beyond the two shown.
- No extra stats beyond the three shown.
- No dismiss/close control.
- No sci-fi, skull, or grimdark elements.
