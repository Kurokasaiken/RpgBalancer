# PLAN-117 — Layer opportunità della mappa: POI Zanara, Luoghi fissi, Eventi strategici, Regioni

**Stato:** **baptized 2026-11-12** (approvazione Director «approvo») — rev. 5, post-dibattito multi-AI web run `20261111-plan117-rev4` (**converged**, acceptance 4/4 su artifact-r002; grok escluso per output degenere). Decisioni di battesimo prese come da colonna Proposta (D-1, D-9, D-10, D-11, D-12, D-13, D-15); restano ai gate di fase D-4 (F1) e D-5/6/7 (F2). **Emendamento F2 proposto 2026-11-12** in appendice A: il prototipo F2 esiste, ma il gate visuale e di interazione non e' passato.

> **Rev. 5 — emendamenti dal dibattito (9 claim, tutti AGREE o REFINE convergenti):**
> - **P1 riscritta a canali disgiunti** (C1): bordo=visibilità, sagoma+punte=famiglia, glifo=attività puntuale, anello=tempo. Il luogo NON è codificato sul marker: lo danno posizione e scheda hover del Luogo.
> - **Tipi POI = 3, ma l'«evento» è locale** (C2): `MapPOIType: quest|job|event` dove `event` = evento puntuale locale con scadenza — **distinto** da `StrategicEventKind` (obiettivi medio/lungo termine, mai marker). Se il Director preferisce 2 tipi, la terza forma diventa solo glifo della timeline Eventi (costo accettato, ruling al battesimo).
> - **Urgenza = pulsazione + equivalente statico** (C3): la pulsazione ha sempre un corrispettivo statico non-colore (halo/anello ispessito o intaglio), attivo anche con `prefers-reduced-motion` e visibile in screenshot.
> - **Anello: verso semantico + geometria ridondante** (C4, corretto in r002): la semantica del ruling Director resta — **CW = in corso** (colore famiglia), **CCW = countdown** (arancione). La geometria è il canale ridondante che la rende leggibile a 32px senza colore né percezione del verso: in corso = arco pieno a capo tondo; countdown = arco a tacche con gioiello terminale. I due canali codificano la stessa informazione.
> - **Piano unico, chiusura a due livelli** (C5): PLAN-117 core = F0–F4 (POI + Luogo autoriale) con OB-1..OB-9; F5 (Eventi) e F6 (Regioni) hanno OB propri (OB-11/OB-12) e possono spin-off in piani successori senza bloccare il core. Il documento resta unificato (architettura del layer intero), il contratto no.
> - **placeId opaco e stabile, regionId provisional** (C6): `placesConfig` usa `placeId` stabile; il legame `regionId` è campo provisional marcato, consolidato e reso blocking solo al gate F6 — il re-bucketing di regions.json non invalida config/test del core.
> - **OB irrobustite** (C7): OB-3 spezzata in palette/pulse/shape; OB-5 = integrità referenziale; OB-8 con cap su NOT_COMPARABLE; OB-9 = checklist 3 domande fissata; OB-12 = campionamento pixel overlay.
> - **Modello canonico Region 1:N Place 1:N POI** (C8): `Luogo ≡ Regione` solo se scelta esplicita nel manifest, mai implicita dello schema.
> - **F5 standalone nel lab** (C9): il componente Eventi si consegna isolato con contratto props + fixture; l'aggancio alla HUD firmata è task successore con dipendenza esplicita da PLAN-116.

> **Rev. 4 (storico):** emendamento strutturale del Director — Luoghi autoriali (mai emergenti), Eventi strategici fuori mappa, anello CW/CCW + arancione, vermiglio scartato, famiglie differenziate per punte, regioni da ridisegnare. Rev. 5 li conserva tutti, correggendo le contraddizioni interne trovate dal dibattito.
>
> **Rev. 3 (storico):** igiene contratto post-dibattito run 1 (converged 3/3). Punti tecnici conservati dove applicabili (misure su superficie viva, accettazione geometrica, copertura stati); le parti sulla soglia di vicinanza sono morte con rev. 4.
>
> **Rev. 2 (storico):** scope ridotto al POI.

**Parent:** R-324, OPEN-025 (Luogo), OPEN-026 (famiglie — rivisitata: 3 tipi visivi con evento-locale), R-323/PLAN-113 (HUD Zanara), PLAN-116 (cassetto — file non toccabili).

