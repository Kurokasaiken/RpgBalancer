---
title: PLAN-091 — `mappa2` Cascata animata (prototipo overlay, figlio di PLAN-089)
status: in corso — battezzato dal Director 2026-10-28 («procedi»)
owner: Mind Weaver (planner)
created: 2026-10-28
source_request: R-291 (vettori cascata) + richiesta critica proposta ChatGPT
parent: PLAN-089
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (esito)
  - test-results/plan-091-mappa2-waterfall-prototype/ (evidence)
---

# PLAN-091 — Cascata animata su `/mappa2-lab`

## Provenance

Il Director ha girato una proposta di piano ChatGPT («overlay sopra il dipinto,
maschere, TilingSprite, mist, ripples, controlli Water») chiedendo ricerca
online, esame e un nuovo piano. Questo documento è la risposta: valutazione,
ricerca, piano corretto.

## Valutazione della proposta ChatGPT

Direzione corretta (overlay, non repaint — allineata a PLAN-089 D7 e al vincolo
«dipinto intatto»), ma contiene 6 difetti materiali che questo piano corregge:

1. **Trappola del rebuild (critico).** Proporre «waterfall on/off» come toggle
   nella famiglia `effects` lo metterebbe in `fxKey`, che è nelle deps dello
   `useEffect` che crea l'app Pixi (`PixiWorldMap.tsx:2164`): ogni toggle
   disfa e ricostruisce renderer+asset. Il vettore Director «controlli live,
   no rebuild» impone il pattern `seaPatternConfigRef`/`coastFoamConfigRef`:
   una prop `waterfallConfig` letta via ref dentro i tick. Correzione qui.
2. **Maschere runtime non usabili su Canvas.** Il Canvas renderer Pixi v8.16+
   supporta `TilingSprite` ma **non** le maschere Sprite/Texture (solo
   maschere Graphics). In headless il renderer può essere Canvas: un overlay
   clip­pato via Sprite-mask sparirebbe o non clip­perebbe. Correzione: niente
   maschere runtime — l'alpha è cotta dentro le texture overlay (erosione +
   feather in pipeline). `TilingSprite` resta usabile solo con mask Graphics;
   preferiamo il wrap a due sprite che è identico su entrambi i renderer.
3. **Contratto `pack.waterfall` già esistente** in
   `WorldSurfacePackWaterfallSchema` (`flowMask/impactMask/basinMask/flowRect/
   impactRect/basinRect/impactPoint`) e già popolato nel manifest + 3 maschere
   generate da `build-mappa2-assets.py` (flow/impact/basin) — lavoro
   uncommitted nel worktree (T-13: verificare provenance prima di toccarlo).
   Il piano ChatGPT ripropone come nuovo ciò che è già ~70% fatto: il task
   reale è QA + FX textures, non la sezione manifest (che va solo estesa con
   `fxAtlases`, chiave già in schema).
4. **Ghosting/double-painting non analizzato.** Scorrere una texture opaca
   sopra la cascata dipinta raddoppia l'immagine (PLAN-089 D7). Correzione:
   l'overlay di flusso è *interior-only* — maschera erosa ~10-14px + feather,
   così la silhouette dipinta resta il bordo e l'overlay aggiunge solo moto
   interno. Nessuna clean plate, nessun repaint, zero sticker edge.
5. **Manca reduced-motion.** PLAN-089 D12 lo esige esplicitamente
   («waterfall statica o low-motion»). Qui: t congelato = flusso fermo,
   mist/ripples non spawnano.
6. **Manca il contratto di chiusura** (R-247 regression spec, `verify:bundle`,
   T-04 witness). Aggiunto.

## Ricerca tecnica (fonti)

- **Taiji devlog «Don't Go Chasing Waterfalls»** (taiji-game.com): la tecnica
  classica stile Zelda è una texture di schiuma/striature scrollata su UV —
  due copie a velocità/offset diversi (lenta + veloce trasparente) sopra un
  gradiente base, più layer edge. Conferma il 2-layer scroll proposto.
- **Lunoland waterfall breakdown**: cascata pixel-art = gradiente radiale +
  wiggle UV quantizzato + stream a velocità diverse + **spray alla base +
  mist sprites wobbly** — conferma che impatto/nebbia portano la metà
  percettiva del risultato.
- **Godot waterfall shader** (godotshaders.com): gap mask + refraction +
  tint — utile come riferimento se in futuro serve una variante shader
  (WebGL-only, fuori scope prototipo).
