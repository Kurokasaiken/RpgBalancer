---
title: PLAN-096 — `mappa2` qualità AAA allo zoom massimo (detail pyramid 2x + hero tile 4x)
status: draft — in attesa di battesimo Director (nessuna implementazione eseguita)
owner: agente locale (planner)
created: 2026-10-29
source_request: R-291 (vettore «mappa2 AAA allo zoom massimo», richiesta Director a voce nella sessione PLAN-092/095; da registrare in RICHIESTE.md al battesimo)
parent: PLAN-089
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (vettore + esito)
  - test-results/plan-096-mappa2-max-zoom/ (evidence)
  - src/docs/docs/idle_village/ (contratto detail pyramid, a implementazione)
---

# PLAN-096 — `mappa2` qualità AAA allo zoom massimo

> Solo plan. Nessuna modifica a codice di runtime, pipeline o asset in questa
> sessione. Le misure sotto sono prese sul dev server `:5173`, `/mappa2-lab`,
> browser pane (headless/in-pane, nessuna finestra in primo piano).

## 0. Mandato e stato misurato

Il Director vuole una produzione AAA: zoomando molto la mappa perde qualità.

Fatti misurati (non stime) in questa sessione:

| Fatto | Valore | Fonte |
|---|---|---|
| Sorgente | `~/Downloads/mappa2.jpeg` 2752×1536, JPEG **q≈100** (quant tables tutte a 1), 3,32 MB | PIL `quantization` |
| Quindi la morbidezza | è del *dipinto* (generato a bassa densità), non compressione: un upscaler non recupera JPEG da pulire, deve **inventare** dettaglio | derivato |
| Mondo | pixel sorgente 1:1, `canvas` 2752×1536, `maxZoom` 3, `minZoom` 0.18 | `manifest.json` |
| Renderer | Pixi, `resolution = min(DPR, 2)` (cap `mobileFit.dprCap` su touch), `antialias:false`, mipmap auto su ogni texture | `PixiWorldMap.tsx:766-769`, `load()` ~755 |
| Densità allo zoom 3 | 3 px fisici per px dipinto a DPR1, **6** a DPR2 (viewport 1920×1080: finestra visibile = 640×360 px di mondo) | misura `__worldCam` zoom=3, `renderer.resolution=2` |
| Pack | `public/assets/world/mappa2/base` = 12 MB totali (5,7 MB sono `debug/`); runtime tutto 1x | `du` |
| Texture nel lab | 143 texture ≈ 227 MB (barra di stato del lab; breakdown per texture **non** disponibile → T-001) | lab UI |
| Costo teorico per layer full-canvas RGBA con mip | 1x = 21,5 MB · 2x (5504×3072) = 86 MB · 4x (11008×6144) = 344 MB | calcolo |
| Strumenti sulla macchina | `cv2 5`, `onnxruntime 1.30`, Pillow, scipy, CoreML bindings. **Nessun** upscaler installato (no realesrgan/waifu2x/upscayl, no torch/diffusers) | `pip list`, `which` |

Witness visivo (T-04): a zoom 3 / DPR2 / 1920×1080 la pittura è **visibilmente
morbida** (screenshot nel browser pane; la cascata e le chiome mostrano lo
stesso grado di blur del terreno). Ciò che **non** ho verificato è il punto 5:

### Difetti dichiarati dal Director — stato di riproduzione

- **Bordi rettangolari netti:** NON riprodotti. Ho eseguito un detector
  (run lunghi ≥90 px di gradiente di luminanza >14 sull'output estratto da
  `renderer.extract`) su 9 viewpoint a zoom 3 (griglia 3×3 di pan) e 4 angoli
  estremi: zero bordi assi-allineati. Quindi o il difetto è **dinamico**
  (sway delle chiome, frame di cascata/laghi), o è locale a una zona non
  campionata, o a DPR1. Va riprodotto prima di fissarlo (T-001).
  Ipotesi ordinate per verosimiglianza, tutte con evidenza nel codice:
  1. **Chiome (39 mesh `MeshPlane`)** — alpha = componente connessa binaria
     (`build-mappa2-assets.py:1000-1008`, close 5×5, **nessun feather**), RGB
     lossy q94, sotto c'è `base_flat.nocanopy.webp` riempita da
     `cv2.inpaint(TELEA, r=7)` (`:1056`): quando i vertici ondeggiano a 3× si
     scopre il riempimento sfocato lungo bordi a scalino, che a pezzi appare
     come "patch rettangolari" (le rect sono bbox di componente).
  2. **Pose/frame rettangolari** — `flip_f*.webp` (168×249 RGB, senza alpha:
     clippati da `flowPolygon`) e `fx/water/*_f*.webp` (RGBA, crop
     rettangolari 71×131 … 367×383): derivati dal dipinto 1x, mismatch
     tono/nitidezza col contorno a bbox quando la camera li ingrandisce.
  3. **Rettangoli "cotti" nelle clean plate** — `waterfall_patch`
     (1260,220)-(1400,430) e `village_patch` (1180,560)-(1590,850) sono
     `cv2.rectangle` pieni in `clean_mask` (`:1053-1057`). `base_flat.clean.webp`
     **non risulta referenziato dal runtime** (grep in `src/` e `scripts/`: nessun
     uso) → oggi non visibile, ma sarebbe esattamente un rettangolo smearato
     se venisse mai attivato (nota per PLAN-089 T clean plates).