**Origine (Director, verbatim):** invariata da rev. 4 — Luogo autoriale; eventi strategici come obiettivi medio/lungo termine in lista ordinata per scadenza; anello orario=lavoro / antiorario=countdown arancione; urgenza=pulsazione senza cambio colore; punte diverse ma simili; regioni «tipo risk» brutte e definite casualmente, da ripensare.

**Decisioni già prese (non si riaprono):** `context/DECISION_LOG.md` 2026-11-11 — eccetto i punti rivisitati: famiglia «minaccia/evento» (diventata evento-locale come terzo tipo, D-9), «vermiglio = urgenza» (sostituita da pulsazione + fallback statico, D-11), aggregazione emergente (bocciata). Restano: hover = scheda alabastro, clic = ventaglio a due anelli (interno = urgenza), niente nome sopra il POI. **Veto modali GX-0042 esteso al core (r002):** scheda hover = elemento ancorato non modale, ventaglio non bloccante, nessun dettaglio in popup — il dettaglio apre in sezione dedicata.

**Cosa NON è:**
- non monta POI su `/game` (flusso POI→quest = PLAN-116 D8); lavoro nel lab `/lab/poi-luogo` (D-1) e su compositi;
- non disegna il dettaglio dei job (D-3);
- non tocca file PLAN-116 (slot, ghiera, medaglione C1, cassetto, HUD firmata): F5 consegna il componente Eventi standalone nel lab, l'integrazione HUD è task successore;
- niente telefono (< 768 px), niente nuove regole di gioco.

## 0. Fatti verificati (2026-11-11)

- **`/game` non ha POI**; il flusso POI→quest esiste solo su `/gameOld` (`MapQuestPoi` → `PoiMatericV3_5`, Sigillo SVG). `PixiWorldMap` espone `anchors` + seam dev `__worldCamCtl`/`__worldCam`.
- **T0.1 fatto:** `scripts/capture-poi-map-matrix.mjs` → `test-results/poi-zanara-f0/` (86 PNG, 7 zone × 2 viewport × 3 zoom + baseline Sigillo). Coverage floor: 0.586 @1440×900, 0.521 @1280×800.
- **Iterazione visiva fatta:** 3 direzioni bocciate (`gen/A,B,C`); mockup Director composto (`card-mock/`); stati+deuteranopia simulati (`card-states/`). Evidenze: contorno scuro necessario; cornice a punte legge a 32px; famiglia per solo colore crolla a 44px e in grigio; micro-architettura si confonde con edifici; verde/vermiglio confondibili in deuteranopia.
- **Regioni attuali:** `public/assets/world/mappa2/base/regions.json` (20 regioni) con overlay hover «Risk-style» piatto — baseline non canonica, da ripensare (F6).
- **Reminder obsoleto:** `ReminderComponentV2/V3` + feed decisioni — riferimento per il componente Eventi, non riuso diretto.
- **Eventi nel mondo:** `seaWonders.ts` e `villageZoneManifest` contengono semi di eventi; nessuna superficie dedicata oggi.

## 1. Principi

- **P1 — Grammatica a canali disgiunti (riscritta rev. 5).**
  - **Bordo** = essere visto (contorno scuro, obbligatorio su ogni terreno).
  - **Sagoma + punte** = famiglia/tipo POI (`quest` / `job` / `event` locale).
  - **Glifo** = attività puntuale (cosa si fa lì: arco, martello, …) — **non** la famiglia e **non** il luogo.
  - **Luogo** = NON codificato sul marker: lo danno la posizione sulla mappa e la scheda hover del Luogo.
  - **Anello** = tempo: **verso** (CW in corso / CCW countdown, ruling Director) **+ geometria ridondante** (pieno vs tacche, vedi P4). I materiali cambiano (Zanara), il significato no.
