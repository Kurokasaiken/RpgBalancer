---
title: PLAN-094 — `mappa2` AmbientDirector + Ambient Sea-Life (Shoal)
status: in corso — battezzato Director («procedi»)
owner: agente locale
created: 2026-10-29
source_request: R-291 (vita ambientale schedulata mappa2) + dibattito multi-AI web `20261028-mappa2-ambient-director` CONVERGED
parent: PLAN-089 (T-009)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore avanzamento/esito)
  - test-results/plan-094-mappa2-ambient-director/ (evidence)
---

# PLAN-094 — AmbientDirector + prima vita schedulata su `/mappa2-lab`

> **Nota PLAN-099 (2026-10-29): regioni ≠ biomi.** `regions.json` ora contiene 20 *territori* di gioco
> (stile Risiko, mare incluso) e **non sono più biomi**; i biomi sono in `biomes.json` / `biome_ids.png`
> (13, ripetibili in zone lontane). Dove questo piano dice «regione», per le **animazioni** leggi
> «bioma»: il cooldown per zona è **per bioma** (`biomeCooldownSec`, campo `biome` nelle zone shoal: `coral_reef` / `shallow_waters` / `open_sea`), non per regione. Già implementato.
> Gli id sotto sono quelli storici (`western_forest`, `central_valley`, `dry_steppe`…) e non esistono più.
> Vedi `plans/PLAN-099-mappa2-territories-and-biomes.md`.


## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261028-mappa2-ambient-director/`:
CONVERGED su `artifact-r003.md`, sha256
`a9970303c740360a691cbdd0ea7be379719fc44a8c810eaa8daafc3bc4d6177e`.
Elettorato ACCEPT 4/4: chatgpt, claude, gemini, deepseek. Escluso: grok
(`provider_dead` — prompt consegnato, zero generazione; stesso failure del
water run). Gemini recuperato via `reseed` (adapter non boundava URL
conversazione `/app`). 17 WITNESS dispositionate `amended`, 0 aperte.
Report: `report.md` nella run. Handoff originale:
`.mw/runs/handoff-mappa2-ambient-director-20261028.md`.

## Scope

**In-scope (slice 1):**
1. `AmbientDirector` — admission scheduler deterministico: 3 tier
   (alwaysOn/scheduled@1Hz/rare), tick logici interi 100ms (≤1 tick/frame,
   discard deterministico + `droppedTicks`), `eventSeed=hash32(scenarioSeed,
   familyId, tick, ordinalWithinTick, zoneId)`, replay = identico spawn log
   (`ambient.spawnlog.json`, CI diff). Effetti esistenti indipendenti;
   coupling solo read-only `occupancyRegistry` (declare/release + startup
   assert sui 7 effetti attesi) consultato dal gate rare.
2. Famiglia `shoal` — blob sott'acqua dark-teal 56–110px su shallows,
   zone-based, **no rotte, no flecks** (reintroduzione solo dietro gate
   ≥2px display); drift 3–8px/s, vita 14–22s, alpha ≤0.22, pool 3 blob
   (maxActive 2 + 1 fading), Poisson ≥300px.
3. Rare: lock globale esclusivo + `nullRare` test event (6s, zero draw);
   consume-before-asset-check; prefetch idle; cancellation semantics.
4. Rotte: schema v0 + validator + fixture avversariali in `scripts/tests/`
   — **nessuna rotta in manifest** fino a slice 2 (navi+wakes).

**Out-of-scope:** navi+wakes (slice 2), fish/flecks dettagliati, weather,
village stages (T-012), adozione effetti esistenti sotto Director,
produzione `/game`, paintover.

## Gate offline sui dati (da artifact-r003 §4–5)

- Zones: celle 64px su `shallow_mask` + `coast_distance ∈ [85,160]` +
  coverage; `coastDistMin = 1.5×maxRadius`; swept-footprint (heading +
  maxTravel baked, validato come le rotte PLAN-095); esclusioni: foam_mask
  dilatata ~24px, bande seaMarks dense, waterfall/riverMouth/confluenze.
- **L\* band gate:** ΔL\* zona-vs-footprint ∈ [~2, ~6] — sotto = invisibile,
  sopra = stain; costanti pinnate a implementazione, valori emessi per zona.
- Nessuna geometria validata a runtime; solo `maskDigest` check.
  Lab: banner non-fatale + fallback spatial lookup; prod: throw + disable.

## Tasks

