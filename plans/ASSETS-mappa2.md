---
title: Elenco asset mappa2 (unico)
type: sotto-documento (non piano)
updated: 2026-10-29
owner: Director (arte e audio) + pipeline (procedurali)
---

# Elenco asset `mappa2`

Un solo posto per sapere **cosa serve, chi lo fa e a che punto è**. I piani
rimandano qui per gli asset; le specifiche tecniche restano nei piani.

Stati: `da decidere` (manca una scelta del Director) · `da produrre` · `consegnato`
(file arrivato, non ancora integrato) · `integrato` · `fatto ✓` (procedurale,
già in pack). **✓ accanto allo stato = verificato chiuso.**

## Biomi → chiave mood

Le animazioni e gli asset chiave su **biomi** (PLAN-099), mai su regioni.
La chiave mood decide il registro del prompt (STYLE/PALETTE/LIGHT del
`scene_prompt_form`).

| Bioma (`biomes.json`) | Regioni che lo contengono | Chiave mood |
|---|---|---|
| `alpine` | snow_peaks | **Rude Beauty** |
| `highland` | waterfall_plateau | **Rude Beauty** |
| `temperate_forest` | ridge_forest, deep_forest, river_meadows, bayou, nw_archipelago, east_cliffs | **Rude Beauty** |
| `meadow` | river_meadows, bayou | **Rude Beauty** |
| `mangrove_bayou` | bayou | **Rude Beauty** |
| `tropical_beach` | sandy_coast, west_atoll, bayou | **Rude Beauty** |
| `tropical_isles` | green_islet, nw_archipelago, west_atoll | **Rude Beauty** |
| `rocky_coast` | east_cliffs, snow_peaks | **Rude Beauty** |
| `open_sea` / `shallow_waters` | sea_west/north/east/south | **Rude Beauty** |
| `coral_reef` | coral_lagoon | **Prismatic** (proposta: laguna iridescente = intrusione altro-mondo; confermare) |
| `red_badlands` | red_desert, red_canyons, volcanic_massif | **Dark Wasteland** |
| `volcanic` | volcanic_massif, red_canyons, se_volcanic_isles | **Dark Wasteland** |
| — | — | **Impero Solare**: nessun bioma su mappa2; riservato a eventuali incarnazioni/strutture imperiali (A9/A10) se volute — da decidere |

## Regole comuni per l'arte

Valgono per tutte le righe della sezione A, salvo nota.

- **Stile:** quello dipinto di mappa2 (non anime/cel, niente contorno nero
  pieno). Luce e palette coerenti col dipinto: la prova è che lo sprite messo sopra
  la mappa non sembri un adesivo. La ref allegata a ogni generazione è il dipinto
  (crop del bioma + vista intera); la chiave mood della riga decide il registro.
- **Vista:** aerea obliqua (~45°), come la mappa. Niente profilo puro.
- **Sorgente a 4×** la dimensione in mappa (serve allo zoom 3 e a PLAN-096).
- **Fondo** piatto magenta `#FF00FF` (cut in pipeline) → PNG/WebP con alpha.
- **Atlante per famiglia:** celle tutte uguali, pose in fila nell'ordine indicato;
  una sola direzione (verso destra), lo specchio fa la sinistra.
- **Ombre:** non disegnarle nello sprite; le aggiunge il runtime.
- **Consegna:** `public/assets/world/mappa2/base/fx/<famiglia>/` (la cartella
  esatta la fissa il contratto del piano). Prima della consegna: **battesimo
  Director** sul candidato compositato sulla mappa (mai sprite nudi).

## A. Arte da generare — divisa per bioma

### A·Terra verde — foresta, prateria, alpi, altopiano → Rude Beauty

| ID | Asset | Piano | Pose / contenuto | In mappa | Sorgente (4×) | Stato | Note |
|---|---|---|---|---|---|---|---|
| A1 | Creatura di branco fantasy | PLAN-097 | cammino 8 · fermo 4 · reazione 2 | 16–20 px | 64–80 px | da decidere | specie da scegliere: «meno banale, più fantasy». Il cervo era solo segnaposto. Bioma `meadow` + margini `temperate_forest` |
| A2 | Stormo (uccello singolo) | PLAN-097 | volo 8 · decollo 3 · atterraggio 3 | 10–14 px | 40–56 px | design battezzato ✓ — strip definitiva da produrre | visto dall'alto in obliquo; gli uccelli esistenti (`atmosphere/birds`) non reggono su mappa2. Bioma `temperate_forest` + `meadow`. **Pilota fatto 2026-10-29** (`context/research/2026-10-29-mappa2-sprite-pilot/`): stile PASS; ruling Director 2026-10-29 «battezzato» (design v4 + approccio 20–24px). Resta: strip 8+3+3 e montaggio atlante |
| A12 | Airone / egretta | PLAN-097 | in piedi 2 · decollo 4 · volo 6 | 18–22 px | 88 px | da decidere | rive `mangrove_bayou` + bordi laghi; da spec piano slice 1 |
| A13 | Aquila | PLAN-097 | cerchio ampio, evento raro | 30–36 px | 144 px | da decidere | `alpine` + `highland`; da spec piano slice 2 |
| A14 | Capre sui crinali | PLAN-097 | come branco | 8–10 px | 40 px | da decidere | `alpine`; da spec piano slice 3 |

