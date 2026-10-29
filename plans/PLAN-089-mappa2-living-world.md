---
title: PLAN-089 — `mappa2` Living World Surface
status: in corso — battezzato dal Director 2026-10-28 («approvo, procedi»)
owner: Mind Weaver (planner)
created: 2026-10-28
source_request: R-291
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (esito dibattito + esito finale)
  - src/docs/docs/idle_village/ (documento contratto mappa2 / update documentazione componenti quando implementato)
  - test-results/plan-089-mappa2-living-world/ (evidence)
---

# PLAN-089 — `mappa2` Living World Surface

## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261028-mappa2-living-world/`
**CONVERGED** su `artifact-r005.md`.

- artifact: `mind-weaver/.mw/runs/20261028-mappa2-living-world/artifact-r005.md`
- sha256: `e5beb9859c8ad3651125a2cd4d9181935432cc5e16ef462e34ad249fad4a7cf6`
- electorate elegibile: `gemini`, `grok`, `deepseek`
- acceptance: 3/3 `ACCEPT`
- provider esclusi dopo fallimenti clarification: `chatgpt`, `claude`
- obiezioni sostanziali: WITNESS-01..18, tutte disposizionate come `amended`

## Mandato Director

Sostituire la mappa canonica di `/game` con `~/Downloads/mappa2.jpeg`, ma solo
dopo che il Director ha visto funzionare le animazioni sulla pittura reale.
Prima del paintover artistico servono: scontorno automatico, maschere, biomi,
testbed e prova visiva/perf. Le modifiche di scenario al dipinto restano una
scelta del Director dopo il testbed.

## Decisioni convergenti

1. **Testbed prima del paintover.** Creare `/mappa2-lab` su `PixiWorldMap` con
   un nuovo asset pack `public/assets/world/mappa2/base/`; non copiare il JPEG
   sopra la mappa canonica e non creare un secondo renderer.
2. **Regola di produzione deterministica.**
   - Prima: testbed sul `mappa2.jpeg` corrente non editato.
   - Dopo acceptance visiva: il Director decide se fare paintover.
   - Nessun paintover → il pack testato è il candidato produzione.
   - Paintover → rerun completo della pipeline sul nuovo `sourceSha256`, poi
     review visiva prima della sostituzione.
3. **Decomposizione automatica agent-owned.** Pipeline classica Python/PIL +
   NumPy + SciPy + Node/sharp + **OpenCV `cv2.inpaint`**. Nessun lavoro manuale
   nascosto dentro la pipeline “automatica”. SAM/rembg solo come fallback
   esplicito dopo fallimento del gate.
4. **Manifest contract, non JSON libero.** Estendere
   `WorldSurfaceManifestSchema` in `src/ui/idleVillage/config/worldSurfaceConfig.ts`
   con `pack` strict (`packRoot`, generator hash/version/revision, masks,
   anchors, atlases, boot phases). `/mappa2-lab` legge il manifest; produzione
   solo via `worldDressing` config o override approvato.
5. **Clean plates obbligatori.** Ogni overlay che può scoprire pixel mancanti
   richiede underpaint/inpainting: canopy, foreground, cascata, cradle villaggio,
   futuri landmark/ship/cloud patches. Se il clean plate fallisce la review,
   l’effetto è `degraded`, non “funzionante”.
6. **Architettura per render families, non un sistema per effetto.** Terrain +
   canopy, water shaders, clouds, bounded local effects, FX atlas/sprites,
   `AmbientDirector` scheduler. Nessun nuovo full-screen pass.
7. **Cascata senza ghosting.** La cascata dipinta in `base_flat` va
   inpainted/sostituita da una patch locale prima del mesh/UV scroll animato.
8. **Micro-entità senza scale cheat produttivo.** LOD semantico per famiglia:
   silhouette aggregate, wakes, foam rings, spouts, glow, mist, specular flashes,
   motion contrast. Slider `0.5x–3x` solo nel lab per calibrazione.