| Task | Cosa | Files | Depends |
|---|---|---|---|
| T-001 | `ambient-director.json` offline: bake zone (swept-footprint, Poisson, esclusioni), L\* band gate, emit per-zone report; route schema v0 + adversarial fixture suite in `scripts/tests/` (land-crossing, clearance, internal_water, stale-mask, known-valid) | `scripts/build-mappa2-assets.py` (o `scripts/build-mappa2-ambient.py`), `public/assets/world/mappa2/base/ambient-director.json`, `scripts/tests/` | — |
| T-002 | Atlas `ambient-sealife.webp` procedurale (3 blob 192×128, blue-noise dither, ~4 tint rows baked) + `pack.ambient` leaf-schema (pattern PLAN-095: json laterale, zero contracts:check cascade) + digest check | `scripts/build-mappa2-assets.py`, `public/assets/world/mappa2/base/fx/`, `manifest.json`, schema leaf in `worldSurfaceConfig.ts` solo se il pattern leaf lo richiede | T-001 |
| T-003 | Runtime AmbientDirector: moduli scheduler/admission/spawnLog/occupancy/nullRare; `ambientSeaLayer` (sopra seaPattern, sotto coastFoam/seaMarks — depth table); pool Sprite 3 blob preallocato; `ambientConfigRef` live; reduced-motion instant-hide; teardown/HMR dispose | `src/ui/idleVillage/pixiSpike/ambient/*.ts`, `PixiWorldMap.tsx` | T-002 |
| T-004 | Controlli lab: Scene = scheduler globals (master, seed, scheduled, diagnostics, triggers collapsed, replay); Water > Sea life = presentation only (alpha/size/life/speed/tintRow — no globals); triggers esclusi da steady-state | `src/pages/mappa2-lab.tsx`, `ambientLabAdapter.ts` | T-003 |
| T-005 | Verifica: determinism spawnlog CI diff, duty/stillness metrics, perf noise-floor A/B entrambi renderer, reduced-motion, off-parity (diff=0 + layer non costruito), `/game` no-import check, visual witness fit/2×/3× + eye-check Director | `tests/`, `test-results/plan-094-mappa2-ambient-director/` | T-004 |

## Acceptance contract (obbligazioni)

- **OB-1** Determinismo: due run stesso seed → `ambient.spawnlog.json`
  identico (schema `{simT,family,ordinal,zoneId,outcome,reason}` +
  `configSnapshotHash` + digest); seed diverso → diverso. `droppedTicks`
  asserito sotto slow-scenario.
- **OB-2** Gate offline: zero zone land-touching; ΔL\*+reject reason per
  zona emessi; fixture suite routes pass/fail in CI (non nel build).
- **OB-3** Perf: `ambient-steady ≤ max(0.5ms, 2×noiseFloor)` p95 su
  **entrambi** i renderer, misura activity-proven; worst ≤ base+3ms;
  Director tick ≤0.05ms. Stillness ≤0.35 + visibleDuty ≥1/120s + ≤1
  entità ambient visibile a fit.
- **OB-4** Evidence: screenshot/crop a fit/2×/3×, due-frame diff solo
  vicino entità, ON/OFF diff solo dentro zone, off-parity (diff=0, layer
  non costruito), reduced-motion 30s → zero entità schedulate.
- **OB-5** `human-eye` Director: review visiva accettata (T-04).
- **OB-6** `verification.json` → `verify:bundle` → `bundle.json`; vettore
  in RICHIESTE.md; chiusura `fatta` con `bundle:`.

## Rischi principali

- Shoal troppo tenue → il Director "non vede niente": mitigato da
  visibleDuty + L\* band + alpha ceiling + eye-check come arbitro finale.
- Banda L\* [2,6] tarata male su questo dipinto → retune costanti, non
  drop del gate (nota claude/deepseek in acceptance).
- Occupancy registry vacuo se gli effetti non dichiarano → startup assert
  prima che il gate rare si attivi.
- Drift foglia-blob vs cloud shadows → heading allineato al drift dominante
  (nota claude).

## Avanzamento

- 2026-10-29: piano battezzato («procedi»), materializzato da artifact-r003.
- **T-001 done (2026-10-29):** `build_ambient_director` +
  `validate_routes` in `scripts/build-mappa2-assets.py`, hook in `main()`
  dopo coast_distance; `ambient-director.json` +
  `debug/ambient-zones-report.json` + `debug/ambient-director-preview.webp`
  emessi; suite `scripts/tests/test_ambient_director.py` **11/11 verde**
  (zone gates, Poisson, determinismo, maskDigest, 5 fixture rotte
  avversariali). **8 zone shoal accettate** (5 sea generico, 2
  coral_lagoon, 1 bayou — western_archipelago filtrato dai gate), ΔL\*
  3.33–4.52, tintRows miste. Finding di probing:
  - `shallow_mask` è gradiente soft (decade <127 già a coast~31px):
    NON usabile come gate binario a 85–160px — coverage misurata su
    `sea_mask`, shallow resta weight (fix applicato, era il primo
    `no_shoal_zones_accepted`).
  - Swept-footprint = capsula r=55 lungo heading (il margine 1.5× è nel
    coastDistMin), non ±82px omnidirezionale — r001 letterale respingeva
    tutto.
  - tintRow va scelta per vicinanza al centro banda ΔL\* [2,6], non per
    vicinanza al paintL — altrimenti ogni zona risulta "invisible".

