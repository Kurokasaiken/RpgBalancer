---
title: PLAN-099 — `mappa2` Territori (regioni stile Risiko) e Biomi separati
status: implementato (pipeline + runtime animazioni); da rifinire a vista — vedi «Cosa non è verificato»
owner: agente locale
created: 2026-10-29
source_request: R-293 (Director: «dobbiamo dividere la mappa in zone e in biomi… le zone tipo Regioni le dobbiamo dividere come fosse una mappa di Risiko… le animazioni vanno per bioma e non per regione»)
parent: PLAN-089 (living world)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (R-293)
  - context/DECISION_LOG.md (regioni ≠ biomi)
  - plans/PLAN-093, 094, 097, 098 (nota di re-keying regione → bioma)
---

# PLAN-099 — Territori e Biomi su `mappa2`

## Problema

Fino a PLAN-098 `regions.json` e `biomes.json` erano **la stessa lista di 10 voci**, disegnata con
poligoni grossolani (rettangoli/trapezi) in `REGION_SPECS` dentro `build-mappa2-assets.py`:
confini che ignoravano costa e fiume, ~37% della mappa senza zona (id 0), isole nel poligono
sbagliato, nessun grafo di vicinato. Le animazioni (shoal, land-life, canopy, meteo, fauna) leggevano
quei poligoni come se fossero biomi.

## Decisione (Director, 2026-10-29)

Due livelli **indipendenti**, ciascuno con la sua maschera:

| | Regioni (territori) | Biomi |
|---|---|---|
| Cosa sono | territori di gioco, contigui, stile Risiko | com'è fatto il terreno |
| Copertura | **tutta** la mappa, mare compreso | tutta la mappa |
| Ripetibili? | no, ognuna è un posto | **sì**: lo stesso bioma in zone lontane |
| Chi li usa | gameplay, hover/selezione, `neighbors` | **tutte le animazioni**, canopy, meteo, fauna |
| File | `region_ids.png`, `regions.json` | `biome_ids.png`, `biomes.json` |

Regola: **un'animazione non legge mai `region_ids`; legge `biome_ids`.**

## Regioni (20 = 15 terra + 5 mare)

Continente (10): `snow_peaks` Vette Nevose · `waterfall_plateau` Altopiano della Cascata ·
`ridge_forest` Bosco del Crinale · `deep_forest` Selva Profonda · `river_meadows` Praterie del Fiume ·
`red_desert` Deserto Rosso · `red_canyons` Canyon Rossi · `volcanic_massif` Massiccio Vulcanico ·
`bayou` Bayou · `sandy_coast` Costa Sabbiosa.
Isole accorpate per vicinanza (5): `green_islet` · `nw_archipelago` · `west_atoll` ·
`east_cliffs` (Scogliere Orientali: ex Nord-Est + Costa Est, una massa continua) · `se_volcanic_isles`.
Mare (5, come collegamenti marittimi del Risiko; possono restare inutilizzati): `sea_west`, `sea_north`,
`sea_east`, `coral_lagoon`, `sea_south`.

Le montagne attorno alla cascata appartengono a `snow_peaks`; `waterfall_plateau` è solo cascata + lago
alpino + bacino (ovale attorno alle maschere `waterfall_*`).

## Biomi (13)

`alpine` · `highland` (altopiano/lago alpino) · `temperate_forest` · `meadow` · `red_badlands` ·
`volcanic` · `mangrove_bayou` · `tropical_beach` · `tropical_isles` · `rocky_coast` · `coral_reef` ·
`shallow_waters` · `open_sea`.

