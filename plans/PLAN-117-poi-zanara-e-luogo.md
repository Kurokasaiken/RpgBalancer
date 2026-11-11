# PLAN-117 — Layer opportunità della mappa: POI Zanara, Luoghi fissi, Eventi strategici, Regioni

**Stato:** bozza rev. 4 (2026-11-11) — emendamento Director durante l'iterazione F1; in preparazione al dibattito multi-AI web (run 2), poi battesimo.

> **Rev. 4 — emendamento strutturale (ruling Director 2026-11-11, iterazione sul mockup):**
> - **Luogo = entità autoriale, non emergente.** Bocciata l'aggregazione per vicinanza («POI vicini diventano Luogo»): ogni POI appartiene a un **Luogo/Regione fissa** decisa dal world design. D-8 e la misura di soglia (T1.3, OB-10) **morte** — la domanda non esiste più.
> - **Eventi ≠ POI.** Gli eventi strategici di medio-lungo termine (es. «invasione goblin tra X giorni», positivi e negativi, obiettivi del giocatore) non sono marker sulla mappa: richiedono un **componente dedicato** (lista/timeline ordinata per scadenza, in chiave Zanara; il reminder obsoleto è il riferimento, non il riuso).
> - **Anello temporale riscritto.** Orario = in corso (colore di famiglia: blu quest / verde job); antiorario = countdown turni alla scomparsa (**arancione**); urgenza = **solo pulsazione luminosa**, niente vermiglio né cambio colore — risolve anche il caso daltonico rosso/verde.
> - **Famiglie visive coerenti.** Stessa cornice stellata Zanara per tutti i tipi; la differenziazione sta nella **forma delle punte/gioielli** e nel glifo — non in sagome radicalmente diverse né nel solo colore.
> - **Regioni da ridisegnare.** L'overlay territoriale «stile Risiko» (verde piatto in hover) è brutto e fuori lingua; le regioni stesse (regions.json) furono definite casualmente → lavoro di ridisegno intelligente.
> - **Generazione:** il Director ha delegato la generazione immagini all'agente (pipeline Gemini web + canvas-readback, quota esaurita in giornata — fallback altri provider o attesa).
> - **Direzione visiva emersa:** mockup del Director come riferimento; preferita «cartografia incisa» — cornice stellata con punte, contorno scuro, campo smalto saturo scuro, glifo piatto (es. arco avorio su blu). Le 3 direzioni A/B/C generate (smalto/oro/gemma senza bordo scuro) bocciate: oro sul perimetro si mimetizza.

> **Rev. 3 (storico):** igiene contratto post-dibattito run `20261111-plan117-poi-zanara` (converged 3/3). I suoi punti tecnici restano dove ancora applicabili (misure su superficie viva, accettazione geometrica, copertura stati), ma le parti legate alla soglia di vicinanza sono superate da rev. 4.
>
> **Rev. 2 (storico):** scope ridotto al POI. Rev. 4 riunifica: POI + Luoghi autoriali + Eventi + Regioni = un solo layer "opportunità della mappa".

