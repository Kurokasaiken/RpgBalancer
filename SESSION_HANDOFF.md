# Session handoff

**Current state:** `PLAN-017-stylized-sea-pattern-evaluation` attivo. Il Director ha richiesto e approvato di portare il pattern authored A1 in `WorldSurfaceTestPage` come overlay di debug/spike. Implementazione completata.

**Desiderata FROZEN:** `.mw/desiderata.md` v19 (Water Effect Lab: shader custom condizionati, fallback DOM, profilazione).

**Richiesta:** R-068 — Plan di implementazione per il mare Voronoi, riformulato in Stylized Sea Pattern Evaluation.

**What was done:**
- Generata texture `sea_pattern_tile.png` (2048x1448, RGBA trasparente) dal riferimento EPS/JPG con high-pass filter.
- Scritto script riproducibile: `scripts/build-sea-pattern-tile.py`.
- Creato preset config: `public/sea-spike-config.json`.
- Riscritto `public/voronoi-sea-spike.html` per renderizzare la texture authored A0/A1 in world-space con micro-scroll.
- Verificato `npm run build:check` ✅.
- Preview iniziale: pattern visibile su `Stretto est` a zoom 0.24, patternScale 4500 wpx, lineOpacity 0.35, colore `#8bbac2`, moto 3 wpx / 18 s.
- **Override Director:** portato lo spike in `WorldSurfaceTestPage` con overlay WebGL (`WorldSurfaceSeaPatternOverlay.tsx`), pulsante `Pattern` e pannello live "Sea pattern — live" / "Pattern mare — dal vivo". Maschera `sea_mask.webp`, ancoraggio world-space a zoom/pan, rispetto `prefers-reduced-motion`, config `public/world-surface-sea-pattern-config.json`.
|- Aggiunto pulsante `Hide UI`/`Show UI` (default off) per nascondere header, pannelli e HUD lasciando solo la mappa.

**URLs / files:**
- Spike live: `http://localhost:5173/voronoi-sea-spike.html` (porta corrente del dev server).
- World Surface live: `http://localhost:5173/world-surface`.
- Browser preview del World Surface: `http://127.0.0.1:62674/world-surface`.
- Screenshot spike: `test-results/sea-spike-screenshot.png`.
- Screenshot World Surface normal: `test-results/world-surface-normal.png`.
- Screenshot World Surface clean (UI off): `test-results/world-surface-clean.png`.
- Texture: `public/assets/world/wanderlust/base/layers/sea_pattern_tile.png`.
- Script build texture: `scripts/build-sea-pattern-tile.py`.
- Script screenshot World Surface: `scripts/screenshot-world-surface-ui-toggle.cjs`.

**Next step:**
- Valutazione visiva del pattern in `WorldSurfaceTestPage`; confermare opacità, densità e colore.
- `SEA-01` reference board + `SEA-05` motion tuning: catturare screenshot A0 (statico) e A1 (moto) per i tre crop ai tre zoom e valutare percettivamente.
- Poi implementare B (dual texture crossfade) e C (Voronoi challenger) per la comparativa.

**Open questions:**
- La texture sembra ancora un po' troppo "luce/caustica" rispetto a "linea disegnata". Serve un altro passo di processing per sparare i glints brillanti e/o un colore più desaturato.
- Il pattern attuale è denso; il Director deve decidere se "molto rade" si ottiene abbassando opacità o serve una texture diversa.
- `patternScale` 4500 wpx sembra un buon punto medio: celle ~50–100 px a schermo a zoom 0.24–0.30. Da confermare.

**Do not touch (salvo nuovo override):**
- `WorldSurfaceRenderer`, `WorldSurfaceWaves`, ripple costiero, layer baked, TestHub finché non esce uno spike approvato.
- `WorldSurfaceTestPage` è ora un overlay di spike autorizzato; non promuovere in produzione senza approvazione.

**Rule candidates:**
- Separazione tra parametri artistici e algoritmici per effetti condivisibili.
- Gold standard authored vs challenger procedurale.
- Pattern world-space: nessuna modalità viewport-space.
