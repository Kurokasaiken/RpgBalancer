---
title: PLAN-098 — `mappa2` Regional Weather & Atmospheric Accents
status: in corso — v1 mist+volcano fatta + storm slice (orographic+glints+lampi, ruling Director 2026-10-29) implementata; anchors 7 mist + 2 volcano vent + 5 orographic + 14 glint, caps {mist:16,volcano:8,orographic:12,glints:14} ≤60, leaf schema + test 5/5, overlay + mount 2 righe, controlli sky-tab + mount 2 righe, spec e2e + probe verde su dev 5173 (determinismo, toggle live, reduced-motion); ruling Director: ember-dot-family eliminata → volcano plume + crater glow sui venti dipinti; storm: banco churn su massicci alpine + bolt Graphics deterministico + snow twinkle; eye-check agente OK (storm-on/off, mist-on/off, ember-on=volcano); resta T-008 bundle (build:check BLOCCATO da PLAN-102 parallelo, T-13)
owner: agente locale (planner)
created: 2026-10-29
source_request: vettore Director «planner multi ai web» su handoff `.mw/runs/handoff-mappa2-regional-weather-20261029.md` + dibattito multi-AI web `20261029-mappa2-regional-weather` CONVERGED
parent: PLAN-089 (living world)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore avanzamento/esito)
  - test-results/plan-098-mappa2-regional-weather/ (evidence)
---

# PLAN-098 — Regional Weather & Atmospheric Accents su `/mappa2-lab`

> **Nota PLAN-099 (2026-10-29): regioni ≠ biomi.** `regions.json` ora contiene 20 *territori* di gioco
> (stile Risiko, mare incluso) e **non sono più biomi**; i biomi sono in `biomes.json` / `biome_ids.png`
> (13, ripetibili in zone lontane). Dove questo piano dice «regione», per le **animazioni** leggi
> «bioma»: il dominio ammissibile e `regionId` degli anchor vanno ri-chiavati a **bioma** (`biomeId`): mist → `mangrove_bayou` + `coral_reef`/`shallow_waters` ∩ `internal_water_mask`; ember → `volcanic`; dust → `red_badlands`; glint → `alpine`. Anche `X.bounds` va sostituito dalla maschera del bioma (`biome_ids.png`). **Da applicare all'implementazione.**
> Gli id sotto sono quelli storici (`western_forest`, `central_valley`, `dry_steppe`…) e non esistono più.
> Vedi `plans/PLAN-099-mappa2-territories-and-biomes.md`.


## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261029-mappa2-regional-weather/`:
CONVERGED su `artifact-r004.md`, sha256
`b84c0ea562f1b7da0f5ce421f121459972138c14c6de022f824b2d5b005d1ff3`.
ACCEPT 4/4 (chatgpt, claude, gemini, deepseek); grok escluso
(provider_dead — 3 prompt-echo in clarification, come nei run precedenti);
gemini recuperato via reprompt al secondo acceptance round. 25+21+1
obiezioni disposizionate `amended` su r002/r003/r004; grounding-ledger e
report nella run dir. Rinumerato da «PLAN-095» handoff e «PLAN-097»
artifact: 095=secondary-water, 096=max-zoom, 097=land-fauna → **PLAN-098**.

**Nota di lettura:** il corpo sotto è l'artifact convergente (r004); il
numero «PLAN-097» nel testo va letto come **PLAN-098**.

---

Identità atmosferica ai biomi estremi via accenti regionali
aria/luce/particelle — senza weather globale, senza toccare acqua, cascata,
navi, fauna, cloud system o `/game`.

## In scope / NOT in scope

In scope: mist su `bayou`/`coral_lagoon`; ash+embers su
`volcanic_massif`; stretch `heat dust` (`dry_steppe`/`red_canyons`) e
`snow glints` (`snow_peaks`). v1 = **mist + embers** (ruling Director;
swap solo su evidenza oggettiva pre-registrata in T-001).

NOT in scope: weather globale, pioggia map-wide, storm, nuove nuvole,
modifiche cloud system, water/ships/fauna/waterfall, `/game`,
Mesh/shader/Filter, >60 sprite persistenti totali.

## Canonical facts (da grounding-ledger.md)

- Region ids canonicali; `regions.json` = bounds+center+areaFraction su
  canvas 2752×1536; NO maschere raster per-bioma; gate raster:
  `internal_water_mask`, `land_mask`, `sea_mask`, `shallow_mask`,
  `coast_distance`, `canopy_mask`.
- `fxAtlases` record generico strict già esistente → chiavi weather senza
  cambio schema. Slot `ambientWeather` riservato PLAN-089
  AmbientDirector → NON riusare.
