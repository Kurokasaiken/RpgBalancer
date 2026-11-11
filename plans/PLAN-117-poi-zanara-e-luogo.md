# PLAN-117 — POI nel linguaggio Zanara + componente Luogo (hover alabastro, clic ventaglio)

**Stato:** bozza rev. 3 (2026-11-11) — rev. 2 + ruling D-8 del Director + revisione post-dibattito multi-AI web (run `20261111-plan117-poi-zanara`, converged 3/3 su r003), in attesa di battesimo.

> **Rev. 3 — cosa cambia (esito dibattito multi-AI web, ACCEPT 3/3: chatgpt, claude, deepseek):**
> - **Igiene del contratto:** rev. 2 lasciava nel testo riferimenti a lavoro sospeso (fork F2, «baseline F1/F2», scheda/ventaglio in T4.1). Ora il contratto cita solo ciò che questa rev. consegna.
> - **T1.3 sulla superficie viva:** la soglia si misura nel lab su anchor DOM reali (`PixiWorldMap`), non solo su ritagli composti; sull'asset congelato dal gate F1; la soglia = il massimo tra vincoli indipendenti (sagome, halo, hit-area) — l'interferenza POI↔scheda resta osservazione contestuale, non entra nella soglia (WITNESS-01).
> - **OB-10 non più hollow:** accettazione geometrica (nessun overlap hit-area alla soglia, sopra e sotto), unità e riferimento documentati, numero **provisional** finché il piano successore decide isteresi e clustering.
> - **Copertura stati:** OB-3 esteso a matrice stato×famiglia (7 stati, `veiled` incluso); vermiglio sul token risolto con test negativo; halo a 0 = zero pixel disegnati.
> - **Nota dibattito su D-8:** il bivio *cluster authored* (attività co-localizzate su un punto — il caso-motore villaggio, deterministico, senza soglia) vs *aggregazione emergente* (l'unica che usa la soglia) è stato sollevato dal dibattito; il ruling chiude la semantica «distanza nel mondo» per la regola emergente. I 2 POI live distano ~540 unità mondo: a densità attuale la regola scatta raramente — registrato come evidenza per il piano Luogo, non riapre la decisione.
> - **§5:** rischi nuovi — collo di bottiglia generazione + uscita «nessuna opzione vince», stacking HUD firmata non verificato nel lab (T-03), regola emergente possibile dead code.

> **Rev. 2 — scope ridotto al POI (Director 2026-11-11, verbatim):** *«lavoriamo sul POI da solo, se ce ne sn tanti vicini deve divnetare automaticamente un luogo e mostrare + POI in questo nuovo modo»*.
> - **In questo piano:** F0 (solo T0.1), F1, F3 (solo T3.1 + test del POI), F4 sul POI.
> - **Sospesi → piano successivo dopo il ruling F1:** T0.2, T0.3, tutta F2, T3.2–T3.4 (scheda in hover, ventaglio, `MapPlace`), D-2, D-3, D-5, D-6, D-7.
> - **Regola nuova (vincolo, non si progetta qui):** POI troppo vicini diventano **automaticamente un Luogo** e si mostrano nel modo nuovo (hover scheda / clic ventaglio). Un Luogo quindi non è solo scritto a mano (villaggio): può nascere dalla vicinanza. In F1 si misura **la distanza a cui due POI cominciano a disturbarsi**: è la soglia che farà scattare il Luogo (D-8).
> - Contratto di chiusura rev. 2: OB-3, OB-4, OB-6, OB-7, OB-8, OB-9 + **OB-10** (soglia di vicinanza misurata e scritta in config). OB-1, OB-2, OB-5 passano al piano del Luogo.
**Parent:** R-324 (questa richiesta), OPEN-025 (Luogo), OPEN-026 (famiglie), R-323/PLAN-113 (HUD Zanara su `/game`), PLAN-116 (cassetto, in corso in un'altra sessione).
**Origine (Director, 2026-11-11, verbatim):**
- *«Un componente che ti dica tutte le attività che ci sn su un determinati punto che ha + attività correlate, che io inizialmente avevo chiamato Luoghi […] Potremmo usare come base il componente verde e alabastro come "contenitore" […] ma quella forma nn è adeguata x il nostro scopo.»*
- *«direi tipo: mouse over il componente di alabastro di cui ti parlavo con testo e immagine. onClick ventaglio»* → ventaglio su **due anelli**, interno = **urgenza**; clic su un sigillo = dettaglio specifico (oggi il cassetto del planner per le quest).
- *«e in tutto ciò: nn facciamo dei nuovi POI che siano adeguati alla nuova HUD e UI?»* → sì: il ventaglio è fatto di POI, quindi i POI nuovi vengono **prima** del Luogo.

**Decisioni già prese (non si riaprono qui):** `context/DECISION_LOG.md` 2026-11-11 (due famiglie: spedizione e lavoro; hover = scheda alabastro, clic = ventaglio, due anelli, interno = urgenza). Grammatica funzionale del Sigillo (`src/docs/docs/idle_village/poi_family_spec.md` § Sigillo): **bordo = essere visto, sagoma = famiglia, glifo = luogo, halo = tempo**; stati available / expiring / working / done / expired / veiled; vermiglio solo per l'urgenza; niente etichetta col nome sopra il POI (R-177, 15/10).

**Cosa NON è:**
- non cambia la vista Village né costruisce la sua vista ibrida veloce (cosa c'è, blueprint): è **successivo** (OPEN-025, correzione Director 2026-11-11);
- non disegna il dettaglio dei job: il clic su un sigillo-lavoro non apre ancora nulla di nuovo (D-3);
- non riattiva la famiglia `job` nel motore né collega edifici e attività: il contenuto del Luogo-villaggio è **fixture etichettata** finché quel legame non esiste (D-2);
- non tocca i file che PLAN-116 sta modificando (`SlotV12Renderer.tsx`, `ResidentSlotRack.tsx`, `C1Medallion.tsx`, cassetto): li legge soltanto;
- niente telefono (< 768 px), niente nuove regole di gioco (tempi, ricompense, rischio).

## 0. Fatti verificati (2026-11-11)

- **`/game` oggi non ha POI.** `src/pages/game-mappa2.tsx` monta `PixiWorldMap` + HUD firmato, nessun marker; il flusso POI→quest esiste solo su `/gameOld` (`MapQuestPoi` → `PoiMatericV3_5 sigillo`). PLAN-116 D8 lo dichiara già fuori scope. `PixiWorldMap` ha però la prop `anchors` (DOM fissato a punti del mondo, dimensione schermo costante) e `worldLayer`: il punto di aggancio esiste.
- **Il Sigillo attuale è nel linguaggio vecchio** (lacca + bronzo del Roster V2, bordo avorio): non appartiene alla famiglia Zanara (smalto smeraldo, oro inciso, gemme sfaccettate — ref canonico `/game` chrome, ruling 2026-11-06). Lo stato viene solo da `mapQuestPoiView` (T-07), testato in `tests/unit/idleVillage/poiSigillo.test.tsx` e `mapQuestPoi.test.ts` (contratto CTR-game-008).
- **Contenitore alabastro:** `src/ui/idleVillage/hudReal/HudRealPanel.tsx` + `panel/frame.webp` (340×512 a 1440). Catture 2026-11-11 in scratch (`panel.png`, `ledger.png`): forma fatta per **una** attività (finestra ad arco ~1:2,6, sigillo esito, placca «INIZIA»); usata come lista (`HudRealLedgerPanel`) lascia finestra vuota, placca senza testo, 2 righe visibili su 4. La cornice dipinta non si stira (DECISION_LOG «mockup-signed-is-not-an-asset»; P2 di PLAN-116): una forma nuova = cornice ricomposta a pezzi (tecnica `column/frame_v2.py` di PLAN-116) o asset nuovo generato dal Director.
- **Vecchio Luoghi:** `TheaterView` (immagine «teatro» + slot affiancati) è commentato in `src/ui/idleVillage/map/MapPage.tsx`: non è visibile dal vivo.
- **Dati:** nessun concetto di Luogo nel codice; catalogo edifici `villageBuildingsConfig.ts` (16 edifici, mock) non collegato alle attività; quest reali su `/gameOld`: `poi-goblin` (ripetibile), `poi-rovine`.
- **Desiderata:** ultima FROZEN v37 (astrolabio): nessuna slice coperta → niente check di disposizione P8. Valgono v35 (visual fork) e v36 (contratti vivi).
- **Superfici e trappole:** HUD su mappa e `PixiWorldMap` → T-01; halo/archi → T-02; popover/hover su `/game` → T-03 (`SkinScope` + `data-hud-controls`); prove visive → T-04; stato derivato → T-07; hit-area → T-21; prompt per immagini → T-16/T-25..T-28. Surface-map `game-interaction` → `npm run test -- tests/unit/idleVillage`.

## 1. Principi

- **P1 — Grammatica invariata, materiali nuovi.** I POI nuovi cambiano aspetto, non significato: bordo/sagoma/glifo/halo e i 7 stati restano quelli del Sigillo; lo stato resta letto da una sola view-model (T-07).
- **P2 — Prima vedere, poi costruire.** Ogni decisione estetica passa da una visual-fork card (v35) con anteprime **sulla mappa vera** (catture headless di `/game` a 1440×900 e 1280×800, almeno 4 biomi + mare), poi ruling del Director.
- **P3 — Asset puliti, niente stiramenti** (come PLAN-116 P2). Gli asset dipinti li genera il Director dai prompt preparati qui (ruling 2026-10-27); l'agente prepara prompt, ritagli e misure.
- **P4 — Leggibilità misurata:** POI distinguibili per sagoma in scala di grigi a 32 px su ogni bioma (`poi-terrain-gate` esistente, bordo ≥ 3:1); testi della scheda ≥ 12,8 px CSS a 1280×800.
- **P5 — Headless/background** per ogni cattura e prova (regola 16); l'occhio del Director è un passo manuale.

## 2. Decisioni aperte (da chiudere al battesimo o al gate indicato)

| ID | Decisione | Proposta del planner | Quando |
|---|---|---|---|
| **D-1** | Superficie di sviluppo e prova | Lab `/lab/poi-luogo` sopra la mappa2 vera (`PixiWorldMap` + `anchors`), `spike: promote`; il montaggio su `/game` arriva con il flusso POI→quest (PLAN-116 D8), non qui | battesimo |
| **D-2** | Contenuto del Luogo-villaggio | **sospesa → piano Luogo** (fixture etichettata 5–9 attività, proposta registrata) | piano Luogo |
| **D-3** | Clic su un sigillo-lavoro | **sospesa → piano Luogo** (feedback «presto» non bloccante, proposta registrata) | piano Luogo |
| **D-4** | Aspetto del POI nuovo | Fork F1 | gate F1 |
| **D-5** | Come si presenta un Luogo chiuso | **sospesa → piano Luogo** (fork: luogo dipinto senza marker vs sigillo-luogo con halo urgenza max) | piano Luogo |
| **D-6** | Forma della scheda in hover | **sospesa → piano Luogo** (fork: più bassa, senza placca d'azione e senza sigillo esito) | piano Luogo |
| **D-7** | Forma del ventaglio | **sospesa → piano Luogo** (fork: cerchio pieno vs arco, raggi, collisioni, chiusura) | piano Luogo |
| **D-8** | Cosa vuol dire «vicini» per far scattare il Luogo automatico | **Deciso 2026-11-11: distanza nel mondo** (px del manifest mappa2), fissa a ogni zoom. Conseguenza: la soglia va misurata **allo zoom più lontano** (`floorZoom`, T-01), perché è lì che due POI non raggruppati sono più vicini sullo schermo | chiusa |

## 3. Fasi

### F0 — Fondamenta (nessun pixel nuovo)
- T0.1 Catture headless di riferimento di `/game` (1440×900, 1280×800) su 4 biomi + mare, con i ritagli dove cadranno POI e Luogo-villaggio; e del Sigillo attuale da `/gameOld` per confronto.
  - ✅ **Fatto 2026-11-11** — `scripts/capture-poi-map-matrix.mjs` → `test-results/poi-zanara-f0/` (86 PNG): 7 zone (villaggio + foresta, neve, canyon, vulcano, laguna, mare ovest) × 3 zoom (`zfloor` coverage, `zmin` manifest 0.18, `zmid` 1.0) × full+crop 400×400 alle due viewport; baseline `gameold-sigillo-*.png`. **Misurato per D-8: coverage floor = 0.586 @1440×900, 0.521 @1280×800** (manifest minZoom 0.18; `__worldCamCtl.set`/`__worldCam`, seam CTR-game-005). Nota T1.3: «zoom più lontano» per la misura = coverage floor (il clamp effettivo della camera), non il minZoom manifest — da confermare in lettura di D-8.
- T0.2 Funzione pura `orderPlaceActivities(activities, views)` → `{ inner, outer }`: interno = `expiring` + `done` (le urgenti), esterno = il resto; ordine stabile dentro l'anello; capienza per anello dichiarata in config (non stimata). **Test di regressione permanente** `tests/unit/idleVillage/placeOrdering.test.ts` (R-247).
- T0.3 Schema config `placesConfig.ts` (Zod, `deepFreeze`): `id`, punto nel mondo, `titleKey`/`bodyKey` i18n (en + it-IT, ICU), immagine, elenco attività; Luogo-villaggio da fixture (D-2).

**Gate F0:** test verdi, `tsc --noEmit` verde. Nessuna richiesta al Director.

### F1 — POI nel linguaggio Zanara (visual fork)
- T1.1 Prompt per 2–3 direzioni materialmente diverse (stessa grammatica, materiali diversi: es. medaglione in oro inciso con campo smaltato; sigillo a placca smeraldo con incastonatura di gemma; una terza solo se vince almeno un asse), per le 3 sagome (spedizione = tondo con coda, lavoro = tassello, minaccia = rombo). Il Director genera; l'agente ritaglia, pulisce, misura (`scripts/hud-real/check-palette.py`, oro nelle soglie G2-6).
- T1.2 Card `.mw/runs/<run>/visual-fork-poi-zanara.md`: anteprime composte sulle catture F0 (colore + grigi, 32/44/55/69 px), halo nei 3 modi (scadenza, lavoro, fatto) a 0 / 25 / 100 %, `poi-terrain-gate` per opzione. Assi: gerarchia/densità, token skin, stati, reduced-motion, costo.
- T1.3 Misura della soglia di vicinanza (rev. 3, **sulla superficie viva** — i ritagli composti di T1.2 servono al fork visivo, non alla misura): nel lab `/lab/poi-luogo`, con gli anchor DOM reali di `PixiWorldMap`, **sull'opzione congelata al gate F1** (non per tutte): serie di distanze decrescenti tra i centri (es. 80 → 24 px) a taglia dichiarata, **allo zoom più lontano** (`floorZoom`, T-01) a 1280×800 e 1440×900 — è lì che due POI non raggruppati sono più vicini sullo schermo. Per ogni distanza si registra: contatto sagome, leggibilità halo, overlap hit-area (≥ 32 px, T-21). L'interferenza POI↔scheda alabastro si misura a parte come osservazione contestuale (input per il posizionamento scheda del piano Luogo): **non** entra nella soglia, che è una relazione POI↔POI (WITNESS-01). La soglia candidata = **il massimo** tra i vincoli indipendenti (deve scattare prima che qualunque criterio fallisca); la distanza sullo schermo si converte in **px del mondo** e diventa la soglia del Luogo automatico (D-8, distanza nel mondo), scritta in config a F3 (OB-10).
- **Gate F1 (D-4):** ruling del Director + baseline congelata (sha256).

### F2 — SOSPESA → piano Luogo (D-5, D-6, D-7)

> Contenuto originale conservato sotto come riferimento per il piano successore. Non è lavoro di questa rev.
- T2.1 Scheda in hover: 2 forme basse ricavate dai pezzi di `frame.webp` (o prompt al Director se i pezzi non bastano) — es. orizzontale (immagine larga a sinistra, testo a destra) e verticale bassa (banda immagine sopra, testo sotto); solo titolo, occhiello, testo, immagine e un riassunto delle attività (conteggi per famiglia).
- T2.2 Ventaglio: 2 disposizioni con i POI scelti in F1 — cerchio pieno su due anelli vs arco superiore su due file — e la regola per i POI vicini (abbassati sotto il ventaglio) e la chiusura (clic fuori, Esc, secondo clic sul Luogo).
- T2.3 Luogo chiuso (D-5): 2 opzioni sulle catture.
- T2.4 Card `.mw/runs/<run>/visual-fork-luogo.md` con anteprima interattiva nel lab (D-1) per hover e clic.
- **Gate F2 (D-5, D-6, D-7):** ruling + baseline congelate.

### F3 — Componenti (solo l'opzione scelta)
- T3.1 POI Zanara come preset additivo del marker (il Sigillo attuale resta per `/gameOld` e i lab), stato letto da `mapQuestPoiView`; nessuna modifica alle INV di CTR-game-008 (Mode B-add: nuovo componente con le sue invarianti).
- ~~T3.2 `PlaceHoverCard`…~~ **sospeso → piano Luogo.**
- ~~T3.3 `MapPlace` nel lab…~~ **sospeso → piano Luogo.**
- T3.4 Test (rev. 3): `poiProximity.test.ts` (OB-10) + estensione di `poiSigillo.test.tsx` al preset nuovo con matrice **stato×famiglia** completa (7 stati, `veiled` incluso): vermiglio asserito sul **token risolto** con test negativo (nessuno stato non-urgente risolve in tonalità vermiglia); halo a 0 = zero pixel disegnati (asserzione automatizzata, T-02); hit-area ≥ 32 px (T-21).

### F4 — Chiusura
- T4.1 Confronto affiancato stessa viewport baseline vs lab (1440×900, 1280×800, + cattura a `floorZoom`) **per il solo POI**; criteri di confronto **pre-registrati**: viewport, zoom, bioma, hash asset, regioni di confronto; regressioni strutturali separate dal giudizio estetico (che resta del Director); `NOT_COMPARABLE` è un esito legittimo.
- T4.2 `verification.json` → `verify:bundle` → `bundle.json`; voce in `RICHIESTE.md`.
- T4.3 Occhio del Director sul lab (manuale). Dichiarare cosa non è stato visto dal vivo (es. snap urgente, pulsazione, montaggio su `/game`).

## 4. Contratto di chiusura

| OB | Tipo | Obbligazione | Comando / artefatto |
|---|---|---|---|
| OB-1 | — | **sospesa → piano Luogo** (ordinamento anelli) | — |
| OB-2 | — | **sospesa → piano Luogo** (hover/clic/chiusura) | — |
| OB-3 | state, blocking | Grammatica invariata sul preset nuovo: matrice **stato×famiglia** completa (7 stati, `veiled` incluso); vermiglio solo urgenza asserito sul token risolto con test negativo; halo a 0 = zero pixel | `npm run test -- tests/unit/idleVillage/poiSigillo.test.tsx` (esteso al preset) |
| OB-4 | state, blocking | Surface `game-interaction` | `npm run test -- tests/unit/idleVillage` |
| OB-5 | — | **sospesa → piano Luogo** (e2e Luogo) | — |
| OB-6 | state, blocking | Build e tipi | `npm run build:check`, `npx tsc --noEmit` |
| OB-7 | state, blocking | Leggibilità: per-marker **e** su cluster alla soglia T1.3 (≥2 biomi); overlay atmosferici/notte dichiarati NOT VERIFIED o una cattura aggiunta | `python3 scripts/poi-terrain-gate.py` sul preset nuovo (bordo ≥ 3:1, sagome distinte in grigio a 32 px) |
| OB-8 | visual, blocking | Same-viewport vs baseline **F1** (criteri pre-registrati: viewport/zoom/bioma/hash asset/regioni; `NOT_COMPARABLE` legittimo) | report affiancato |
| OB-9 | human-eye | Occhio del Director sul lab; **montaggio su `/game` = NOT VERIFIED by design (D-1)** — il lab prova il preset sulla superficie mappa reale, non l'integrazione | screenshot + nota |
| OB-10 | state, blocking | **Contratto produttore→consumatore** (rev. 3): (a) distinzione authored/emergente registrata in config; (b) soglia in **px del mondo** (D-8), misurata su anchor live a `floorZoom` (T1.3), copre **solo il caso emergente**; (c) accettazione geometrica — alla soglia registrata nessuna coppia di hit-area (≥32 px) si sovrappone, verificato sopra e sotto soglia sul preset reale; (d) campi documentati `unit`/`reference` (hitArea\|edge\|center) e comportamento al bordo; (e) numero **provisional, non frozen**: isteresi, clustering mode, famiglie/stati misti, `veiled`, cluster vuoto/singolo/oversize = **prerequisiti del piano successore** elencati in «Successor constraints», non decisi né disegnati qui | `npm run test -- tests/unit/idleVillage/poiProximity.test.ts` |

Visual fork: **obbligatorio solo per D-4** (card F1); D-5/D-6/D-7 sospesi al piano Luogo.

## 5. Rischi

- **Collisione con PLAN-116** (stessa area HUD, file slot/medaglione non committati in un'altra sessione): F3 non tocca quei file; se il preset POI vuole riusare l'anello C1 si legge l'asset, non si modifica il componente.
- **Asset:** se i pezzi di `frame.webp` non bastano per la scheda bassa serve un giro di generazione del Director (tempo non stimabile qui).
- **Dati finti scambiati per veri:** la fixture del villaggio è etichettata in config e nel lab (come `poiDemo`, R-131/R-200).
- **Collo di bottiglia generazione (rev. 3):** la catena F1 è seriale su una risorsa scarsa (prompt → generazione Director → misura → F3). Mitigazioni: il harness di misura T1.3 e i test OB-10 si costruiscono su sagome placeholder mentre le immagini non ci sono; F1 si ferma a 2 direzioni salvo vittoria di un asse; esito «nessuna opzione vince» esplicito (prompt rivisti, non baseline forzata).
- **Stacking HUD firmata non verificato (rev. 3):** il lab monta `PixiWorldMap` + anchor ma non il chrome HUD completo (`SkinScope`, `data-hud-controls`, T-03): «funziona nel lab» ≠ «funziona sotto la HUD firmata». La prova d'integrazione reale resta nel piano del montaggio su `/game`.
- **La regola emergente potrebbe essere dead code (rev. 3):** a densità attuale la soglia emergente scatta raramente (POI live a ~540 unità mondo); se il piano Luogo adottasse cluster authored, la soglia resta fallback documentato — dichiarato apertamente invece di spenderci una fork cycle in silenzio.

## 6. Successor constraints (rev. 3 — registrati, non disegnati)

Prerequisiti che il piano Luogo deve risolvere **prima** di implementare l'aggregazione. Elencati come vincoli aperti ereditati dal dibattito multi-AI — questo piano li registra, non li decide:

- **Bivio authored vs emergente:** il piano Luogo decide se un Luogo nasce anche da cluster authored (attività configurate sullo stesso punto — deterministico, copre il caso-motore villaggio) o solo dalla soglia emergente di OB-10. Evidenza: a densità attuale la regola emergente scatta raramente (POI live a ~540 unità mondo).
- **Isteresi:** soglia di ingresso vs uscita (evitare flicker quando la distanza oscilla intorno al valore — oggi la distanza nel mondo è fissa, ma stato/posizione dei POI cambiano).
- **Clustering:** transitivity e membership deterministiche (A~B, B~C, non A~C → componente connessa vs diametro limitato); cluster vuoto, singleton, oversize.
- **Famiglie/stati misti:** cosa entra in un Luogo automatico (spedizione+lavoro insieme? stati diversi?); eleggibilità di `veiled` (per grammatica nasconde informazione: conta per la vicinanza? rivela la sua esistenza nel Luogo?).
- **Semantica del consumatore:** come il Luogo legge la soglia — `unit`/`reference`/bordo dal contratto OB-10, senza reinterpretarla.
- **Interazione DOM-over-Pixi:** click-vs-pan su anchor, hit-area a tutti gli zoom, pass-through wheel/pinch — superficie dove i marker muoiono (T-21/T-03), oggi non provata da nessuna parte.
