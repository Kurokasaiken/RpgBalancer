---
title: PLAN-093 — `mappa2` Ambient Land-Life Layer
status: in corso — direzione approvata dal Director (piano incollato in sessione 2026-10-28)
owner: agente locale
created: 2026-10-28
source_request: R-291 (vettori «plan parallelo» + «handoff PLAN-092 land-life») + piano incollato dal Director in sessione
parent: PLAN-089
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore avanzamento/esito)
  - test-results/plan-093-mappa2-ambient-land-life/ (evidence)
---

# PLAN-093 — Ambient Land-Life su `/mappa2-lab`

> **Nota PLAN-099 (2026-10-29): regioni ≠ biomi.** `regions.json` ora contiene 20 *territori* di gioco
> (stile Risiko, mare incluso) e **non sono più biomi**; i biomi sono in `biomes.json` / `biome_ids.png`
> (13, ripetibili in zone lontane). Dove questo piano dice «regione», per le **animazioni** leggi
> «bioma»: `western_forest`→`temperate_forest`, `central_valley`→`meadow`, `bayou`→`mangrove_bayou` (+`tropical_beach`), `coral_lagoon` (isolette)→`tropical_isles`; l'anchor porta `biomeId` (non più `regionId`). Già implementato in `build-mappa2-assets.py`.
> Gli id sotto sono quelli storici (`western_forest`, `central_valley`, `dry_steppe`…) e non esistono più.
> Vedi `plans/PLAN-099-mappa2-territories-and-biomes.md`.


## Provenance

Il Director ha incollato in sessione il piano «PLAN-092 — mappa2 Ambient
Land-Life Layer» chiedendo di eseguirlo in parallelo al dibattito multi-AI web
sul sistema acqua (`mind-weaver/.mw/runs/20261028-mappa2-water-motion/`, tab
separata). Handoff di riferimento:
`.mw/runs/handoff-mappa2-ambient-land-life-20261028.md`.

**Rinumerato PLAN-093**: il numero 092 nel frattempo è stato preso da
`plans/PLAN-092-mappa2-waterfall-painted-scroll.md` (collisione di numerazione
tra sessioni parallele sullo stesso worktree — T-13). Handoff e piano Director
citano «PLAN-092» ma intendono questo lavoro.

## Perché

È la slice più parallela possibile: non tocca cascata/fiumi/laghi, non decide
rotte navali o creature marine, non richiede paintover, non tocca `/game` e dà
subito "vita" alla mappa a costo basso mentre la cascata resta in eye-check e
l'acqua è in dibattito.

## Audit biomi e anchors (T-001 — eseguito)

- **Regioni** (`regions.json`, 10): le zone land-life ad alta leggibilità sono
  `western_forest` (741×661), `bayou` (861×521), `central_valley` (831×521),
  `coral_lagoon` (bordi) e il `DENSE_FOREST_CORE_POLYGON` nel builder
  (la foresta scura di riferimento dello sway).
- **Sorgente anchor reale (T-07):** `canopy_mask.webp` (coverage 5.95%,
  39 patch reali) + `region_ids.png` per l'attribuzione di regione. Gli anchor
  land-life nascono dentro la maschera di foliage vera, non da coordinate
  casuali. `points.json` ha solo 10 punti `land` generici — insufficienti.
- **`pack.fxAtlases`:** le chiavi `ambientLandLife`/`ambientSeaLife`/
  `ambientWeather` puntano a `fx/ambient-*.webp` **inesistenti** (placeholder
  del futuro AmbientDirector) — non le tocchiamo; usiamo chiavi dedicate
  `landLife*`.
- **`fxOn.landLife` esiste già** ma gatea canopy sway + fumo villaggio
  (eredità wanderlust) ed è un flag `effects` → rebuild. Il nuovo overlay ha
  config live separata via ref (pattern `waterfallConfigRef`), mai in `fxKey`.