- Z-order: base layers z<5, `REGION_RING_Z=5`, `CLOUD_BAND_Z=10`,
  `NIGHT_WASH_Z=20` ⇒ **`REGIONAL_WEATHER_Z = 4`** (sotto rings UI, sopra
  base/canopy) — assertato sul display tree risolto a runtime. Se
  l'audit T-005 trova canopy z ≥ 4, l'implementatore sceglie un valore
  intermedio tra canopy e REGION_RING_Z (es. 4.5) e lo registra
  nell'audit — mai spostare canopy.
- Canvas fallback: `meshOk = 'mesh' in renderPipes` → weather usa SOLO
  Sprite/Graphics (mai Mesh/Filter/shader) → Canvas-safe by
  construction.
- `reducedMotion` = `matchMedia` letto a boot (convenzione boot-only, no
  live change — documentato).
- Pipeline: `build-mappa2-assets.py` deterministico (Python+Pillow/
  numpy/cv2), debug previews in `base/debug/`.
- Lab: `LAB_TABS=['scene','water','sky','land']` → sottosezione
  `regional atmosphere` in `sky`; ref no-rebuild; `Save defaults`
  persistente (merge over defaults + unknown-key ignore per compat).
- Leaf-schema precedent PLAN-095: config in JSON separato + leaf Zod in
  file nuovo, zero hunk su `worldSurfaceConfig.ts`.

## Anchor model — containment reale

`weather-anchors.json` = leaf config file nel pack root (pattern
`secondary-water.json` PLAN-095; fixed path `packRoot +
'weather-anchors.json'`; niente `pack.regionalWeather` nel manifest
condiviso):

```json
{
  "schemaVersion": 1,
  "seed": 97421,
  "canvas": { "width": 2752, "height": 1536 },
  "caps": { "mist": 16, "embers": 8, "dust": 0, "glints": 0 },
  "thresholds": { "minReach": 40, "minSpacing": 60, "shorelineMargin": 24 },
  "anchors": [
    { "id": "<placeholder-mist_01>", "type": "mist", "x": 0, "y": 0,
      "regionId": "bayou", "mask": "internal_water_mask",
      "radius": 120, "reach": 180, "weight": 1, "phase": 0 }
  ]
}
```

- **Eligible domain per famiglia** (Boolean esplicito, valutato
  **per singola regione**, `reach` calcolato sul dominio finale):
  - `mist` → per ogni regione R ∈ {`bayou`,`coral_lagoon`}:
    `R.bounds ∩ dilate(internal_water_mask, shorelineMargin)` —
    il dominio di R non ammette pixel di altre regioni; ogni anchor
    accettato conserva il suo `regionId` di origine ed è validato
    contro `regionId.bounds`;
  - `ember` → `volcanic_massif.bounds` ∩ `land_mask` ∩ ¬`sea_mask`;
  - `dust` → (`dry_steppe` ∪ `red_canyons`) ∩ `land_mask` ∩ ¬`sea_mask`;
  - `glint` → `snow_peaks.bounds` ∩ `land_mask`.
- **`reach` (px)** = margine dal centro anchor al bordo del dominio
  finale via `cv2.distanceTransform`; **vincolo strict**: `radius +
  driftMax ≤ reach` (`driftMax` costante per-tipo, es. mist 24, ember
  40) — copre spawn offset + drift. Anchor violanti: shrink radius o
  drop (rejected visibili in preview).
- **Strict leaf schema**: `type ∈ {mist,ember,dust,glint}`;
  cross-field: combinazioni `(type,regionId,mask)` da tabella enum
  canonica (mist→bayou|coral_lagoon→internal_water_mask; ember→
  volcanic_massif→land_mask; …); header refines: `canvas == 2752×1536`,
  `sum(caps) ≤ 60`, cap per-tipo ≤ ceiling; `x,y` finiti nel canvas,
  `radius,reach > 0`; id unici deterministici, ordinati, interi →
  byte-stable; campi ignoti rifiutati. L'esempio sopra è marcatamente
  `<placeholder>`: il test T-002 asserisce ogni `(x,y)` reale dentro
  `regionId.bounds`, tipi `ember/dust/glint` fuori `sea_mask`.
- **Claim onesto**: localizzazione visiva regionale sui **centri** delle
  particelle (non pixel della texture); guard-ROI = rect fuori dominio
  dilatato di metà texture — rect pinnati in preview T-003 e costanti
  spec.

## Asset contract

```text
fx/weather/mist_blob.webp   (soft blob singolo, ~256px, lossless)
fx/weather/ash.webp         (cenere scura, ~16px singola immagine)
fx/weather/ember.webp       (tizzone ambrato, ~16px singola immagine)
fx/weather/heat_dust.webp   (solo se famiglia attivata)
fx/weather/snow_glint.webp  (solo se famiglia attivata)
weather-anchors.json        (leaf config sopra)
debug/weather-anchors-preview.webp  (bounds+dominio+accepted+rejected+
                                     guard-ROI rects)
debug/weather-fx-preview.webp
```

