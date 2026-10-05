# Implementation Map — GoblinEventModalV17

| ID | Element | Implementation | File / Source |
|----|---------|----------------|---------------|
| V001 | Outer frame | `RASTER_CROP` with alpha | `public/mockups/goblin-invasion-painted/goblin-invasion-frame.png` |
| V002 | Top banner | `RASTER_CROP` + paintover | `goblin-invasion-banner.png` |
| V003 | Badge text | `REACT_I18N` | `t('world.goblinInvasion.warTable.eventLabel')` |
| V004 | Title text | `REACT_I18N` | `t('world.goblinInvasion.title')` |
| V005 | Sky background | `RASTER_CROP` (part of hero) | `goblin-invasion-hero.png` |
| V006 | Totem | `RASTER_CROP` (part of hero) | `goblin-invasion-hero.png` |
| V007 | Lower panel | `RASTER_CROP` + paintover | `goblin-invasion-panel.png` |
| V008 | Warning body | `REACT_I18N` | `t('world.goblinInvasion.warTable.description')`, `t('willBeAttacked')` |
| V009–V011 | Stat icons | `RASTER_CROP` | `goblin-invasion-icon-enemy.png`, `goblin-invasion-icon-arrival.png`, `goblin-invasion-icon-target.png` |
| V012–V014 | Stat labels | `REACT_I18N` | `t('warTable.enemy')`, `t('warTable.arrival')`, `t('warTable.targetObjective')` |
| V015–V017 | Stat values | `REACT_I18N` | `t('warTable.enemyCount/Unit')`, `t('warTable.arrivalCount/Unit')`, `t('warTable.targetName')` |
| V018 | Primary button | `CSS` + `PAINTOVER` texture | `<button>` with `background-image` and `clip-path` |
| V019 | Secondary button | `CSS` + `PAINTOVER` texture | `<button>` with `background-image` and `clip-path` |
| V020 | Solar glow | `CSS` | `radial-gradient` from token |
| V021 | Vignette | `CSS` | `radial-gradient` from token |
