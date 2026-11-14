---
title: Handoff — POI Zanara battezzati → POI di produzione
type: handoff
status: PROPOSAL — handoff operativo, non canonico; le decisioni stanno in DECISION_LOG.md (2026-11-11/12)
date: 2026-11-12
from: sessione «POI singolo» (explorer/planner, run `.mw/runs/20261111-poi-zanara/`, non tracciato)
to: sessione che implementa i POI su `/game` e nel lab (PLAN-117 F3+)
related: plans/PLAN-117-poi-zanara-e-luogo.md (rev. 5, battezzato da altra sessione), CTR-game-008, poi_family_spec.md § Sigillo, PLAN-116 D8
---

# Handoff — dal POI battezzato al POI di produzione

## 1. Cosa è battezzato (Director, 2026-11-12)

Due cornici, stessa sagoma, stessi materiali; cambia solo il colore dello smalto.

| Famiglia | File (tracciato) | Fonte |
|---|---|---|
| **Lavoro (job)** — verde smeraldo | `public/assets/ui/hud-real/poi/poi-job-frame.webp` | ritaglio del pezzo verde, trasparente, 994×1081 |
| **Spedizione (quest)** — zaffiro | `public/assets/ui/hud-real/poi/poi-quest-frame.webp` | ricolorazione Gemini del verde, ritagliata (sagoma coincide al 90,5 %, oro invariato) |

Strati che **non sono nell'immagine** e vanno disegnati dal codice:
- **Collare** quasi nero `#060c14`, ~1 px a 48 px, attorno alla sagoma.
- **Bagliore** dorato «sole dietro»: `poi-glow-gold.webp`, radiale con raggi irregolari (corona corta + ~28 raggi + 4 raggi sulle punte), composto **additivo** (`mix-blend-mode: screen` o equivalente) **sotto** il POI, non una fascia che segue la sagoma.
- **Arco del tempo**: livelli in `public/assets/ui/hud-real/poi/layers/` (`poi-arc-mask`, `-tube`, `-inc`, `-top`, `poi-green-base`) + `arc-geometry.json`.
- **Icona**: oggi solo i tronchi (`poi-icon-logs.webp`, presi dal mockup v3). Le altre icone sono da produrre.

Dimensione di riferimento: **larghezza totale con le punte = 48 css px a 1440×900** (testato a 32, 48, 64). Il corpo dell'anello è ≈ 0,80 della larghezza totale. A 32 px l'arco non si legge (≈ 1,3 px).

## 2. Decisioni del Director da rispettare (tutte in `context/DECISION_LOG.md`)

