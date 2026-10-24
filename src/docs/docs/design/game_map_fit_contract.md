---
title: Contratto del fit della mappa di /game
type: design-contract
updated: 2026-10-11
related: hud_component_guide.md, context/recurring-traps.md (T-01)
---

# Come deve essere la schermata `/game`, e perché

La mappa è un mondo dipinto da guardare, non una dashboard in un riquadro. Il
contratto vale **all'apertura e allo stato a riposo** (camera di fit); quando il
giocatore trascina o zooma, la camera è sua e la terra può finire sotto qualunque
cosa — è esplorazione, non un bug.

## Il contratto

1. **La terra sta dentro l'area libera.** Il bounding box della terra
   (`safeFit.landBounds`) deve stare dentro lo schermo meno gli inset della HUD:
   sopra le placche fisse in alto (`insets.top`), sopra il plinth della nav
   (`insets.bottom`). I pannelli laterali aperti non entrano nel calcolo: la
   mappa non si muove per nessun pannello (Director, 2026-10-14).
2. **Il chrome fisso non copre mai terra protetta.** Placche top, plinth nav,
   identity: nessuna intersezione col rettangolo della terra a schermo.
3. **I pannelli flottanti possono coprire terra** solo perché sono chiudibili o
   trascinabili (roster, ledger, quest window — vedi `hud_component_guide.md`).
   Il fit non riserva spazio per loro: aprirli o chiuderli non sposta né
   ridimensiona la mappa.
4. **Mai vuoto oltre il mare.** Lo schermo non mostra mai oltre il rettangolo di
   mare renderizzato: niente colore di stage, niente righe ai bordi.
5. **Il mare è continuo.** Il mare generato (deep-sea shader) incontra il mare
   dipinto in una sfumatura, non in una riga; il campo lontano sfuma in nebbia
   ("fog of the unexplored"), non in una seconda copia della mappa.

## Come funziona il fit (i tre numeri)

In `PixiWorldMap.tsx`:

- **fit zoom** = `min(freeW / landW, freeH / landH)` — quanto basta perché la
  terra entri nell'area libera. È lo zoom "giusto" a riposo.
- **coverage floor** = `max(W / (canvas + 2·seaMargin), H / (canvas + 2·seaMarginY))`
  — lo zoom sotto il quale lo schermo vedrebbe oltre il mare raggiungibile. È un
  vincolo di *copertura*, non di contenuto: la camera non può andare oltre
  ±margin, quindi sotto il floor apparirebbe il vuoto.
- **resting zoom** = `max(floor, fit)` — e qui stava il bug.

### Perché il floor combatteva il fit (la ricorrenza T-01)

Con margini piccoli il floor è alto. Quando `floor > fit`, lo zoom è più grande
del necessario: il bbox della terra esce dall'area libera. R-121 ha pinnato il
bordo sud sopra la nav quando la terra non ci sta in altezza — ma il problema di
fondo restava: **il floor saliva ogni volta che il viewport superava la copertura
del mare**, quindi a finestre larghe/basse (1920×800) o strette la mappa "diventava
troppo grande" e la terra finiva sotto il chrome.

Allargare i margini *abbassa* il floor ma non risolve nulla se il mare extra è
fatto di specchi/texture ripetute: le cuciture si vedono. Risolto così (R-148):

- `seaMarginPx: 3600`, `seaMarginYPx: 1800` — la portata del mare. Oltre ~1700 px
  lo shader è già nebbia piatta, quindi il mare extra è oceano aperto credibile,
  non texture ripetuta. A tutti i viewport target (1280–3440) il floor resta
  sotto il fit → **il fit decide, sempre**.
- `SEA_QUAD_PAD = 1600` — i quad deep-sea/pattern coprono `margin + pad`, ben oltre
  i bound di pan (±margin): il bordo del quad non è mai raggiungibile, quindi il
  colore di stage non può mai disegnare una riga allo schermo.
- `cameraConfig.minZoom` (manifest, 0.18) — onora il pavimento di leggibilità,
  ma **solo sullo zoom-out dell'utente** (rotellina). Il fit può scendere più in
  basso a finestre piccole: preferiamo un'isola piccola dentro l'area libera a
  una grande sotto il chrome.
- South-pin invariato: se la terra non ci sta in altezza, il bordo sud resta
  pinnato sopra la nav e l'eccesso va a nord.
- `refit` al recenter resetta `userMoved`: dopo il re-centro i resize tornano a
  rifare il fit, non a ri-clampare una camera vecchia.

### Le "linee tra mare vecchio e nuovo"

Due meccanismi reali, entrambi eliminati:

1. **Sliver dello stage.** Con i margini stretti il pan clampava esattamente a
   `±margin` quando il floor vinceva → il bordo del quad mare cadeva sul bordo
   schermo → mezza colonna di `#489397` (più chiaro del mare profondo) = riga
   verticale/orizzontale intermittente. Ora il quad arriva `SEA_QUAD_PAD` oltre
   il raggio di pan: irraggiungibile.