- **Banda teal orizzontale:** NON riprodotta. Medie di riga ogni 45 px ai
  quattro angoli estremi: nessuna riga uniforme teal. Candidati da escludere
  in T-001, in ordine: (a) colore stage `STAGE_COLOR` del lab (T-01 documenta
  lo stage `#489397` più chiaro del mare profondo come causa di sliver quando il
  bordo del quad mare tocca lo schermo; `SEA_QUAD_PAD=1600`), (b) quad
  `Mare.webp`/shader mare + `seabedShift`, (c) sprite `ripple_ring`/`mist_blob`
  /onda di bordo-frame, (d) ombra nuvole. **Non assumere** (T-04): è un
  difetto che il Director ha *visto*; senza il suo clip/zoom/posizione la
  causa resta ipotesi. → richiesta esplicita di clip/coordinate al Director
  come input di T-001.

## 1. Quanto zoom serve, e dove (domanda 1)

Densità di campionamento (texel dell'asset per px fisico), con asset a scala
`s` (1x, 2x, 4x) a zoom `z` e DPR `d`: `texel/px = s / (z·d)`. ≥1 = nitido,
<1 = ingrandito.

| z \ DPR | DPR1 | DPR2 |
|---|---|---|
| z=1 | 1x:1.0 ✓ | 1x:0.5 · **2x:1.0 ✓** |
| z=2 | 1x:0.5 · 2x:1.0 ✓ | 2x:0.5 · **4x:1.0 ✓** |
| z=3 | 2x:0.67 · **4x:1.33 ✓** | 2x:0.33 · 4x:0.67 · (6x servirebbe: 16512×9216 = 152 MP, escluso) |

Conclusioni di fondo (da dichiarare, non ancora ruling):

- Una super-immagine unica a 4x (11008×6144, 344 MB GPU, oltre il limite
  texture 4096–8192 mobile) è **non fattibile**; a 6x ancor meno.
- 2x globale rende nitido tutto fino a z=1 @DPR2 e z=2 @DPR1 (la grande
  maggioranza dell'uso panoramico).
- Il dettaglio "vero" a z≥2 serve solo dove il giocatore *guarda da vicino*:
  POI/ancore (`points.json`, 60 punti), cascata+lago, villaggio, laghi/fiumi,
  zone con animazioni (`PLAN-092/095`). Il resto è terreno a bassa informazione
  in cui lo zoom 3 non ha un perché.

### Opzioni per la decisione O-1 (Director, aperta — non decisa silenziosamente)

| | Cosa | Critica più forte |
|---|---|---|
| **A. Soft-cap di zoom per zona** | `maxZoom` effettivo letto da `region_ids.png`/hero-zones: 3 solo dentro gli hero, ~1.5–2 fuori; **0 pixel nuovi** | Controllo camera non uniforme, zoom che "si ferma" in mezzo al nulla; non produce AAA, la nasconde |
| **B. Piramide: master 2x + hero 4x (questo plan)** | 2x globale (4 tile) + tile 4x on-demand nei soli hero | Costo di produzione e di memoria alto; rischio di dettaglio inventato incoerente col dipinto (§3); sfora i budget senza le leve di §2 |
| **C. `maxZoom` globale 2** + 2x master | Un solo asset nuovo; a DPR2 z=2 → 2x:0.5 ancora un po' morbido | Rinuncia a zoom che il Director ha già (z=3); AAA solo "quasi" |

Il plan sotto implementa **B** ma lo costruisce a gate: T-003 è un pilota su
una zona, e O-1 si chiude lì (con A come rete di sicurezza zero-pixel
dichiarata nel runtime, vedi T-005). Se il Director sceglie A o C, i task
T-004..T-006 si riducono (marcati `[solo B]`).

## 2. Architettura del dettaglio (domanda 2)

Principio: il **mondo resta 2752×1536 in coordinate**. Cambia solo la densità
delle texture ("texture scale factor" per asset, come `resolutionHint.scaleTarget`
già nel manifest). Nulla di geometria (maschere, `points.json`, poligoni,
`secondary-water.json`, `region_ids`, `pack.waterfall.*Rect`) cambia: i
rect sono in `sourceWidth/Height`, gli sprite delle chiome già calcolano
`scale = rect/tex` (`PixiWorldMap.tsx:848`) → un asset 2x si adatta da solo.
Da **verificare** in T-005 per i layer base (imageFit `fill`).

### 2.1 Livelli

- **L0** — master 1x attuale (fallback e geometria). Resta nel pack, `sourceSha256`
  e tutti gli hash dei gate PLAN-089/095 invariati (`detailRevision` nuovo,
  separato).
- **L1** — master 2x (5504×3072) in **4 tile 2752×1536** (≤4096: ok mobile, se
  si decide di abilitarlo). 86 MB GPU totali con mip. Selezione: `z·DPR ≥ ~1.25`
  → L1 residente; sotto → L0 (L1 scaricato). Nessun pop: cross-fade ~250 ms
  (alpha ramp, texture L0 sotto).
- **L2** — hero tile 4x: ogni hero = rettangolo di mondo ≈512×512 → 2048×2048
  texel (21,3 MB GPU con mip), **tile 2048² uniformi** (≤4096 ovunque). Carico
  lazy quando `z·DPR ≥ ~2.5` **e** il viewport interseca l'hero con margine;
  LRU residente max **3** (64 MB); prefetch dell'hero più vicino al centro
  camera; evict dopo >N s fuori vista. Bordo hero: feather 32 px mondo (non
  rettangoli netti — è proprio il difetto da non reintrodurre).

### 2.2 Budget (stime, da misurare in T-001 e T-006)

Baseline lab: ≈227 MB, 143 texture. Worst case desktop proposto:
227 − 21,5 (L0 base scaricato) + 86 (L1) + 64 (3 hero L2) ≈ **355 MB**.
Leve per rientrare in un tetto di **≤360 MB desktop hard / ≤230 MB mobile**
(mobile: L1/L2 spenti di default; flag di device-class):

1. `Foreground.webp` e `Mare.webp` sono RGBA **full-canvas** (2752×1536, 21,5 MB
   ciascuno su GPU) ma la copertura è 5,9% (foreground) → ritaglio a bbox/rect
   (−~18 MB).
2. Maschere RGBA con solo canale alpha usato (`save_alpha_mask` scrive RGB
   bianco + alpha): se usate dallo shader possono diventare una texture
   single-channel (Pixi r8unorm) o essere scaricate; T-001 elenca quali sono
   residenti GPU vs solo CPU.
3. Hero su richiesta + LRU 3.
4. L1 caricato per tile (solo i tile che intersecano il viewport), non i 4.

Peso file (download/repo, stima webp q≈90): L1 ≈ **4–6 MB** totale (la base 1x
oggi è 1,29 MB; il dettaglio sintetico comprime peggio); hero ≈ **1,5–2,5 MB**
ciascuno × 6–10 zone = **9–25 MB**; overlay derivati 2x (cascata, pose acqua,
chiome, atlanti fx) ≈ **+2–4 MB**. Totale pack runtime ≈ **+15–35 MB** (oggi
6,3 MB runtime + 5,7 debug). Repo: i webp binari cambiano a ogni iterazione →
committare solo l'output finale approvato; intermedi in `.mw/runs/` fuori git
(O-4: Git LFS sì/no).

Contratto dati (nuovo leaf, niente cascata `contracts:check`, stesso pattern di
`mappa2SecondaryWaterConfig`): `detail-pyramid.json` + schema Zod strict in
`src/ui/idleVillage/config/mappa2DetailPyramidConfig.ts` con: livelli,
`tileGrid`, hero `{id, worldRect, tile, sha256, bytes, gpuBytes}`,
`detailRevision`, `parentSourceSha256`, `generatorRecipe` (§3). `worldSurfaceConfig.ts`
byte-identical (stesso vincolo di PLAN-095 OB-3).

## 3. Come produrre il dettaglio (domanda 3)

Vincolo non negoziabile: **il dettaglio nuovo deve restare il dipinto del
Director**, non diventare un'altra immagine. Rischi: dettaglio inventato che
sposta forme (un fiume che cambia curva, una chioma che cambia contorno,
alberi che compaiono sul sentiero), grana/texture a pattern ripetuto,
deriva cromatica tra tile adiacenti.

### Ricette candidate (decisione tramite visual-fork, T-003)

- **R1 — solo upscale neutro** (modello tipo Real-ESRGAN/SwinIR via
  `onnxruntime`, o CPU lanczos+USM come baseline controllo). Nessun dettaglio
  inventato; ma 2752→5504 di un dipinto già morbido dà "più liscio", non
  "più ricco". Forza: sicuro, deterministico (pesi pinnati). Critica: **non
  risponde alla richiesta AAA** a z≥2, solo la ammorbidisce meno.
- **R2 — R1 + img2img a basso denoise per tile** (0.15–0.25), tile 1024²
  con overlap 128 px e blend feather, style-reference = crop della sorgente
  (ricalibrata). Forza: aggiunge micro-dettaglio coerente di pennellata.
  Critica: tile adiacenti derivano (grana/colore), seam; dettaglio inventato
  non spiegabile; serve un generatore (non installato).
- **R3 — R2 + vincolo strutturale** (edge/depth lock o maschera di
  protezione sulle classi acqua/POI/sentieri: denoise ≈0 lì) + passata di
  armonizzazione cromatica per tile verso L0 (low-frequency match). Forza:
  il più sicuro tra quelli con dettaglio. Critica: più lavoro e più
  strumenti; i protetti restano morbidi (acqua!) proprio dove il Director
  guarda.

Visual-fork: **richiesto** (`visual-fork: required — T-003`). Trigger gate:
(1) crea elementi grafici, (2) ≥2 rappresentazioni materialmente diverse
(R1/R2/R3 = densità di dettaglio e grammatica di pennellata differenti),
(3) direzione non fissata da frozen. Card: `.mw/runs/<run>/visual-fork-aaa-detail.md`,
2–3 opzioni, **senza** "recommended" di default, matrice con assi
gerarchia/densità, costo, deriva, preview superficie #1 (galleria PNG
side-by-side 1x/R1/R2/R3 sullo stesso crop a z=3) → poi #2 harness a
`/mappa2-lab` su tile pilota; baseline congelata al ruling (sha256).

### Gate di coerenza (misurabili, pre-registrati prima di vedere i risultati)

- **G-RT (round-trip):** `downscale(L1 → 1x)` vs `L0`: SSIM ≥ soglia S1 e
  ΔE medio ≤ soglia E1 sull'intero canvas; per hero lo stesso sul crop.
  *Soglie da calibrare su R1 (che per costruzione passa) e fissare in T-003
  prima del giudizio sulle R2/R3.*
- **G-STRUCT:** per ogni classe maschera (`sea`, `land`, `internal_water`,
  `waterfall`, `canopy`, `river_flow`, `lake_shimmer`) la maschera ricavata
  sul 2x (soglia sul colore) ricalcolata e confrontata con la maschera 1x
  upsample: IoU ≥ 0.98 (acqua/cascata: ≥0.99). Garantisce che le pose
  `secondary-water` e le maschere restino valide per coordinate.
- **G-SEAM:** su ogni confine tra tile (L1 e L2) e tra hero e L1: gradiente
  di luminanza e di colore lungo il confine ≤ quello della stessa riga
  nell'interno ×1.5. (Il detector di bordi usato per la ricerca dei difetti
  in §0 diventa gate permanente.)
