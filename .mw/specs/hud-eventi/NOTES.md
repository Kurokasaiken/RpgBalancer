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
- **Production asset:** `public/assets/ui/hud-real/events/bar.webp` (976×186, sha256 `39afbef927a5f98c5c52539cfed5b04a89b2f32123588401b74208116463ed74`).
- **Use:** collapsed Events bar in `HudRealEventsBar` / `GameTopChrome`; red native gem = threat, filtered circular gem copy = other tones, medallion glyph = non-colour-only type sign.

- **Final witness:** `test-results/r386-events-bar/final-comparison-board.png` confronta reference, empty state, threat con gemma rossa nativa e pannello reale aperto; probe DOM in `final-probe.json` e `postrefactor-probe.json`, narrowing in `narrow-probe.json`.

- **Correzione visual 2026-11-25:** neutral/empty swappa l'asset verde firmato del Tempo (`time/dial-frame.webp`), non un filtro sulla gemma rossa; contenuto su una riga con countdown compatto finale (`5d`). Witness `test-results/r386-events-bar/swap-empty-bar.png` e `swap-threat-bar.png`.

## ref-eventi-panel-aperto-2026-11-26.jpg

- **Path:** `.mw/specs/hud-eventi/refs/ref-eventi-panel-aperto-2026-11-26.jpg`
- **sha256:** `16d80ed87f2d820448c3d6a4b193832a79f7a2783213467e6a1f323cf1a7efd5`
- **Size:** 1024×682
- **Registered:** 2026-11-26
- **Director quote:** *«questo è il componente aperto»*
- **Meaning:** visual reference for the OPEN state of the Events component — companion of the collapsed bar reference (`ref-eventi-bar-specular-time-2026-11-25.png`). Structure: ornate header bar with compass medallion left and large gemmed medallion top-right (matching the bar's semantic gem), 4 circular slots row under the header (first one lit/green), 3 list rows with circular type medallion left and chevron right, ornamental bottom divider with central diamond. Not yet implemented as a skin — the current open panel is the legacy list; reskinning is future work pending Director direction.

### Produzione pannello aperto (2026-11-26)

- **Generator:** `scripts/hud-real/build-events-panel.py` — stessa ricetta magenta-key/decontamination della barra, slice orizzontali full-width.
- **Production assets:** `public/assets/ui/hud-real/events/panel-bodytop.webp` (976×132), `panel-row.webp` (976×99, tiling — ogni banda finisce con il suo divisore, le cuciture sono mascherate), `panel-bottom.webp` (976×89).
- **Componente:** `src/ui/idleVillage/hudReal/HudRealEventsPanel.tsx` montato dentro `GameTopChrome` sotto la barra collapsed — la barra resta l'header visivo (stessa famiglia d'arte), il corpo si estende sotto.
- **Comportamento Director (verbatim 2026-11-26):** *«deve essere montato in produzione. Quando clicco eventi chiuso voglio una animazione in cui la parte d sotto si allunga e diventa questo. E poi può anche diventare + lungo e mostrare ancora + righe»* — apertura = reveal verticale ancorato in cima (height 0→full, 420ms), più eventi = più righe tiling = pannello più lungo; oltre `maxRows` (5) le righe scrollano dentro. I 4 slot circolari sono i filtri tipo (all + 3 tipi a priorità più alta), lo slot attivo porta il glow verde. Click riga → focus evento sulla mappa e chiusura (contratto `focusEvent` esistente). In modalità non-blueprint il vecchio `HudRealLedgerPanel` resta il fallback montato sullo stage.
- **Witness:** `test-results/r386-events-bar/open-probe.json`, `open-mid-animation.png`, `open-panel-open.png`.

### Fix visuali 2026-11-26 (Director: pezzo sotto il ring, spunta nel ring, gap barra/tendina, slot filtro)

- Gemma neutral: overlay `time/dial-frame.webp` portato a 100px design — copre l'intero footprint del medaglione rosso (r~46 design incluse punte); prima i raggi rossi spuntavano sotto/dentro.
- Gap barra/tendina: l'arte della barra ha 27px sorgente di padding trasparente sotto il bordo visibile; il corpo ora doka a `dockTopPx` 77 (config) invece di EVENTS_H-4 — niente mappa visibile in mezzo.
- Slot filtro: de-glow deterministico del primo slot in `build-events-panel.py` (copia circolare sfumata r64/f14 dal secondo slot — il riferimento resta intoccato, il glow attivo è del CSS); glifo del tipo dentro ogni slot (chronicle per "all") così si leggono come filtri. Witness `test-results/r386-events-bar/fix-witness.png`, errors [].

