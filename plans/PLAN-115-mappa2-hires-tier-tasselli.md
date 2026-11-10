# PLAN-115 — mappa2 hi-res su `/game`: livelli per dispositivo + tasselli LOD

**Stato:** in chiusura — tutte le fasi fatte, obbligazioni bloccanti PASS (`.mw/runs/20261110-plan115/bundle.json`); verdetto BLOCKED solo dai gate globali (vedi §7 F6).
**Parent:** R-322 (`/game` = mappa2 approvata + HUD firmato), PLAN-089 (look mappa2), PLAN-083 (mobile-fit).
**Origine (Director, 2026-11-10, verbatim):** *«io voglio che i player possano zoomare, quindi mi piace la versione hires. magari dobbiamo fare versioni diverse x mobile? e x steam deck? come risolvono i giochi "normalmente"?»* → dopo il confronto: *«Tier + tasselli»*.
**Cosa NON è:** non cambia il look approvato il 2026-11-10 (calibrazione `/mappa2-lab` → `mappa2ApprovedLook.ts`), non tocca camera/fit (T-01), HUD, meccanica, `/gameOld`, il lab. Non introduce texture compresse (KTX2) se non al gate condizionale F5. L'impaginazione mobile di `/game` (HUD in verticale, fit PLAN-083) è **fuori scope**: piano a parte.

## 0. Fatti verificati (2026-11-10, codice + misure headless WebGL)

- `/game` disegna `base_flat.nocanopy.webp` 2752×1536 + 40 ritagli chioma che ondeggiano + `Mare.webp` + `Foreground.webp` + lastre grade combinate (`game-grade-*`) + shader (pattern mare, schiuma, fondale…). Memoria GPU nello stesso contesto: **246 MB** (dopo i tagli R-322), boot dev 9 s.
- `effects.hiRes` (oggi solo seam dev `/game?hires=1`) carica `base_flat.hi.webp` 5504×3072 (upscale `4xNomos2`, R-298) e **nasconde ogni altro strato** (`PixiWorldMap.tsx`: `if (hiRes && layer.id !== 'base_flat') sprite.visible = false`) e **salta i ritagli chioma** (`swapBase = canopyOn && !hiRes`). Perde quindi tre cose del look approvato: chiome che ondeggiano, mare approvato (e il fondale che si vede trascinando, che lavora su `seaSprites`), primo piano. `foam_strokes.hi.webp` è vuota (R-318). Memoria **360 MB**, boot dev 17 s.
- `Mare.webp` è opaco sul 99,6% del mare e **0%** della terra: il mare approvato può restare sopra una base hi-res di sola terra.
- La base hi-res ha **dettagli inventati** dall'upscale (palma sulla spiaggia SW, motivo «a labirinto» in un cespuglio, isolotti/piante diversi in primo piano; confronti in `.mw/runs/20261110-game-mappa2/hires/`). Gli isolotti in mare sparirebbero sotto `Mare.webp`; quelli in terra restano.
- Camera: `maxZoom 3`, `minZoom 0.18` (manifest). A panoramica 1920×1080 DPR 1 la base 2752 è già rimpicciolita (scala ≈ 0,7); su Retina (DPR 2) è ingrandita (≈ 1,3 px fisici per texel) → morbida già a panoramica.
- Chi campiona la base nello shader (schiuma `uBase`, cascata solo senza flipbook) continua a usare la texture 2752: le coordinate mondo restano 2752×1536 in tutto il renderer.

## 1. Principi

- **P1 — Il look approvato non si sposta.** A scala ≤ 1 (texel per pixel fisico) `/game` resta pixel-identico a oggi (prova 0 px, harness R-322). L'hi-res aggiunge dettaglio solo dove si zooma, sulla terra.
- **P2 — Memoria proporzionale allo schermo, non alla mappa.** I tasselli hi-res si caricano solo per la porzione visibile e solo sopra la soglia di scala; fuori vista escono dalla memoria (budget per livello).
- **P3 — La base 2752 resta residente** come fallback immediato (niente buchi durante il caricamento dei tasselli) e come sorgente degli shader.
- **P4 — Il livello si decide per capacità, si può forzare a mano.** Profilo automatico all'avvio, override in impostazioni (se D4 = sì).
- **P5 — Ogni scelta visiva passa dal visual-fork gate** (PLAN-047): card + ruling, mai decisa dall'agente.
- **P6 — Verifiche headless/background** (regola 16); occhio del Director su dispositivi reali come passo manuale.

## 2. Decisioni aperte (Director)