- **G-CANARY:** nessun pattern ripetuto: autocorrelazione del dettaglio ad
  alta frequenza sotto soglia entro hero (evita tiling visibile).
- **Revisione Director obbligatoria** (human-eye) per ogni hero: il dettaglio
  inventato non si valida a metrica (T-04).

### Chi genera (O-2, aperta)

La memoria di progetto riporta il ruling del Planner 2026-10-27 *"asset li
genera il Director"*. Per R2/R3 serve un generatore img2img che non è
installato in locale. Opzioni, da decidere: (a) setup locale (CoreML/ONNX:
costo setup alto, rischio licenza pesi) ; (b) il Director genera i tile via
web UI da un batch che il plan prepara (crop + prompt + nome file): applicare
trappole T-25 (conteggio nuove generazioni prima dell'acquisizione), T-26
(registro prompt), T-27 (REF-CLEAN: ispezionare la ref per firme/watermark,
prompt che regge anche senza ref). R1 e la baseline di controllo sono sempre
locali.

## 4. Cosa rigenerare e cosa scala per coordinate (domanda 4)

Pipeline: `scripts/build-mappa2-assets.py` (1729 righe) + nuovo
`scripts/mappa2/detail/` per il livello dettaglio. Regola: la geometria
resta *una sola*, derivata dal master 1x; i pixel dettagliati si **cuciono
sopra** per coordinata.

| Asset | Strategia | Perché |
|---|---|---|
| `masks/*` (sea, land, shallow, coast_distance, foam, internal_water, waterfall*, river_flow, lake_shimmer, canopy_mask) + `region_ids.png` | **scala per coordinate**, restano 1x | Sono geometria; il confine del dettaglio cade sotto la loro precisione a 1x. Eccezione: il bordo `canopy` (alpha) → vedi riga chiome |
| `points.json`, `regions.json`, `biomes.json`, poligoni cascata/laghi, `secondary-water.json`, `land-life-anchors.json`, `ambient-director.json` | **scala per coordinate**, invariati | sono in world px |
| `base_flat.webp`, `.nocanopy.webp` | **rigenera**: L1 (4 tile) + hero L2. La `nocanopy` va rigenerata da L1 con riempimento migliore di TELEA (patch-based/ricamo da vicini + L1 detail) | texture portante; il riempimento attuale è la causa più probabile dei bordi |
| `forest_canopy_*.canopy.webp` (39) | **rigenera da L1** con alpha ricalcolata sul 2x (soft, feather ~1.5 px, **non** upsample della binaria 1x) + estrusione bordi RGB sotto l'alpha (anti-fringe) | alpha binaria a scalino + bleed webp lossy è il candidato n.1 ai bordi netti |
| `fx/waterfall/flip_f0..7` (168×249) + `painted_flow_tile` | **rigenera** da L1 sul `flowRect` (2x → 336×498) o dall'hero L2 cascata | derivati dai pixel dipinti |
| `fx/water/*_f0..7` pose laghi/fiumi (6 set × 8 frame, RGBA crop) | **rigenera** da L1 (stessi rect, ×2); geometria e sha di `secondary-water.json` invariati | derivati dai pixel dipinti |
| `fx/water/river_flow_tile.webp` (256² lossless), `fx/waterfall/flow_streaks|mist_blob|ripple_ring` | **rigenera** a 2x (procedurali, costo ~0; webp lossless ≤ qualche decina di KB) | sono sovrapposti sul dipinto a 3× |
| `Foreground.webp` | **rigenera** da L1 **ritagliato** a bbox (non full-canvas) | −18 MB GPU (§2.2) |
| `Mare.webp` | **O-3 aperta**: oggi 1x full-canvas RGBA (550 KB); lo shader mare è procedurale e a z=3 lavora su 1x. Decisione dopo T-001 sul profilo reale (il sea è la zona meno informativa) | evitare di pagare 86 MB per il mare |
| `fx/clouds/*` (16+16 shadow), `fx/land-life/*` | scala/upsample banale o rigenera 2x (decide T-001 sul fatto che a z=3 si noti) | sprite piccoli già "vettoriali" |
| `debug/*` | non runtime; ridurre a ≤1 foglio per feature (non fanno peso al runtime) | solo peso git |

Il gate di pipeline `gate.status = pass` e `maskRevision` rimangono invariati;
nuovo blocco `detail` nel `pipeline-report.json` con i gate di §3.

## 5. Difetti allo zoom massimo (domanda 5)

Ordine: **riprodurre → causa → fix a risoluzione 1x indipendente → rivalidare
alla fine sul 2x** (la piramide non deve nasconderli: un bordo netto a 2x si
vede uguale).

1. **Harness di cattura riproducibile** (T-001): pan deterministici su griglia
   fitta (≥6×4 viewpoint) a z ∈ {1, 1.5, 2, 3} e DPR ∈ {1, 2}, più una
   sequenza temporale (60 frame a Δt noto) per i difetti dinamici (sway
   chiome, flip cascata, glint laghi); detector di bordi assi-allineati
   (§0) + detector di righe quasi-uniformi per la banda; export in
   `test-results/plan-096-mappa2-max-zoom/`. In pane nascosto
   `visibilityState=hidden` blocca rAF/animazioni (nota di memoria) → pilotare
   `Animation.currentTime`/tick manuali, mai dedurre dall'animazione libera
   (T-04).
2. **Bordi rettangolari**: ablazione per layer (spegnere chiome / cascata /
   poses acqua / nuvole / land-life una alla volta nell'harness; il lab ha già
   toggle) per attribuire il bordo a un layer, poi correzione in pipeline
   (feather alpha, anti-fringe, nocanopy migliore, patch non rettangolari).
3. **Banda teal**: ablazione stage/quad mare/sprite fx (§0); se è il bordo
   quad/stage, il fix canonico è T-01 (pinna il bordo protetto, non allargare
   il mare: `SEA_QUAD_PAD` e `floorZoom` non sono da ritoccare alla cieca).
4. **Regressione permanente** (R-247): il detector entra come test e2e
   (zero bordi assi-allineati ≥ soglia nell'harness su fixture di pose) con
   mutant (rimuovere il feather → il test deve fallire).

## 6. Task

Ogni task ha `files:` e `depends:`. Runtime headless/in-pane; una finestra
visibile è un passo manuale del Director (mai agente).

- [ ] **T-001 — Misura e riproduzione.** Harness di cattura (§5.1);
  tabella GPU per texture (nome, w×h, MB, residente/CPU-only); matrice
  densità (§1) con le riprese reali; elenco difetti con causa attribuita per
  ablazione; heatmap "dove serve zoom" da `points.json` + presets del lab
  (Overview/Cascata/Bayou/Vulcano/Arcipelago) + chiusura **O-1 pre-gate**
  (il Director vede i numeri). Input richiesto al Director: clip/coordinate
  del difetto «bordo rettangolare» e «banda teal».
  `files:` `scripts/mappa2/capture-zoom-harness.mjs` (nuovo),
  `test-results/plan-096-mappa2-max-zoom/` · `depends:` none
  · scope runtime: nessuna modifica a `src/`.
- [ ] **T-002 — Fix dei difetti a 1x** (indipendenti dalla risoluzione).
  Feather alpha chiome + anti-fringe + nocanopy migliore + (se causa) clip
  pose acqua; fix dello stage/quad se T-001 lo attribuisce lì.
  `files:` `scripts/build-mappa2-assets.py`, `public/assets/world/mappa2/base/
  layers/*.canopy.webp`, `base_flat.nocanopy.webp`, (eventuale)
  `PixiWorldMap.tsx` · `depends:` T-001. **Mode A** (bugfix, red-first):
  test e2e del detector (§5.4) scritto prima, deve fallire senza il fix.
  Superficie `game-map-pixi` → eredita `CTR-game-001/002/005/008` (surface-map).
- [ ] **T-003 — Pilota hero + visual-fork.** Una zona (proposta: cascata+lago,
  mondo ≈(1100,290)-(1600,620) ⊂ `waterfall_plateau`) in R1/R2/R3 (R2/R3 con
  O-2 risolta); gate §3 pre-registrati e calibrati su R1; card visual-fork
  VF-AAA-001; **ruling Director** (human-eye, side-by-side z=3 @DPR1 e DPR2
  1920×1080); baseline congelata. **Gate G1 del plan:** se nessuna ricetta
  passa i gate *e* convince il Director, T-004..T-006 `[solo B]` non partono e
  si ripiega su A o C (O-1).
  `files:` `scripts/mappa2/detail/` (nuovo), `.mw/runs/<run>/visual-fork-aaa-detail.md`,
  `test-results/plan-096-mappa2-max-zoom/pilot/` · `depends:` T-001
- [ ] **T-004 — Pipeline detail pyramid** `[solo B]`. Master L1 (4 tile) +
  hero (zone decise in T-001/T-003) con ricetta approvata; `detail-pyramid.json`
  + schema Zod strict + test unit (negative: tile >4096, hero senza sha,
  detailRevision mismatch, budget oltre tetto); gate §3 in
  `pipeline-report.json`; `sourceSha256`/maschere/`secondary-water.json`
  sha **invariati** (asserito). Rigenerazione overlay derivati (§4: chiome,
  flip, pose, tile fx, Foreground ritagliato). `Mare.webp` secondo O-3.
  `files:` `scripts/build-mappa2-assets.py`, `scripts/mappa2/detail/`,
  `public/assets/world/mappa2/base/{layers,fx,detail}/`,
  `public/assets/world/mappa2/base/detail-pyramid.json`,
  `src/ui/idleVillage/config/mappa2DetailPyramidConfig.ts`,
  `tests/unit/idleVillage/mappa2DetailPyramidConfig.test.ts`
  · `depends:` T-003 (ruling ricetta)
- [ ] **T-005 — Runtime streaming** `[solo B]`. In `PixiWorldMap.tsx`: selettore
  L0/L1/L2 su `z·DPR`, loader per tile con LRU 3 hero, cross-fade senza pop,
  budget gate (`bytes` esistente ~755), device-class (mobile = L0), `__detailDebug`
  DEV; soft-cap di zoom per zona come rete di sicurezza (O-1 A) dietro flag;
  z-order invariato (sea → secondaryWater → canopy → foreground → clouds,
  asserito come PLAN-095); verifica che i layer base 2x si adattino a
  imageFit `fill` senza ritocchi di coordinate; `mappa2-lab.tsx` tab "Detail"
  (L0/L1/L2 on/off per confronto A/B e overlay debug dei tile).
  **Conflitto di file:** `PixiWorldMap.tsx` è modificato in-flight da
  PLAN-092/094/095 (stato worktree attuale). T-005 non parte finché almeno
  PLAN-095 T-004 e PLAN-094 sono chiusi, o parte su branch dedicato con rebase
  (T-13: mai commit scoped che catturi lavoro altrui).
  `files:` `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`,
  `src/pages/mappa2-lab.tsx` · `depends:` T-004
- [ ] **T-006 — Witness, perf, chiusura.** Playwright/headless su WebGL **e**
  Canvas fallback (L0 only), DPR 1 e 2, 1920×1080, z ∈ {1,2,3}: screenshot
  crop + due-frame diff + detector bordi/banda; perf p95 ≤33 ms (come
  PLAN-095) con hero in/out streaming (picchi di upload), GPU ≤ tetto §2.2,
  zero `__pixiBuildCount>1`; mutant suite; review Director human-eye.
  `files:` `tests/e2e/idleVillage/mappa2MaxZoom.spec.ts`,
  `test-results/plan-096-mappa2-max-zoom/` · `depends:` T-005 (o T-002 se O-1 ≠ B)

Parallelismo: T-002 e la parte di T-003 senza generatore (R1) sono
indipendenti dopo T-001 e **non toccano gli stessi file** (T-002: pipeline
+ asset chiome; T-003: nuovo `scripts/mappa2/detail/`) → possono girare in
sessioni separate. T-004→T-005→T-006 seriali.

## 7. Contratto di chiusura — obbligazioni

- **OB-1** Unit: `npm run test -- tests/unit/idleVillage/mappa2DetailPyramidConfig.test.ts`
  PASS — schema strict + negative (tile >4096, budget oltre tetto, sha
  mismatch, hero senza `worldRect`). Sul ramo A/C: obbligazione sostituita
  da test del soft-cap/`maxZoom`.
- **OB-2** Regressione permanente (R-247): `tests/e2e/idleVillage/mappa2MaxZoom.spec.ts`
  PASS su WebGL + Canvas fallback: (a) zero bordi assi-allineati ≥90 px
  sull'harness a z=3 @DPR1/2, (b) nessuna riga quasi-uniforme teal ≥ soglia,
  (c) `__pixiBuildCount===1` e z-order, (d) switch L0↔L1↔L2 senza flash
  (diff massimo frame consecutivi ≤ soglia), (e) budget GPU/texture.
  Mutant suite (feather rimosso, hero senza feather, cross-fade off, hero
  non scaricato): ognuno FAIL come atteso.
- **OB-3** Safeguards: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run closure:lint`, `npm run contracts:check`
  (PASS senza Mode B-amend: `worldSurfaceConfig.ts` intatto). Pipeline: gate
  §3 PASS (G-RT, G-STRUCT, G-SEAM, G-CANARY); `sourceSha256`, `sea_mask`,
  `Mare` (salvo O-3), `coast_distance`, `foam`, `secondary-water.json`
  **invariati** (sha256).
- **OB-4** Evidence: crop 1x vs L1 vs L2 allo stesso viewport, z=3 @DPR1 e
  DPR2, in `test-results/plan-096-mappa2-max-zoom/` — pre-registrati
  (regione, z, DPR, tolleranza, esito PASS/FAIL/NOT_COMPARABLE).
- **OB-5** `human-eye` Director: ruling visual-fork VF-AAA-001 (T-003) e
  review finale zona per zona; il plan **non è chiuso** senza di essa (T-04:
  «ho visto che si vede nitido» è un claim percettivo, lo chiude un occhio
  su schermo reale; ciò che non è stato verificato — es. device reali,
  DPR3, Safari/Firefox — va elencato nella voce `fatta`).
- **OB-6** Perf: p95 frame ≤33 ms e nessun hitch >100 ms nello streaming
  hero in sessione headless di 60 s; picco memoria ≤ tetto §2.2.
- **OB-7** `verification.json` → `verify:bundle` → `bundle.json`; vettore in
  RICHIESTE.md; chiusura `fatta` con `bundle:`.

Eredità da trappole: T-01 (non toccare `SEA_QUAD_PAD`/`floorZoom`/margini per
mascherare una banda), T-04 (witness che vede), T-13 (sessioni parallele
sullo stesso worktree), T-22 (misura percettiva sul runtime che esibisce il
sintomo: dev server `:5173`, non solo `vite preview`).

visual-fork: required — T-003 (card VF-AAA-001). Task T-002/T-005 (feather,
streaming): visual-fork: skipped — correzione di difetto e meccanica di
caricamento che conservano grammatica visiva, gerarchia e leggibilità del
dipinto approvato; perimetro `scripts/build-mappa2-assets.py` + `PixiWorldMap.tsx`
(effetto: elimina artefatti, nessuna nuova rappresentazione).

## 8. Rischi

- **Dettaglio inventato incoerente** (R2/R3): forme che si spostano, grana
  ripetuta, deriva cromatica tra tile. Mitigazione: G-RT/G-STRUCT/G-SEAM/
  G-CANARY pre-registrati + review per hero; ripiego R1/A/C.
- **Memoria**: 355 MB worst case desktop senza le leve di §2.2; su mobile
  L1/L2 spenti. Il rischio vero è **upload GPU** (hitch) durante lo
  streaming: tile 2048² ≈ 21 MB di upload sincrono → upload in più frame
  o `createImageBitmap` off-thread; misura in T-006.
- **Peso e git**: +15–35 MB di binari; churn webp → solo output finale in git
  (O-4: LFS?).
- **Conflitti di file**: `PixiWorldMap.tsx`, `build-mappa2-assets.py`,
  `manifest.json` toccati in-flight da PLAN-092/093/094/095 (worktree sporco).
  Sequenziare; nessun commit scoped su file altrui.
- **Difetti non riprodotti**: se T-001 non li riproduce, resta un'ipotesi e
  il plan si limita a fix delle cause documentate; il Director fornisce clip
  (§0). Nessun fix «a occhio».
- **Strumenti assenti**: nessun upscaler/generatore locale. R1 richiede
  pesi ONNX (verificarne la licenza), R2/R3 un generatore (O-2).
- **Toolchain a scala**: `cv2.inpaint` su 5504×3072 è lento e di qualità
  inferiore; per la nocanopy su L1 serve un riempimento diverso (testato su
  T-002 prima).
- **Rigenerazione che invalida hash**: cambiare il master NON deve cambiare
  `sourceSha256` né i gate PLAN-095 pinnati sul sha: il `detailRevision` è
  separato, asserito in OB-3.

## 9. Decisioni aperte (non prese)

- **O-1** Zoom: A soft-cap per zona / **B piramide (questo plan)** / C `maxZoom` 2 — gate G1 dopo il pilota T-003.
- **O-2** Chi genera il dettaglio img2img: setup locale / Director via web UI su batch preparato.
- **O-3** `Mare.webp` a 2x o 1x.
- **O-4** Git LFS per i binari del pack dettaglio.
- **O-5** Elenco hero: proposta di partenza = cascata+lago, villaggio, 1–2 POI per bioma da `points.json`; chiusa in T-001 con la heatmap.
- **O-6** Dibattito multi-AI sul plan: **non** proposto di default (piano
  tecnico a costo medio; PLAN-081 lo riserva a governance/architettura
  materiale). Da attivare solo su via libera del Director, in particolare
  per la ricetta img2img (tema di gusto, dove un dibattito costa meno di un
  tile rigettato).

## 10. Documenti letti per il plan

`AGENTS.md`, `context/recurring-traps.md` (indice + T-01, T-04, T-13, T-22,
T-25..T-28), `plans/PLAN-089`, `plans/PLAN-095`, `plans/INDEX.md`,
`.mw/surface-map.json` (`game-map-pixi`), `public/assets/world/mappa2/base/
{manifest.json,pipeline-report.json,secondary-water.json}`,
`scripts/build-mappa2-assets.py` (canopy `:990-1061`, writer `:111-128`),
`src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` (init `:765`, load `:755`,
canopy `:835-870`, camera `:2540-2590`). `desiderata.md`, `DESIGN_PILLARS.md`,
`DECISION_LOG.md`, `MASTER_PLAN.md`, `CURRENT_STATE.md` **non riletti
integralmente** per questa sessione-plan (il plan non cambia gameplay né
monetizzazione; nessuna riga FROZEN è stata trovata in tensione, ma non è
un controllo esaustivo: verificare al battesimo).

> **Asset:** l'elenco unico (pose, dimensioni, stato) è in [`ASSETS-mappa2.md`](ASSETS-mappa2.md).