### Gemma neutral senza cerchio orologio (2026-11-26, Director: «togli il cerchio dentro il componente con lo smeraldone»)

- `scripts/hud-real/build-events-gem.py` genera `public/assets/ui/hud-real/events/gem-neutral.webp` dal `time/dial-frame.webp` (mai modificato: resta del Tempo) — il centro sfaccettato r<100 è scalato a coprire l'intero interno sotto la ghiera oro, cancellando anello del quadrante, tratti e cuciture. Inspect: `test-results/events-gem-neutral-inspect.png`.

### Fix 2026-11-26 bis: smeraldo dietro la ghiera + altezza riga chrome

- **Gemma:** primo tentativo sbagliato — lo smeraldo scalato a r148 copriva anche la ghiera oro interna (Director: «hai messo lo smeraldo davanti al componente ring? m sa che è sbagliato»). La scanline radiale mostra la struttura: centro sfaccettato r<100, anello scuro quadrante r~112-124, ghiera oro r~125-160. Rigenerato con COVER_R 124: la ghiera resta davanti, smeraldo seduto dentro.
- **Altezza (Director: «il componente deve essere d altezza cm gli altri de componenti in alto: tempo e risorse»):** `eventsFit` ora include il vincolo `ROW_H / EVENTS_H` — la barra non supera mai l'altezza della riga chrome condivisa, testo compensato da `--hud-text-k` come il boost risorse. Nota: a 1440 il vincolo larghezza (reserve) è appena più stretto di quello altezza, quindi l'effetto si vede su viewport più larghi; witness `test-results/r386-events-bar/height-witness.png` con misure reali delle tre barre.

### Pareggio altezza simmetrica (2026-11-26, Director: «sistema simmetrico di 3 componenti dello stesso peso»)

- Misure chiave: TIME_SLIM_BAR 419.5×54, RESOURCES_SLIM_BAR 379×62 con RES_K≈1.105 → RES_H≈68.5, ROW_H=68.5; capsulePx time 52.5 resources 57; chronicleReservePx 360, fit condiviso e eventsFit calcolati in GameTopChrome.
- Prima iterazione (cap ROW_H/EVENTS_H) troppo debole: a 1440 il vincolo larghezza (348/488=0.713) è più stretto del cap (0.736) → nessun cambiamento visivo.
- Implementato pareggio vero: `eventsHeightFit = (TIME_SLIM_BAR.h * fit) / EVENTS_H` — la barra Eventi rendera alla STESSA altezza resa del banner Tempo (gemello speculare). DA VERIFICARE VISIVAMENTE SU /game — se il Director la vuole pareggiata alle Risorse (più alte) invece che al Tempo, cambiare TIME_SLIM_BAR.h con RES_H in quella formula. Se il risultato sembra troppo piccolo/cramped, valutare target intermedio o scala capsule. Il probe live delle 3 barre misurate (`height-probe`) è fallito per boot flaky — RIFARE: misurare getBoundingClientRect di chrome-day-banner/chrome-resources/chrome-events e confrontare.

### Tool tuning proporzioni (2026-11-26, Director: «fammi un tool x modificare le proporzioni del componente eventi, con accanto come referenza il componente tempo»)

- Route `/events-tuner` (`src/pages/events-tuner.tsx`, registrata in `src/deploy/labRoutes.ts` + `labRouteData.ts`): Tempo slim a sinistra invariato come referenza, barra Eventi a destra scalata come in produzione; slider `heightRatio` 0.6-1.5, checkbox tendina aperta, readout con valore da copiare in config.
- Knob produzione: `eventsBarConfig.heightRatio` (zod, default 1 = stessa altezza resa del banner Tempo); `GameTopChrome` lo applica in `eventsHeightFit`. Per cambiare le proporzioni: Director regola lo slider nel tool, copia il valore in `eventsBarConfig.heightRatio` — una riga.
- NOTA: il pareggio 1.0 usa il Tempo (54px design). Se il Director sceglie un ratio diverso nel tool, aggiornare anche il commento contratto INV e il test r339 (che rispecchia la formula con heightRatio implicito 1 — se cambia il default il test va riallineato).