- **P2 — Prima vedere, poi costruire.** Fork card su catture vere, ruling Director, baseline congelata.
- **P3 — Generazione agente, ruling Director.** L'agente scrive prompt, genera, compone, misura; il Director decide.
- **P4 — Leggibilità misurata + accessibilità.** Famiglia distinguibile a 32px in grigio **senza** glifo né colore (test: due POI di tipo diverso con stesso glifo restano distinguibili). Urgenza = pulsazione **+ stato statico equivalente** non-colore. Anello: **CW = in corso** = arco pieno capo tondo (colore famiglia); **CCW = countdown** = arco a tacche + gioiello terminale (arancione); verso e geometria codificano la stessa informazione (ridondanza), così la lettura regge a 32px senza colore né percezione del verso; anello a 0 = assente.
- **P5 — Ogni cosa al suo posto.** Modello canonico: `Region 1:N Place 1:N POI`. POI = opportunità puntuali in un Luogo; Place = nodo autoriale dentro una Region; Evento strategico = obiettivo a scadenza in timeline dedicata (mai marker); `Luogo ≡ Regione` solo se dichiarato nel manifest.
- **P6 — Headless/background** (regola 16).

## 2. Decisioni aperte

| ID | Decisione | Proposta post-dibattito | Quando |
|---|---|---|---|
| **D-1** ✅ | Superficie dev/prova | Lab `/lab/poi-luogo` su `PixiWorldMap` + anchors | **presa 2026-11-12** |
| **D-4** | Preset POI definitivo | «Cartografia incisa» (preferita) vs varianti | gate F1 |
| **D-9** ✅ | Tipi visivi | **3**: quest / job / event-locale (sagome+punte proprie); se il Director torna a 2, la terza forma → glifo timeline | **presa 2026-11-12** |
| **D-10** ✅ | Colore famiglia | Rinforzo (blu/verde scuri); identità su sagoma+punte | **presa 2026-11-12** |
| **D-11** ✅ | Canale urgenza | Pulsazione **+ equivalente statico** (ruling niente vermiglio confermato) | **presa 2026-11-12** |
| **D-12** ✅ | Confine Eventi | `StrategicEventKind` = timeline dedicata, mai marker; `event` in MapPOIType = solo evento locale puntuale | **presa 2026-11-12** |
| **D-13** ✅ | Luogo autoriale | `Region 1:N Place 1:N POI`; `placeId` obbligatorio opaco; `regionId` provisional fino a F6 | **presa 2026-11-12** |
| **D-14** | Ridisegno regioni | Feedback in lingua Zanara + definizioni semantiche | gate F6 (successore) |
| **D-15** ✅ | Chiusura a due livelli | Core F0–F4 chiude PLAN-117; F5/F6 spin-off in piani successori con contratti propri | **presa 2026-11-12** |
| **D-5/6/7** | Scheda hover, ventaglio, Luogo chiuso | Invariate | gate F2 |
| **D-2/3** | Fixture villaggio, clic job | Invariati | piano |

## 3. Fasi

### Core (PLAN-117 propriamente detto)

**F0 — Fondamenta**
- ✅ **T0.1 fatto** (matrice catture + baseline Sigillo).
- ✅ **T0.2 fatto 2026-11-12:** `src/ui/idleVillage/components/gameFrame/placeOrdering.ts` + `tests/unit/idleVillage/placeOrdering.test.ts` (5 test: inner=expired→expiring(progress asc)→done, stabile, capienza da `PLACES_CONFIG.fan`, overflow in coda esterna).
- ✅ **T0.3 fatto 2026-11-12:** `src/balancing/config/idleVillage/placesConfig.ts` (`placeId` opaco, `worldPoint`, `regionId` provisional opzionale, `regionWide`, i18n, `activityIds`, `fixture`) + `poiConfig.ts` (`MapPOIType` quest/job/event-locale, `placeId` obbligatorio, `deadlineTurn`, `activityRef`) — entrambi Zod+deepFreeze, fixture villaggio marcata; integrità referenziale in `placesConfig.test.ts` (OB-5).
- ✅ **T0.4 fatto 2026-11-12:** `src/balancing/config/idleVillage/eventsConfig.ts` — inventario fonti in testata (seaWonders, eventReminderTokens, goblinEventModalTokens, ReminderComponentV2/V3, QuestDecisionFeed, villageZoneManifest) + `StrategicEventDefinition` (`kind` positive/negative, `deadlineTurn`, `placeId?` link mai marker) + `sortStrategicEvents` (stabile, non-mutante).
- ✅ **T0.5 fatto 2026-11-12:** semantic draft `Region 1:N Place 1:N POI` in testata di `placesConfig.ts` (regione autoriale non canonica, place autoriale mai emergente, `placeId` opaco/stabile, `regionId` provisional fino a F6).