| ID | Domanda | Opzioni | Dove si decide |
|---|---|---|---|
| **D1** ✓ **C — hi-res grezza** (Director 2026-11-10: «2») | Dettagli inventati dalla base hi-res sulla terra | (a) tenere; (b) rattoppare le zone segnalate con la 2752 ingrandita; (c) rattoppo + ridipintura mirata (Director) | Gate F1 (card con contact sheet delle zone) |
| **D2** ✓ **b — mare hi-res** (Director 2026-11-10) | Il mare a zoom alto | (a) `Mare.webp` 2752 approvato sopra la terra hi-res (turchese identico, fondale funziona, bordo costa a 2752); (b) mare dalla base hi-res (più nitido, tinta diversa, perde fondale) | Gate F1 (visual-fork) |
| **D3** ✓ **a — tenerla** (Director 2026-11-10: «1 · con contrasto») | Lastra «dettaglio montagne» (clarity) sopra la terra hi-res | (a) tenere; (b) spegnerla nei tasselli hi-res (la base è già nitida; R-318 mostra conflitti delle lastre 2752 su roccia hi-res) | Gate F1 (visual-fork) |
| **D4** | Impostazione «Qualità grafica» visibile al giocatore | (a) sì, in `SettingsPanel` (Auto/Alta/Media/Bassa); (b) solo automatico | Prima di F4 |
| **D5** | Budget di memoria per livello | **FIRMATO 2026-11-10:** Desktop ≤ 420 MB, Deck ≤ 320 MB, Mobile ≤ 160 MB (texture GPU, `__pixiTextureReport`; misura F0 in `.mw/runs/20261110-plan115/F0-budget.md`) | Gate F0 ✓ |
| **D6** ✓ **resta 3** (Director 2026-11-10: «Sì, resta 3») | Zoom massimo | (a) resta 3; (b) cap legato ai texel disponibili (es. 2 su DPR 2) per non ingrandire oltre i pixel esistenti | Gate F3 |

Nessuna di queste è decisa in questo piano.

## 3. Fasi

### F0 — Misura e budget per profilo (0 righe di prodotto)
- Harness headless WebGL (`.mw/runs/20261110-game-mappa2/ab-hires.mjs` come base, orologio fermo, `Math.random` seminato): tre profili — **Desktop** 1440×900 DPR 2, **Deck** 1280×800 DPR 1, **Mobile** 390×844 DPR 3 touch (emulato) — su `/game` e `/game?hires=1`: memoria (`__pixiTextureReport`), numero texture, tempo di boot, frame p50/p95 con orologio reale.
- **Uscita:** `.mw/runs/<plan115>/F0-budget.md` con la tabella; **Gate G0:** il Director firma i budget (D5).

### F1 — Asset hi-res «sicuro per il look» (gate visivo)
- **F1.1** Composito `layers/base_flat.nocanopy.hi.webp` (5504×3072): base hi-res fuori dalle chiome; dentro le maschere chioma (ingrandite ×2) il suolo della `nocanopy` 2752 ingrandita Lanczos (si vede solo nei 2–3 px di oscillazione). Script deterministico `scripts/build-mappa2-hires-land.py`, nessuna generazione.
- **F1.2** Inventario dei dettagli inventati: differenza strutturale hi vs 2752×2 (Lanczos) sulla terra → zone sopra soglia → contact sheet affiancato.
- **F1.3** Visual-fork card (template `.mw/templates/visual-fork/`): D1 zone, D2 mare, D3 clarity — preview `/game?hires=…` a 1440×900 DPR 2, zoom 1 / 2,2 / 3 su villaggio, cascata, costa SW, massiccio nord.
- **Gate GV-1 (Director):** ruling su D1–D3 → baseline congelata (path + sha256). F2 non parte prima.

### F2 — Piramide di tasselli (offline)
- Script `scripts/build-mappa2-tiles.py`: taglia la base hi-res approvata (F1) in tasselli **512×512 + gutter 2 px** (contro le cuciture del filtro bilineare), WebP lossless, in `public/assets/world/mappa2/base/tiles/L0/{x}_{y}.webp` + `tiles/tiles.json` (livello, scala rispetto al mondo 2752 = 2, griglia, dimensione, gutter, sha della sorgente).
- Integrazione nel pipeline: chiamata da `build-mappa2-assets.py` (stesso schema di `mappa2_sea_zones.py`), così una rigenerazione non perde i tasselli.
- **Uscita:** tasselli + manifest; test unitario che ricompone L0 dai tasselli (senza gutter) e confronta pixel-identico con la sorgente.

