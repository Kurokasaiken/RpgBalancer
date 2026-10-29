---
title: PLAN-097 — `mappa2` Fauna di terra (selvaggina, stormi, carovana) sopra l'AmbientDirector
status: draft — da battezzare Director (nessuna implementazione eseguita)
owner: agente locale (planner)
created: 2026-10-29
source_request: richiesta Director a voce (sessione PLAN-092/095): «questo plan non doveva includere anche selvaggina sulla mappa? avevamo degli uccelli come animazione, ma non so se quello stile va ancora bene»
parent: PLAN-089 (T-009: «…caravan/fireflies/embers/dust/deer/birds»)
depends_on: PLAN-094 (AmbientDirector, famiglia shoal) — la fauna è una famiglia nuova dello stesso scheduler
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore + esito, da registrare al battesimo)
  - test-results/plan-097-mappa2-land-fauna/ (evidence)
---

# PLAN-097 — Fauna di terra su `/mappa2-lab`

> **Nota PLAN-099 (2026-10-29): regioni ≠ biomi.** `regions.json` ora contiene 20 *territori* di gioco
> (stile Risiko, mare incluso) e **non sono più biomi**; i biomi sono in `biomes.json` / `biome_ids.png`
> (13, ripetibili in zone lontane). Dove questo piano dice «regione», per le **animazioni** leggi
> «bioma»: cervi → `meadow` (+margini `temperate_forest`), passeriformi → `temperate_forest` + `meadow`, aironi → `mangrove_bayou` + rive laghi, aquila → `alpine` + `highland`, capre/cavalli → `alpine` / `red_badlands`. **Da applicare all'implementazione** (la fauna non è ancora costruita).
> Gli id sotto sono quelli storici (`western_forest`, `central_valley`, `dry_steppe`…) e non esistono più.
> Vedi `plans/PLAN-099-mappa2-territories-and-biomes.md`.


## Perché

PLAN-089 T-009 prevedeva cervi, uccelli e carovana. Finora sono stati eseguiti
solo due pezzi: la vita marina (PLAN-094, slice shoal) e i micro-effetti di
terra (PLAN-093: foglie, motes, farfalle). Il Director li ha guardati e li
giudica deboli: a scala 4–7px non si leggono alla vista d'insieme e da vicino
sembrano particelle, non mondo vivo. Il valore per una mappa interattiva sta in
cose che si leggono a colpo d'occhio e raccontano qualcosa: **creature con
silhouette riconoscibile**, in luoghi coerenti col bioma.

Conseguenza operativa già applicata (2026-10-29): in `mappa2-lab` foglie e
motes hanno default 0, flutter era già 0. Il codice resta.

## Finding — gli uccelli esistenti NON tengono su mappa2 (2026-10-29)

Sprite `public/assets/atmosphere/birds/bird_strip.webp` (1024×122, 8 pose) +
voli in `atmosphereAssets.ts`. Composti a scala reale (46×44px, formazione a V
come nel config) sul dipinto di mappa2, su prateria e su mare:

- sagome **grigio ardesia piatte e semitrasparenti**: nessuna luce, nessuna
  ombra a terra, nessun legame con la gamma del dipinto → leggono come adesivi
  (stesso problema già documentato per le nuvole anime in `atmosphereAssets.ts`);
- **troppo grandi**: 46px contro chiome dipinte di ~40px, un uccello vale un
  albero;
- vista di profilo, mentre il dipinto è una veduta aerea obliqua;
- le coordinate dei voli sono della mappa /game: con `originX` fino a 3818 su una
  mappa larga 2752 buona parte dei voli cade fuori da mappa2.

**Decisione proposta:** non riusare gli sprite; nuovi sprite dipinti per
mappa2. Il codice di volo (`PixiWorldMap.tsx`, effetto `birds`) è riusabile come
meccanismo, non come asset. Nel lab l'effetto `birds` è acceso di default:
valutare se spegnerlo finché non ci sono gli sprite nuovi (O-1).

## Specie e zone (proposta)

Zone da `regions.json` (10 regioni, coordinate in px sorgente 2752×1536):

| Famiglia | Dove | Comportamento | Priorità |
|---|---|---|---|
| **Cervi / selvaggina** (branco 3–5) | `central_valley`, margini `western_forest` | pascolo fermo, cammino lento tra anchor, testa alzata, fuga breve | slice 1 |
| **Passeriformi** (stormo piccolo) | `western_forest`, `central_valley` | decollo dalle chiome, volo corto con ombra a terra, atterraggio | slice 1 |
| **Aironi/egrette** | `bayou`, rive laghi | fermi in acqua, decollo raro | slice 1 |
| **Carovana** (2–4 carri) | strade dipinte della valle (da verificare quali sono percorribili) | marcia lenta su polilinea, pausa | slice 2 |
| **Aquila** | `snow_peaks`, `waterfall_plateau` | evento raro, cerchio ampio | slice 2 |
| **Gabbiani** | coste | volo sul bagnasciuga (condividere gli anchor con PLAN-094) | slice 2 |
| Capre sui crinali, cavalli selvatici nelle steppe | `snow_peaks`, `dry_steppe` | come cervi | slice 3 |

