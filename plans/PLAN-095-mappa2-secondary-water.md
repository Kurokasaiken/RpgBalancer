---
title: PLAN-095 — `mappa2` Secondary Water Motion (Rivers, Lakes & Confluences)
status: in corso — battezzato Director («procedi»)
owner: agente locale
created: 2026-10-28
source_request: R-291 (sistema acqua secondario: fiumi, laghi e shimmer) + dibattito multi-AI web `20261028-mappa2-water-motion` CONVERGED
parent: PLAN-089
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore avanzamento/esito)
  - test-results/plan-095-mappa2-secondary-water/ (evidence)
---

# PLAN-095 — Secondary Water Motion su `/mappa2-lab`

## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261028-mappa2-water-motion/`:
CONVERGED su `artifact-r003.md`, sha256
`da8719f29d5cae37a21906757860fe12a09acbd062f11abf3bfd20659b9de870`.
Elettorato ACCEPT: claude, gemini, deepseek. Esclusi: chatgpt
(`provider_dead`, harvest echo adapter — obiezione già registrata WITNESS-12),
grok (ABSENT dalla clarification). 13 WITNESS registrate e dispositionate,
0 aperte. Report: `report.md` nella run. Handoff originale:
`.mw/runs/handoff-mappa2-water-motion-20261028.md`.

**Numerato PLAN-095**: l'artifact dibattito citava «PLAN-094», ma il numero
094 è riservato al vettore sea-life (RICHIESTE 2026-10-28, «handoff PLAN-094
sea-life»).

## Scope (artifact + correzioni da T-001 data-probing)

**In-scope (riscritto dopo probing HSV/gate offline — vedi «Finding»):**
1. `river_central` (`y≈585..960`, outflow bacino → estuario) — unico vero
   fiume della mappa; **catena di pozze** (non canale sottile): streak
   segmentati sui canali + `poolGlints` shimmer sulle pozze; recupera i px
   assorbiti da `sea_mask`; tint `#8fd8e2`; exclusion polygon sulla pozza
   delta aperta.
2. `west_shallows` (`x≈860..1230,y≈655..710`) — campo di ruscelletti
   frammentati da guadi/vegetazione → feature **glint**, non fiume.
3. `lake_alpine` (10 glint), `lake_canyon_pond` (1), `west_shallows` (4),
   `lake_bayou_west` (3), `lake_bayou_east` (1) — glint deterministici
   `hash01`, punti ≥3-4px dal bordo, **mai** scroll lineare sui laghi.
4. 6 confluenze: foam pulse + wake `radius ≤10%` larghezza canale (~2px).

## Finding T-001 (2026-10-28) — divergenze rispetto all'artifact

- **`river_east_canyon` NON È ACQUA**: il nastro chiaro attraverso il canyon è
  un sentiero dipinto (probing HSV: zero teal lungo il corridoio). Rimosso
  dai fiumi; la sola acqua reale è la pozza teal (1840-1890,810-890) →
  `lake_canyon_pond`. Il design kill-switch ha funzionato in authoring:
  nessun falso positivo in produzione.
- **`river_west_branch` è frammentato** → `west_shallows` (glint), non river.
- **`~sea` rimosso dal class mask**: il fiume centrale inferiore È `sea` per
  connettività — il corridoio autoriale è l'identità, non la soglia globale
  (proprio la tesi del dibattito). `internal_water` +6.893 px recuperati.
- **Gate calibrati sul dipinto reale**: coverage rects+glints ≥85% interno
  eroso (comp residuo ≤300px, pozza organica bounded — non wedge
  strutturale); ratio overdraw ≤8× (fiumi sottili, ~5k px² assoluti);
  `bend ≤28°` via fillet Chaikin auto; `θ_joint <60°`; cap 22 segmenti.
- **Larghezza rect** = cross-section reale del class mask sulla normale del
  leg (max+4px), non stima da dist-transform.
- **`render = eroded_class ∩ rect_union`** (strettamente dentro i rect).

**In-scope originale (per confronto):**
1. ~~`river_west_branch`~~ → `west_shallows` (glint feature)
2. ~~`river_east_canyon`~~ → `lake_canyon_pond` (era sentiero dipinto)

**Out-of-scope:** flow-field/mesh/shader; modifiche a `sea_mask`/`Mare.webp`/
`coast_distance`/`foam` (byte-identical); foam continuo sulle rive;
navi/fauna (riservato a T-009); paintover; `/game` untouched.

