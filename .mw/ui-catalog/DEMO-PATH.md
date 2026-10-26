# Percorso demo — ordine di lavoro del catalogo (bozza 2026-10-26)

Ordine per quanto il giocatore ci passa nei primi 15 minuti della demo Next Fest (core loop, «teaser + demo»).
Stato = `status` del manifest. «Serve» = cosa manca davvero. Basato sui ruling `brushwork-1`, `icons-1`, `halo-1`, `motion-1`, `targets-1`, `purple-3`.


## Livello 1 — Primi minuti (tutti li vedono)

| componente | stato manifest | serve | tipo |
|---|---|---|---|
| `title-screen` | documented | Key art di sfondo (dalle capsule); lastra di famiglia sui 3 bottoni | asset |
| `game-boot-screen` | documented | Solo allineamento a rubrica | — |
| `hud-top-tabs` | in_review | Ruling HUD = A (pulita); resta terzo tab centrale (hud-tabs-4) e regolo velocità (hud-tabs-3) | codice |
| `nav-bar` | in_review | **Ruling M1 (2026-10-26)**: da implementare (slot uguali, requisiti, recenter nel dock) | codice |
| `hud-corner` | in_review | **Ruling (2026-10-26)**: dock con recenter, menu senza «Pannelli», HUD nascosta = occhio chiuso senza etichetta | codice |
| `pixi-world-map` | documented | Pochi problemi emersi; overlay mappa = «debug draw» (da verificare) | verifica |
| `map-quest-poi` | documenting | Stato non raggiunto in cattura; medaglione vuoto (P0 3/3) | cattura + asset |
| `objective-cartouche` | documenting | Non documentato (non raggiunto) | cattura |
| `region-tooltip` | documented | — | — |
| `hud-tooltip` | documented | — | — |

## Livello 2 — Villaggio ed economia

| componente | stato manifest | serve | tipo |
|---|---|---|---|
| `village-screen-view` | documented | Il registro vive qui (non sulla mappa) | — |
| `village-building-pins` | documented | «Medaglione vuoto» P0: 11 icone di edificio dipinte (D-1 = B) | asset ×11 |
| `village-slot-overlay` | documented | Stessa famiglia di icone | asset |
| `village-registry` | documented | Effetto/costo al posto del flavor; stato forma+testo; overflow | codice |
| `village-building-tooltip` | documented | Segue il registro | codice |
| `village-stash-panel` | documented | Icona dipinta per oggetto (INV-1 B) | asset ~10 |
| `merchant-panel` | documented | Ritratto del mercante + icone oggetto | asset |
| `materic-roster-component-v2` | documented | Riferimento di stile (Roster V2); difetti noti §4.5 | codice |
| `hero-sheet-panel` | documented | Glifi statistiche incisi (cerchi con simbolo = vietati 6b) | codice |

## Livello 3 — Cuore del gioco: quest

| componente | stato manifest | serve | tipo |
|---|---|---|---|
| `quest-expedition-detail` | documented | Testata dipinta già presente | codice |
| `quest-run-window` | unassigned | TDZ risolto sul branch `claude/sharp-cerf-2f1461` (non fuso): poi cattura | sblocco + cattura |
| `quest-stage-cluster` | unassigned | Come sopra | sblocco + cattura |
| `quest-reward-popup` | unassigned | Racconto: vignetta ad hoc in cornice (B) | asset + codice |
| `quest-journey-route` | unassigned | Come sopra | sblocco + cattura |
| `quest-outcome-toast` | unassigned | Come sopra | sblocco + cattura |
| `world-surface-event-card` | documenting | Non documentato | cattura |
| `world-surface-event-shroud` | documenting | Non documentato | cattura |
| `hero-level-ceremony` | documented | Ritratti esistenti, costo asset ~0 | codice |
| `hud-event-ledger` | documented | — | — |

## Livello 4 — Perdita, memoria, sistema

| componente | stato manifest | serve | tipo |
|---|---|---|---|
| `settlement-lost-overlay` | documented | Bottone e grigiato FATTI; manca la vignetta ad hoc (la fai tu); manca banda d'ottone e token (colori scritti a mano) | asset + codice |
| `memorial-panel` | documented | Racconto: vignetta ad hoc | asset + codice |
| `legacy-reliquary-panel` | documented | — | codice |
| `load-game-panel` | documented | Miniatura automatica al salvataggio (codice, non arte) | codice |
| `settings-panel` | documented | — | — |
| `new-game-confirm` | documented | — | — |
| `stage-edge-strips` | documented | — | — |

## Livello 5 — Fuori dal giro estetico

| componente | stato manifest | serve | tipo |
|---|---|---|---|
| `director-panel` | documented | Strumento di sviluppo | — |
| `tuning-panel` | documented | Strumento di sviluppo | — |
| `error-boundary` | documenting | Solo allineamento minimo | — |

_Non collocati: nessuno._

## Cosa blocca cosa

1. ~~Ruling su nav-bar e hud-corner~~ **fatto 2026-10-26**: il Livello 1 è ora implementabile (nav-bar, hud-corner, barra in alto).
2. **Fusione del branch del fix TDZ** sblocca la documentazione di 5 componenti quest.
3. **Un set di 11 icone di edificio + ~10 di oggetto** (dipinte, stessa famiglia delle 18 esistenti) sblocca pin, slot, registro, magazzino e mercante insieme.
4. **Una vignetta ad hoc per schermata di racconto** (villaggio perduto, memoriale, ricompensa): la prima la generi tu.