Giorno/notte: il ciclo è stato tolto dal Director; **nessuna** famiglia dipende
dall'ora (niente lucciole/pipistrelli).

## Grammatica di movimento

- Silhouette corta e leggibile, **non particelle**: ogni animale è uno sprite
  dipinto con pose.
- Tre stati: `idle` (pascolo/riposo), `move` (cammino/volo), `react` (alzata di
  testa o fuga). Transizioni con dissolvenza di pose, mai teletrasporto.
- Ombra di contatto morbida sotto ogni creatura (sprite `multiply`, alpha
  0.25–0.35), spostata come la luce del dipinto.
- Branchi con offset e fasi diverse: mai due animali sincronizzati.
- Spawn via `AmbientDirector` (eventSeed deterministico, spawnlog replayable);
  nessun `Math.random()` nel tick.
- Zoom: sotto lo zoom minimo leggibile (da misurare, ipotesi 0.5) le creature si
  nascondono invece di diventare puntini; sopra, scala fissa in px mondo.
- `reduced-motion`: niente movimento; al più pose `idle` statiche.

## Dimensioni (px del mondo, 2752×1536)

Le chiome dipinte misurano circa 40px; le creature devono stare *sotto* quella
scala:

| Creatura | Corpo in mondo | Sorgente consigliata (4×, per zoom 3 e per PLAN-096) |
|---|---|---|
| Cervo | 16–20 px | 80 px |
| Lepre/volpe | 8–10 px | 40 px |
| Uccello piccolo (ali aperte) | 10–14 px | 56 px |
| Airone | 18–22 px | 88 px |
| Carro con bue | 22–28 px | 112 px |
| Aquila (ali aperte) | 30–36 px | 144 px |

## Asset che devono arrivare dal Director

Per i ruling del 2026-10-27 gli asset li genera il Director. Richiesta minima
per la **slice 1** (veduta aerea obliqua, ~45°, luce coerente col dipinto,
fondo trasparente, stile dipinto di mappa2 — non anime/cel):

1. **Cervo**: cammino 8 pose, pascolo (testa giù) 4 pose, testa alzata 2 pose.
   Una direzione (verso destra); lo specchio fa la sinistra.
2. **Passeriforme**: volo 8 pose viste dall'alto-obliquo (non di profilo),
   decollo 3 pose, atterraggio 3 pose.
3. **Airone**: in piedi 2 pose, decollo 4 pose, volo 6 pose.
4. **Ombre** (generabili in pipeline): ellissi morbide per le tre taglie.

Formato: atlante per famiglia, celle di dimensione uguale, 4× della scala in
mondo (vedi tabella). Nome file e ordine delle pose vengono fissati dal contratto
`mappa2FaunaConfig.ts` (T-002). Il planner non genera immagini.

Alternative da decidere (O-2): generare le pose con un modello a partire da un
solo disegno di riferimento per specie, con ritocco del Director.

## Architettura (sintesi)

- **Contratto** `public/assets/world/mappa2/base/fauna.json` + schema leaf
  `src/ui/idleVillage/config/mappa2FaunaConfig.ts` (Zod strict, come
  `secondary-water`); parse obbligatorio solo in `/mappa2-lab`; `/game` non lo
  carica mai.
- **Anchor** generati in pipeline (`scripts/build-mappa2-assets.py`) da
  `region_ids.png`, `canopy_mask.webp`, `land_mask.webp`, `internal_water_mask`
  e dalle polilinee strada; gate offline: distanza dal bordo, niente anchor su
  roccia/acqua profonda/costruzioni, spaziatura minima.
- **Runtime** (`PixiWorldMap.tsx`): famiglia `fauna` nell'AmbientDirector; pool
  di `Sprite` preallocati (cap proposto ≤28 vivi), swap di texture da atlante,
  nessuna allocazione nel ticker; identico su WebGL e Canvas.
- **Lab**: slider densità e velocità per famiglia, pulsante "Trigger" per gli
  eventi rari, toggle per famiglia; default calibrati dopo il giudizio dal vivo.