## Gold grading verso il Time reference (2026-11-26)

Misura: l'oro degli slice Eventi era hue ~35° (bronzo-arancio) vs Time gold reference 45.2°; verdi già coerenti (~160°). Correzione in pipeline: `scripts/hud-real/goldgrade.py` (`grade_gold_toward_time`, rotazione hue solo famiglia oro con maschera morbida, shift adattivo clamp ±15°, target `TIME_GOLD_HUE = 45.2`) applicata come post-step in `build-events-bar.py` e `build-events-panel.py`. Rigenerare con entrambi gli script dopo ogni modifica. Dopo: bar 44.1°, row 43.6°, bodytop 44.0°. Board confronto: `test-results/events-gold-grade-board.png`. La gemma neutral non va gradata (deriva dall'asset Time). Se il Director giudica l'oro ancora sbagliato, il target è una costante sola in `goldgrade.py`.

## Events tuner v2 (2026-11-26)

`/events-tuner`: overlay ancorato centro-su-centro dentro il box Tempo (mai al flex row — bug risolto, sfasamento 43px), scaling `transformOrigin: center` (nessuna deriva d'asse), range X ±1000, default mirror+overlay+ghost ON, scala default 1.48 (=148%, larghezze coincidenti 419.4 vs 419.5 — verificata l'ipotesi Director ~150%). Toggle "fantasma" opacità 50% per vedere entrambe le barre. Tutto test-only: solo `heightRatio` va in produzione.

## heightRatio 1.48 in produzione (2026-11-26)

Director: «aggiorna /game con le nuove proporzioni». `eventsBarConfig.heightRatio` 1 → **1.48** (larghezza barra = larghezza banner Tempo, verificato nel tuner). Test r339 aggiornato: la formula specchio ora include `heightRatio` — 28/28 verdi. Per tornare indietro basta riportare il knob a 1.

## Tubo slim stile Tempo (2026-11-26)

Director: il frame del tubo Eventi era una pipe dorata cilindrica spessa (~19px con groove+glow), il Tempo ha rail sottile tagliente (~5px). Chirurgia raster `scripts/hud-real/build-events-tube.py`: per colonna nella sezione interna x205-795 stretch verticale dello smalto esistente (interno preservato) a coprire la zona pipe liberata + trapianto delle righe rail del Tempo (y2-6/y102-106 interior) ridimensionate orizzontalmente; fade 55px verso i medaglioni terminali; silhouette alpha invariata; medaglione grande finale e medaglione tipo intoccati. ORDINE PIPELINE: `build-events-bar.py` → `build-events-tube.py` → `build-events-interior.py` (rigenerare la barra richiede rieseguire entrambe le chirurgie). Righe del pannello a tendina NON trattate (arte diversa, non richiesto). Misura verdi: interno medaglione Tempo = smalto scuro (1,17,27), gemma Eventi = smeraldo (1,84,60) — materiali diversi by design, non il sole che scurisce (sole = overlay runtime dialSlim).

## Margine simmetrico + smalto pulito (2026-11-26 sera)

Director 4 punti. Fix: (2) margine destro — `sunTipOverhangPx: 10` in cassettoLayoutConfig.topChrome, `eventsRightMargin = max(marginPx, bannerMarginPx − sunTipOverhang×fit)` in GameTopChrome sia per eventsWidth che eventsLeft; riserva 432→468. Misura live a 1440: events right edge 1392 (48px dal bordo) ≈ time tip ~47-49 da sinistra. (3) smalto sporco — la stretch per-colonna sbavava le righe glow residue: ora smoothing verticale kernel 9 prima dello stretch in build-events-tube.py; rigenerare sempre bar→tube→interior. (1) misure oneste: smalto reso Tempo 50px, Eventi 45-49px, Risorse 58px; larghezze box identiche 419/419/420. Se vuole ancora più grande: heightRatio oltre 1.48 (ma la larghezza supera il Tempo). (4) Risorse: centro misurato 720.5 vs centro pagina 720 — già centrato matematicamente; la percezione off-center veniva dai gap asimmetrici (33 vs 79px), ora 33 vs 43 dopo la fix margini.

## Rigenerazione fascia interna (2026-11-26, Director: «prendi l'originale e fatti rigenerare solo la parte dentro»)

