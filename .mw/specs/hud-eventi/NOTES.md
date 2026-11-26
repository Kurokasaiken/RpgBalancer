# hud-eventi — registered references

## ref-eventi-bar-specular-time-2026-11-25.png

- **Path:** `.mw/specs/hud-eventi/refs/ref-eventi-bar-specular-time-2026-11-25.png`
- **sha256:** `2850093cb3f8c6027dde44609c9c1a3d72702d6e2cdf0809cb7f9651287d3bbb`
- **Size:** 1024×215
- **Registered:** 2026-11-25
- **Director quote:** *«componente eventi: salva questo come referenza e usalo, speculare al compoente tempo. la gemma rossa è x i pericoli, altri colori saranno x altro»*
- **Meaning:** visual reference for the Events component, specular to the Time component. The red gem denotes dangers/threats; other gem colours will denote other event categories.

### Production derivative (2026-11-25)

- **Generator:** `scripts/hud-real/build-events-bar.py` — deterministic magenta-key/decontamination/trim recipe.
- **Production asset:** `public/assets/ui/hud-real/events/bar.webp` (976×186, sha256 `6c8fa2d9f3f1a52404682207aec82068685c1c51846cbd3027ced20d6a0e1510`).
- **Use:** collapsed Events bar in `HudRealEventsBar` / `GameTopChrome`; red native gem = threat, filtered circular gem copy = other tones, medallion glyph = non-colour-only type sign.

- **Final witness:** `test-results/r386-events-bar/final-comparison-board.png` confronta reference, empty state, threat con gemma rossa nativa e pannello reale aperto; probe DOM in `final-probe.json` e `postrefactor-probe.json`, narrowing in `narrow-probe.json`.

- **Correzione visual 2026-11-25:** neutral/empty swappa l'asset verde firmato del Tempo (`time/dial-frame.webp`), non un filtro sulla gemma rossa; contenuto su una riga con countdown compatto finale (`5d`). Witness `test-results/r386-events-bar/swap-empty-bar.png` e `swap-threat-bar.png`.