Texture singole (nessun spritesheet/frame math). Embers: blend normale +
glow baked — **mai `add`**. `fxAtlases.weatherMist/weatherAsh/
weatherEmber` (+`weatherDust/weatherGlint` se attive) — OB-3 verifica
`contracts:check` verde dopo l'aggiunta chiavi.

## Runtime contract

Nuovo leaf module `regionalWeatherOverlay.ts` esporta
`createRegionalWeather(world, anchors, textures, configRef,
reducedMotion)` — `PixiWorldMap.tsx` riceve solo costante z, mount call,
wiring config ref (≤4 righe diff); `mappa2-lab.tsx` solo import + 1 JSX
line. Pre-flight T-13 `git diff` su entrambi i file caldi.

- `regionalWeatherBox`: Container `zIndex = 4`,
  `label:'regional-weather'`, figlio del world container sortable.
- Pools allocati ai caps (v1 ≤24, budget ≤60 overlay); caps totali
  per-overlay, slot ∝ `weight` anchor (soft-risk: un anchor high-weight
  può monopolizzare — accettato, weight generato bounded).
- Slider semantics: family slider = visible count
  (`i < round(slider*cap)`, no rebuild); `opacity` = moltiplicatore
  globale; `speed` scala dt; `enabled:false` = `visible=false` + stop
  ticker work pool (verificato via `__pixiBuildCount` costante + zero
  position delta).
- Determinismo: `FNV-1a(anchor.id) → mulberry32`, mai `Math.random`;
  moto da accumulatore elapsed-time; drift clampato a `reach` (spawn
  offset incluso nel vincolo radius+driftMax≤reach).
- `reducedMotion`: stessa fase seed-derived del modo normale (zero delta
  garantito); mist statica con `opacity×0.6` che compone sullo slider;
  embers/dust/glints nascoste + slider disabilitati; `speed` disabilitato
  (clamp 0).
- DEV hook `__regionalWeatherDebug`: `{order (resolved display tree:
  terrain, canopy, landLife, secondaryWater, waterfall, weather, rings,
  clouds, nightWash — absent layers handled), counts, freeze(),
  setTime(ms), positions}`.
- **Nessun `freezeUnderlying`** (violerebbe no-cloud-change + ≤4-line
  diff): il guard check usa `app.ticker.stop()` + `setTime` + render
  manuale → diff ON−OFF a tempo congelato isola l'overlay.

## Lab controls (tab `sky`, sottosezione `regional atmosphere`)

toggle `weather`; sliders `mist`,`embers` (+`dust`,`glints` disabilitati
se cap=0/anchor assenti); `speed` 0.25–3 (disabilitato in reducedMotion);
`opacity` 0–1; persistenza `Save defaults` con merge+ignore unknown.
Componente `<RegionalAtmosphereControls/>`.

## Tasks

- **T-001** Audit bounds/gates; conteggi pre-registrati: mist ≥6,
  embers ≥4 dopo gate+minReach(40)+minSpacing(60) — sotto soglia → swap
  famiglia documentato (numeri nel plan). Output: tabella audit.
- **T-002** Leaf schema `mappa2RegionalWeatherConfig.ts` +
  `mappa2RegionalWeatherConfig.test.ts` (strict parse, cross-field
  combos, header refines, negative tests malformed/missing-file → fail
  closed, defaults merge, anchor-in-bounds + sea_mask assertions).
- **T-003** `build-mappa2-assets.py`: anchors da eligible domain +
  distanceTransform + preview (accepted/rejected/guard-ROI rects).
- **T-004** Texture `fx/weather/*.webp` deterministiche + fx-preview.
- **T-005** `regionalWeatherOverlay.ts` + mount/wiring (≤4 righe su
  `PixiWorldMap.tsx`) + `__regionalWeatherDebug`.
- **T-006** `<RegionalAtmosphereControls/>` in `sky` + defaults; slider =
  visible count, zero rebuild.
- **T-007** Spec permanente `tests/e2e/idleVillage/
  mappa2RegionalWeather.spec.ts` (headless).
- **T-008** Evidenza rigenerata post-final-change + safeguards + bundle.

## Contratto di chiusura — obbligazioni

- **OB-1** Unit: `mappa2RegionalWeatherConfig.test.ts` — strict parse,
  cross-field, header refines, negative tests (missing file, malformed
  JSON → fail closed; NO invalid-path test — il path è fixed resolver),
  bounds/sea_mask assertions, defaults merge compat.
