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