- Difetto: la cancellazione/ricostruzione precedente lasciava ghosting e macchie nel campo interno; non era un layer DOM né una gemma separata.
- `scripts/hud-real/build-events-interior.py` rigenera deterministicamente solo lo smalto interno post-tube (bbox operativo x150-830, y39-142): preserva rail sottili, medaglioni, ornamenti oro, gemma rossa, silhouette e alpha. Non copre con patch opache: usa il crop pulito dello smalto centrale della reference originale `(225,70)-(735,143)`, lo ridimensiona nella fascia post-tube e fonde solo dentro la maschera della fascia.
- ORDINE PIPELINE canonico: `build-events-bar.py` → `build-events-tube.py` → `build-events-interior.py`. Non rieseguire `build-events-interior.py` da solo come inspection: la fusione feather non è pensata per applicazioni ripetute sul file già trattato; la rigenerazione valida è sempre la pipeline completa dalla sorgente.
- Asset rigenerato: `public/assets/ui/hud-real/events/bar.webp` sha256 `39afbef927a5f98c5c52539cfed5b04a89b2f32123588401b74208116463ed74`. Diff controllato: bbox `(151,38)-(830,143)`, max diff fuori maschera 2/255.
- Witness statico: `.mw/runs/20261126-events-mirror-clarification/interior-after-integration-board.png`; witness runtime: `.mw/runs/20261126-events-mirror-clarification/game-events-inner-runtime-crop.png`.

## Cross-reference R-391: socket filtri come controllo default (2026-11-26)

Il Director ha designato il crop dei 4 socket circolari di questo pannello come reference corretta/default per filtri e chiusura su stash/magazzino, roster e tempo: *«la seconda immagine (dal compoentne eventi) è la reference corretta x i filtri... E' anche lo stesso elemento x fare il pulsante x perchiudere (la x grande)»*. Artifact durevole: `.mw/specs/hud-real/refs/ref-round-filter-sockets-2026-11-26.png` sha256 `f64631afc7cb928e79970544d78572b5420573ec607cadf03eddb92a7163970f`.

## Guscio Time condiviso, mirrored integralmente (2026-11-26 sera)

Director: *«fai quella parte integralmente»* e *«non deve essere un altro componente o una copia, devono puntare allo stesso oggetto proprio, possibilmente, deve poter essere riutilizzato»*.

- Il collapsed Events bar **non usa più** `events/bar.webp` come guscio di produzione. Quell'asset resta solo artifact storico/derivato della reference; la pipeline `build-events-bar/tube/interior` non è più la sorgente del frame live.
- Nuovo oggetto riusabile unico: `src/ui/idleVillage/hudReal/HudRealTimeShell.tsx` (`HudRealTimeShellLayers`) + contratto geometrico `timeShellGeometry.ts`. Tempo e Events puntano entrambi a `TIME_SLIM_BAR`; Events applica mirroring geometrico solo ai layer dipinti, mentre testo e contenuto live non sono specchiati.
- Correzione Director 2026-11-26: niente maschera runtime. `scripts/hud-real/build-time-shell-empty.py` deriva `time/bar-slim-empty.webp` dal master `time/bar-slim.webp`, cancellando fisicamente smalto/socket dipinti del Tempo nella fascia interna, rimuovendo anche il residuo metallico a parentesi e inserendo baked l'interno donato dal vecchio `events/bar.webp`. Il Tempo continua a usare il master pieno; Events usa la variante interior-donor dello stesso guscio.
- Dentro la fascia donor-baked vengono montati titolo/countdown Events; nel medaglione destro il gem-content `events/gem-neutral.webp` porta il tono (warning/danger via filtri provvisori) e il glifo tipo preserva il segno non colour-only.
- Il pannello aperto legacy a slice resta in produzione ma viene scalato da 488 a 419.5 design px per seguire la larghezza del guscio condiviso; `dockTopPx` 50 lo ancora sotto il rail senza gap.
- Witness runtime headless `/game` della variante baked-empty: `.mw/runs/20261126-events-empty-shell/neutral-pair.png`, `neutral-open-pair.png`, probe `probe-output.json` (`errors: []`, `blackwell: false`, `shellSrc: time/bar-slim-empty.webp`). Witness precedenti del passaggio a guscio condiviso in `.mw/runs/20261126-events-shared-shell/`.