### A·Bayou, costa e isole → Rude Beauty

| ID | Asset | Piano | Pose / contenuto | In mappa | Sorgente (4×) | Stato | Note |
|---|---|---|---|---|---|---|---|
| A4 | Sirena sullo scoglio | PLAN-094 | arrivo 4 · seduta 4 · tuffo 6 | 16–20 px | 64–80 px | **fork design** — ruling Director pendente | evento raro; gli scogli candidati (`rocky_coast`) li sceglie la pipeline. v1 bocciata 2026-10-29 (colori/stile fiabeschi); varianti vB (rame/muschio) e vC (argento/indaco) in `context/research/2026-10-29-mappa2-sprite-pilot/` sezione 3c. Ruling: prima la creatura, poi strip a 14 pose |
| A15 | Gabbiani | PLAN-097 | volo sul bagnasciuga | 10–14 px | 56 px | da decidere | coste; condivide anchor con PLAN-094; da spec piano slice 2 |

### A·Deserto rosso e vulcano → Dark Wasteland

| ID | Asset | Piano | Pose / contenuto | In mappa | Sorgente (4×) | Stato | Note |
|---|---|---|---|---|---|---|---|
| A16 | Cavalli / creature selvatiche | PLAN-097 | come branco | 16–20 px | 64–80 px | da decidere | `red_badlands` (era `dry_steppe`); specie coerente col mood; da spec piano slice 3 |

### A·Mare → Rude Beauty (`coral_reef` → Prismatic)

| ID | Asset | Piano | Pose / contenuto | In mappa | Sorgente (4×) | Stato | Note |
|---|---|---|---|---|---|---|---|
| A3 | Coda di balena lontana | PLAN-094 | emersione + tuffo, 8–12 pose | 30–40 px | 120–160 px | **bocciata** (Director 2026-10-29, saltata) | candidati archiviati in `context/research/2026-10-29-mappa2-sprite-pilot/` (sezione 3b) — riprendere con brief diverso se torna in campo |
| A5 | Balena (ridipinta) | PLAN-094 | corpo + coda + pinne **separati** (per rig) | ~60 px | ~240 px | **bocciata** (Director 2026-10-29, saltata) | prove archiviate: evento ridotto a dorsale+sbuffo (cresta bassa, sbuffo procedurale) — in statico quasi invisibile a spec 60px; se torna: cresta più spessa/contrastata |
| A6 | Kraken (ridipinto) | PLAN-094 | corpo + 6–8 tentacoli **separati** | ~73 px | ~290 px | da produrre | sostituisce `kraken1.webp`; candidato anche in acque `volcanic` (mood Wasteland se spawna lì — decidere alla consegna) |
| A7 | Nave pirata (ridipinta) | PLAN-094 | scafo + vele separate | ~53 px | ~210 px | da produrre | sostituisce `nave-pirata1.webp`; serve una vista coerente con le rotte (PLAN-101) |