Il bioma di ogni pixel di terra è **classificato per colore** (HSV su `base_flat`, neve/sabbia/rosso/scuro/roccia/chioma/prato/palude), limitato ai biomi ammessi per regione (`REGION_ALLOWED_BIOMES`), poi lisciato con una maggioranza 9×9 dentro la regione. Il bioma base di regione (`REGIONS`) è solo il fallback per i pixel senza indicazione di colore. Il mare è raffinato per pixel: `coral_reef` = Laguna Corallina, `shallow_waters` = mare con `shallow_mask > 40`,
`open_sea` il resto. Esempi di biomi in più regioni: `temperate_forest` (Bosco + Selva),
`red_badlands` (Deserto + Canyon), `tropical_isles` (3 gruppi d'isole), `volcanic` (Massiccio + Isolotti).

## Pipeline

1. `scripts/build-mappa2-territories.py` (nuovo) — semi su canvas a metà risoluzione; crescita geodetica
   sulla terra (fiume come muro), Voronoi euclideo sul mare, smoothing dei punteggi e argmax a
   risoluzione piena; scrive `region_ids.png`, `biome_ids.png`, `regions.json` (con `kind`, `continent`,
   `biomes`, `neighbors`), `biomes.json` (con `regions`) e anteprime `debug/regions-preview.webp`,
   `debug/biomes-preview.webp`. Legge le maschere già emesse dalla pass principale.
2. `scripts/build-mappa2-assets.py` — **non disegna più regioni**: `load_territory_maps()` legge i file
   sopra (errore esplicito se mancano) e tutte le decisioni d'animazione usano i biomi:
   - shoal (`ambient-director.json`): campo `region` → **`biome`**;
   - land-life (`land-life-anchors.json`): `regionId` → **`biomeId`**; zone mote/flutter da
     `LANDLIFE_MOTE_BIOMES` / `LANDLIFE_FLUTTER_BIOMES`;
   - canopy bloccata in `CANOPY_BLOCKED_BIOMES = {alpine, red_badlands, volcanic}`.
   `biomes.seed.json` (poligoni) è rimosso.
3. Ordine di rigenerazione: pass principale (maschere) → `build-mappa2-territories.py` → pass principale.
   Con le maschere già presenti basta territories → principale.

Runtime: leaf schema della Director (`region` → `biome`), AmbientDirector
(`regionCooldownSec` → `biomeCooldownSec`, cooldown per bioma), PixiWorldMap (zone shoal e tipo
anchor land-life). L'hover/selezione regioni del lab (`region_ids.png` + `regions.json`) resta com'è e
ora usa i nuovi territori.

## Cambi di comportamento visibili (onesti)

- Canopy: maschera −0,14% / +0,19% dell'area, 40 livelli (prima 39 + uno nuovo). Tolti alberi sul fianco
  ovest delle Vette e in Deserto Rosso; aggiunti sul bordo dell'Altopiano e su un'isola NO. Il resto
  della pass principale (cascata, acqua secondaria) è byte-identico.
- Land-life: mote/flutter ora seguono i biomi, quindi compaiono anche nelle isole `tropical_isles` (NO,
  atollo) e sulla Costa Sabbiosa, non più solo in Bayou/Valle/Laguna.
- Shoal: stesse regole di spawn; cambia solo l'etichetta (bioma) usata per il cooldown.

## Cosa non è verificato

- Il lab carica e l'hover regioni risponde (`volcanic_massif` sul vulcano); nessun errore console.
  **Non** ho visto girare shoal/land-life/canopy dopo il cambio (rAF fermo nel preview pane, T-04):
  verificato solo schema + test + diff delle maschere.
- La classificazione per colore è una **prima passata euristica**, tarata a occhio su `base_flat`: non è validata contro una verità di riferimento. Errori visti nell'anteprima: parte del vulcano (grigio-bruno) finisce in `red_badlands`; alcune pareti rocciose nella neve sono `rocky_coast`; le chiome dipinte sono `temperate_forest` solo se la `canopy_mask` le copre o se il verde è scuro.
- Nessun dato di altitudine: `alpine` vs `highland` vs `rocky_coast` si distinguono solo per colore e regione.
- Confini di mare = Voronoi (linee quasi dritte); angoli dipinti (felci/rocce) assegnati alla regione
  più vicina, non esclusi come decorazione.
- Contorno in alto a sinistra del poligono Vette (picchi non coperti da nessuna maschera) disegnato a mano.
- Hover del lab mostra la regione, non ancora il bioma.

## Test

- test unit `mappa2Territories` — copertura 100%, 15+5, adiacenza simmetrica,
  bioma ripetibile, zone shoal e anchor land-life con bioma dichiarato, nessuna chiave `region`/`regionId`.
- test python della Director (11) e test unit della Director aggiornati a `biome`.

## Follow-up

- Validare la classificazione per colore: campione di pixel annotato a mano, o un'altra fonte di altitudine/uso del suolo.
- Mostrare il bioma nell'hover del lab; rifinire a vista i confini di mare e gli angoli.
- Ri-chiavare a bioma PLAN-097 (fauna) e PLAN-098 (meteo) all'implementazione (note già nei piani).