- **Pixi v8.16 Canvas renderer** (PR #11815): `TilingSprite` supportato;
  **masking solo Graphics**; blend modes parziali. Vincolo decisivo per il
  design alpha-baked.

## Design — «Mode A: motion paint»

Overlay *sopra* il dipinto, zero repaint, sprite-only (Canvas-safe):

1. **Flow layer**: `fx/waterfall/flow_streaks.webp` — tile RGBA ripetibile su
   Y, alpha derivata da `waterfall_mask` erosa ~12px + feather gaussiano +
   fade X ai bordi. Runtime: **due Sprite identici impilati** (`B.y = A.y - H`),
   offset `y = (t·speed) mod H` → wrap continuo. `flowStrength` → alpha,
   `flowSpeed` → px/s. La silhouette della cascata resta quella dipinta:
   l'overlay non la tocca mai.
2. **Mist**: pool di sprite blob (`mist_blob.webp`) spawnati dentro
   `impactRect`, salita+espansione+fade, riciclati; conteggio ∝ `mistAmount`.
3. **Foam pulse**: 1-2 sprite a `impactPoint`, alpha pulsante lenta.
4. **Basin ripples**: pool di anelli (`ripple_ring.webp`) spawnati a
   `impactPoint`, scale 0.15→1 + fade, raggio max ≲ metà `basinRect`.
5. **Config**: `PixiWaterfallConfig` (`enabled/flowSpeed/flowStrength/
   mistAmount/ripples/foamPulse`), defaults accanto a
   `DEFAULT_SEA_PATTERN_CONFIG`, prop → `waterfallConfigRef` letto nei tick.
   `enabled:false` → container nascosto, **nessun rebuild**.
6. **Ordine scena**: container waterfall creato dopo base+canopy, prima di
   cloud bands; in `world` (scala con la camera, non DOM overlay).
7. **Boot**: FX in `pack.fxAtlases["waterfall_*"]` + `wantAsset()`;
   `onStats` conteggia le texture.
8. **Reduced-motion**: `t=0` congela lo scroll (statica accettabile);
   mist/ripples gated su `!reducedMotion`.

**Mode B (repaint-cover su `base_flat.clean`)** resta fuori: vincoli
«cascata/bacino intatti» + «no `base_flat.clean` runtime» la pre-escludono.
Se il Director vorrà confrontarla dopo il prototipo → visual-fork dedicato.

**Visual-fork:** `skipped — unica direzione implementata (overlay Mode A);
alternativa Mode B pre-esclusa dai vincoli correnti — ruling Director
richiesto solo per aprire il confronto repaint`.

## Tasks

| Task | Cosa | Output verificabile | Depends |
|---|---|---|---|
| T-001 | Audit provenance lavoro uncommitted (T-13) + QA maschere vs dipinto (crop `test-results/.../waterfall-masks-preview.webp`, gate `waterfall_mask≥3000px`, `basin≥8000px`) + eventuale ri-tuning erosione per overlay | nota QA + crop ROI flow/impact/basin | — |
| T-002 | Pipeline: emit `fx/waterfall/flow_streaks.webp` (Y-tile, alpha erosa+feather+fadeX), `mist_blob.webp`, `ripple_ring.webp`; registrazione in `pack.fxAtlases`; debug preview aggiornata | file emessi + manifest parse + preview | T-001 |
| T-003 | Runtime flow: consume `pack.waterfall`, due-sprite wrap, `waterfallConfigRef`, boot wiring, z-order, reduced-motion | flusso visibile live, nessun rebuild al toggle | T-001,T-002 |
| T-004 | Mist + foam pulse: pool sprite a `impactPoint`, spawn/fade/rise | spray percettibile, pool senza alloc in tick | T-003 |
| T-005 | Basin ripples: anelli concentrici expand+fade, raggio bound a `basinRect` | ripples leggibili nel bacino | T-003 |
| T-006 | Lab tab `water`: toggle + `flowSpeed`/`flowStrength`/`mistAmount`/`ripples`/`foamPulse` live via config ref; integrazione `Save defaults`/`Reset` | slider→uniform live, no rebuild, defaults persistiti | T-003 |
| T-007 | Spec e2e permanente + loop visivo + Director review | spec verde + screenshot accettati + ruling | T-003..T-006 |

## Contratto di chiusura — obbligazioni

- **OB-1** Unit: `npm run test -- tests/unit/idleVillage/useWorldSurface.test.ts`
  verde (fixture `pack.waterfall` già coperta, estesa a `fxAtlases` se serve).
- **OB-2** Regression permanente (R-247): `tests/e2e/mappa2-waterfall.spec.ts`
  headless — `ready: yes` → focus «Cascata» → frame t0/t1: diff>0 nel
  `flowRect` (moto reale), diff≈0 in due guard-region (roccia adiacente,
  riva bacino) → dipinto intatto; toggle+slider senza rebuild (stessa
  identità `__pixiApp`/canvas); reduced-motion emulato → diff≈0.
  Il test fallisce senza il runtime waterfall (red-first implicito).
- **OB-3** Safeguards: `npm run lint -- <scope>`, `npm run build:check`,
  `npm run closure:lint` verdi.
- **OB-4** Evidence: screenshot/crop per iterazione in
  `test-results/plan-091-mappa2-waterfall-prototype/` con log scarti/accettati
  (ruling visivo 2026-10-28); p95 frame dal readout lab.
- **OB-5** `human-eye` Director: review finale su screenshot/visit accettati
  (T-04 — il piano non chiude la qualità percettiva da solo).
- **OB-6** `verification.json` → `verify:bundle` → `bundle.json`; vettore
  cascata in RICHIESTE chiuso solo con citazione `bundle:`.

## Acceptance

- Cascata in moto percepibile (streaks), spray alla base, ripples nel bacino.
- Dipinto, cascata e bacino **visivamente intatti** fuori dagli overlay.
- Controlli Water live, zero rebuild, HUD nascondibile con `H` invariato.
- Funziona su WebGL **e** Canvas fallback (headless), nessuna dipendenza
  mesh/shader/sprite-mask.
- `prefers-reduced-motion`: cascata statica, niente mist/ripples.
- Texture count/MB riportati; FX budget trascurabile (<2MB stimato).

## Non-goals

- Nessun repaint / `base_flat.clean` come base runtime / Mode B.
- Nessuno shader o `MeshPlane` per la cascata nel prototipo.
- Nessuna modifica a `/game` o al pack `wanderlust`.
- Nessun arcobaleno rare / fiumi downstream (restano in PLAN-089 T-008/T-009).

## Open decisions per il Director

- Battesimo e priorità vs PLAN-089 T-007/T-008 (questo piano *è* la slice
  cascata di T-008, anticipata su richiesta).
- Dopo il prototipo: tenere Mode A, aprire fork Mode B (repaint-cover), o
  ibrido (streaks + repaint parziale).
- `impactPoint` come anchor riutilizzabile per effetti futuri (arcobaleno?).

## Trappole citate

- **T-04**: nessun claim di moto senza due frame/diff + occhio agente.
- **T-13**: worktree condiviso — il lavoro waterfall uncommitted va
  verificato/integrato, mai clobberato o committato scoped su file altrui.
- **T-15**: effetti non inventati da zero — tecnica da fonti citate.
- **T-17**: iterazioni sul lab → dev server può servire transform stale;
  invalidare/riavviare se lo slider «non fa niente».
- **T-22**: giudizio percettivo solo sul runtime che mostra l'effetto.

## Implementation log — 2026-10-28

- **T-001 (audit):** lavoro waterfall uncommitted verificato e integrato —
  schema `pack.waterfall` strict, manifest popolato, 3 maschere emesse, gate
  `pass` (flow 8340px / impact 15719px / basin 15700px), preview coerente.
- **T-002:** pipeline emette `fx/waterfall/{flow_streaks,mist_blob,ripple_ring}
  .webp` (~17KB totale) registrati in `pack.fxAtlases` + bootPhase
  `ambient-fx`. Streaks tileable-Y con foam-slugs obliqui (v1 a sole striature
  scartata: Y-translation-invariant, leggeva shimmer non caduta).
- **T-003..T-005:** blocco waterfall in `PixiWorldMap` — `TilingSprite` +
  Graphics-mask (inset+taper, interior-only), pool mist 7 slot, foam pulse,
  pool ripples 4 anelli bound a `basinRect`, prop `waterfallConfig` via ref
  (zero rebuild, `enabled:false` nasce il container).
- **T-006:** tab Water: toggle + 5 slider live; `LabDefaults`/endpoint Vite
  estesi (`waterfallOn/FlowSpeed/FlowStrength/Mist/Ripples/Foam`).
- **T-007:** spec permanente `tests/e2e/idleVillage/mappa2Waterfall.spec.ts`
  2/2 verde su build preview: motion diff ROI, guard-region dipinto
  statico, `__pixiApp` tag invariato al toggle, reduced-motion frozen.
  Direzione scroll verificata su sorgente Pixi (`setUvs.mjs`: `tilePosition.y`
  crescente → contenuto giù = caduta).
- Evidence: `test-results/plan-091-mappa2-waterfall-prototype/`
  (`wf-crop-a-v2.png` accettato, `wf-diff-x6-v2.png` motion, `wf-off.png`).
- Safeguards: lint scoped ✓, `build:check` ✓, `useWorldSurface` 12/12 ✓,
  `closure:lint` ✓.

- **Bundle (2026-10-28):** `.mw/runs/plan091-mappa2-waterfall-prototype/bundle.json`
  — OB-1..OB-4 **PASS**; OB-5 `human-eye` Director pendente (non bloccante).
  `contracts:check` fail-closed sul diff worktree: (a) `worldSurfaceConfig.ts`
  è helper di import-closure di ~15 INV → Mode B-amend cascade (la modifica è
  la sezione `pack.waterfall`, additiva — da classificare B-add/neutral, serve
  ruling/disposition); (b) ~25 INV `executedCount(BASE) unknown` per diff
  esteri di altre sessioni (T-13); (c) `source_ref R-283` non risolvibile a
  BASE (lavoro altrui). Task **in corso**, non `fatta`: attende ruling
  Director su gate contratti + eye-check visivo.
