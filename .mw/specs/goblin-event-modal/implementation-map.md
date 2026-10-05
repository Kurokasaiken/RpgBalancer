# Implementation Map — Goblin Event Modal

| ID | Element | Class | File / Source |
|----|---------|-------|---------------|
| V001 | Base sky / solar glow | CSS | `GoblinEventModalV17.tsx` outer `style` using `effects.solarGradient` + `palette.sky*` |
| V002 | Hero illustration | RASTER_CROP | `public/mockups/goblin-invasion-painted/goblin-invasion-hero.png` |
| V003 | Top banner | CSS | `div` with `linear-gradient` and `effects.bannerClip` |
| V004 | Title "INVASION" | REACT_I18N | `t('world.goblinInvasion.title')` |
| V005 | Lower panel | CSS | `div` with `linear-gradient` on `palette.panel` / `palette.panelGlass` |
| V006 | Panel header "WORLD EVENT" | REACT_I18N | `t('world.goblinInvasion.warTable.eventLabel')` |
| V007 | Body text | REACT_I18N | `t('world.goblinInvasion.warTable.description')` |
| V008 | Warning text | REACT_I18N | `t('world.goblinInvasion.warTable.willBeAttacked')` |
| V009 | Arrival medallion | CSS/SVG | Count, unit and remaining text from i18n; styled with tokens |
| V010 | Primary button | CSS | `<button>` with `effects.buttonPrimaryGradient` and `effects.buttonNotchedClip` |
| V011 | Carved outer frame | SVG | `GoblinEventFrame` with `feTurbulence`, gradients, corner ornaments |
| V012 | Reference overlay | REFERENCE_ONLY | `version === 1` renders `reference.png` at `opacity: 0.4` |

## Implementation notes

- All colors, spacing, typography and effects come from `src/balancing/config/idleVillage/goblinEventModalTokens.ts`.
- The hero asset contains no baked UI text; all UI text is React/i18n.
- Enemy and target stat blocks and the secondary button are intentionally omitted per the current scope.