### F3 — Strato tasselli nel renderer
- Nuovo modulo `src/ui/idleVillage/pixiSpike/baseTiles.ts` (PixiWorldMap è già 3,8k righe): `mountBaseTiles({ world, cam, canvas, load, unload, ticks, budget })`.
  - Container subito **sopra la base** (stesso posto nell'ordine: sotto `Mare`, canopy, grade, nuvole).
  - A ogni `apply()` della camera: scala = `cam.zoom × resolution`; sotto soglia (proposta 1,05) nessun tassello; sopra → tasselli che intersecano la vista + 1 di margine; carica asincrono con dissolvenza breve (niente «pop»), scarica con LRU oltre il budget del profilo (`texture.destroy` + `Assets.unload`).
  - Niente mipmap sui tasselli (mostrati solo ingranditi): −33% per tassello.
  - Prop opzionale `baseTiles?: { manifestUrl: string; budgetTiles: number; minScale: number }` su `PixiWorldMap`; assente = comportamento identico a oggi (il lab non la passa).
- **Gate G3 (Director):** D6 (zoom massimo) con il dato di F0.

### F4 — Profili per dispositivo
- `src/ui/idleVillage/config/mappa2Tiers.ts`: `detectTier()` → `desktop | deck | mobile` (pointer grossolano + schermo piccolo → mobile; GPU `WEBGL_debug_renderer_info` / 1280×800 Linux → deck; altrimenti desktop) e `TIER_PROFILES` con: budget tasselli, cap DPR, opzioni `gpuLight`, effetti accesi (mobile: proposta di spegnere i più costosi solo se F0 lo richiede), soglia tasselli.
- `/game` sceglie il profilo all'avvio; override da impostazioni se D4 = (a) (persistenza in `gameSettings`, schermata PLAN-076 `SettingsPanel`).

### F5 — Condizionale: texture compresse (KTX2/Basis)
- Solo se un profilo resta sopra il budget firmato dopo F4. Gate a parte (cambia l'immagine: card + ruling). Non pianificato in dettaglio qui (YAGNI).

### F6 — Verifica e chiusura
- Vedi §5.

## 4. Trappole ereditate (shift-left)

- **T-01** (`PixiWorldMap`, layout `/game`): i tasselli non toccano `refit`, `floorZoom`, margini; la terra protetta resta dov'è. Acceptance: geometria della camera a riposo invariata (stessi `__worldCam` a parità di viewport, prima/dopo).
- **T-04**: ogni claim visivo («niente cuciture», «nitido a zoom») si chiude con cattura reale + occhio, non con la metrica.
- **T-22**: misure sul runtime che esibisce il sintomo — headless con `--use-angle=metal` (WebGL vero), non CanvasRenderer; il Mac Retina, la Deck e il telefono del Director sono il testimone finale.
- **R-322 (questa sessione)**: la base 2752 e il `nocanopy` differiscono sull'86% dei pixel: il composito F1.1 parte dalla `nocanopy`, non da `base_flat`.
- **Preview pane**: rAF fermo a pannello nascosto — le prove si fanno headless, non nel pannello (memoria «Preview pane: animazioni congelate»).
- **T-13**: un'altra sessione lavora sul villaggio (`villageZoneOverlay`, `fx/village`): i tasselli stanno **sotto** l'overlay villaggio e non ne toccano i file.

## 5. Contratto di chiusura (`.mw/runs/<plan115>/verification.json` → `verify:bundle`)

| # | Obbligazione | Tipo | Comando / artefatto |
|---|---|---|---|
| V1 | Ricomposizione tasselli = sorgente, pixel-identica | state (blocking, R-247) | `npm run test -- tests/unit/idleVillage/mappa2Tiles.test.ts` |
| V2 | Selezione tasselli: vista+margine, soglia di scala, LRU entro budget, nessun tassello sotto soglia | state (blocking, R-247) | `npm run test -- tests/unit/idleVillage/baseTiles.test.ts` |
| V3 | `detectTier` e profili | state (blocking) | `npm run test -- tests/unit/idleVillage/mappa2Tiers.test.ts` |
| V4 | `/game` a panoramica pixel-identica a prima (tasselli inattivi) | state (blocking) | harness R-322 `ab-grade.mjs` → 0 px vs baseline pre-F3 |
| V5 | A zoom 2,5 DPR 2: solo tasselli visibili caricati, memoria entro budget Desktop; zoom out → tasselli scaricati | state (blocking) | `tests/e2e/idleVillage/gameMappa2Tiles.spec.ts` (headless WebGL) |
| V6 | Budget per profilo (Desktop/Deck/Mobile emulati) rispettati | state (blocking) | harness F0 ripetuto → tabella in `F6-budget.md` |
| V7 | Nessuna cucitura ai bordi dei tasselli | state + human-eye | sonda sui bordi (Δ ≤ 2 livelli lungo le righe di giunzione) + contact sheet a zoom 3 |
| V8 | Camera a riposo invariata (T-01) | state (blocking) | `__worldCam` prima/dopo a 1280×800, 1440×900, 1920×1080 |
| V9 | Look approvato ai gate F1 | human-eye | card F1 + baseline sha256; side-by-side baseline vs implementazione |
| V10 | Dispositivi reali | human-eye (manuale, Director) | Mac Retina, Steam Deck, telefono: zoom fluido, nitido, nessun crash/ricarica |
| V11 | Suite esistenti verdi | state (blocking) | `tests/unit/idleVillage/mappa2ApprovedLook.test.ts`, mappa2 unit (27 file), `tests/e2e/idleVillage/gameMappa2.spec.ts` |

`visual-fork:` — le decisioni estetiche D1, D2, D3 passano dalla card di F1.3; nessun task esecutivo ne presuppone l'esito.

## 6. Ordine e dipendenze

F0 (misura) → **G0** budget → F1 (asset) → **GV-1** look → F2 (tasselli dall'asset approvato) → F3 (renderer) → **G3** zoom max → F4 (profili; D4 prima) → F5 solo se serve → F6.

Dibattito multi-AI: non proposto (piano tecnico ordinario; il Director può chiederlo).

## 7. Avanzamento (2026-11-10)

- **F0** ✓ misura → `.mw/runs/20261110-plan115/F0-budget.md`; **G0** ✓ budget firmati.
- **F1** ✓ — ruling **D1 = C** (hi-res grezza), **D2 = b** (mare hi-res), D3 provvisorio a. La mappa a panoramica cambia di conseguenza (P1 superato dal ruling: la v2 è il nuovo look). Card `visual-fork-F1.md`.
- **F2** ✓ `scripts/build-mappa2-tiles.py` → set v2 residente + `tiles/v2/L0` (66 × 512 + gutter 2, ricomposizione identica alla sorgente).
- **F3** ✓ `pixiSpike/baseTiles.ts` + prop `baseTiles`; Retina: 324 MB totali con tutte le celle; giunzioni invisibili (`f3/seam-ab.png`).
- **Prossimo:** F4 profili (Deck: celle solo a zoom; Mobile: ritagli `.v2`, budget celle basso, tagli per stare in 160 MB), poi F6 chiusura.
- **F4** ✓ profili + asset telefono; budget rispettati su tutti e tre (`F4-tiers.md`). Restano D3, D4, D6 e V10 (dispositivi reali), poi chiusura F6.
- **D4** ✓ «Qualità grafica» nelle Impostazioni (contratto `game-menu-screens` INV-14) + correzione dialoghi del titolo invisibili (INV-13, red-first). **Da fare in F6:** invarianti `pixi-world-map` (Mode B-add) per selettore canale mare/zone, `hiLand`, `baseTiles` (montaggio dopo `ticks`), `gpuLight` mobile; `contracts:check` su commit pulito.
- **D6** ✓ zoom massimo resta 3 (manifest `camera.maxZoom`, nessuna modifica).
- **D3** ✓ lastra dettaglio montagne tenuta (già così in `/game`). **Tutte le decisioni D1–D6 prese.** Resta F6: invarianti `pixi-world-map`, `verification.json` → `verify:bundle`, `contracts:check` su commit pulito, V10 su dispositivi reali (Director).
- **F6** (2026-11-10, «Sì, chiudi»): invarianti nuove `pixi-world-map` INV-6…9 (B-add), `game-settings` INV-5 (red-first), `game-menu-screens` INV-13 (bug, red-first) e INV-14; V8 camera a riposo identica su 3 finestre (`v8-camera.json`). `verify:bundle`: **OB-1…OB-8 PASS** (tutte le bloccanti); OB-9/OB-10 occhio del Director; OB-11 `contracts:check` FAIL. **Verdetto BLOCKED dai gate globali, non da questo lavoro:** (1) BASE sigillato prima di R-322 → citazioni R-322 ammesse solo con proposta sha256 approvata dal Director; (2) molti componenti dell'altra sessione o già alterati (carta evento, roster, vista villaggio, skin) falliscono in modo chiuso sul diff non committato; (3) trust-set non approvato nel ledger del Director (deriva preesistente di `.mw/surface-map.json`). Si sbloccano con: commit separati per sessione → nuovo sigillo → approvazioni Director. Test vecchio già rosso escluso dall'OB-3: `tests/unit/frozen/worldSurfaceKit.alignment.test.ts` (25 rossi senza questo lavoro).

