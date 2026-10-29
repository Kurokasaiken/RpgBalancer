---
title: 'PLAN-103 — Macro plan animazioni mappa2'
status: draft — da battezzare
owner: Mind Weaver (planner)
created: 2026-10-29
source_request: R-295
parent: PLAN-089
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (voce R-295 + esito)
  - plans/ASSETS-mappa2.md (resta l'elenco unico asset — il macro rimanda, non duplica)
---

# PLAN-103 — Macro plan animazioni `mappa2`

Macro plan: organizza la famiglia dei piani figli di [PLAN-089](PLAN-089-mappa2-living-world.md)
che portano le animazioni sulla nuova mappa. Non contiene implementazione:
definisce **stato, modello di spesa, dipendenze, gap e gate di famiglia**.

La tabella Director (2026-10-29, in R-295) è la fonte delle colonne
«Modello economico» / «Modello forte»; questo documento la rende viva e
linkata, e aggiunge le righe che la versione a mano non copriva.

## Regola economico/forte

- **Modello economico** = la fetta minima che sblocca giudizio o misura:
  spec/E2E, schema e fixture, controlli nel lab, harness di misura. Chiudibile
  senza giudizio estetico.
- **Modello forte** = la feature completa fino al giudizio visivo del Director
  (T-04: claim percettivi solo con testimone che può vedere).
- Un piano può chiudere la parte economica e restare aperto sulla forte; lo
  stato in `plans/INDEX.md` riflette il piano intero, non la fetta.

## Stato della famiglia

| Piano | Stato (INDEX) | Modello economico | Modello forte |
|---|---|---|---|
| [091](PLAN-091-mappa2-waterfall-prototype.md)/[092](PLAN-092-mappa2-waterfall-painted-scroll.md) Cascata | quasi fatto | spec E2E finale | ogni ritocco visivo |
| [093](PLAN-093-mappa2-ambient-land-life.md) Foglie/motes | bundle OB-1..4 PASS; BLOCKED su `contracts:check` + OB-5 re-look Director | — (eventuale pulizia) | — |
| [094](PLAN-094-mappa2-ambient-director.md) Vita marina | in corso | controlli lab, report | nucleo AmbientDirector (scheduler deterministico), sirena e coda di balena |
| [101](PLAN-101-mappa2-sea-routes.md) Rotte/navi | candidate — da battezzare | schema/validator rotte + fixture (già dentro T-000) | navi+wakes runtime, atlas heading, eye-check |
| [095](PLAN-095-mappa2-secondary-water.md) Fiumi/laghi | manca T-004 | spec E2E di base | spec con mutanti e verifica visiva |
| [096](PLAN-096-mappa2-max-zoom-aaa-detail.md) Alta risoluzione | bozza | harness di misura (T-001) | tutto il resto: streaming, budget GPU, ricetta del dettaglio |
| [097](PLAN-097-mappa2-land-fauna.md) Fauna di terra | bozza, bloccato sugli asset | schema e test (T-002) | runtime sull'AmbientDirector, giudizio sulle creature |
| [098](PLAN-098-mappa2-regional-weather.md) Meteo | bozza | sprite procedurali di mist e braci (v1) | pioggia locale, nuvole sulle vette e lampi (giudizio visivo) |
| [099](PLAN-099-mappa2-territories-and-biomes.md) Territori/biomi | implementato, da rifinire a vista | — | rifinitura a vista |
| [100](PLAN-100-mappa2-map-audio-and-secrets.md) Audio e segreti | bozza | schema e test di `secrets.json` | priorità sui clic di gioco, curva audio da tarare a orecchio |
| Pulizie varie | — | non spedire `debug/` (6,6 MB) nella build, togliere i ~19 script `_tmp-*` | — |

## Correzioni rispetto alla tabella a mano

- **Rotte e navi non stanno dentro 094**: il dibattito AmbientDirector le ha
  mandate a slice 2 e sono diventate [PLAN-101](PLAN-101-mappa2-sea-routes.md)
  (`routes.max(0)` fino a slice 2 nel contratto 094). 094 tiene il nucleo
  scheduler + shoal + sirena/coda di balena.
- **093 non è solo «in pausa»**: il bundle è `BLOCKED` su
  `contracts:check`/`closure:lint` (drift worktree condiviso, stesso pending
  di 091) e OB-5 attende il re-look Director sul risultato circoscritto.
- **Giorno/notte**: è già assegnato alla seconda fetta di 098 (sezione
  rinviati del piano), non serve riga separata.
- **Rare wonders ridipinti** (balena A5, kraken A6, nave pirata A7): il
  vettore «rare wonders» non è mai diventato un piano; oggi penzola come
  nota di 094/ASSETS. Vedi righe-gap sotto.

## Onde e dipendenze

- **Onda 0 — sblocchi**: ruling `contracts:check`/`closure:lint` pendente
  (blocca 091 e 093); fix schema `pack.ambient` (boot mappa rotto, hunk
  PLAN-094); PLAN-095 T-004 (E2E + mutanti + visual witness).
- **Onda 1 — acqua e schedulazione**: 094 nucleo (scheduler + shoal),
  098 v1 (mist/braci), rifinitura visiva 099.
- **Onda 2 — vita**: 101 navi+wakes (dipende da eye-check shoal 094 e dal
  validator rotte), 097 fauna (dipende da 094 + asset A1/A2), 100
  audio/segreti.
- **Onda 3 — qualità**: 096 hi-res (dopo il suo harness T-001), LOD/culling/
  reduced-motion (gap G-2), benchmark+witness (gap G-3), village-stage (G-4).
- **Onda 4 — chiusura**: review Director + gate paintover (T-013),
  swap produzione `/game` (T-014), pulizie finali (G-7).

## Cosa manca — righe-gap proposte

Voci coperte dal mandato PLAN-089 ma non da nessun piano figlio. Numerazione
proposta da PLAN-104 in su, o assorbimento nei piani esistenti — decisione
Director.

| Gap | Cosa | Modello economico | Modello forte |
|---|---|---|---|
| G-1 | **Porting effetti esistenti** (PLAN-089 T-007): sea/deep-sea/coast foam retune, seaMarks, nuvole+ombre, canopy/terrain breathing — fatto a pezzi nel lab, mai certificato | checklist famiglia→effetto + spec di parità | retune visivo per famiglia, eye-check Director |
| G-2 | **LOD/culling/reduced-motion/quality profile** (T-010): decisione 12 di PLAN-089, nessun figlio la copre | matrice reduced-motion compilata + thresholds in config | culling misurato per famiglia, quality profiles |
| G-3 | **Benchmark + visual witness** (T-011): nessun figlio lo copre | harness di misura (condivisibile con PLAN-096 T-001) | report p50/p95/worst/>33/>50 + video witness per scenario |
| G-4 | **Village-stage pilot** (T-012): bloccato su asset A9 (lista incarnazioni da definire) | contratto patch blend/tone/grain + fumo runtime | `village_stage_0` + cross-fade, giudizio Director |
| G-5 | **Rare wonders ridipinti** (balena, kraken, nave pirata — A5/A6/A7): ruling Director 2026-10-29 «piano suo» → **PLAN-104** (da scrivere); arte Director richiesta | lista pose/asset + contratto rare lock (già in 094) | rig + animazioni con kit, giudizio visivo |
| G-6 | **Strutture scoperte persistenti** (approvata 2026-10-29, A10 «da assegnare»): comparsa dopo scoperta + stato visibile; ruling Director 2026-10-29 «piano suo» → **PLAN-105** (da scrivere) | contratto stato→tavola + 1 struttura pilota | set strutture + integrazione scoperte |
| G-7 | **Chiusura produzione** (T-013/T-014): review testbed, gate paintover, swap `/game`, e il pack `debug/`+`_tmp-*` fuori dalla build | checklist review + esclusione asset | rerun pipeline post-paintover su nuovo `sourceSha256` + swap manifest |
| G-8 | **Debito di chiusura**: PLAN-091 OB-5 + ruling contracts:check; PLAN-093 re-look; canopy coverage eye-check (ruling 2026-10-28) | raccolta witness pronti per un review round unico (modello PLAN-068) | ruling Director per voce |

## Gate di famiglia

Il macro è `completed` quando:

1. Ogni figlio è `completed`/`suspended`/`superseded` in `plans/INDEX.md` e
   le righe-gap sono disposizionate (piano proprio, assorbite o `open` con
   motivazione).
2. Lo swap produzione è deciso (fatto o deferito con motivazione) — il
   mandato PLAN-089 vieta la sostituzione senza acceptance visiva.
3. La build non spedisce `debug/` né gli script `_tmp-*`.

## Decisioni aperte per il Director

- ~~G-5 rare wonders~~: deciso — piano dedicato **PLAN-104** (ruling Director 2026-10-29).
- ~~G-6 strutture persistenti~~: deciso — piano dedicato **PLAN-105** (ruling Director 2026-10-29).
- G-3 benchmark: harness condiviso con PLAN-096 T-001 o misure separate?
- ~~Priorità vs PLAN-043~~: deciso — PLAN-043 **in pausa** (Director 2026-10-29: rifacimento estetica completo); la famiglia mappa2 ha la corsia.
- Se `/mappa2-lab` resta dev-only anche in produzione (gate build) o diventa
  superficie tuning permanente (già aperto in PLAN-089).

## Contratto di chiusura (di questo macro plan)

- OB-1: il file esiste e ogni link `PLAN-*` citato punta a un file reale in `plans/`.
- OB-2: riga in `plans/INDEX.md` con link e stato.
- OB-3: voce R-295 in `RICHIESTE.md` aggiornata all'esito.
- OB-4 (living): la tabella «Stato della famiglia» viene riallineata a
  `plans/INDEX.md` quando un figlio cambia stato — il macro è documento vivo.