**Parent:** R-324, OPEN-025 (Luogo), OPEN-026 (famiglie — rivisitata: si propongono 3 tipi visivi), R-323/PLAN-113 (HUD Zanara), PLAN-116 (cassetto, in corso in un'altra sessione — file non toccabili).

**Origine (Director, verbatim):**
- 2026-11-11 mattina: Luogo come aggregato di attività su un punto; hover scheda alabastro, clic ventaglio a due anelli (interno = urgenza); POI nuovi nel linguaggio Zanara *prima* del Luogo.
- 2026-11-11 sera (iterazione F1): *«il vermiglio sull'urgenza per adesso nn mi interessa, possiamo scartarlo […] orario se qualcuno c sta lavorando, anti orario se abbiamo X turni prima che sparisca. Con i colori diversi: arancione x la scadenza, l'altro a seconda se è job o quest»* · *«famiglie visive.. magari cambiamo la forma della punta? ma devono rimanere relativamente simili»* · *«Urgenza al massimo facciamo pulsare e basta»* · *«vorrei che ci fossero degli eventi […] negativi o positivi e rappresentano davvero gli obiettivi a medio e lungo termine […] come POI sulla mappa nn hanno senso […] un componente (che in teoria già c'è ma è obsoleto) che mostra in ordine di scadenza tutte le quest, eventi, ecc.»* · *«usiamo il luogo di per se, come già sn divisi in regioni […] i poi appariranno sempre in regioni specifiche […] nn è che i luoghi verranno creati sul momento x vicinanza d POI»* · *«la mappa è divisa tipo risk ma verde è molto brutto e va migliorato […] le regioni le abbiamo definite casualmente, dobbiamo pensarci meglio»*.

**Decisioni già prese (non si riaprono qui):** `context/DECISION_LOG.md` 2026-11-11 — **eccetto** i punti esplicitamente rivisitati da rev. 4: la famiglia «minaccia/evento» torna discussa (3 tipi visivi, non più solo "variante di spedizione"), la regola «vermiglio = urgenza» è sostituita dalla pulsazione, l'aggregazione emergente è bocciata. Restano: hover = scheda alabastro, clic = ventaglio a due anelli (interno = urgenza), niente nome scritto sopra il POI, grammatica **bordo/sagoma/glifo/anello** (l'anello ora = direzione + colore di stato, non più vermiglio).

**Cosa NON è:**
- non monta POI su `/game`: il flusso POI→quest è PLAN-116 D8; il lavoro vive nel lab `/lab/poi-luogo` (D-1) e su compositi;
- non disegna il dettaglio dei job (D-3);
- non tocca file di PLAN-116 (slot, ghiera, medaglione C1, cassetto): li legge soltanto;
- niente telefono (< 768 px), niente nuove regole di gioco;
- il componente Eventi è **specificato** qui (architettura + pelle), non implementato fino al suo gate.

## 0. Fatti verificati (2026-11-11)

- **`/game` non ha POI**; il flusso POI→quest esiste solo su `/gameOld` (`MapQuestPoi` → `PoiMatericV3_5`, Sigillo SVG). `PixiWorldMap` espone `anchors` + seam dev `__worldCamCtl`/`__worldCam` (CTR-game-005).
- **T0.1 fatto:** `scripts/capture-poi-map-matrix.mjs` → `test-results/poi-zanara-f0/` (86 PNG, 7 zone × 2 viewport × 3 zoom + baseline Sigillo). Coverage floor misurato: 0.586 @1440×900, 0.521 @1280×800.
- **Iterazione visiva fatta:** 3 direzioni generate e bocciate (`gen/A,B,C`); mockup Director (`refs/director-mockup.jpg`) estratto e composto (`card-mock/`); stati+deuteranopia simulati (`card-states/`). Evidenze: contorno scuro necessario; cornice a punte legge a 32px; famiglia per solo colore crolla a 44px e in grigio; micro-architettura si confonde con edifici scena; verde/vermiglio confondibili in deuteranopia.
- **Regioni attuali:** `public/assets/world/mappa2/base/regions.json` (20 regioni, centro+bbox+biomi) con overlay hover "Risk-style" piatto — definite casualmente, da ripensare.
- **Reminder obsoleto:** componenti `ReminderComponentV2/V3` + feed decisioni (`QuestDecisionFeed*`): riferimento per il componente Eventi, non riuso diretto.
- **Eventi nel mondo:** `seaWonders.ts` e materiali di `villageZoneManifest` contengono semi di eventi; il concetto "invasione/evento a scadenza" non ha superficie propria oggi.

## 1. Principi

- **P1 — Grammatica, non pixel.** Bordo=essere visto, sagoma=famiglia, glifo=luogo, anello=tempo (direzione+colore di stato). I materiali cambiano (Zanara), il significato no — tranne dove rev. 4 lo dichiara esplicitamente (vermiglio→pulsazione).
- **P2 — Prima vedere, poi costruire.** Fork card su catture vere, ruling Director, baseline congelata (v35).
- **P3 — Generazione agente, ruling Director.** L'agente scrive prompt, genera (quota permettendo), compone, misura; il Director vede e decide.
- **P4 — Leggibilità misurata + accessibilità.** Sagoma distinta a 32px in grigio; nessun canale informativo affidato al solo rosso/verde (urgente = pulsazione; lavoro vs quest = forma+icona, colore solo rinforzo).
- **P5 — Ogni cosa al suo posto.** POI = opportunità puntuali in un Luogo; Luogo = nodo territoriale autoriale; Evento = obiettivo strategico a scadenza (componente dedicato); Regione = partizione geografica ridisegnata. Nessuno si improvvisa nell'altro.
- **P6 — Headless/background** (regola 16).

## 2. Decisioni aperte

| ID | Decisione | Proposta | Quando |
|---|---|---|---|
| **D-1** | Superficie dev/prova | Lab `/lab/poi-luogo` su `PixiWorldMap` + anchors | battesimo |
| **D-4** | Preset POI definitivo | Direzione «cartografia incisa» (preferita) vs varianti post-dibattito | gate F1 |
| **D-9** (nuova) | Quanti tipi visivi | 3 (quest/event/job, sagome proprie+punte proprie) — rivisita OPEN-026 | dibattito/battesimo |
| **D-10** (nuova) | Colore famiglia | Ammesso come **rinforzo** (blu/verde scuri); famiglia resta su sagoma+punte+icona | battesimo |
| **D-11** (nuova) | Secondo canale urgenza | Pulsazione luminosa (ruling già dato: niente vermiglio, niente badge) — confermare che basta | battesimo |
| **D-12** (nuova) | Confine Eventi | Eventi = lista/timeline dedicata, **mai** marker mappa; nome/superficie del componente | dibattito |
| **D-13** (nuova) | Luogo autoriale | Luogo = regione o nodo co-locato scritto nel manifest; ogni POI ha `placeId` obbligatorio | dibattito |
| **D-14** (nuova) | Ridisegno regioni | Feedback territoriale in lingua Zanara (non verde piatto); definizioni regioni ripensate | dibattito/gate F6 |
| **D-5/6/7** | Scheda hover, ventaglio, Luogo chiuso | Restano valide le scelte del mattino (scheda bassa, due anelli interno=urgenza) | gate F2 |
| **D-2/3** | Fixture villaggio, clic job | Invariati | piano |

## 3. Fasi

### F0 — Fondamenta
- ✅ **T0.1 fatto** (matrice catture + baseline Sigillo; vedi §0).
- T0.2 `orderPlaceActivities(activities, views)` → `{ inner, outer }` (interno = urgenti: expiring+done; ordine stabile; capienza da config) + test permanente `placeOrdering.test.ts`.
- T0.3 Schema `placesConfig.ts` (Zod, deepFreeze): `id`, punto/regione nel mondo (`placeId` ↔ regione), i18n, immagine, elenco attività; `poiConfig` con `placeId` obbligatorio; niente campi soglia/cluster emergenti.
- T0.4 (nuovo) Inventario Eventi: fonti esistenti (`seaWonders`, manifest, `ReminderComponent*`, feed decisioni) e modello dati minimo `{ id, kind: positive|negative, deadlineTurn, placeId?, titleKey, bodyKey }`.

### F1 — POI Zanara (visual fork)
- ✅ **T1.1 fatto (iterazione 1–2):** 3 direzioni generate+bocciate; mockup Director come reference; ipotesi bordo scuro validata su compositi.
- T1.2b Varianti «cartografia incisa» per le **3 sagome** (spedizione, lavoro, evento — differenza in punte/gioielli+glifo, D-9): composite su catture F0 a 32/44/55/69, colore+grigio+deuteranopia; stati anello nuovi (CW famiglia / CCW arancione / pulsazione) disegnati; `poi-terrain-gate` su ogni opzione.
- **Gate F1 (D-4, D-9, D-10, D-11):** ruling + baseline congelata (sha256).
- ~~T1.3 misura soglia vicinanza~~ **eliminata (rev. 4).**

### F2 — Luogo autoriale (fork)
- T2.1 Scheda hover bassa (come da decisioni mattina); T2.2 ventaglio due anelli (interno = urgenti secondo la nuova grammatica); T2.3 Luogo chiuso (dipinto o sigillo-luogo); T2.4 card lab con hover+clic su Luogo-villaggio fixture.
- **Gate F2 (D-5, D-6, D-7):** ruling + baseline.

### F3 — Componenti (opzioni scelte)
- T3.1 POI Zanara: preset additivo del Sigillo (SVG — halo, punte, pulsazione, stati nuovi), `/gameOld` e lab invariati; stato da `mapQuestPoiView`; nessuna modifica alle INV di CTR-game-008.
- T3.2 `PlaceHoverCard` + `MapPlace` nel lab (Luogo autoriale, da `placesConfig`).
- T3.3 Test: `poiSigillo.test.tsx` esteso (matrice stato×famiglia×tipo, 3 sagome; pulsazione asserita via attributo/classe, non colore; anello a 0 = zero pixel; hit-area ≥32px) + `placeOrdering.test.ts` + `mapPlace.test.tsx` (DOM-over-Pixi: clic vs pan).

### F4 — Chiusura
- T4.1 confronto affiancato pre-registrato (viewport/zoom/bioma/hash/regioni; `NOT_COMPARABLE` legittimo); T4.2 `verify:bundle`; T4.3 occhio Director + dichiarazione del non-visto.

### F5 — Eventi strategici (componente dedicato — D-12)
- T5.1 Fork superficie: lista verticale in chrome Zanara vs strip orizzontale tipo speed-controls vs drawer dedicato; voci ordinate per `deadlineTurn`, segno positivo/negativo leggibile senza colore-solo (icona+glifo).
- T5.2 Preset e integrazione HUD (post-ruling): vive nella HUD firmata, mai come marker mappa; può linkare un Luogo (se l'evento ha `placeId`).
- **Gate F5 (D-12):** ruling sul fork + baseline.

### F6 — Regioni (ridisegno — D-14)
- T6.1 Fork feedback territoriale: contorno inciso/glow + tinta smalto tenue vs pattern filigrana su bordi; **mai** verde piatto; grigio-safe.
- T6.2 Revisione definizioni: regioni semantiche dal world design (non casuali), con `regionId` usato da `placesConfig` (D-13); minimo una re-bucketing documentata.
- **Gate F6 (D-14):** ruling + baseline.

## 4. Contratto di chiusura

| OB | Tipo | Obbligazione | Comando / artefatto |
|---|---|---|---|
| OB-1 | state, blocking | `orderPlaceActivities` + test permanente (interno=urgenti secondo nuova grammatica) | `npm run test -- tests/unit/idleVillage/placeOrdering.test.ts` |
| OB-2 | state, blocking | Luogo lab: hover scheda, clic ventaglio, chiusura; clic-vs-pan DOM/Pixi | `mapPlace.test.tsx` (+ e2e se serve) |
| OB-3 | state, blocking | Preset POI: matrice stato×famiglia×tipo (3 sagome, 7 stati, `veiled`); pulsazione = attributo non colore (nessun rosso/vermiglio risolto, test negativo); anello 0 = zero pixel; hit-area ≥32px | `npm run test -- tests/unit/idleVillage/poiSigillo.test.tsx` |
| OB-4 | state, blocking | Surface `game-interaction` | `npm run test -- tests/unit/idleVillage` |
| OB-5 | state, blocking | `placesConfig`/`eventsConfig` Zod-validati, `placeId` obbligatorio su ogni POI, fixture villaggio etichettata | schema test |
| OB-6 | state, blocking | Build e tipi | `npm run build:check`, `npx tsc --noEmit` |
| OB-7 | state, blocking | Leggibilità: 3 sagome distinte a 32px in grigio su ≥2 biomi; punte/icone distinguibili; deuteranopia simulata documentata; atmosferici/notte NOT VERIFIED o cattura | `python3 scripts/poi-terrain-gate.py` |
| OB-8 | visual, blocking | Same-viewport vs baseline pre-registrato (per preset F1 e fork F2/F5/F6) | report affiancato |
| OB-9 | human-eye | Occhio Director sul lab; `/game` = NOT VERIFIED by design | screenshot + nota |
| ~~OB-10~~ | — | **eliminata (rev. 4)** — nessuna soglia di vicinanza: Luoghi autoriali | — |
| OB-11 (nuovo) | state, blocking | Eventi: modello dati + ordinamento per scadenza testato; componente **assente** dalla mappa (nessun marker evento nei test) | `npm run test -- tests/unit/idleVillage/eventTimeline.test.ts` |
| OB-12 (nuovo) | state, blocking | Regioni: `regionId` ↔ `placeId` coerenti nel config; feedback territoriale non "verde piatto" asserito a token (niente fill primario verde sull'overlay) | test + gate visivo F6 |

Visual fork: D-4 (F1), D-5/6/7 (F2), F5, F6 — ognuna con card su superficie vera.

## 5. Rischi

- **Collisione PLAN-116** (file HUD in altra sessione): F3 non li tocca.
- **Quota generazione:** Gemini out-of-quota in giornata; fallback ChatGPT/Grok o attesa — le sagome possono anche essere **disegnate in SVG** dal componente (il Sigillo è già SVG).
- **Scope esploso:** rev. 4 unifica 4 lavori (POI/Luoghi/Eventi/Regioni); il rischio è il blocco seriale — i gate sono pensati per chiudere F1 prima di F2, e F5/F6 possono slittare in piani successori se il dibattito lo conferma.
- **3 tipi vs 2 famiglie:** D-9 rivisita OPEN-026 — se il dibattito/battesimo torna a 2, le sagome evento restano prodotte ma inutilizzate (costo accettato).
- **Icone come famiglia:** se glifo=famiglia (mockup), la lettura "icona=luogo" si perde — trade-off registrato per il dibattito (opzione: glifo = famiglia + dettaglio luogo nel sigillo? da discutere).
- **Stacking HUD non verificato nel lab** (T-03) — resta.
- **Fixture scambiate per vere** — resta (config etichettata).

## 6. Successor constraints (rev. 4)

- **Aggregazione emergente eliminata** — non ereditare D-8/OB-10; i Luoghi sono autoriali. Se un giorno tornasse la prossimità, è un piano nuovo.
- **Eventi:** il componente è specificato qui ma il design di dettaglio (voci, glifi, click→dettaglio) è del fork F5.
- **Regioni:** la rideterminazione geografica è F6; `regions.json` attuale = baseline non canonica.
- **Interazione DOM-over-Pixi** (clic vs pan, hit-area): da testare in F3 lab prima di qualsiasi montaggio `/game` (piano futuro).