2. **Rottura di texture alla riga dipinto↔generato.** Le caustiche dipinte
   finiscono al bordo del canvas; il colore resta continuo (verificato a pixel:
   il blur del bordo nello shader funziona). Il campo lontano è ora nebbia
   uniforme: la transizione resta una sfumatura di ~420 px dentro il canvas
   (`DEEP_SEA_BAND_PX`), non una riga.

Se tornassero linee: misura dove cadono i bordi a schermo (vedi sotto), poi
controlla (a) se è il bordo del quad (stage leak — il pad non basta o i bound pan
sono cambiati), (b) la riga del canvas dipinto (rottura di texture — il velo/
band va ritoccato), (c) i bordi dello schermo con pan clappato (sliver).

## Come misurare (meccanico, non a occhio)

In dev `PixiWorldMap` espone `window.__worldCam` = `{panX, panY, zoom, width,
height}` ad ogni `apply()`. La proiezione:

```
landScreen = { x0: (land.x0 - panX)·z, y0: (land.y0 - panY)·z,
               x1: (land.x1 - panX)·z, y1: (land.y1 - panY)·z }
```

**Regola del contratto:** `landScreen` non deve intersecare i `getBoundingClientRect()`
del chrome fisso: le due `section` delle placche top, il plinth che contiene la
`nav` (risali al parent `position:absolute`), eventuali utility/hanging fissi.
I pannelli flottanti (`[data-testid="resident-roster-panel"]`, la `section` del
ledger) si misurano ma non violano il contratto.

**Attenzione:** il `landBounds` è un bbox — i suoi angoli contengono mare. Un
margine di ~10–40 px di bbox sotto una placca può essere solo mare dipinto:
segnala, ma verifica a occhio prima di chiamarlo violazione.

**Script pronto:** `scripts/probe-game-map-fit.cjs` — gira su N viewport, salva
screenshot + `probe-report.json` in `test-results/probe-game-map-fit/` con zoom,
floor, rettangolo terra, bordi canvas e violazioni. Usalo prima e dopo ogni
modifica al fit.

**Viewport da coprire sempre:** 1440×900 e 1280×800 (canonici della guida HUD),
1920×800 e 1600×760 (larghi/bassi, dove il floor vinceva), almeno uno stretto
(1024×700), **390×844 portrait touch (mobile-fit, R-274)** e il proprio
viewport reale.

## Portrait / mobile-fit (R-274, PLAN-083)

Sotto `mobileFitConfig.breakpointPx` (768) il fit a riposo cambia regola:

- **Cover sull'asse corto, non contain.** Il resting zoom è
  `effectiveMinZoom = max(coverScale, wheelMinBound)`, dove `coverScale =
  max(W / canvasW, H / canvasH)` — il canvas dipinto copre tutto il
  viewport (niente letterbox). La camera è centrata su
  `mobileFitConfig.mapFocal` (frazioni del canvas).
- **`effectiveMaxZoom = max(wheelMaxBound, effectiveMin ×
  mobileMaxZoomFactor)`** — il range pinch è garantito non-vuoto anche
  quando la cover scala sopra il wheel max. Se `min === max` (aspect
  atipici) il pinch no-op ma il pan resta attivo.
- **A ≥768 la coppia wheel è verbatim** — i bound effettivi esistono solo
  nel branch mobile: l'emit-identical desktop è strutturale, non dipende
  da nessuna precondizione su coverScale o sulla mappa caricata.
- **Pan clamp** sui bound mare esistenti (±`seaMarginPx/YPx`) alla scala
  effettiva corrente: dopo un pan massimale la viewport non mostra mai
  area fuori dalla quad mare.
- Il pinch è **DOM Pointer Events** sul canvas (pointerType `touch`,
  `setPointerCapture`, `pointercancel` → restore transform pre-gesto,
  transizione pan→pinch senza salto); il path mouse/wheel è invariato.
- Spec: `tests/mobileFit.spec.ts` (progetto Playwright `Mobile Fit`,
  boot singolo serial).

## Diagnosi rapida quando "la mappa è troppo grande"

1. Leggi `__worldCam.zoom` e ricalcola `floor` e `fit`: se `zoom ≈ floor` il
   colpevole è la copertura (margini troppo stretti per quel viewport) — se
   `zoom ≈ fit` il problema sono gli inset (pannelli, insets sbagliati).
2. Se `landScreen.y0 < 0` o `y1 > H`: overflow verticale → il south-pin deve
   valere; se non vale, il floor ha vinto sul fit.
3. Se `landScreen` esce dai lati: overflow orizzontale → stesso discorso.
4. Linee: individua dove cade il bordo (canvas: `(0-panX)·z`, `(Wcanvas-panX)·z`;
   quad: `(-margin-panX)·z`, `(canvas+margin-panX)·z`) e campiona i pixel con PIL
   — il profilo RGB dice se è un gradino o solo texture.
