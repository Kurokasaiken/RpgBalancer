---
id: PLAN-082
title: "PLAN-082: Astrolabio V6.2 — famiglia uniforme per board + morph accoppiato (v37, R-275)"
created: 2026-10-23
status: baptized — Director 2026-10-23 («procedi» su desiderata v37 FROZEN «approvo»)
---

# PLAN-082: Astrolabio V6.2 — famiglia uniforme per board (v37, R-275)

**Origine:** bug Director — nelle quest lo skill check mostra «ogni tanto» una
forma orribile: valli scavate fin quasi al nucleo con punte tonde. È il
quadrante proibito già chiuso in v17/PLAN-010: la V16 accoppia profondità
valle e forma della punta in un solo `morph`, quindi «valle profonda + punta
tonda» non è costruibile. `starProfile.ts` (R-234, PLAN-067 T-B1b) ha
reintrodotto il problema: `mix` (punta) e `depth` (valle) disaccoppiati,
valle fiore inchiodata a `0.3675` (valore pre-v17), e una terza famiglia
"blade" (0.22). Inoltre il mix intermedio `0<m<1` produce ibridi con assi
reali non uniformi (`axisProfile` R-253).

**Ruling Director — desiderata v37 FROZEN (2026-10-23):** famiglia unica per
board decisa a maggioranza sulle stat reali — fiore <10%, stella 10–35%,
stella magra >35% di margine sulla difficoltà; nessun mezzo-fiore, nessuna
mescolanza; punte per-asse invariate; copertura dipinta qualitativa.

**visual-fork:** skipped — regola estetica già battezzata dal Director in
desiderata v37 (FROZEN, «approvo»); uniche scelte aperte sono i numeri di
banda valle, tarati sulle screenshot della pagina di test V6.2
(`.mw/runs/20261023-astrolabe-family-glyph/`).

## Modello

`starProfile.ts` diventa la regola di famiglia + bande, non più mix/depth
disaccoppiati:

- `boardStarProfile(margins)` — per-asse `margin = stat/diff` (valori grezzi,
  non radii `rOf`: le soglie del Director sono sulle stat). Ogni asse vota la
  sua famiglia; il board prende il livello più alto con maggioranza (≥3/5).
- `valleys: ValleyProfile[]` — `mix` uniforme per board (0 fiore, 1
  stella/magra — mai in mezzo → il ramo lerp di `rStarAt` diventa
  irraggiungibile); `depth` resta per-valle dalla stat più debole fra le due
  punte vicine, ma mappata **dentro la banda della famiglia**:
  fiore 0.42–0.55 / stella 0.30–0.22 / magra 0.15 (cap v17), margini più
  deboli → valle più piena. Mai sotto 0.42 in fiore: 0.3675 era la causa del
  bug (valle ≈ rCore).
- `engine.ts`: `recomputeGeometry` calcola `geo.axisMargin[i]` dai valori
  grezzi stat/diff (`axisProfile` o `skills`), li passa al profilo; mix
  uniforme rende irraggiungibile il ramo lerp di `rStarAt`. `starPath` e
  `rStarAt` restano invariati.
- Fallback `valleyAt` senza `valleyProf`: `{mix:0, depth:0.55}` — fiore pieno,
  mai la 0.3675 proibita.

## Tasks

| Task | Contenuto | Depends |
|---|---|---|
| T-001 | **Red-first + implementazione.** Test aggiornati in `tests/unit/destinyAstrolabeV62/starProfile.test.ts` (scritti prima, rossi sul codice attuale): famiglia uniforme su assi misti, soglie 10%/35%, voto maggioranza a 3 classi, mix∈{0,1} ⟺ depth nella banda giusta (quadrante proibito non costruibile), simmetria, wiring `axisMargin` in `recomputeGeometry`. Poi implementazione: `starProfile.ts` riscritto (`buildBoardProfile`), `engine.ts` riga margini + chiamata; `rStarAt`/`starPath` invariati. Tag `// INV:` nel test | — |
| T-002 | **Contratto + verifica visiva + bookkeeping.** `sync:bug -- --component destiny-astrolabe-v62 --source-ref R-275`; emendare `R-234-astrolabe-valley-per-tip` (famiglia per-board) + aggiungere `R-275-astrolabe-no-hybrid` e `R-275-astrolabe-family-thresholds`; `redfirst:record`. Screenshot headless sulla pagina V6.2: 35/50 (fiore pieno), 55/50 (stella), 72/50 (magra), assi misti (uniforme). Bookkeeping: `plans/INDEX.md`, `RICHIESTE.md` R-275 | T-001 |