| A18 | Pesce del banco (silhouette dall'alto) | PLAN-094 | **corpo** + **coda** (cerniera) in 2 file separati, testa a destra | ~12 px | 96×48 | **consegnato e integrato 2026-10-29** — sostituisce i segnaposto procedurali | forma piena in un solo colore (lo tinge il runtime col blu del mare profondo); animo io: coda che ondeggia, deviazioni, banco coordinato |
| A19 | Ombra gigante: manta e pescione | PLAN-094 | 1 silhouette statica per animale, testa a destra, posa dritta | 130–290 px | 512×192 | **consegnato e integrato 2026-10-29** | animo io: ondulazione automatica (mesh piegata) + bolle procedurali |
| A20 | Tartaruga marina (dall'alto) | PLAN-094 | **guscio+testa** + **4 pinne** separate (cerniera sul bordo del guscio) | ~40 px | 192×128 | **consegnato e integrato 2026-10-29** | animo io: pinne che remano in alternanza |
| A21 | Delfino (dall'alto) | PLAN-094 | **corpo** + **pinne pettorali** + **coda orizzontale** separati | ~38 px | 192×64 | **consegnato e integrato 2026-10-29** | animo io: due salti ad arco (scala/opacità) e anelli di spruzzo procedurali |

### A·Trasversali (multi-bioma / tutto il mondo)

| ID | Asset | Piano | Pose / contenuto | In mappa | Sorgente (4×) | Stato | Note |
|---|---|---|---|---|---|---|---|
| A8 | Animazioni dei segreti | PLAN-100 | 1 animazione one-shot per segreto | — | — | da decidere | dipende dalla scelta dei 4–6 punti (O-1); il mood segue il bioma del punto |
| A9 | Villaggio, una tavola per incarnazione | PLAN-089 T-012 | 1 immagine per incarnazione (+ fumo dal runtime) | ~300×300 px | ~1200 px | da decidere | elenco incarnazioni da definire; ipotesi: una incarnazione per chiave mood (4 tavole) |
| A10 | Strutture scopribili, una tavola per stato | da assegnare | 1 immagine per struttura per stato | 100–200 px | 400–800 px | da decidere | regola: restano visibili dopo la scoperta e mostrano lo stato; mood per bioma della struttura |
| A11 | Tasselli ad alta risoluzione | PLAN-096 | tasselli 2× e 4× (ingranditore + ridipintura) | — | — | da decidere | solo se si sceglie lo zoom 3 a qualità piena; copre tutti i mood |
| A17 | Carovana (carri) | PLAN-097 | marcia lenta su polilinea, pausa | 22–28 px | 112 px | da decidere | strade dipinte della valle (`meadow`); da spec piano slice 2 |

## B. Audio

| ID | Asset | Bioma / mood | Piano | Contenuto | Stato | Note |
|---|---|---|---|---|---|---|
| B1 | Rombo della cascata | `highland` / Rude Beauty | PLAN-100 | loop senza giunzione, 10–20 s | da decidere | si sente solo da zoomati; fonte da scegliere (O-2) |
| B2 | Suoni di clic dei segreti | per-punto | PLAN-100 | 1 suono breve per segreto | da decidere | dipende da A8 |
| B3 | Suoni delle animazioni nascoste | per-punto | PLAN-100 | 1 per segreto (facoltativo) | da decidere | dipende da A8 |
| B4 | Altri suoni di zona | mare / foresta / vulcano | PLAN-100 (futuro) | mare, foresta, vulcano… | da decidere | solo se li vuoi dopo la cascata; il vulcano ha registro Wasteland |

## C. Procedurali (li genera la pipeline o il runtime, nessuna arte da fare)

| ID | Asset | Bioma / mood | Piano | Dove | Stato |
|---|---|---|---|---|---|
| C1 | Pose della cascata (24) | `highland` | PLAN-092 | `fx/waterfall/flip_f*.webp` | fatto ✓ |
| C2 | Pose di fiume e laghi (8 per elemento) | `meadow`, `highland`, `mangrove_bayou` | PLAN-095 | `fx/water/*_f*.webp` | fatto ✓ |
| C3 | Mist, splash, anelli del bacino | `highland` | PLAN-091/092 | `fx/waterfall/mist_blob.webp`, `ripple_ring.webp` | fatto ✓ |
| C4 | Arcobaleno raro | `highland` | PLAN-092 | texture canvas nel runtime | fatto ✓ |
| C5 | Banchi di pesci (blob) | `open_sea`, `shallow_waters`, `coral_reef` | PLAN-094 | `fx/ambient-sea-life.webp` | fatto ✓ (slice 1) |
| C6 | Nuvole e ombre | tutto il mondo | PLAN-089 | `fx/clouds/*` | fatto ✓ |
| C7 | Mist, cenere, braci | `mangrove_bayou`, `coral_reef` (mist) + `volcanic` (cenere/braci) | PLAN-098 v1 | `fx/weather/*` | da produrre |
| C8 | Pioggia locale, nuvole sulle vette, lampi | `alpine` + `volcanic` | PLAN-098 slice 2 | da definire | da decidere |
| C9 | Ombre di contatto, scie, spruzzi delle creature | terra + mare | PLAN-094/097 | runtime | da produrre |

## Decisioni che bloccano la produzione

1. **Creatura fantasy dei branchi** (A1) — specie, e mood di conferma (Rude Beauty).
2. **Punti dei segreti** e loro animazioni (A8, B2, B3).
3. **Fonte dei suoni:** generati, libreria con licenza o registrati (B1–B4).
4. **Incarnazioni del villaggio e strutture scopribili** con i loro stati (A9, A10) — ipotesi una per chiave mood.
5. **Zoom massimo a qualità piena** sì/no (A11).
6. **Conferma mapping mood:** `coral_reef`→Prismatic, nessun bioma→Impero Solare.
7. **Famiglie PLAN-097 di riserva** (A12–A17): quali entrano in produzione dopo il pilota.

## Ordine consigliato

1. **Pilota di stile:** una sola creatura (A2 stormo o A3 coda di balena) per
   verificare che lo stile regga sulla mappa prima di produrre il resto.
2. A3, A4 (mare: eventi rari ad alto impatto, pochi frame).
3. A5–A7 (mostri ridipinti), quando c'è il kit di animazione.
4. B1 (suono cascata), poi segreti (A8, B2, B3).
5. A1 quando è scelta la specie; poi le famiglie di riserva (A12–A17).