- **Z-order**: sopra terreno e canopy-base, sotto le chiome che li coprono
  (verificare cosa succede con gli animali nel bosco: o restano fuori dalle
  maschere canopy o si usa la maschera inversa) e sotto `Foreground`.

## Task

- [ ] **T-001** Intake asset: il Director consegna gli atlanti della slice 1;
  verifica dimensioni, pose, alpha. · `depends:` consegna Director
- [ ] **T-002** Contratto + schema + test unit (`mappa2FaunaConfig.ts`,
  `tests/unit/idleVillage/mappa2FaunaConfig.test.ts`). · `depends:` none
- [ ] **T-003** Pipeline anchor + gate offline + debug sheet
  (`scripts/build-mappa2-assets.py`, `fauna.json`). · `depends:` T-002
- [ ] **T-004** Runtime famiglia `fauna` sull'AmbientDirector + pool + ombre +
  LOD + reduced-motion + controlli lab. · `depends:` T-001, T-003, PLAN-094 T-003
- [ ] **T-005** E2E + witness visivo: crop WebGL/Canvas a zoom 1.0 e 3.0, due
  frame diversi, creature dentro il bioma, nessuna sui bordi/acqua. · `depends:` T-004
- [ ] **T-006** Slice 2 (carovana, aquila, gabbiani) — da piano separato dopo la
  review della slice 1. · `depends:` T-005 + Director

## Contratto di chiusura

- **OB-1** Unit: schema + negative test (anchor fuori maschera, pose mancanti, cap
  vivi superato).
- **OB-2** E2E `tests/e2e/idleVillage/mappa2Fauna.spec.ts` su WebGL e Canvas:
  creature presenti, spawnlog identico a parità di seed, reduced-motion fermo,
  nessun rebuild al toggle.
- **OB-3** Safeguards: lint scoped, test scoped, `build:check`, `closure:lint`,
  `contracts:check` (oggi fail-closed per drift condiviso: vedi nota).
- **OB-4** Evidence: crop reali a zoom 1.0 e 3.0 con le creature, ON/OFF.
- **OB-5** `human-eye` Director — T-04: diff e metriche non chiudono il claim.

## Decisioni aperte

- **O-1** Spegnere l'effetto `birds` esistente nel lab finché mancano gli sprite
  nuovi? (proposta: sì).
- **O-2** Come si producono le pose: disegnate/generate dal Director, oppure da
  un disegno di riferimento per specie più passata di animazione?
- **O-3** La selvaggina è solo scenografia, o deve legarsi al gioco (nodo di
  caccia, risorsa, indizio per quest)? Cambia il contratto: serve un `id` stabile
  per branco e uno stato persistente.
- **O-4** Interazione: le creature reagiscono al cursore/click o allo zoom?
- **O-5** Vuoi che gli animali entrino nel bosco (sotto le chiome) o restino su
  prateria e radure? (proposta: radure, per evitare occlusioni sbagliate)
- **O-6** Budget: cap 28 creature vive e quota di memoria grafica per gli
  atlanti, da confrontare con PLAN-096 (piramide di dettaglio).

## Rischi

- Stile: se le pose non hanno luce e palette del dipinto, ripetono il problema
  degli adesivi. Mitigazione: pilota con **una** specie (cervo) prima di
  produrre le altre.
- Occlusione con le chiome canopy (livelli sopra il terreno): da risolvere in
  T-004 con anchor in radura.
- Collisione di numerazione e di worktree con sessioni parallele (T-13): prima
  di battezzare, controllare `PLAN-094` e `PLAN-096` e rileggere `plans/INDEX.md`.
- `contracts:check` oggi fallisce per drift già presente nel worktree condiviso
  (`PixiWorldMap.tsx` è in import-closure di `game-frame-pixi`): serve il ruling
  Mode B-amend del Director prima di chiudere qualsiasi plan che tocchi il
  renderer.

## Decisioni Director 2026-10-29

- **Branchi sì, ma non cervi "banali":** servono creature più fantasy e meno ovvie. La specie è da decidere (riapre la tabella "Specie e zone" e la lista asset della slice 1: il cervo resta solo come segnaposto tecnico).
- **Stormo casuale ogni tanto:** confermato (era già pensato così); sprite nuovi in stile mappa2.
- **Mulino/ruota:** non convince; al massimo dentro il villaggio.
- **Zone:** dopo PLAN-099 le «regioni» sono territori di gioco, non biomi. Gli anchor della fauna vanno chiavati per **bioma** (`biomes.json` / `biome_ids.png`), non per `regions.json`.

> **Asset:** l'elenco unico (pose, dimensioni, stato) è in [`ASSETS-mappa2.md`](ASSETS-mappa2.md).