- **OB-2** Regression permanente (R-247) `mappa2RegionalWeather.spec.ts`:
  toggle ON/OFF senza rebuild (`__pixiBuildCount` costante + zero
  position delta); `__regionalWeatherDebug.order` asserisce posizione
  weather vs siblings reali sul display tree risolto; positions delta ≠0
  ON, =0 OFF; guard-ROI (rect pinnati) ON−OFF diff =0 dopo
  `app.ticker.stop()`+`setTime`.
- **OB-3** Safeguards: `lint -- <scope>`, `test -- <scope>`,
  `build:check`, `closure:lint` entro timeout invarianti +
  **`contracts:check` verde dopo l'aggiunta chiavi `fxAtlases.weather*`**
  al manifest.
- **OB-4** Evidence `test-results/plan-097-mappa2-regional-weather/`:
  anchors preview, fx preview, screenshot ON/OFF, motion diff (2 frame
  ≥250ms, soglia mean ≥2/255 ROI attivo, =0 guard ROI; calibration frame
  committato), reduced-motion invariant (positions invariate + embers
  nascoste — via positions, non solo screenshot), canvas-fallback:
  Playwright `--use-gl=disabled --disable-gpu` con assert
  `renderer.name !== 'webgl'` + ticker vivo; **se non forzabile →
  downgrade dichiarato PARZIALE**: static test nessun import
  Mesh/Filter/shader + meshOk=false simulato con assert sprite
  renderable + position delta ≠0 (evidenza parziale, non verifica
  fallback reale).
- **OB-5** `human-eye` Director (T-04).
- **OB-6** `verification.json` → `verify:bundle` → `bundle.json`;
  evidenza con config testata + identità worktree; ogni cambio
  successivo invalida l'evidenza relativa.
- **OB-7** `/game` untouched: diff vuoto su file `/game` + zero hunk su
  `worldSurfaceConfig.ts` + una spec `/game` esistente verde come
  witness (es. `tests/e2e/idleVillage/minimalWireframe.smoke.spec.ts`;
  se nessuna spec /game applicabile → downgrade dichiarato a
  path-diff + `contracts:check`).

## Rischi

- R1 mist oltre bounds → eligible domain ∩ gates + reach (radius+driftMax
  ≤ reach) + guard-ROI rect pinnati.
- R2 embers su foreste → domain volcanic_massif ∩ land ∩ ¬sea +
  weight bassi ai bordi.
- R3 confettura visiva (overlap land-life) → caps bassi, opacity default
  0.6, eye-check OB-5.
- R4 file caldi condivisi (T-13) → leaf modules, diff ≤4 righe su
  `PixiWorldMap.tsx` e ≤2 su `mappa2-lab.tsx`, pre-flight `git diff`,
  nessun commit.
- R5 slot `ambientWeather` → non riusare.
- R6 evidence flakiness → determinismo seeded + ticker-freeze + soglie
  numeriche + Δt pinnato + rigenerazione post-final-change.
- R7 weight monopoly → soft risk accettato (weight bounded); notare se
  l'audit mostra concentrazione.

## Decisioni Director 2026-10-29 — seconda fetta

Il Director allarga lo scope rispetto al «NOT in scope» sopra (che resta valido per la v1):
- **Pioggia locale:** un rovescio che attraversa una zona (non pioggia su tutta la mappa).
- **Nuvole che si formano sulle montagne, con lampi:** nubi orografiche che nascono sulle vette e un temporale con lampi.
- **Giorno/notte:** da ritestare sulla mappa2 (tolto sulla mappa precedente perché veniva brutto; il runtime ha già `NIGHT_WASH_Z`).
- L'arcobaleno raro sotto la cascata è già fatto (PLAN-092), non va rifatto qui.

> **Asset:** l'elenco unico (pose, dimensioni, stato) è in [`ASSETS-mappa2.md`](ASSETS-mappa2.md).

## Aggiornamento 2026-10-29 — vulcano rifatto (Director: «cima 1»)

Il dipinto non ha un vulcano: l'effetto v1 (nebbia grigia piatta sul bordo est) è stato bocciato. Ora la bocca è sull'apice della cima scura a sud
(`volcano_01` a (1754, 982), r 26) e tutto è runtime: bagliore rosso pulsante (alone + nucleo), 3 venature di lava che scendono dal pendio e un
**pennacchio** (16 sbuffi) che sale dalla bocca, si piega col vento e passa da arancione illuminato a fumo scuro a cenere. Caps: volcano 16.
Verificato con cattura a zoom del lab. Restano da rifare: **nuvole sui monti con forma propria** (cappello / bandiera / bancata scura con lampi
interni — attesa decisione Director: puffi esistenti deformati o dipinte), nebbia (poco leggibile) e scintille di neve (troppo discrete).