- **Z-order:** le leaves/motes devono stare sopra terreno/canopy e sotto
  `Foreground.webp` (strisce vignette d'angolo): il container si monta dopo il
  layer `sea` nel loop dei surface layers, prima del foreground.

## Famiglie scelte (2, come da handoff Director)

1. **`leaves`** — foglie/pollen in caduta+sway dalle canopy reali
   (default on, densità bassa). Coerente col canopy sway, leggibile.
2. **`motes`** — polvere/pollen/glow flecks in drift lento sopra chiome,
   prateria e bordi bayou/laguna (default on, alpha bassa).
3. **`flutter`** — silhouette farfalla/insetto, pool cablato ma **default 0**:
   stretch, attivabile solo dopo eye-check (rischio gimmick su scala mappa).

Scartate per la slice: `land_glimpses` (narrativo, troppo facile da rendere
falso), uccelli in volo (già `birds` in Sky), qualunque cosa marina.

## Asset contract

In `scripts/build-mappa2-assets.py` (deterministico, seed da `source_hash`):

```text
fx/land-life/leaf.webp                # ~28×20, ellisse irregolare, tint caldo-verde
fx/land-life/mote.webp                # ~24px, soft radiale, verde-oro pallido
fx/land-life/butterfly.webp           # ~24px, due lobi silhouette
land-life-anchors.json                # anchors da canopy_mask + region_ids
debug/land-life-preview.webp          # overlay anteprima anchors
```

Manifest (strict schema `pack.landLife`, additivo):

```text
pack.fxAtlases.landLifeLeaf    = "fx/land-life/leaf.webp"
pack.fxAtlases.landLifeMote    = "fx/land-life/mote.webp"
pack.fxAtlases.landLifeFlutter = "fx/land-life/butterfly.webp"
pack.landLife = { anchorsFile: "land-life-anchors.json",
                  maxLeaves: 24, maxMotes: 36, maxFlutters: 10 }
bootPhases["ambient-fx"] += i 3 file land-life
```

Ogni anchor: `{id, x, y, regionId, type, weight, radius}` — `type ∈
{leaf, mote, flutter}`; leaf da `canopy_mask`; mote da canopy dilatata + terra
nelle regioni scelte; flutter da terra in `coral_lagoon`/`central_valley`/`bayou`.
Nessun anchor in regioni senza candidatura: meno entità > falsi positivi.

## Runtime contract

In `PixiWorldMap.tsx`, blocco dedicato (stesso stile del blocco waterfall):

- `landLifeBox` nel `world` dopo il layer `sea` (sopra canopy, sotto foreground);
- pool sprite senza alloc in tick: leaves ≤24, motes ≤36, flutters ≤10, ogni
  entità legata a un anchor del suo tipo (spawn/drift/respawn nel `radius`);
- jitter deterministico `hash01` (nessun RNG in tick);
- `landLifeConfigRef` letto ogni tick: `enabled:false` → `box.visible=false`,
  **nessun rebuild** (mai dentro `fxKey`);
- `reducedMotion` → overlay statico/nascosto (motes fermi alpha bassa, foglie e
  flutter non spawnano);
- nessun full-screen pass, nessun mesh/shader, Canvas-safe;
- solo pack `mappa2` (wanderlust invariato).

```ts
export interface PixiLandLifeConfig {
  enabled: boolean;
  leaves: number;   // 0..1
  motes: number;    // 0..1
  flutter: number;  // 0..1
  speed: number;    // multiplier
  opacity: number;  // 0..1
}
// defaults: enabled true, leaves .45, motes .55, flutter 0, speed 1, opacity .55
```

## Lab controls (tab `land`)

Sotto-sezione compatta `land life` sotto `forest sway`: toggle + slider
`leaves`/`motes`/`flutter`/`speed`/`opacity` → prop `landLifeConfig` live.
`LabDefaults`/`CODE_DEFAULTS`/endpoint Vite `NUMERIC_KEYS` estesi
(`landLifeOn`, `landLifeLeaves`, `landLifeMotes`, `landLifeFlutter`,
`landLifeSpeed`, `landLifeOpacity`).

## Tasks

| Task | Cosa | Output verificabile | Depends |
|---|---|---|---|
| T-001 | Audit biomi/anchors + scelta famiglie + questo piano | audit nel piano, plan file | — |
| T-002 | Pipeline: `fx/land-life/*` + `land-life-anchors.json` deterministico + preview debug | file emessi, anchors dentro canopy_mask | T-001 |
| T-003 | Schema `pack.landLife` + fxAtlases + estensione fixture `useWorldSurface` | manifest parse verde, test unit | T-002 |
| T-004 | Overlay sprite pools Canvas-safe in `PixiWorldMap` | movimento visibile live, zero alloc tick | T-003 |
| T-005 | Controlli live tab Land + `LabDefaults`/endpoint | slider→ref live, no rebuild, defaults persistiti | T-004 |
| T-006 | Spec e2e permanente + verifica visiva + safeguards | spec verde + screenshot accettati | T-004,T-005 |

## Contratto di chiusura — obbligazioni

- **OB-1** Unit: `npm run test -- tests/unit/idleVillage/useWorldSurface.test.ts`
  verde (fixture estesa a `pack.landLife`).
- **OB-2** Regression permanente (R-247): `tests/e2e/idleVillage/mappa2LandLife.spec.ts`
  — `ready: yes` → frame t0/t1: diff>noise nel ROI foresta (moto reale),
  diff≈0 in guard-region mare/roccia (dipinto intatto); toggle land-life senza
  rebuild (stessa identità `__pixiApp`); reduced-motion emulato → diff≈0.
- **OB-3** Safeguards: `npm run lint -- <scope>`, `npm run build:check`,
  `npm run closure:lint` verdi.
- **OB-4** Evidence: screenshot/crop in `test-results/plan-093-mappa2-ambient-land-life/`
  con scarti conservati e soli accettati al Director (ruling visivo 2026-10-28);
  p95 frame dal readout lab.
- **OB-5** `human-eye` Director: review su screenshot/visit accettati (T-04 —
  il piano non chiude la qualità percettiva da solo; non bloccante).
- **OB-6** `verification.json` → `verify:bundle` → `bundle.json`; vettore in
  RICHIESTE chiuso solo con citazione `bundle:`.

## Acceptance

- ≥2 famiglie visibili senza overlay aggressivo; entità legate ad anchor reali.
- `land life` off rimuove subito l'overlay senza rebuild.
- Canvas fallback senza errori; ticker vivo >10s (REG-001).
- Reduced-motion non anima.
- Nessun uso di `base_flat.clean.webp` come base runtime; niente repaint.
- Controlli live compatti nella sola tab `land`.
- `build:check` + test scoped verdi; screenshot accettati prima della review.

## Non-goals

- Navi, kraken, pesci, scie, fiumi, lake shimmer (dibattito/plan acqua).
- Villaggio/evoluzione edifici; produzione `/game`; paintover.
- Modifiche al blocco/tab waterfall o al dipinto.
- `land_glimpses`/creature rare (follow-up futuro).

## Trappole citate

- **T-04**: nessun claim di moto senza due frame/diff + occhio agente; Director
  review a parte.
- **T-07**: anchors da `canopy_mask`/regioni reali, non simulazione parallela.
- **T-13**: worktree condiviso — lavoro PLAN-091/092 uncommitted mai toccato,
  mai committato scoped; failure sospetti → retry prima di fixare.
- **T-15**: `page.evaluate` solo stringhe nelle spec tsx.
- **T-22**: giudizio percettivo solo sul runtime che mostra l'effetto
  (`vite preview`, non dev).

## Visual-fork

`skipped` — famiglie e defaults scelti dal piano/handoff Director
(leaves+motes on, flutter dietro eye-check); nessuna alternativa visiva in
competizione decisa dall'agente.

## Implementation log — 2026-10-28

- **T-001 (audit):** regioni/biomi auditati; sorgente anchor scelta =
  `canopy_mask` + `region_ids` (T-07). Piano scritto come **PLAN-093**
  (numero 092 preso da waterfall-painted-scroll, collisione sessioni).
- **T-002:** pipeline emette `fx/land-life/{leaf,mote,butterfly}.webp` +
  `land-life-anchors.json` (38 anchor: 18 leaf/14 mote/6 flutter, regionId
  attribuito) + `debug/land-life-preview.webp`. Verifica no-clobber: tutti
  gli output PLAN-091 **byte-identici** al rilancio (script deterministico).
- **T-003:** `WorldSurfacePackLandLifeSchema` strict + `pack.landLife`
  opzionale + fxAtlases `landLife*`; fixture test estesa. Unit **12/12 verde**.
- **T-004:** blocco land-life in `PixiWorldMap` — container sopra sea/canopy,
  sotto foreground; pool leaves 18/motes 36/flutters 10, jitter `hash2`
  deterministico, `landLifeConfigRef` live no-rebuild, reduced-motion gated.
  Convissuto con edit live PLAN-092 painted-scroll (T-13, sezioni disgiunte).
- **T-005:** tab Land — toggle `land life` + 5 slider live; `LabDefaults`/
  `CODE_DEFAULTS`/`NUMERIC_KEYS` estesi (`landLife*` + `waterfallPainted`
  dell'altra sessione preservato, duplicati ripuliti).
- **T-006:** spec `tests/e2e/idleVillage/mappa2LandLife.spec.ts` **2/2 verde**
  su preview build: ROI anchor animata, guard vulcano statica, toggle
  `land life` senza rebuild (`__pixiApp` invariato), reduced-motion frozen.
  Evidence `test-results/plan-093-mappa2-ambient-land-life/`
  (frame a/b, off, diff-x6, crop bayou — autovalutazione: overlay sottile,
  non aggressivo).
- **Safeguards:** lint scoped 0 errori; `build:check` verde al retry
  (1° timeout = carico condiviso T-13); unit 12/12.
- **Bundle:** `.mw/runs/plan093-mappa2-ambient-land-life/bundle.json` —
  **OB-1/OB-2/OB-3/OB-4 tutti PASS** (OB-2 stabilizzato: seam deterministico
  `__landLifeBox.visible` + asserzione ON→OFF; confronto pixel "off deve
  calare" era fragile perché la ROI bayou contiene canopy/foam animati).
  Verdict `BLOCKED` solo da `contracts:check`/`closure:lint` fail-closed su
  stato worktree condiviso — **identico al ruling pendente PLAN-091**:
  Mode B-amend su `worldSurfaceConfig.ts` (helper import-closure di ~25
  contratti, già amendato da PLAN-091: il mio landLife si somma allo stesso
  pending), ~30 INV uncapturable, `_tmp-wf-*.cjs` altrui senza mapping,
  STRICT_FILES multi-owner, R-283 unresolvable. OB-5 `human-eye` Director
  pendente (non bloccante). **Task `in corso`, non `fatta`** — attende il
  ruling Director che sblocca anche PLAN-091 + eye-check visivo.
- **Iterazione post eye-check Director (2026-10-28, «foglie non
  proporzionate alla foresta, un po' in giro, circoscrivere al bioma»):**
  leaf anchors gated su densità locale canopy ≥0.35 (interior foliage, non
  slivers) + raggio 90→58; runtime: spawn nell'inner 55%×22% del raggio,
  caduta 90–180→36–70px, sway 14–36→6–15px, scala 0.45–0.9→0.30–0.54.
  Spec ri-verde 2/2 su rebuild completo; evidence rigenerate.
- **Iterazione 2 post eye-check (2026-10-28, «foglie comunque enormi
  rispetto agli alberi»):** scala foglia 0.30–0.54 → **0.14–0.26** (≈4–7
  world px, proporzionata alle chiome dipinte ~40px). Flutter: era
  invisibile perché default 0 + scala 0.55 → scala 0.8, alpha base
  0.55→0.7 (resta spento di default, slider `flutter` lo attiva).