## Architettura (sintesi artifact-r003)

- **Mask split (WITNESS-06):** `river_*_classMask` non erosa (solo semantica:
  aggiorna additivamente `internal_water_mask`, +≥15k px); `river_render_mask`
  erosa 2.5–4px → `safePolygons` disgiunti (≤400 vert totali, ≤14 segmenti,
  bbox overdraw ≤2.5× mask & ≤150k px²).
- **Bend coverage (WITNESS-13):** rect estesi ai joint ≥ `w·tan(θ/2)`;
  gate offline `feature_render ∖ ∪rects` ≤0.25% e nessun componente scoperto
  >4px; overlap interno ≤3/255 luminance peak; `θ_joint <60°` else cut.
- **Asset:** 1 tile nuovo `fx/water/river_flow_tile.webp` (256×256 lossless,
  alpha=0 tra filamenti, sha256 pinned, checked-in o encoder pinned);
  riuso `ripple_ring`/`mist_blob` → 34 texture totali (~110.25 MB).
- **Contratti:** zero cascata `contracts:check` — `worldSurfaceConfig.ts`
  byte-identical; nuovo asset `secondary-water.json` + leaf schema dedicato
  `src/ui/idleVillage/config/mappa2SecondaryWaterConfig.ts` (Zod strict),
  parse obbligatorio solo in `/mappa2-lab`, `/game` non lo fetcha mai.
- **Runtime:** `secondaryWaterBox` dopo `sea` (Mare.webp) e prima di
  `canopy`/`Foreground`/`clouds` (z-order asserito E2E); 1 `Graphics` mask
  unificata per feature (`mask.visible=false` vietato); segmenti
  `TilingSprite` orientati joint-extended; pool glint/wake preallocati;
  nessuna allocazione nel ticker.
- **LOD 2 stadi:** `lodScale` 1.0/1.5/2.2 (z≥0.65 / 0.32–0.65 / <0.32) +
  `lodAlpha` clamp ≥35% a z=0.18 (mai invisibile); modulo `tilePosition`.
- **Live controls:** `secondaryWaterConfigRef` (pattern `waterfallConfigRef`),
  mai in `fxKey`; tab Water: `riversOn`, `eastCanyonOn`, `riverFlowSpeed`,
  `riverFlowStrength`, `lakeShimmer`, `confluenceFoam`.
- **Reduced-motion:** scroll e spawn fermi, overlay statico presente
  (asserito, non solo diff≈0). Niente `Math.random()` nel tick.

## Tasks

- [x] **T-001** Pipeline: corridoi autoriali + esclusioni, `classMask`/
  `renderMask` split, `safePolygons`, segmenti joint-extended, glint/confluence
  anchors, debug sheet `secondary-water-preview.webp`; gate offline completi
  (contenimento, disgiunzione, union ±3%, waterfall polygon 0-overlap,
  vertici/segmenti/bbox budget, anti-uphill con tolleranza flat-segment,
  bend-coverage, east-canyon IoU/canopy, glint ≥4px). Riferimento
  east-canyon checked-in `scripts/mappa2/fixtures/` (CI-riproducibile).
  `files:` `scripts/build-mappa2-assets.py`, `public/assets/world/mappa2/base/
  masks/{river_flow,lake_shimmer,internal_water}_mask.webp`,
  `public/assets/world/mappa2/base/debug/secondary-water-preview.webp`,
  `scripts/mappa2/fixtures/` · `depends:` none
- [x] **T-002** Tile lossless + `secondary-water.json` + schema leaf:
  `files:` `scripts/build-mappa2-assets.py`,
  `public/assets/world/mappa2/base/fx/water/river_flow_tile.webp`,
  `public/assets/world/mappa2/base/secondary-water.json`,
  `src/ui/idleVillage/config/mappa2SecondaryWaterConfig.ts`,
  `tests/unit/idleVillage/mappa2SecondaryWaterConfig.test.ts`
  · `depends:` T-001
- [x] **T-003a** Runtime core + z-order (`PixiWorldMap.tsx`):
  `secondaryWaterBox` tra `sea` e `canopy`; Graphics mask unificata per
  feature; `TilingSprite` segmentati; pool glint (20) + confluence (12);
  WebGL+Canvas, 0 allocazioni/tick. · `depends:` T-002