**F1 — POI Zanara (visual fork)**
- ✅ **T1.1 fatto (iterazione 1–2):** direzioni bocciate; mockup Director; bordo scuro validato su compositi.
- T1.2b Varianti «cartografia incisa» per le **3 sagome** (quest, job, event-locale — differenza in punte/gioielli, NON nel glifo): composite a 32/44/55/69, colore+grigio+deuteranopia; stati anello geometrici (arco pieno capo tondo / tacche+gioiello / pulsazione+statico) disegnati; `poi-terrain-gate` su ogni opzione.
- **Gate F1 (D-4, D-9, D-10, D-11):** ruling + baseline congelata (sha256).

**F2 — Luogo autoriale (fork)**
- **Prototipo 2026-11-12, NON approvato:** `src/pages/poi-luogo-lab.tsx`, `PlaceHoverCard.tsx`, `PlaceFan.tsx`, `MapPlace.tsx`, `mapPlace.test.tsx` (8 test tecnici). Il Director ha bocciato marker-Luogo e sigilli orbitanti; la revisione ad arco e i mock radiali non sono baseline. I test del vecchio comportamento non certificano il nuovo.
- **Gate F2 (D-5, D-6, D-7):** riaperto: vedere appendice A per nuovo perimetro, ruling e baseline.

**F3 — Componenti (opzioni scelte)**
- T3.1 Preset additivo Sigillo (SVG — punte, archi geometrici, pulsazione+statico, stati), `/gameOld` e lab invariati; stato da `mapQuestPoiView`; INV CTR-game-008 rispettate.
- T3.2 `PlaceHoverCard` + `MapPlace` nel lab (da `placesConfig`).
- T3.3 Test: `poiSigillo.test.tsx` esteso (vedi OB-3 spezzata) + `placeOrdering.test.ts` + `mapPlace.test.tsx` (DOM-over-Pixi: clic vs pan).

**F4 — Chiusura core**
- T4.1 confronto affiancato pre-registrato (viewport/zoom/bioma/hash); T4.2 `verify:bundle` sul perimetro core; T4.3 occhio Director + dichiarazione del non-visto.

### Perimetro successore (specificato qui, contratto proprio)

**F5 — Eventi strategici (componente dedicato — D-12)**
- T5.1 Fork superficie standalone nel lab: lista verticale in chrome Zanara vs strip orizzontale vs sezione dedicata; voci ordinate per `deadlineTurn`; segno positivo/negativo leggibile senza colore-solo (icona+glifo); **veto modali** rispettato (GX-0042).
- T5.2 Consegna = componente standalone + contratto props documentato + fixture. **NON** integrazione HUD (task successore, dipendenza esplicita da PLAN-116).
- **Gate F5 (D-12):** ruling + baseline propria; se spin-off, diventa PLAN-117b.

**F6 — Regioni (ridisegno — D-14)**
- T6.1 Fork feedback territoriale: contorno inciso/glow + tinta smalto tenue vs filigrana su bordi; mai verde piatto; grigio-safe.
- T6.2 Definizioni semantiche dal world design (re-bucketing documentato di regions.json); consolidamento `regionId` (da provisional a canonico) con integrità referenziale `regionId ↔ placeId`.
- **Gate F6 (D-14):** ruling + baseline propria; se spin-off, diventa PLAN-117c.

## 4. Contratto di chiusura

### Core (chiude PLAN-117)

