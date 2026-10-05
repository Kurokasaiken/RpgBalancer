# Reconstruction Spec — GoblinEventModalV17

## Component tree

```
GoblinEventModalV17
├── Layer 0 — Sky / Hero
│   └── goblin-invasion-hero.png
├── Layer 1 — Frame
│   └── goblin-invasion-frame.png (alpha)
├── Layer 2 — Banner background
│   └── goblin-invasion-banner.png
├── Layer 3 — Lower panel background
│   └── goblin-invasion-panel.png
├── Layer 4 — Primary action
│   └── button element with background-image goblin-invasion-button-primary.png
├── Layer 5 — Secondary action
│   └── button element with background-image goblin-invasion-button-secondary.png
└── Layer 6 — React/i18n text + icons
    ├── badge
    ├── title
    ├── body + warning
    ├── three stats (icon + label + value)
    └── two button labels
```

## Landmarks

| Name | x | y | w | h | percent x | percent y | percent w | percent h |
|------|---|---|---|---|-----------|-----------|-----------|-----------|
| card | 0 | 0 | 1086 | 1448 | 0 | 0 | 100 | 100 |
| frame.inset | 120 | 180 | 846 | 1088 | 11.0 | 12.4 | 77.9 | 75.1 |
| banner | 120 | 120 | 846 | 140 | 11.0 | 8.3 | 77.9 | 9.7 |
| title.center | 543 | 210 | — | — | 50.0 | 14.5 | — | — |
| hero | 120 | 260 | 846 | 640 | 11.0 | 17.9 | 77.9 | 44.2 |
| panel | 150 | 780 | 786 | 220 | 13.8 | 53.9 | 72.3 | 15.2 |
| body.center | 543 | 830 | — | — | 50.0 | 57.3 | — | — |
| warning.center | 543 | 870 | — | — | 50.0 | 60.1 | — | — |
| stats.row | 150 | 960 | 786 | 80 | 13.8 | 66.3 | 72.3 | 5.5 |
| primaryButton | 280 | 1080 | 526 | 85 | 25.8 | 74.6 | 48.4 | 5.9 |
| secondaryButton | 300 | 1180 | 486 | 60 | 27.6 | 81.5 | 44.8 | 4.1 |

## Effects

| Effect | Where | Implementation |
|--------|-------|----------------|
| Sky gradient | hero | part of hero asset |
| Solar glow | top-left of hero | CSS `radial-gradient` |
| Frame shadow | around inner edge | CSS `box-shadow` |
| Vignette | full card | CSS `radial-gradient` |
| Panel glow | edges of panel | part of panel asset or CSS `filter: drop-shadow` |
| Button bevel | primary/secondary | part of button asset + CSS clip-path |

## Asset requirements

| Asset | Dimensions | Must contain | Must NOT contain |
|-------|------------|--------------|------------------|
| hero | 846×640 | sky + totem, no banner, no panel, no buttons | text |
| frame | 1086×1448 with alpha | full carved frame | inner content |
| banner | 846×140 | blank parchment texture | "GOBLIN INVASION" or badge text |
| panel | 786×220 | blank green parchment | body/warning text, stat text, icons |
| button-primary | 526×85 | red plate texture | "PREPARE DEFENSES" |
| button-secondary | 486×60 | blue plate texture | "VIEW DEFENSES" |
| icon-enemy | ~80×80 | goblin swarm | labels |
| icon-arrival | ~120×80 | hourglass/crest | labels |
| icon-target | ~80×80 | castle | labels |
