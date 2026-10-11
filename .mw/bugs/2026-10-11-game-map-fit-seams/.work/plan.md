# Plan — R-148 game map fit + sea seams

## Diagnosi (da investigation.json)

`floorZoom` è un vincolo di *copertura* (il viewport non deve mai vedere oltre il
mare renderizzato) applicato come *min-zoom globale*. Con margini 700/400 il floor
batte il fit a 1920×800, 1600×760 e sotto ~1280px → terra sotto la placca top e/o
la nav. Allargare i margini riduce il floor ma non lo elimina, e avvicina il bordo
del quad mare al bordo schermo (quando pan clampa a ±margin, il bordo quad =
bordo schermo → slivers di `stageColor` #489397, chiaro, contro il mare profondo).

## Fix

1. **`gameFrameConfig.ts`** — `seaMarginPx: 700→2400`, `seaMarginYPx: 400→1400`.
   I margini diventano la "portata" del mare aperto: oltre ~1690px (`uFade*2.6`) il
   mare è nebbia piatta → bordo del mondo credibile, nessuna texture da cucire.
   Il floor scende a ~0.21 @1920 e ~0.14 @1280: smette di battere il fit (0.26/0.23)
   su tutti i viewport target → la terra torna dentro l'area libera.

2. **`PixiWorldMap.tsx`**:
   - `SEA_QUAD_PAD`: i quad `deepSea` e `seaPattern` coprono `margin + pad` (pad
     abbondante, es. 1600) così il bordo del quad è irraggiungibile (i bound pan
     fermano a ±margin) → elimina la riga chiara allo schermo-edge.
   - `onWheel`: il clamp di zoom-out utente diventa `max(floorZoom(), cameraConfig.minZoom)`
     (minZoom=0.18 del manifest oggi ignorato). `apply()` resta su floor puro:
     il fit a finestre piccole deve poter scendere sotto 0.18.
   - Seabed: il letto tiene `min(margin, 700)+pad` (cap) così rovine/forzieri non si
     stirano; `deepSea` esce da `seaSprites`/seaGroup → il reveal durante il drag
     assottiglia solo il mare dipinto (il mare profondo resta opaco: corretto anche
     artisticamente — il reveal è fenomeno da acqua bassa).
   - `refit()` south-pin invariato (rete di sicurezza).

3. **Documentazione**:
   - `src/docs/docs/design/game_map_fit_contract.md` (nuovo): la guida — contratto
     della schermata, perche floor≠fit, ricetta diagnostica, metodo di misura.
   - `hud_component_guide.md` §9: metodo di misura meccanica (probe + regola bbox).
   - `context/recurring-traps.md` T-01: meccanismo cucitura confermato + risoluzione.
   - `RICHIESTE.md` R-148, `context/INDEX.md`, kanban.

4. **Verifica**: probe `scripts/probe-game-map-fit.cjs` ai viewport chiave + screenshot,
   lint/test/build:check/kanban:lint, evidence log in test-results/.

## Rischi

- margini grandi → nuvole percorrono più mare (ok), pan slack maggiore (accettato:
  il recenter esiste).
- `PANEL_FIT_SHARE` invariato: a larghezze <~1100 i pannelli coprono comunque terra
  (ammesso dalla guida: sono chiudibili/mobili).
- Load avg 213: i safeguard potrebbero dare timeout ambientali → ritentare, non ignorare.