- **T-002 done (2026-10-29):** `build_shoal_atlas` procedurale →
  `fx/ambient-sea-life.webp` 512×256 (4 tint rows × 3 blob variant,
  gaussian+noise+dither, sha `99a45fbe…`); `pack.ambient` nel manifest;
  leaf schema `src/ui/idleVillage/config/mappa2AmbientDirectorConfig.ts`
  (strict zod, `routes.max(0)` fino a slice 2) — **PARSE OK** su
  ambient-director.json reale (7 zone, seed base_flat `35c10f42…`; il
  conteggio varia col seed, deterministico per seed). Manifest tests
  12/12 verdi. `worldSurfaceConfig.ts` intatto.
- **T-003 done (2026-10-29):** runtime `src/ui/idleVillage/pixiSpike/ambient/`
  — `ambientDirector.ts` (tick logici 100ms ≤1/frame + droppedTicks conteggiati,
  hash32 eventSeed, cooldown family/region, cap global+family, rare lock
  `nullRare` consume-before-check, spawn log ring 512, OccupancyRegistry,
  `triggerShoal` manuale) + `ambientShoal.ts` (pool 3 blob, sub-texture 128×64
  dall'atlas, fade 3s, drift heading≤maxTravelPx, reduced-motion hide istantaneo).
  Wiring PixiWorldMap: `ambientSeaLayer` sotto secondaryWaterBox/foam,
  fetch+parse via leaf schema, `__ambientDebug` seam, `ambientDirectorConfigRef`
  live. `tests/unit/idleVillage/ambientDirector.test.ts` **7/7** — il test
  nullRare ha trovato un bug reale (`lastRareAttempt` init `-1` bloccava il
  primo roll → `-Infinity`). `build:check` verde. Manca ancora il witness
  visivo (T-005) e i controlli lab (T-004).
- **T-004 done (2026-10-29):** controlli lab tab `water` — toggle ambient
  director, intensity, shoal probability/alpha, rare (nullRare) checkbox,
  bottone `Trigger Shoal` (coda manuale → tick consume, niente skew di
  simTime), spawn log viewer (ultimi 10) + occupancy count. Tutto live via
  `ambientDirectorConfigRef` — zero rebuild. Occupancy: 8 effetti esistenti
  dichiarati read-only nel registry. `ambientDirector.test.ts` 7/7 +
  `build:check` verdi.
- **T-005 done (2026-10-29):** `tests/e2e/idleVillage/mappa2AmbientDirector.spec.ts`
  **2/2** — trigger→spawn log record + drift numerico reale, toggle live
  (layer.visible=false, app tag invariato), reduced-motion → layer vuoto/
  invisibile. Evidenza: `test-results/plan-094-mappa2-ambient-director/`
  (shoal-on.png, perf.json). Bug reali trovati e fixati: `pack.ambient`
  rompeva il manifest strict-schema (boot bloccato) → leaf-file pattern
  PLAN-095; toggle spegneva solo `shoal.container` → `ambientSeaLayer.visible`
  ora segue `enabled`. **Riserve oneste:** perf delta p95 misurato 1.4ms su
  baseline 37.6ms — entro il noise frame-level ma sopra il bound letterale
  0.5ms (probe rAF in-page è grezzo, misura dedicata CPU-cost residua);
  Canvas renderer non eseguito (preference:'webgl' hardcoded, supporto
  by-construction: solo Sprite); witness visivo Director fit/2×/3× ancora
  pending — T-04: il piano non si chiude sui soli check tecnici.

- **Finding OB-5 (2026-10-29, eye-check Director):** lo shoal spawna correttamente
  (log `spawned (manual)` verificato, posizione zona pinnata `shoal-z-14-4`)
  ma a fit e a 1.4× — anche con `shoal alpha 0.40` + `intensity 2.00` —
  il blob NON si distingue dal texture dipinto del mare. Verdetto Director:
  "non vedo nulla". Falsificatrice «invisible» scattata — il visual va
  rifatto prima della chiusura: candidati (a) tint row più contrastata /
  alpha-base più alta, (b) cluster di fleck più densi invece di 3 blob
  dispersivi, (c) silhouette scura leggibile tipo "ombra di branco" invece
  di striatura luminosa. Blocca OB-5/OB-6.

- **Visual v2 (2026-10-29, risposta al finding OB-5):** `ambientShoal.ts` riscritto come **silhouette del colore del mare profondo**
  (rgb 7,46,72): ogni banco = 26 pesciolini procedurali (canvas, nessun asset) che nuotano insieme con respiro del gruppo,
  deviazione e battito di coda individuali; il 14% delle ammissioni diventa **un'ombra gigante** tipo manta (una alla volta, più lenta e più
  lunga). Alpha efficace = slider × 2.4 (max 0.7; default 0.16 → 0.38). Zone e scheduler invariati; l'atlas `ambient-sea-life.webp`
  non è più usato dal runtime (resta nel pack). Witness: cattura headless a fit mostra un cluster scuro ben leggibile sul turchese
  (`scratchpad`, non in repo); **resta l'eye-check del Director** (T-04) e la prova a 2×/3×. Aperto: pesci più grandi/rari «abissali».