| OB | Tipo | Obbligazione | Comando / artefatto |
|---|---|---|---|
| OB-1 | state, blocking | `orderPlaceActivities` + test permanente | `npm run test -- tests/unit/idleVillage/placeOrdering.test.ts` |
| OB-2 | state, blocking | Luogo lab: hover scheda **ancorata non modale**, clic ventaglio **non bloccante**, chiusura; clic-vs-pan DOM/Pixi; nessun popup/modale (GX-0042, test negativo) | `mapPlace.test.tsx` |
| OB-3a | state, blocking | **Palette**: nessun token/valore rosso-vermiglio risolto nel preset; arancione solo sull'anello countdown | `poiSigillo.palette.test.ts` |
| OB-3b | state, blocking | **Pulse**: pulsazione risolta da `getComputedStyle` (keyframes ≠ none) in stato urgente, **e** equivalente statico presente con reduced-motion; assenza totale di animazione negli stati non urgenti | `poiSigillo.pulse.test.ts` |
| OB-3c | state, blocking | **Shape**: matrice 3 sagome × 7 stati (incl. `veiled`); due POI stesso glifo + tipo diverso distinguibili a 32px grigio; archi geometrici a 1/25/50/75/99% leggibili (pieno vs tacche); anello 0 = zero pixel; hit-area ≥32px | `poiSigillo.shape.test.ts` |
| OB-4 | state, blocking | Surface `game-interaction` | `npm run test -- tests/unit/idleVillage` |
| OB-5 | state, blocking | `placesConfig`/`eventsConfig`/`poiConfig` Zod-validati; `placeId` obbligatorio **con integrità referenziale** (ogni `placeId` ∈ placesConfig); `regionId` marcato provisional; fixture villaggio etichettata | schema test (build-time) |
| OB-6 | state, blocking | Build e tipi | `npm run build:check`, `npx tsc --noEmit` |
| OB-7 | state, blocking | Leggibilità: 3 sagome distinte a 32px grigio su ≥2 biomi; stati anello distinguibili in colore+grigio+deuteranopia simulata con soglia documentata; atmosferici/notte NOT VERIFIED o cattura | `python3 scripts/poi-terrain-gate.py` |
| OB-8 | visual, blocking | Same-viewport vs baseline pre-registrato **solo per il perimetro core** (preset F1, fork F2); `NOT_COMPARABLE` ≤ N casi (N fissato al congelamento baseline) ognuno con motivazione scritta | report affiancato |
| OB-9 | human-eye | Occhio Director sul lab con **checklist fissata in anticipo**: (1) famiglia leggibile senza colore a 32px? (2) stati anello inequivocabili? (3) urgente visibile con animazione ferma? `/game` = NOT VERIFIED by design | screenshot + nota |

### Successori (non bloccano il core)

| OB | Tipo | Obbligazione | Dove |
|---|---|---|---|
| OB-11 | state, blocking | Eventi: modello + ordinamento per scadenza testato; componente standalone nel lab; **nessun marker evento** nella mappa (test negativo); veto modali rispettato | `eventTimeline.test.ts` — piano F5/successore |
| OB-12 | state, blocking | Regioni: `regionId` consolidato con integrità referenziale `regionId ↔ placeId`; overlay territoriale verificato a **pixel** (hue/sat/alpha campionati, non solo token): mai fill primario verde; ≥2 compositi reali (selezionata/non) + verifica Director | test + gate visivo — piano F6/successore |

~~OB-10~~ eliminata (rev. 4): nessuna soglia di vicinanza.

## 5. Rischi

- **Collisione PLAN-116** (file HUD in altra sessione): F3 non li tocca; F5 consegna standalone, l'integrazione HUD è successora con dipendenza esplicita.
- **Quota generazione:** Gemini out-of-quota; fallback altri provider o **SVG disegnato dal componente** (il Sigillo è già SVG).
- **3 tipi vs 2 famiglie:** D-9 al battesimo — se torna a 2, la sagoma evento resta prodotta ma inutilizzata (costo accettato); il test di distinguibilità OB-7 è il criterio oggettivo.
- **Stacking HUD non verificato nel lab** (T-03) — resta.
- **Fixture scambiate per vere** — resta (config etichettata).
- **Divergenza residua (C2):** claude preferisce 2 tipi POI (quest/job) con la terza forma solo come glifo timeline; la maggioranza + il ruling Director («Quest, Eventi e Job») tengono il terzo tipo come evento-locale puntuale. D-9 resta al battesimo.

## 6. Successor constraints

- **Aggregazione emergente eliminata** — Luoghi autoriali; nessuna soglia di vicinanza da ereditare.
- **Eventi:** design di dettaglio (voci, glifi, click→dettaglio) nel fork F5; integrazione HUD dopo PLAN-116.
- **Regioni:** rideterminazione geografica in F6; `regions.json` attuale = baseline non canonica; `regionId` provisional fino al consolidamento.
- **Interazione DOM-over-Pixi** (clic vs pan, hit-area): testare in F3 lab prima di qualsiasi montaggio `/game`.