9. **Atlas separati per cadence tier.** Ambient sea-life, ambient land-life,
   ambient weather; sheets rare separati (`whale`, `kraken`, `avalanche`,
   `rainbow`, `storm`) lazy-loaded. I rare non stanno dentro atlas always-on.
10. **Scheduler deterministico.** Seed da map config, cooldown, max concurrency,
    rare globalmente esclusive, replayabile in benchmark. Trigger manuali solo
    lab/debug ed esclusi dalla misura p95 di produzione.
11. **Villaggio evolutivo.** Raccomandazione: cradle centrale preparata in base +
    `village_stage_0..N.webp` patch regionali delimitate da fiume/foresta, con
    luminance/tone/grain match e cross-fade. Resta Director-choice/visual fork
    se emergono alternative materialmente diverse.
12. **Reduced-motion/fallback espliciti.** Freeze/static first frame, no
    scheduled/rare events, no travel/particles, waterfall statica o low-motion,
    cloud shadows statiche, sway/breathing off. Fallback: rare sheets, land
    particles, fish/abyssal, cloud shadow variant, canopy density.

## Biomi target iniziali

Seed supervisionati per 10 regioni: Vette Innevate/Ghiacciaio (N), Altopiano
della Cascata e Lago Alpino (N-centro), Foresta Densa (O), Bayou/Mangrovie
(SO), Valle Fluviale/Praterie/Villaggio (centro), Steppe Aride (NE), Canyon
Rossi/Arco (E), Massiccio Vulcanico Nero (SE), Laguna Corallina (S),
Arcipelago/Atollo (O).

## Tasks

| Task | Cosa | Output verificabile | Depends |
|---|---|---|---|
| T-001 | Asset intake + pipeline skeleton | Copia/staging read-only del JPEG, `sourceSha256`, `biomes.seed.json`, schema `Mappa2WorldSurfaceManifestSchema` + loader contract | — |
| T-002 | Segmentazione mare/terra/acque interne/foreground | `base_flat.webp`, `Mare.webp`, `Foreground.webp`, `sea_mask`, `land_mask`, `internal_water_mask`, debug overlays | T-001 |
| T-003 | Canopy + clean plates | `*.canopy.webp`, `base_flat.nocanopy.webp`, inpainted waterfall/village/foreground plates | T-002 |
| T-004 | Biomi/regioni/anchors | `region_ids.png`, `regions.json`, `biomes.json`, `points.json` con confidence/source | T-002 |
| T-005 | Gate asset automatico | coverage ≥95%, no large holes, 10 region IDs + reserved IDs, dimension/alpha checks, debug report | T-003,T-004 |
| T-006 | `/mappa2-lab` testbed | Route dev che monta `PixiWorldMap` sul manifest mappa2, focus presets, family toggles, density/cadence controls, lab-only triggers, zoom/texture/frame readout | T-001,T-005 |
| T-007 | Porting effetti esistenti | Sea/deep-sea/coast foam retuned; seaMarks; birds; clouds + shadows; canopy/terrain breathing | T-006 |
| T-008 | Cascata e fiumi | Patch inpainted + local mesh/UV scroll, mist, pool rings, river glints, rare rainbow | T-003,T-006 |
| T-009 | Ambient FX atlases + scheduler | 3 ambient atlases + rare sheets separati; `AmbientDirector` seed/cooldown/concurrency; fish/abyssal/ships/wakes/caravan/fireflies/embers/dust/deer/birds | T-006,T-007 |
| T-010 | LOD/culling/reduced-motion/fallback | Config thresholds, viewport culling, canopy density caps, reduced-motion behavior, quality profile | T-007..T-009 |
| T-011 | Benchmark + visual witness | Scenari base/ambient-steady/ambient-peak/deterministic-rare/reduced-motion a overview e close zoom; report p50/p95/worst/>33/>50, textures, boot phases, screenshot/video/witness | T-010 |
| T-012 | Village-stage pilot | `village_stage_0` + patch blend/tone/grain contract + cross-fade/smoke emitters | T-006,T-011 |
| T-013 | Director review + scenario paintover gate | Review visiva testbed; scelta paintover sì/no; eventual rerun pipeline su edited source hash | T-011,T-012 |
| T-014 | Production swap | `worldDressing` manifest switch to accepted mappa2 pack, no hardcoded paths | T-013 + Director approval |