- **Visual v2.1 (2026-10-29):** banco più riconoscibile (16 pesci più grandi, sagoma con pinna dorsale, coda forcuta e ventre chiaro,
  disposti a spirale per non sovrapporsi, nuoto coordinato); l'ombra gigante ora sceglie a caso tra **manta** e **pescione generico**
  (tonno/squalo). Cattura a 3× verificata: i singoli pesci si distinguono. **Correzione (feedback Director: «pesci visti lateralmente che ruotano, non ha senso»):** la mappa è vista dall'alto, quindi i pesci
  sono ridisegnati **dall'alto** (corpo a fuso + pinne pettorali + coda biforcuta incernierata) e non ruotano più su sé stessi:
  mantengono la direzione, avanzano/rallentano lungo la rotta, deviano appena di lato e la coda ondeggia (≈5 Hz); anche il
  pescione generico è ora visto dall'alto. Verificato con due fotogrammi a 3×. Prossimi candidati: vedi risposta al Director (delfini che
  saltano, tartaruga, scia di bolle, bioluminescenza notturna se il giorno/notte entra).

- **Visual v2.2 (2026-10-29, «vanno tutti bene»):** `ambientShoal.ts` ora ammette 4 tipi, tutti dall'alto e del colore del mare profondo:
  **banco** (default), **ombra gigante** (10%: manta o pescione, con **scia di bolle** dietro), **tartaruga** (7%: carapace, testa e 4 pinne che remano
  in alternanza), **coppia di delfini** (8%: attraversano il percorso sicuro in 6 s con due salti ad arco, ingrandimento/opacità al picco e
  **anelli di spruzzo bianchi** a ogni rientro). Un solo tipo speciale attivo alla volta. Seam di prova `shoal.forceKind`. Verificati con
  catture a 3× (tartaruga, delfini, gigante). Non fatto: bioluminescenza (dipende dal giorno/notte). Da fare: eye-check Director sul movimento.

- **Silhouette del Director integrate (2026-10-29):** le tavole Gemini (nero su bianco, dall'alto, testa a destra) sono in
  `scripts/assets-src/mappa2-sealife/` (pesce, pescione, martello, delfino, manta, tartaruga; l'orca/balena `qq7i` e la prima tartaruga
  numerata sono scartate). `scripts/build-mappa2-sealife.py` le taglia in pezzi PNG (bianco+alfa, tinti a runtime col blu profondo) in
  `fx/sea-life/` e scrive il leaf `sea-life.json` (schema strict `mappa2SeaLifeConfig.ts` + 4 test): per ogni pezzo pivot e punto di attacco
  sul corpo (coppia di pixel più vicina corpo/linguetta, gap 4–19 px). Runtime: `ambientRig.ts` (rig a cerniera: coda che ondeggia, pinne,
  remata della tartaruga) + `ShoalAdapter.setRigs` sostituisce i segnaposto procedurali appena i PNG sono caricati (i segnaposto restano
  come ripiego). Banco = pesce; ombra gigante = manta / pescione / pesce martello a caso (+ bolle); tartaruga; delfini. Verificato con
  catture a 3× di tutti e quattro i tipi. Da fare: eye-check Director sul movimento.

## Decisioni Director 2026-10-29 (vita marina)

- Confermata la direzione: **banchi di pesci** + **qualcosa di più grande**.
- **Coda di balena** che emerge lontano: candidata per "più grande" (costa molto meno della balena intera).
- **Sirena** che ogni tanto si appoggia su uno scoglio: nuovo evento raro (anchor = scogli dipinti in mare aperto/costa).
- Balena, kraken e nave pirata esistenti hanno animazioni grossolane (solo comparsa/dissolvenza, stile cartone): da rivedere con il kit di animazione (rig/pose + scia/spruzzi) quando arriva l'arte nuova.

> **Asset:** l'elenco unico (pose, dimensioni, stato) è in [`ASSETS-mappa2.md`](ASSETS-mappa2.md).