## Appendice A — Emendamento F2 proposto (2026-11-12, NON battezzato)

**Provenienza:** R-324, messaggi Director sul radial inclinato e sul nuovo ordine di riempimento; mock Gemini come riferimento d'intento, non specifica pixel. Questa appendice non sostituisce automaticamente le decisioni rev. 5: mette in evidenza i punti da rivedere al gate F2.

**Intento espresso:** il Luogo rimane un'entita' autoriale della mappa, non una nuova famiglia di POI. Il click sull'elemento geografico apre un menu radiale inclinato con un perno centrale progettato per le dimensioni desiderate; ogni settore mostra icona e colore dell'attivita', senza testo. Le posizioni si aggiungono fino a completare il cerchio, continuando nella parte inferiore dopo la superiore. Il primo settore isolato va *in alto a destra dello schermo*: il Director lo chiama «Nord Ovest», ma la posizione visiva e' il riferimento finche' non si chiarisce la convenzione cardinale. Non assumere che il primo sia a ore 12.

**Interazione espressa:** dopo una permanenza su un settore compare una scheda informativa flottante non bloccante; cambiando settore la scheda resta montata e aggiorna il contenuto. Click fuori o Esc chiudono il radial e la scheda; click sul settore apre il planner in sezione dedicata e chiude radial e scheda. Nessun popup/modale bloccante (GX-0042). Colore non esclusivo per distinguere le attivita'.

**Materiale di partenza:** il POI Zanara battezzato nel workstream parallelo e' il riferimento visuale, non `PoiMatericV3_5` come scelta definitiva. Per il perno sono aperte due strade: asset del Luogo rielaborato (ritaglio, prospettiva e piedistallo calibrati) oppure immagine dedicata coerente con quell'asset; *non* duplicare automaticamente il villaggio reale sotto al perno. Blur della mappa = ipotesi da provare in lab, non decisione.

**Rischio di occlusione (ruling Director 2026-11-12):** nessuna regola fissa — dipende dalle dimensioni delle fette. Ammesso lo spicchio disegnato **in grigio, non funzionale**, quando il disegno lo copre troppo; ammessi altri escamotage. Il sotto-piano deve presentare al Director **soluzioni alternative** confrontabili, non un'unica risposta.

**Ordinamento (ruling Director 2026-11-12): STABILE** — ogni attivita' mantiene il suo spicchio finche' esiste; l'urgenza si legge da pulsazione + fallback statico, non dalla posizione. **Supera il criterio «interno=urgenti» di D-6**: `placeOrdering.ts` (commit `66709ab8`) va rifattorizzato nel sotto-piano — partenza NE (alto a destra), riempimento continuo fino al cerchio, posizioni persistenti per identita' attivita'.

**Dibattito multi-AI web (confermato Director 2026-11-12):** scope chiuso sul radial — prospettiva misurata dall'ellisse della palizzata, perno (asset villaggio rielaborato vs arte dedicata), regole di occlusione e alternative, sequenza menu->scheda->planner. Non riapre F0/F1/F5/F6.

**Gesti risolti dal Director 2026-11-12 (revisione del punto 3 della desiderata v30):** sul villaggio dipinto nella mappa, **hover** = scheda avorio con spiegazioni (D-5), **click** = radial delle azioni del Luogo; il pulsante **`Village`** nella nav inferiore apre la vista Villaggio a tutta area. Il click sulla mappa non apre piu' la vista Villaggio: questa revisione va registrata nel punto 3 della v30 alla prossima modifica autorizzata di `.mw/desiderata.md`. Restano separati eventi strategici (F5), regioni (F6) e HUD/PLAN-116.

**Decomposizione consigliata:** sotto-piano *F2 radial Luogo* collegato a PLAN-117, non nuovo piano per POI/Eventi/Regioni; il contratto F2 supera la scala di un task (perno art, geometria e hit test in prospettiva, overflow, scheda persistente, planner e verifica visiva). Gate ordinati: (1) risolvere collisione v30 e convenzione del primo settore; (2) comparare due soluzioni per il perno e due trattamenti sfondo sul medesimo crop e viewport reali, ruling Director/baseline; (3) prototipo interattivo lab con ordine/occlusione, hover persistente, chiusura, focus e planner di prova; (4) safeguard e testimone visivo a 1440x900 e 1280x800. Fino al ruling non riscrivere `MapPlace`/`PlaceFan` come se il nuovo design fosse congelato.