## Acceptance contract

### Automatic pipeline

- Tutti i file attesi emessi con dimensioni/alpha corrette.
- `land + sea` copre ≥95% canvas; nessun buco grande non spiegato.
- Esattamente 10 region IDs + reserved IDs per sea/foreground/unassigned.
- Anchors con `confidence`; low-confidence esclusi di default.
- Clean plates e waterfall patch visivamente verificati in browser.
- Rerun su edited source produce nuovo hash e output deterministico.

### Lab/testbed

- `/mappa2-lab` monta il manifest mappa2 senza sostituire produzione.
- Focus preset funzionanti per ogni bioma/effect.
- Family toggles e deterministic scenarios disponibili.
- Trigger manuali solo lab/debug, esclusi dalle metriche produzione.
- Debug scale slider `0.5x–3x` non influenza la produzione.

### Animation/visual

- Nessun overlay mostra buchi neri, seam, sticker edge o ghosting.
- Cascata locale senza double-painting; nessun full-canvas moving quad.
- Micro-entità leggibili via silhouette/contrast cues; nessuna scala cartoon
  introdotta in produzione senza ruling.
- Rare events globalmente esclusive e non simultanee per default.
- `prefers-reduced-motion` visibilmente coerente.

### Performance

- Report su macchina, OS/browser/Tauri, viewport, DPR.
- `p95 ≤33ms`, `>50ms = 0` durante gesti dove fattibile.
- Boot ≤4s su fasi `manifest + core-paint + terrain-masks + ambient`.
- Budget iniziale: ≤120MB texture estimate e ≤80 texture objects per map+FX;
  lab max ≤160MB prima di split/lazy rare sheets.
- Texture count/MB e boot phases riportati per scenario.

### Governance/verification

