# PLAN-092 — mappa2 Waterfall "Painted Scroll" (Mode A2)

**Stato:** candidato (da battezzare)
**Parent:** PLAN-089 (mappa2 living world) · sostituisce la direzione tecnica di PLAN-091 sulla colonna di caduta
**Provenienza:** dibattito multi-AI web `20261028-waterfall-animation-techniques` (mw-web-debate, 2 round: clarify + converge) — convergenza Gemini + DeepSeek; Grok non votante (harvest echo).
**Richiesta madre:** R-291 · feedback Director 2026-10-28 («la cascata è già molto bianca, in quel modo è invisibile» / «nn si vede alcuna animazione» / «le gocce enormi da tutt'altra parte» / «cerchi enormi sulla pietra» / «nn abbiamo animato il lago da cui nasce la cascata»).

## Problema

La cascata è dipinta **bianco brillante**. Qualunque overlay chiaro di streaks è
invisibile sopra di essa (PLAN-091 v1-v6 lo ha confermato: tuning su alpha/speed
non ha mai reso il moto percettibile). I panelisti concordano: su soggetto già
chiaro l'unica soluzione è **muovere i pixel del dipinto stesso**, non
aggiungere un layer.

## Design convergente — scroll della texture dipinta

Tecnica «DesktopPaints fluctuation» applicata a PixiJS v8, Canvas-safe:

1. **Flow layer**: crop del dipinto nella fascia di caduta → reso **tileable
   verticalmente** in pipeline → `TilingSprite` (`addressMode: repeat`) clippato
   da `flowPolygon` → `tilePosition.y` scrolla giù + `skew.x` sinusoidale piccolo.
   Il layer animato copre solo il **tratto medio di caduta**: labbro superiore e
   impatto restano dipinto statico sotto → il wrap del tile avviene fuori vista
   (soluzione DeepSeek, preferita all'alpha-fade di Gemini — nessuna cucitura
   visibile per costruzione).
2. **Skew anti-sticker-edge**: `anchor.set(0.5)` (skew simmetrico) + clip
   **inner-inset** di `tan(amp)·H/2 + 1px` rispetto a `flowPolygon`
   (`amp ≤ 0.03` default); opzione `tilePosition.x = -sin(t·freq)·amp·H/2` per
   incollare il pattern interno.
3. **Lago sorgente**: **solo shimmer** — `alpha = 0.92+0.08·sin(t·0.4)` e
   `scale ±0.002` sfasato sul crop clippato a `lakePolygon`. Nessuno scroll
   (un lago dipinto che trasla legge come fiume). [FORK] fallback: micro-scroll
   bidirezionale `x = A·sin(t·0.2)`, `A=4-8px` — solo se lo shimmer non basta.
4. **Bacino**: **NO micro-scroll superficie** (sentenza DeepSeek: muovere i
   riflessi dipinti legge innaturale — stesso rischio del lago). Solo ripples
   esistenti, **raggio max 8–12% di `basinW`** (i 16–30% attuali sono ancora
   troppo grandi) già clippati a `basinPolygon`.
5. **Streaks attuali**: retrocessi a layer opzionale secondario (bande foam
   chiaro/scuro alternate, alpha bassa) — valutare in review se il core basta.
6. **Droplets**: **eliminati** fino a validazione del core (erano fuori posto
   ed enormi — rientrano solo in una slice successiva dedicata).
7. **Opzione (a) streaks scuri**: scartata (sporco, non moto).
   **Opzione (d) shader/mesh**: scartata (over-engineering, diverge Canvas).

## Asset pipeline (T-002)

`build-mappa2-assets.py` emette `fx/waterfall/painted_flow_tile.webp`:
- crop di `flowRect` esteso verticalmente (1.5–2× altezza di caduta);
- reso tileable con **edge-blend wrap** (offset 50% + clone/blend banda di
  raccordo, blur progressivo sulla giunzione — algoritmo PIL/OpenCV in
  pipeline, non manuale);
- stesso procedimento opzionale per `lake_tile.webp` se serve il fork lago.
Manifest `pack.waterfall` (additivo): `paintedFlowTile`, `paintedFlowRect`,
`paintedFlowClip` (poligono inner-inset), `lakeTile` opzionale.

## Controlli live (pattern PLAN-091, nessun rebuild)

`waterfallConfig` ref esistente + nuovi campi `{ skewAmp, skewFreq,
paintedFlow: boolean }` — toggle per confronto A/B con streaks layer.

## Task

- T-001: pipeline crop + tileable wrap + manifest (`paintedFlowTile`).
- T-002: runtime painted-flow layer (scroll+skew, clip inner-inset, labbro/impatto dipinti statici).
- T-003: lake shimmer (alpha/scale breathing, nessuno scroll).
- T-004: ripples raggio → 8–12% basinW; rimozione droplets; streaks come flag secondario.
- T-005: controlli lab estesi (paintedFlow toggle, skew amp/freq).
- T-006: screenshot/diff/perf + Director eye-check → PLAN-091 chiuso/superseded.

## Contratto (obbligazioni)

- OB-1: pack manifest con campi painted-flow parse verdi (Zod strict, unit test).
- OB-2: spec e2e `mappa2Waterfall.spec.ts` aggiornata — moto ROI, guard statico, no-rebuild, reduced-motion; **nuovo assert**: il layer animato non tocca labbro né impatto (guard-region sulle due fasce statiche).
- OB-3: lint scoped + `build:check` + `closure:lint`.
- OB-4: evidence visiva accettata (`test-results/plan-091-…/` o nuova dir).
- OB-5: human-eye Director — la convergenza è sul moto *percettibile*, giudizio suo.
- OB-6: `verify:bundle` con `.mw/runs/<task>/verification.json`.

## Vincoli ereditati

Nessun repaint del dipinto (il crop è copia, il layer base resta intatto) ·
Canvas fallback identico (sprite + Graphics mask, niente filtri/shader) ·
reduced-motion · nessun rebuild Pixi sui controlli · `/game` intoccata ·
overlay interior-only (inner-inset doppio: mask + skew margin).

## Fork dichiarati

- Lake: shimmer-only (default) vs micro-scroll bidirezionale — **default shimmer**,
  fork valutato in review visiva, non in implementazione.
- Wrap seam: stretched-tile clip (default) vs alpha-fade bordo tile — fallback
  documentato se il labbro non è separabile dal tratto di caduta.

## Implementation log

_(vuoto — piano nato dal dibattito, in attesa di battesimo)_

## Avanzamento 2026-10-29 — splash, mist e arcobaleno (Director)

- **Splash**: 3 anelli di schiuma che si allargano dal punto d'impatto (appiattiti 0.42x) + fino a 9 spruzzi parabolici; slider "impact splash" (0-1).
- **Mist**: pool 7→12 sprite, sale di ~34px (era 18), alpha max 0.32 (era 0.26).
- **Arcobaleno**: evento raro, arco additivo ('screen') su texture canvas procedurale (nessun asset), piedi sfumati; entra 3.5s, tiene 7s, esce 5s; intervallo medio `rainbowEveryS` (default 150s, attesa 0.6x-1.4x), intensita `rainbow` (default 0.7). Bottone "Trigger rainbow" nel lab, come l'evento marino. Indipendente dal giorno/notte (ciclo tolto dal Director). Con reduced-motion non compare.
- Goccioline laterali: restano spente (`i >= 0` nel tick); da rivalutare dal vivo.
- Suono (rombo): non fatto — deciso dal Director solo se zoomato; manca la scelta tra sintesi WebAudio e asset registrato.

## Avanzamento 2026-10-29 — dieta texture (Director: «ritagliare quelle grandi quanto la mappa»)

Misura con intercettazione degli upload WebGL (headless Metal, movimento normale):
- **In GPU** finiscono solo `base_flat.nocanopy`, `Mare`, `sea_mask`, `coast_distance` (2752x1536) + `Foreground` + `sea_pattern_tile` (2048x1448). `region_ids`, `waterfall_mask` e il doppione di `base_flat` venivano decodificati (RAM) ma mai caricati in GPU: il contatore del lab li contava come GPU.
- Contatore del lab: 212 MB → 132 MB (texture uniche, stesso schema di stima: x1.33 mipmap).
- Tagli fatti: (1) `Foreground.webp` a striscia 2752x418 con `rect` di livello (pipeline `build-mappa2-assets.py`; −12 MB in GPU reale); (2) `waterfall_mask` + ricarica di `base_flat` non più create se esistono le pose del flipbook (la mesh shader non è mai mostrata); (3) `region_ids.png` letta con `fetch`+`createImageBitmap` (nessuna texture Pixi), 1 byte per pixel, canvas di lettura rilasciato — 0 pixel diversi su 2752x1536 (20 id).
- Scartato: «nocanopy a patch» — con la canopy attiva `nocanopy` sostituisce `base_flat`, non si somma.
- `load()` ora conta le texture uniche ed espone `window.__pixiTextureReport()` (seam dev/test).
- Test permanente: `tests/unit/idleVillage/mappa2ForegroundCrop.test.ts`.
- Da valutare a occhio (restano i veri consumi in GPU): `sea_mask`, `coast_distance`, `Mare` a metà risoluzione; texture compresse KTX2.

## Avanzamento 2026-10-29 — fluidità della cascata (Director: «frame rate troppo basso»)

Dalla registrazione schermo del Director (60 fps): la cascata cambiava 13,6 volte/s (23% dei fotogrammi) con distanze di 1-7 fotogrammi tra un cambio e l'altro → a scatti.
Fix: 24 pose (`FLIP_N` 8→24, passi 3x più piccoli, stesso spostamento per ciclo) + dissolvenza tra pose consecutive nel runtime (secondo `Sprite` sulla posa successiva con alpha = frazione dell'orologio); default `flipFps` 14→42 (stessa velocità apparente), slider 6-90 pose/s. Misura nel runtime WebGL: 149/149 fotogrammi cambiano a 60 fps, regolari (p10 0.94, mediana 1.13, p90 1.43).

## Avanzamento 2026-10-29 — bacino della cascata (Director: «linee bianche ferme nel bacino», velocità scelta da lui)

- Gli archi bianchi nel bacino sono dipinti nell'immagine di base: restano fermi. Ora l'acqua del bacino (maschera del bacino ∩ acqua interna) ha 8 pose che si espandono dal punto d'impatto (stessa ricetta dei fiumi, direzione radiale). Contratto in `secondary-water.json` → `basin.flowPoses` (schema opzionale).
- Runtime: sprite a dissolvenza tra pose consecutive; velocità = slider **falls basin speed** nel tab Water, poses/s, 0–20, default 4 (lento). Misura nel runtime: slider 0 → fermo; 4 → ~4–5 cambi/s; 12 → ~12 cambi/s.
- Da verificare dal vivo, da zoomato: a vista d'insieme il bacino è piccolo.