**Chiarimento Director 2026-11-12 (proposta, non ancora revisione della FROZEN v30):** «Village è il pulsante nel menù in basso, non sulla mappa»; primo settore a **Nord Est sullo schermo (alto a destra)**, non Nord Ovest. Nel sotto-piano F2 valutare un dibattito multi-AI limitato a prospettiva, perno, occlusioni, accessibilita' e sequenza menu→scheda→planner, senza riaprire F0/F1/F5/F6. Prima dell'integrazione `/game` serve la revisione esplicita del punto 3 della desiderata v30 che attualmente assegna anche al click sulla regione `village` l'apertura della vista Villaggio.

### Esito dibattito multi-AI web (run `20261112-plan117-radial-f2`, converged 3/3)

Artifact `artifact-r003` (sha 39a6b4ed) in `mind-weaver/.mw/runs/20261112-plan117-radial-f2/`. Risolto: inclinazione = misura ellisse palizzata all'art-lock -> tilt derivato, un solo valore globale; geometria di riferimento 12 slot da 30 gradi con bande contigue (hub 0-95, collare 95-105, spicchi 105-205, rim 205-230); NO blur/desaturazione globale (vignetta navy locale opzionale); disco sempre pieno, slot vuoti traslucidi pointer-events:none, locked!=vuoto; hit-test via path SVG + inversa CSS3D, pan mai bloccato, seam NE=index0; card dwell 350ms poi swap istantaneo, posizionamento deterministico; doppia pista rim (esterna CW solida+chevron, interna CCW tratteggiata+vuota) componibile sulla stessa slice; urgenza su gemma (pulse+rivetto, orologio condiviso); costanti geometriche congelate solo dopo la misura, gate prototipo al tilt derivato su 1280x800 e 1440x900 con hitbox distinguibili e render grayscale 100%.
**Ruling Director (mockup, 2026-11-12):** riempimento **orario da NE** (NE,E,SE,S,SW,W,NW,N); slice = **8x45 gradi** (i centri cadono esatti sui punti cardinali); socket vuoti = **vetro traslucido**; hub = **medaglione uniforme** (navy + oro inciso + punte-gemma, NON inset villaggio). Con 8 slot il tetto attivita' per Luogo e' 8; oltre 8 = affordance hub -> planner (design-error case). Geometria di riferimento aggiornata: slot da 45 gradi, angoli identici al compass che il Director ha enumerato; capienza tipica 4-6 lascia 2-4 socket vetro.

**Gate materiale F2 (2026-11-13, ancora aperto):** il kit generato per `/lab/poi-luogo` è **candidato, non battezzato**. La prima cattura mostrata al Director aveva scacchiera rasterizzata, collari duplicati e archi grossi; segnalazione «tanti errori» e riproduzione `.mw/bugs/2026-11-13-poi-radial-material/`. Una correzione tecnica dei layer/alpha/scala non equivale a ruling sull'arte, sull'occlusione del villaggio o sul trattamento finale della scheda slice. Nessuna integrazione in `/game` finché non c'è gate visivo Director.

**Ruling composizione 2026-11-13 (Director: «niente testo, x il resto uguale al mockup»):** baseline = `.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg` (sha `2bec1c46dde3fdf6`) — **ventaglio di carte-smalto sovrapposte**, non disco unico; niente etichette testo. Sostituisce i ruling 2026-11-12 su disco unico/medaglione navy/socket vetro; restano vigenti direzione CW da NE, ordine stabile, dwell 350 ms, GX-0042, pan mai bloccato. Sub-plan draft con contratto OB-F1..F6 e open gates OG-1..OG-3 in `plans/PLAN-117-F2-fan-luogo.md` — **la strada del disco inclinato (`PlaceRadial` + kit `disc-*`) va considerata superata come baseline F2**: resta nel lab come fallback fino a nuovo ruling, nessun altro investimento su quella direzione senza ruling esplicito.