- Safeguards: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run closure:lint`, contratti `/game` rilevanti.
- Ogni claim percettivo richiede testimone/browser reale visibile (T-04), non
  solo metriche o diff.
- Visual fork obbligatorio se emergono alternative materialmente diverse per
  clouds, waterfall, micro-entities o village stages.

## Open decisions per il Director

- Battesimo del piano e priorità rispetto a PLAN-043/altri lavori `/game`.
- Naming finale del world/pack (`mappa2` vs nome canonico).
- Se `/mappa2-lab` resta lab-only o diventa superficie tuning permanente.
- Scelta visual-fork su clouds/waterfall/micro-entities/village se servono
  alternative.
- visual-fork: skipped — `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` e `src/ui/idleVillage/config/worldSurfaceConfig.ts`: diff additive e pack-gated (`WorldSurfacePackSchema` strict; `/game` resta sul manifest wanderlust invariato), superficie `/mappa2-lab` lab sperimentale — il fork visivo scatta alla promozione in `/game` secondo acceptance — RICHIESTE.md#R-291
- Se usare il pack del JPEG corrente o fare paintover dopo il testbed.
- Quali scenario additions dipingere dopo review: torre rovina, shrine/faro,
  vent/lava, rovine sommerse, spirit tree, mine/goblin camp, shipwreck/bones,
  cliffs laterali arrotondati, foreground separabile.

## Director visual-witness gate

Dal 2026-10-28 ogni operazione visiva deve chiudersi con screenshot/esame da parte dell’agente. Gli scatti non soddisfacenti vengono corretti prima della presentazione al Director; i fallimenti restano solo come evidence/debug in `test-results/plan-089-mappa2-living-world/`.

## Non-goals

- Nessuna modifica al dipinto prima del testbed.
- Nessuna sostituzione di produzione senza acceptance visiva.
- Nessun secondo renderer o renderer DOM parallelo.
- Nessuna mappa statica “sufficiente”: la sostituzione deve preservare e
  estendere la lingua animata esistente.
- Nessun claim di performance o estetica senza evidence reale.

## Implementation log — 2026-10-28

- **T-001 asset intake + contract:** creato `scripts/build-mappa2-assets.py`;
  esteso `WorldSurfaceManifestSchema` con `pack.packVersion: 1`, generator
  hash/version/revision, mask/anchor/region/canopy/FX/boot metadata; test pack
  in `tests/unit/idleVillage/useWorldSurface.test.ts`.
- **T-002 segmentazione base:** generato pack
  `public/assets/world/mappa2/base/` da `~/Downloads/mappa2.jpeg`
  (`2752x1536`, sha256 `e3760858…`). Output: `base_flat`, `Mare`, `Foreground`,
  `sea/land/shallow/internal_water/foam/coast_distance`, `region_ids`,
  `regions`, `biomes`, `points`, `pipeline-report`, debug overlay.
- **T-003/T-004/T-005 prima passata:** 36 canopy layer + `canopy_mask`,
  `base_flat.nocanopy`, `base_flat.clean` via `cv2.inpaint`; 10 biomi seed;
  60 anchors; gate `pass` con uscita `needs_manual_mask` se coverage/regioni/
  canopy/anchors falliscono.
- **T-006 testbed runtime:** creata `/mappa2-lab` su `PixiWorldMap` con focus presets, FX toggles, wonder cadence/trigger, forest sway e frame/texture readout; resolver
  `pack` per `sea_mask`, `coast_distance`, `points`, canopy; fallback
  `wanderlust` invariato. Evidenza headless:
  `test-results/plan-089-mappa2-living-world/mappa2-lab-landlife-headless.png`
  (`ready 25/25`, 29 texture, ~98 MB). Verifiche: manifest Zod parse,
  `useWorldSurface.test.ts` 12/12, `build:check` PASS.

La prima slice dimostra il contratto runtime e l’asset pipeline, ma non è ancora
la verifica percettiva finale di Director su tutte le animazioni T-007+.

- **Visual check cloud (2026-10-28):** primo screenshot scartato perché usava i cumuli `wanderlust` bianchi/opachi. Generato set `fx/clouds/mappa2_cloud_*.webp` + shadows e `pack.cloudBands`; iterazioni successive scartate per strisce procedurali; sostituite con nuvole reali estratte da `~/Downloads/nuvole.jpeg` e ritinte. Screenshot accettato: `test-results/plan-089-mappa2-living-world/visual-checks/check-013-final-ready.png` (`ready 35/35`, 33 texture, ~110 MB, p95 17.5ms). Vettori esposti: `sea line color/opacity` e `cliff foam color/strength` separati, `cloud visibility` dedicato.
- **Cloud alpha hole fix (2026-10-28):** Director ha rilevato che le nuvole mostravano buchi invece di chiaro/scuro pittorico. Corretto `scripts/build-mappa2-assets.py`: threshold silhouette `24 → 14`, close `7px`, fill dei cavity interni tramite contour esterno e feather solo sul bordo. Evidenza: `visual-checks/check-047-cloud-filled-final.png` e `visual-checks/check-048-clouds-live-filled.png`. Gate: `py_compile` PASS, `useWorldSurface` 12/12, `build:check` PASS, `closure:lint` timeout >30s nel worktree condiviso.
- **Dense forest canopy restore (2026-10-28):** Director ha rilevato che la foresta grande/scura non si muove più. Root cause: la maschera biome-only escludeva il corpo della foresta perché cade in `central_valley`. Aggiunto `DENSE_FOREST_CORE_POLYGON` senza riaprire tutta la valle; `maskRevision 4`, canopy `19 → 25`, coverage `1.62% → 3.16%`, patch principale `forest_canopy_14` `566×276`. Runtime witness: `__canopySway=25`, Canvas fallback sprite `dx≈-1.36px` in 700ms; ROI diff mean `3.55`, `1669px>20`. Evidenza `visual-checks/check-054-forest-a.png`. Gate: `useWorldSurface` 12/12, `build:check` PASS, scoped lint 0 errori/file ignorati, `closure:lint` timeout 30s.
- **Canopy coverage restore (2026-10-28):** Director ha rilevato che molte altre foreste non si muovevano. Sostituito il whitelist-biome troppo stretto con classificatore `green_score = G - mean(R,B) >= 30` + `edge_density >= .45` + HSV `18–100 / S>=40 / V<=200`, escludendo `snow_peaks`, `dry_steppe`, `red_canyons`, `volcanic_massif`; `DENSE_FOREST_CORE_POLYGON` resta come boost mirato. `maskRevision 5`, canopy `25 → 39`, coverage `3.16% → 5.95%`, patch foresta grande `652×458`. Overlay accettato: `visual-checks/check-058-canopy-broad-full.png`; live `visual-checks/check-059-canopy-broad-live.png` con `__canopySway=39` e movimento Canvas fallback. Gate: `useWorldSurface` 12/12, `build:check` PASS, scoped lint 0 errori/file ignorati, `closure:lint` timeout 30s.

## Decisioni Director 2026-10-29 — idee di ambiente (dopo ricerca e lista proposte)

Fonte unica delle scelte; i piani figli riportano solo la parte loro.

**Sì / da fare**
- **Strutture scoperte persistenti:** una struttura trovata esplorando resta visibile sulla mappa da lì in poi; se cambia stato, il cambio si vede sulla mappa. La comparsa "dipinta a pennello" vale come principio, **non** come animazione: per ora comparsa normale (le cose dinamiche si decidono dopo).
- **Stormo casuale** ogni tanto (sprite nuovi per mappa2) → PLAN-097.
- **Branchi:** sì, ma creature meno banali e più fantasy (specie da decidere) → PLAN-097.
- **Coda di balena** che emerge lontano → PLAN-094.
- **Sirena** che ogni tanto si appoggia su uno scoglio → PLAN-094 (evento raro).
- **Vita marina:** banchi di pesci + "qualcosa di più grande" → PLAN-094.
- **Pioggia locale** e **nuvole che si formano sulle montagne con lampi** → PLAN-098 (seconda fetta).
- **Giorno/notte:** da ritestare sulla mappa2 (era stato tolto perché brutto sulla mappa precedente) → PLAN-098.
- **Arcobaleno raro** sotto la cascata → fatto (PLAN-092).
- **Suono della cascata quando ci si zooma sopra**; altri suoni di zona da valutare → PLAN-100.
- **Segreti cliccabili** solo in zone super specifiche: 1 clic = suono, 3 clic = animazione nascosta (riferimento: tabellone di Hearthstone) → PLAN-100.

**No / non ora**
- Animazione a pennello della scoperta, penna/cartografo, "qui ci sono draghi" dinamici: rimandati (dinamiche decise dopo).
- Sentieri che si consumano: la mappa non ha sentieri.
- Cicatrici/conquista di zone: non è prevista la meccanica di conquista (idea buona, archiviata).
- Viaggio visibile: esiste già qualcosa di simile.
- Mulino/ruota ad acqua: al massimo nel villaggio, non convince.
- Faro: non per ora.
- Piccoli oggetti cliccabili sparsi che reagiscono: fastidiosi (solo i segreti in punti specifici).

> **Asset:** l'elenco unico (pose, dimensioni, stato) è in [`ASSETS-mappa2.md`](ASSETS-mappa2.md).