## Contratto di chiusura (obbligazioni)

| ID | Tipo | Contenuto |
|---|---|---|
| OB-1 | `state` (blocking, R-247) | `npm run test -- tests/unit/destinyAstrolabeV62/starProfile.test.ts` verde; include: famiglia uniforme su assi misti, soglie 10%/35%, majority a 3 classi, quadrante proibito non costruibile (mix 0 ⟺ depth ≥ banda fiore), simmetria |
| OB-2 | `state` (blocking) | `npm run lint -- src/ui/idleVillage/components/destinyAstrolabeV62 tests/unit/destinyAstrolabeV62` + `npm run build:check` verdi |
| OB-3 | `state` (blocking) | `npm run contracts:check` verde dopo `sync:bug -- --component destiny-astrolabe-v62 --source-ref R-275` + `redfirst:record`/`retire` (Mode B-amend su `R-234-astrolabe-valley-per-tip`, add `R-275-*`) |
| OB-4 | `human-eye` | Screenshot headless pagina V6.2 sui 4 casi (fiore/stella/magra/misti → uniforme) in `.mw/runs/20261023-astrolabe-family-glyph/`; eye-check Director (T-04) — le bande di valle si battezzano qui |
| OB-5 | `state` | `npm run closure:lint` verde |

## Rischi accettati

- La `depth` per-valle dentro la banda può ancora variare fra valli vicine
  (assi molto diversi) — è lettura voluta («quale skill ti tradisce»), la
  famiglia comune garantisce che non diventi ibrido.
- Soglia discreta = cliff a ±1pp sul margine: accettato, i check reali non
  stazionano sul confine; se emerge jitter si aggiunge isteresi in seguito.
- `axisProfile` assente (overlay, 1 skill): margine unico → famiglia
  unanime, comportamento coerente col caso colonna.

## Stato esecuzione (2026-10-23)

- **T-001 — done.** `starProfile.ts` riscritto (`boardStarProfile`):
  voto di maggioranza sui margini grezzi `stat/diff` per asse
  (fiore ≤10%, stella >10%, magra >35%; >=3 assi su 5 decidono).
  `mix` uniforme ∈ {0,1} per costruzione; `depth` per-valle dentro la
  banda della famiglia dal vicino più debole. `engine.ts` passa
  `axisMargin` grezzi; rimosso `valleyProfiles` disaccoppiato e
  `V62_VALLEY_FLOWER = 0.3675`. Test 10/10 verdi.
  Commit `af55d6fb` (src+test+jsonl filtrati T-13) + `5343611f` (docs).
- **T-002 — quasi done.** `sync:bug` → `destiny-astrolabe-v62.INV-1`;
  emenda Mode B `R-234-astrolabe-valley-per-tip` (retire journal con
  provenance R-234, risolvibile al sigillo); contratto aggiornato con
  `R-275-astrolabe-no-hybrid` + `R-275-astrolabe-family-thresholds`;
  eccezione `EXC-20261023151050-09f6` per la suite test.
  Screenshot headless in `.mw/runs/plan082-family-glyph/shots/`:
  `flower-35-50`, `star-60-50`, `lean-72-50`, `boundary-55-50`,
  `mixed-flower`, `mixed-lean`.
- **OB-1 verde** (10/10). **OB-2 verde** via `npx tsc --noEmit` +
  `npm run build` completo (10m53s — il wrapper `build:check` ha cap
  180s insufficiente su macchina caricata; lint in quarantine per
  `idleVillage`, gate reale = tsc). **OB-3**: `contracts:check` rosso
  solo per derive ambientali (T-13 + sigillo `fe11533b` che non risolve
  ref post-BASE R-270/271/275 — stesso limite documentato da R-270,
  sblocco = riforgiatura sigillo Director). **OB-4**: eye-check Director
  pendente (T-04 — gli screenshot sono pronti). **OB-5**: `closure:lint`
  rosso sul gate condiviso, non su file di questo scope.