- [x] **T-003b** LOD + reduced-motion + live controls + test hooks
  (`PixiWorldMap.tsx`, `mappa2-lab.tsx`): `secondaryWaterConfigRef`,
  `window.__pixiBuildCount` (in costruttore `Application`),
  `window.__secondaryWaterDebug` (DEV). · `depends:` T-003a
- [ ] **T-004** E2E + mutant + visual witness:
  `tests/e2e/idleVillage/mappa2SecondaryWater.spec.ts` —
  z-order assert; freeze altri layer + ON-minus-OFF stesso camera;
  guard ring 4–10px boundary-straddling; direction sign via cross-correlation
  `dot>0`; joint-corner check + mutant `shrink-rects` deterministico
  (`--mutant=shrink-rects` pipeline flag); renderer name asserted
  (WebGL + forced Canvas); `__pixiBuildCount===1` dopo toggle; reduced-motion;
  budget (≤36 tex, ≤112MB, p95≤33ms). Costanti gate pinnate in modulo
  condiviso (nota claude). Screenshot/crop in
  `test-results/plan-095-mappa2-secondary-water/` WebGL+Canvas @zoom 1.0/0.18.
  `files:` spec + test-results · `depends:` T-003b

## Contratto di chiusura — obbligazioni

- **OB-1** Unit: `npm run test -- tests/unit/idleVillage/mappa2SecondaryWaterConfig.test.ts`
  PASS — schema strict parse + negative tests (>14 seg, >400 vert, uphill,
  sha mismatch).
- **OB-2** Regression permanente (R-247): `tests/e2e/idleVillage/mappa2SecondaryWater.spec.ts`
  PASS WebGL + forced Canvas, mutant suite (nomask/freeze/reverse/
  hidden-mask/wrong-zorder/shrink-rects) tutti FAIL come previsto.
- **OB-3** Safeguards: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run closure:lint`, `npm run contracts:check`
  (deve restare PASS senza Mode B-amend: `worldSurfaceConfig.ts` intatto).
  Pipeline: gate offline T-001 tutti PASS; `sea_mask`/`Mare`/`coast_distance`/
  `foam` sha256 invariati; `internal_water` superset +≥15k px.
- **OB-4** Evidence: screenshot/crop + ON/OFF + due-frame diff in
  `test-results/plan-095-mappa2-secondary-water/` (zoom 1.0 e 0.18,
  WebGL e Canvas, joint inclusi — nota claude).
- **OB-5** `human-eye` Director: review visiva accettata (T-04 — diff e
  metriche non chiudono il claim).
- **OB-6** `verification.json` → `verify:bundle` → `bundle.json`; vettore in
  RICHIESTE.md; chiusura `fatta` con `bundle:`.

## Rischi principali

- `river_east_canyon` cromatica locale fragile vs vegetazione → gate IoU
  pre-manifest + kill-switch reversibile a v1.1 (self-check seq 66).
- Overdraw Canvas su rect estesi → budget bbox ricomputato *dopo*
  l'estensione (nota claude).
- Seam leggibile ai joint → crop reali obbligatori in T-004 entrambi i
  renderer (numerico non basta, nota claude).
- libwebp drift su tile → checked-in artifact o encoder pinned (nota deepseek).

## Avanzamento 2026-10-28 (sessione executor)

- **T-001 done**: `build_secondary_water` in pipeline, tutti i gate offline
  PASS, build completo OK. Finding onesto documentato sopra (east=sentiero,
  west=shallows, fiume=catena di pozze con pool glints).
- **T-002 done**: `river_flow_tile.webp` lossless deterministico (sha
  `90ed4336…` pinned), `secondary-water.json` emesso e validato contro
  `Mappa2SecondaryWaterSchema` (PARSE OK sul file reale), 9/9 unit test
  verdi. `worldSurfaceConfig.ts` intatto.
- **T-003a/b done (pending E2E)**: `secondaryWaterBox` dopo `sea` e
  `landLifeBox`; fetch + parse lab-mandatory di `secondary-water.json`;
  Graphics mask unificata per feature; `TilingSprite` orientati con LOD a 2
  stadi; glint/wake pool preallocati; `secondaryWaterConfigRef` live;
  `__pixiBuildCount` + `__secondaryWaterDebug`; reduced-motion nel tick;
  controlli Water tab wired + LabDefaults. `esbuild` syntax OK, lint scoped
  pass. NON ancora verificato in browser reale (T-04): serve T-004.
- **T-004 pending**: suite E2E + mutant + visual witness.