1. **Il glifo mostra il tipo di attività, non il luogo** (il luogo lo dice la posizione) — supera Sigillo D1.
2. **Il tempo riempie la fascia esterna** della cornice (canale tra due fili d'oro), non un anello aggiunto. Prima del riempimento il POI è identico a oggi (il canale non si vede). Lo smalto scorre **sotto** rombi, gemme piccole, foglioline e incisioni, che restano sopra.
3. **Verso:** lavoro = riempie in senso **orario** da dodici; scadenza = parte **pieno** e si scarica **antiorario**.
4. **Colore dell'arco = colore della famiglia.** Job `#226a40` (tra il 75° e il 90° percentile dei verdi della cupola, scurito su richiesta). Quest: **non deciso** (vedi §5).
5. **Niente badge** di stato (clessidra, «!», forziere, spunta). Non previsti.
6. **Urgenza:** solo sull'arco antiorario, e forse nemmeno lì; l'ultimo tratto vira al rosso `#e8553a` con **miscela percettiva** (OKLCH: verde→oliva→ambra→arancio→rosso; blu→viola→magenta→rosso), niente marrone.
7. **Le punte restano** (sono ciò che rende leggibile la sagoma); le gemme crescono **in proporzione** (1,3×), non solo l'oro. **Non toccare le punte senza chiedere.**
8. **Alabastro solo per elementi eccezionali** (scheda hover del Luogo), non per i POI.
9. Il blu è ammesso («quel teal strano no»); il blu per le quest non convince del tutto il Director.

## 3. Come si compone (ordine dei livelli, dal basso)

1. bagliore dorato (additivo sulla mappa)
2. collare scuro
3. cornice (`poi-*-frame.webp`, con icona nella cupola)
4. arco, dentro il canale `R_IN=0,845 … R_OUT=0,972` del raggio esterno (centro e raggio in `arc-geometry.json`):
   `maschera canale × ombreggiatura a tubo × colore famiglia`, poi `poi-arc-inc` (moltiplica, scurisce le incisioni), poi **`poi-arc-top`** sopra (rombi, gemme, foglioline)
5. icona

Il centro dell'anello **non** è il centro dell'immagine (la punta in basso la sposta): usare il centro fittato in `arc-geometry.json` (era sbagliato di 26 px in una versione intermedia).
Il bordo del fronte è un menisco: il centro del canale avanza di ~6° più dei bordi.

## 4. Codice di produzione esistente (letto, non modificato)

- `src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx` — marker oggi usato su `/gameOld`; **`mapQuestPoiView(...)` è la sola fonte di stato** (T-07): `state`, `progress`, `direction` (`clockwise` = lavoro, `counterclockwise` = scadenza), `deadlineWarn`, `done`. Il nuovo POI deve leggere da qui, senza timer propri.
- `poiSigillo.ts` — taglie `S/M/L` (0,8 / 1 / 1,25).
- `PoiMatericV3_5` con prop `sigillo` — è il Sigillo vecchio (lacca+bronzo). **Va aggiunto un preset nuovo, additivo**: `/gameOld` e i lab (`PoiMarkerLabPage`, `PoiBronzeComparePage`) continuano a usare il vecchio.
- `QUEST_GLYPH_URLS` — oggi 2 glifi dipinti (goblin, rovine).
- **`/game` (`src/pages/game-mappa2.tsx`) non monta POI.** `PixiWorldMap` ha la prop `anchors` (DOM agganciato a punti del mondo, dimensione schermo costante): è il punto di aggancio. Il flusso POI→quest su `/game` è PLAN-116 D8 (fuori scope di PLAN-117 core).
- Test esistenti da non rompere: `tests/unit/idleVillage/poiSigillo.test.tsx`, `mapQuestPoi.test.ts`; e2e `gameQuestExpedition.spec.ts`, `gameQuestLifecycle.spec.ts`; contratto `CTR-game-008`. Nuovo comportamento = **Mode B-add** (nuove invarianti) con test di regressione permanente (R-247).

## 5. Punti da risolvere con il Director prima di implementare

Differenze tra **PLAN-117 rev. 5** (battezzato da un'altra sessione) e quanto deciso/mostrato in questa sessione. Non le ho risolte io.

1. **Famiglie differenziate per punte** (rev. 5, «punte diverse ma simili») ↔ i due POI battezzati hanno **la stessa sagoma**, cambia solo il colore; il tipo lo dice l'icona. In grigio le famiglie si distinguono solo dall'icona. Confermare.
2. **Terzo tipo `event`** (rev. 5): **non esiste ancora** una cornice per minaccia/evento (rosso/granato). Serve, oppure decidere che i tipi sono 2.
3. **Arco CCW «arancione»** (rev. 5) ↔ oggi: arco nel colore famiglia, che vira al rosso nell'ultimo tratto. Rev. 5 dice «vermiglio scartato».
4. **Geometria ridondante dell'anello** (rev. 5 C4: CW = arco pieno a capo tondo; CCW = arco a tacche con gioiello terminale) ↔ l'arco prototipato è un **canale riempito** senza tacche e senza capi tondi. T-02 vieta il round cap sugli archi che possono valere 0.
5. **Urgenza = pulsazione + equivalente statico non-colore** (rev. 5 C3) ↔ Director: niente badge; al massimo viraggio al rosso. Nessun equivalente statico è stato progettato.
6. **Colore arco quest:** il 90° percentile del blu della cupola è desaturato (`#636fa1`), il 75° `#2d4a87`, il 50° `#113368`. Un punto medio sarebbe ≈ `#485c94` (grigiastro). Va scelto a occhio; sul mare il blu su blu è il caso peggiore.
7. **Soglia del viraggio al rosso:** 10 % non si vede (36° a 48 px), 25 % si vede solo da ~64 px. Valore proposto, non deciso.

## 6. Cosa NON è stato verificato

- Nessuna prova **dal vivo** in browser: tutte le prove sono compositi Python sulla mappa2 a 32/48/64 px (catture headless di `/game`, headless e senza finestre).
- L'**animazione** (fronte viscoso, scarica, viraggio) non esiste: ci sono solo fotogrammi. Va legata ai tick via `mapQuestPoiView`/`TimeEngine`; nel preview pane le animazioni restano congelate (verificare pilotando `Animation.currentTime`).
- I livelli dell'arco esportati sono stati provati come array in memoria, **non ricaricando i file webp**: la prima cosa da fare è un test che li ricomponga dai file.
- Non misurati con `check-palette.py` né con `poi-terrain-gate.py` sulle cornici finali.
- Una prova di vicinanza (8 POI ravvicinati, soglia del Luogo) **non è stata rifatta** con questo componente; il bagliore a ~1,6× il raggio può sommarsi tra POI vicini.
- Difetti noti nel pezzo: due steli d'oro del rombo in basso; l'icona dei tronchi è color legno, non «oro a rilievo»; il bagliore è meno visibile su villaggio/deserto (fondi già caldi).

## 7. Lavoro che resta, in ordine suggerito

1. Risolvere con il Director i punti 1–5 di §5 (una domanda per volta, parole semplici).
2. Terza cornice (minaccia/evento) se i tipi sono 3; arco quest scelto.
3. Preset POI nuovo nel renderer (additivo) che compone gli strati di §3 leggendo `mapQuestPoiView`; test di composizione dai file + invarianti (arco a 0 = nessun pixel, T-02; a 25 % e 100 %; CW/CCW).
4. Icone: un set per tipo di attività (decisione: tipo, non luogo), nello stesso stile; le icone dei mockup v3 sono un punto di partenza.
5. Pagina lab sopra la mappa2 vera (`PixiWorldMap` + `anchors`), poi prova di vicinanza e fork con il Director.
6. Montaggio su `/game` solo dopo PLAN-116 D8.

## 8. Trappole che ho incontrato (per non rifarle)

- Non trattare le mie critiche come regole del Director; una modifica chiesta = una modifica (memoria `feedback_do_only_what_asked_design`).
- Allungare solo l'oro delle punte le trasforma in fili che spariscono a 32–48 px.
- Un «alone» fatto come fascia colorata attorno alla sagoma è un secondo collare, non una luce.
- File salvati da OpenCV sono BGR: leggerli come RGB in un'anteprima dà colori sbagliati (blu al posto del verde).
- Verificare sempre **a dimensione reale** sulla mappa, non sugli ingrandimenti.

## 9. Dove sta il resto

Run non tracciato `.mw/runs/20261111-poi-zanara/` (catture, tutte le varianti, prompt Gemini, `evidence/`): utile come storico, **non** come fonte per l'implementazione.

## 10. Evidence per il ruling visivo (2026-11-12, sessione ruling)

Generato `.mw/specs/poi-zanara/compose-poi-arc.py` (compositore da file webp
tracciati + `arc-geometry.json`, canvas lavoro 1500×1500 attorno al centro
dell'anello; registrazione alfa della cornice blu: IoU 0,982, scala 1,240).
Output in `test-results/poi-arc-ruling-2026-11-12/`:

- `A-quest-arc-color-grid.png` — 6 blu candidati (p50/p75/mid/p90/bright/navy)
  su mare a 32/48/64 px + laguna/foresta/villaggio/canyon a 48 px, scadenza al 50%.
- `A-quest-arc-color-sea-full.png` — gli stessi 6 su crop mare intero a 48 px.
- `A-quest-arc-color-zoom.png` — zoom ×4 della cima dell'anello (mare 48/64 px).
- `B-urgency-threshold-{sea,village}.png` — 5 regole di viraggio
  (T=10/15/25% tip, T=25% fix45, T=25% whole) × restante 30/25/20/15/10/5%, 48 px.
- `B-urgency-threshold-{sea,village}-zoom.png` — gli stessi con zoom ×4.
- `C-job-green-reference.png` — job verde 40%/80% su mare/villaggio.

Note per chi legge i compositi: sono PIL, non Pixi — il bagliore è screen-blend,
l'arco è smalto letterale `colore×tube`. A 48 px l'anello è ~2-3 px: le tavole
zoom servono a leggere il colore, quelle a scala reale a giudicare la visibilità.
In attesa del ruling su: colore arco quest, soglia+modo del viraggio, segno di
forma per famiglia (fork visivo v35 da fare).

## 11. Implementazione runtime su /game (2026-11-12, sera)

I POI Zanara sono montati sulla mappa giocabile `/game` (`src/pages/game-mappa2.tsx`):

- `src/balancing/config/idleVillage/poiZanaraConfig.ts` — geometria+palette (Zod),
  specchio di `arc-geometry.json`. `familyColor.quest=#2f6fd0`,
  `urgentStartsAtRemaining=0.25`, `urgentMode='tip'` sono **PROVVISORI**, in
  attesa del ruling del Director.
- `src/ui/idleVillage/components/poi/PoiZanara.tsx` — composito DOM:
  bagliore oro (screen) → base famiglia (cornice+collare cotti, webp
  `layers/poi-{job,quest}-base.webp` generati canvas-aligned) → anello SVG nel
  canale (maschera `poi-arc-mask.webp`, tappi butt — T-02: a frazione 0 non
  disegna nulla) → incisioni → decorazione → icona nella cupola.
- `MapQuestPoi` prop `marker='zanara'`: la frazione deriva da `mapQuestPoiView`
  — `available` = share della finestra d'offerta, `in_progress` = 1−progress
  (residuo), scrittura iniziale dal `sealWriteIn` (nasce pieno e drena al
  valore live).
- `game-mappa2.tsx` monta i POI quest reali (`poi-goblin`, `poi-rovine`) con
  `marker="zanara"` — il reveal è quello canonico (`questShown`/
  `autoRevealedIds`/run live), non un duplicato. `/gameOld`/`game-frame-pixi`
  e i lab restano sul Sigillo (default `marker='sigillo'`).
- Seam di review famiglie: `?poiDemo=1` o azione Director «POI types» monta 5
  esemplari (2 job + 3 quest, 32/48/64 px) su biomi diversi, frazione pilotata
  dal `currentTick` reale (ciclo 90 tick) — si riempiono/svuotano col clock e
  si fermano in pausa.

Evidence live (`test-results/poi-zanara-live/`): `game-full.png` (7 marker su
mappa reale), `real-0-quest_poi-goblin.png`, `real-1-quest_poi-rovine.png`
(reveal reale senza demo), `poi-*` crop per famiglia/bioma. Probe archi:
T0→T+20s a ×4 tutti e 5 i path SVG cambiano (job CW, quest CCW).

Trappole riapplicate: T-01 (stato unico `mapQuestPoiView`, nessun clock
duplicato), T-02 (butt caps), T-04 (testimone = cattura headless WebGL della
mappa vera, non compositi), T-07 (frazione da `state.currentTick`, pausa/velocità
rispettate), T-13 (failure di boot in headless = WebGL software lento, non bug:
attendere il transform dell'anchor layer, non `data-map-ready`).

Nota di verifica: `/game` apre in pausa per design (`gamePage.startPaused`) —
gli anelli si muovono solo col clock avviato (Space o tasti 1..n, dove n indicizza
`speeds[n-1]`: ×4 è il tasto 3).

### Errata 2026-11-13 (fix post-review Director)

- `poi-quest-base.webp` era stato cotto con la registrazione spostata di
  (+228,+239) px: cornice e canale/maschera sfasati, arco visibile fuori sede.
  Ri-registrato sulla sagoma della base job (IoU 0,972, scala 1,310, offset
  342,340) — ora alpha centrata (894,5;909,6) ≈ job (892,5;908,6).
- I marker crescevano a zero con lo zoom mappa: `PixiMapAnchor.zoomScaleExp`
  (esponente su zoom/fitZoom, clamp 0,75–2,4) applicato agli anchor POI;
  valore in `POI_ZANARA_CONFIG.anchorZoomScaleExp = 0,6` (95→134 px a 1,77×).
- Contorno navy sulla sagoma: `outlineColor/outlinePx` in config, drop-shadow
  quadruplo + ombra di appoggio su `PoiZanara` («la riga attorno», Director).

### Errata 2026-11-13 bis (leggibilità live-map, secondo giro Director)

- Primo giro insufficiente («nn si vede un cavolo»): i problemi veri erano
  densità e contrasto, non solo la base disallineata.
- `familyColor` schiarito per l'arco: job `#4cc07e`, quest `#8fb6ff` — il
  canale navy + smalto zaffiro uccideva il blu pari-tono (`#2f6fd0` resta come
  colore di famiglia concettuale, l'arco è la variante chiara).
- `markerScale: 1.3` in config: i marker Zanara rendono una taglia sopra il
  `sizePx` autoriale (il sigillo resta com'era).
- `iconDiameterFactor` 0,66→0,78 + disco «cameo» avorio morbido dietro il
  glifo + alone caldo: le icone dipinte scure su cupola navy ora si leggono.
- «Filo» luminoso non mascherato al centro del canale (stroke 0,3, bianco 40%
  in OKLCH sopra il colore segmento): l'avanzamento si legge anche ad arco corto.
- Fix collaterale: `isGamePath` mancante in `App.tsx` (edit PLAN-118 a metà,
  /game irraggiungibile) — ripristinato `pathname === '/game'`. Attenzione T-13:
  la sessione deploy-slim era in corso sullo stesso file.

### Errata 2026-11-13 ter (veto testo + arco overspill)

- Veto Director registrato in DECISION_LOG: mai testo/etichette sotto i POI.
- Overspill: banda non mascherata a 1,9× larghezza canale, opacità 0,5, sotto
  inc/top — l'arco «si accende» oltre il bordo e si legge a distanza mappa.
  Il riempimento esatto nel canale resta (maschera), il filo luminoso sopra.
- Stack finale: glow → base → overspill(0,5) → arco mascherato → inc → top →
  filo luminoso → cameo+icona.

### Errata 2026-11-13 quater (magic-circle halo al posto dell'overspill)

- Il Director ha chiesto di riusare l'halo dei POI precedenti (il «magic
  circle» del Sigillo) al posto della banda overspill, in tinta coi nuovi
  colori di famiglia. Fatto.
- Nuovo componente `src/ui/idleVillage/components/poi/PoiMagicCircle.tsx`:
  port standalone del magic circle del Sigillo (binari doppi r=45/54, banda
  runica su due giri, scintille cardinali, perla di testa, bloom tintato) —
  PoiMatericV3_5 resta intoccato (trusted). Geometria da
  `POI_MATERIC_V4_TOKENS`; tono parametrico = colore famiglia, vermiglio in
  urgenza. ViewBox allargato a `-20 -20 126 126` per contenere l'anello che
  nel sigillo sborda via `overflow=visible`.
- `poiZanaraConfig.haloOuterRailPx: 640` — il binario esterno (r=54 unit) è
  mappato a 640 px canvas, appena fuori dalle punte (~580); l'anello fluttua
  attorno alla cornice e legge benissimo a distanza mappa. 0 = off.
- In `PoiZanara`: rimossi overspill e filo luminoso; resta l'arco mascherato
  nel canale (sottile, autoriale) + l'halo runico sopra top, prima dell'icona.
  Sweep: job +1 (riempie CW), quest −1 (drena CCW) — speculari a pari frazione.
- Evidence live: `test-results/poi-zanara-live/halo-*.png` (demo 5 famiglie)
  e `halo-real-*.png` (Goblin/Rovine reali). Risultato molto più evidente
  dell'overspill — il countdown si legge a colpo d'occhio a scala mappa.
- `build:check` verde. TODO dedup futura: far consumare `PoiMagicCircle`
  anche a PoiMatericV3_5 richiede toccare il sigillo trusted (doc governance).

### Errata 2026-11-13 quinquies (halo aderente, ruling Director)

- Ruling: l'anello runico non deve fluttuare lontano — «deve partire dai
  gioielli (passando dietro) ed essere aderente all'outer ring». Inoltre via
  la luce attorno (`poi-glow-gold`), via il collare navy (outline filter), e
  via il riempimento del canale — l'halo è l'unico indicatore di tempo.
- `haloOuterRailPx` 640 → 540: la banda runica ora copre ~450-540 px canvas,
  raso al bordo della cornice; renderizzata PRIMA della base così le punte/
  gioielli le passano davanti.
- In `PoiZanara` rimossi: layer glow, filtro outline (campi config
  `outlineColor`/`outlinePx`/`channelMask` restano in schema, inutilizzati),
  arco mascherato nel canale con tutta la logica `segments`/`arcPath`/
  `mixStroke` (rampa tip inclusa — l'urgenza ora è solo il salto a vermiglio
  dell'intero halo, semantica sigillo).
- Stack finale: magic-circle halo → base → incisione → top → cameo+icona.
- Evidence: `test-results/poi-zanara-live/halo2-*.png`.
- `build:check` verde.

### Errata 2026-11-13 sexies (gioielli nativi + via il track scuro)

- Gioielli: il layer `top` condiviso portava le gemme smeraldo dell'arte verde
  sopra la base azzurra. Il POI azzurro originale (`Downloads/poi blu.webp`
  → `poi-quest-frame.webp` → `poi-quest-base.webp`) ha gia' i suoi gioielli
  zaffiro dipinti e registrati sulla stessa sagoma — rigenerato
  `poi-quest-top.webp` bucando le gemme verdi (maschera hue 80-175, dilatazione
  + blur morbido): sotto traspaiono le gemme native. Niente hue-shift.
  `POI_ZANARA_LAYERS.top` ora e' per-famiglia: job=`poi-arc-top`,
  quest=`poi-quest-top`.
- Rimosso il dark backing track dal magic circle: su cornice oro leggeva come
  «scritte nere» (ruling). Le rune ora sono solo bloom+inchiostro chiaro.
- Evidence: `test-results/poi-zanara-live/halo4-*.png`.

### Errata 2026-11-13 septies (base job = frame originale)

- La base job usava `poi-green-base.webp`, che aveva cuocito l'anello navy nel
  cerchio + collare scuro esterno. Rigenerato `poi-job-base.webp` dal frame
  originale `poi-job-frame.webp` (= `Downloads/poi.png`), registrato per bbox
  sulla stessa sagoma (scale ~1.0, offset 397/398), alpha opacizzato per
  l'halo dietro i gioielli.
- Confermato il layout: magic-circle halo UNDER base (rune dietro i gioielli,
  `haloOuterRailPx: 540`), niente glow, niente outline, niente arco nel
  canale, top per-famiglia (quest con gioielli zaffiro nativi via buchi).
- Evidence: `test-results/poi-zanara-live/halo7-*.png`.

### Errata 2026-11-13 octies (halo = settori angolari, non occluder)

- L'occluder-layer (halo sopra base, sotto top con punte copiate) NON ha
  funzionato: stesso artefatto visivo (ruling Director: "stesso identico
  errore"). Soluzione finale, proposta dal Director: l'halo non disegna
  affatto nei settori angolari occupati dalle punte — esclusione geometrica,
  niente masking via layer.
- Implementazione: `PoiMagicCircle` accetta `gapSectors` (gradi, sistema
  canvas, 0=nord CW); `PoiZanara` passa `POI_ZANARA_CONFIG.halo[family].gaps`
  — job `[[-10,10],[73,108],[153,207],[252,287]]`, quest
  `[[-13,13],[72,109],[153,207],[251,288]]` (misurati via alpha-probing
  radiale sulle basi cotte). Rune, binari e scintille cardinali sono
  clip-pati con `ctx.setLineDash` su archi spezzati per settore — i gioielli
  non vengono mai coperti perche' l'anello li "scavalca" geometricamente.
- `haloOuterRailPx` ora per-famiglia in config `halo.job`/`halo.quest`
  (sagome diverse). Config: `haloGapDeg` -> `halo[family].gaps`.
- Evidence: `test-results/poi-zanara-live/halo10-*.png`.
- Nota T-13: `src/analytics/GuardianDryRunAnalyzer.ts` e
  `idleVillageMapAssetTelemetry.ts` erano mid-write (errori sintassi) al
  momento della verifica — lavoro dell'altra sessione, non nostro. `tsc` sui
  file POI pulito.

### Errata 2026-11-13 nonies (palette halo piena + rune gold + job POI reali)

- **Palette**: `familyColor` torna alla tinta smalto piena del componente —
  job `#17a352` (smeraldo, hue ≈148 della cupola), quest `#2f5fd4` (zaffiro,
  hue ≈222). Ruling Director: «stesso blu del componente, non biancastro» /
  «un bel verde pieno». I chiarori precedenti (`#4cc07e`/`#8fb6ff`) erano per
  l'arco sul canale navy — inutili ora che l'halo vive sulla fascia oro.
- **Rune gold**: nuovo `haloRuneColor` `#e8c46a` (oro dipinto della cornice,
  sampled) e prop `runeColor` su `PoiMagicCircle` — i glifi sono gold in
  entrambi i passi (bloom + crisp); binari, perla di testa e scintille
  cardinali restano in tinta famiglia (vermiglio in urgenza).
- **Job POI reali** (ruling Director 2026-11-13: «un POI di job deve
  apparire»): in `game-mappa2.tsx` ogni `activeActivities` con
  `activity.type==='job'` monta un marker Zanara verde sul villaggio
  (`JOB_POI_VILLAGE_OFFSET` {-95,+110} da `MAPPA2_VILLAGE_ORIGIN`, cluster
  orizzontale 92px per lavori multipli). Frazione = share elapsed
  (`1 - ticksRemaining/durationTicks`, fill CW). Stessa attività su più
  residenti = un marker al completamento più vicino.
- Nota: i job reali partono dal villaggio (VillageSlotOverlay → store
  `startActivity`); `job_wood_gathering_stable` richiede strength≥3 —
  residenti con stats a 0 non la avviano, `slot_rack_lab` sì.
- Evidence: `test-results/poi-zanara-live/job-real-crop.png`,
  `colors-quest-crop.png`, `job-real-full.png` (job reale avviato via store
  in probe playwright).
