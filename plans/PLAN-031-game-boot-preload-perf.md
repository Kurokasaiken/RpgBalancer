---
title: PLAN-031 — /game boot preload + performance measurement
status: completed
owner: Mind Weaver (planner)
created: 2026-10-12
source_request: R-166
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - test-results/game-perf-<date>.log (evidence)
  - RICHIESTE.md (esito R-166)
---

# PLAN-031 — `/game` come schermata principale: preload totale + misurazione

## Mandato del Director (R-166, 2026-10-12)

> *"la pagina che adesso si chiama /game è quella che dovrà diventare la schermata
> principale del mio gioco. [...] deve essere tutto pre caricato, trascinare i
> componenti deve essere smooth [...] Deve essere professionale da videogame AAA."*

Decisioni ratificate in sessione:

- **Title screen approvata** — scopo funzionale: caricare *tutta* la mappa e
  *tutti* i componenti durante il loading, così dopo non c'è latenza. Priorità
  dichiarata: **i medaglioni** (drag del PG dalla pgCard istantaneo dal primo gesto).
- **Sequenza:** (1) fix preloading — a pagina aperta zero rallentamenti, zero
  zoom/posizioni strane, zero attese: si attende solo durante il loading;
  (2) misurare la responsività di tutto ciò che esiste; (3) gate Director:
  numeri soddisfacenti → aggiungere funzioni, altrimenti cambiare strategia.

## Diagnosi FACT (verificata nel codice 2026-10-12)

### Perché oggi si vedono attese e "zoom strani"

`PixiWorldMap` (`src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`):

1. `app.init()` → **canvas montato subito** (line ~492): il giocatore vede lo
   stage mentre il mondo si costruisce.
2. I ~21 layer base si caricano **in serie**: `for (const layer of layers) await load(...)`
   (line ~531) — uno sprite alla volta appare a schermo. Poi altre attese
   sequenziali: canopy manifest+texture (506–555), `sea_mask` (richiesta 3 volte:
   609, 677, 883), `sea_pattern_tile`, ~30+ sea marks/waves in serie (902–928),
   `coast_distance` (1026), bird strip (1053), cloud sprites + shadow bake con
   blur canvas **sul main thread** (822–841, 1154–1160), region id-map + raster
   pesanti (1364–1470), seabed art generato a pixel loop (661–680, 724–746).
3. `refit()` viene chiamato **solo alla fine** (line 1321): durante tutto il
   caricamento la camera resta a `panX:0, panY:0, zoom:1` — l'angolo nord-ovest
   della mappa a scala 1:1 — poi salta all'inquadratura giusta. Questo è il
   "posti zoomati strani" del Director.
4. Nessun `onReady`: la pagina non può sapere quando il mondo è davvero pronto.
5. Le texture si caricano in GPU **al primo draw**: sprite fuori viewport vengono
   uploadati al primo pan → jank alla prima esplorazione.
6. La pagina è un `lazy()` chunk con fallback testuale (`App.tsx` ~1033).

### Perché il primo drag del medaglione può impuntare

- `handleDragStart` → state → mount del drag overlay + primo render del componente
  medaglione + eventuali `<img>` non decodificate — tutto a freddo, sul frame del
  gesto.
- Il `DndContext` avvolge l'intera pagina: il cambio di stato ri-renderizza i
  consumer (da verificare in T-B2 dove sta il costo).

### Strumentazione già esistente (non reinventare)

- `useFrameMetrics` (p50/p95/worst/longFrames/fps, pausa su `document.hidden`) e
  `useImageFootprint` in `src/ui/idleVillage/hooks/useFrameMetrics.ts`.
- `WorldSurfacePerfHud` (dev readout, **non** montato su `/game`).
- `/map-benchmark` (`src/pages/map-benchmark.tsx`): replay scripted di pan+zoom
  con delta frame — il pattern da generalizzare.
- Suite `MapPerformanceProfiler*` (engine/config/exporter/HUD).
- `PixiWorldMap.onStats` riporta texture count + MB GPU.
- Precedente test hooks: `__idleVillageTestHooks`, `__worldCam` (DEV) già esposti.

## Vincoli e trappole onorate

- **T-01** (fit/margini mare): il piano cambia *quando* refit gira, non la matematica
  di `floorZoom`/`seaMargin*`/`safeFit`. Vietato riaprire quella partita.
- **T-04** (claim percettivi): misure eseguite in browser reale visibile (rAF non
  gira in tab nascosta); il verdetto finale è dell'occhio del Director.
- **T-03** (scope CSS): la veil/boot screen porta lo scope skin sul root del
  componente, incluse superficie che apre.
- **T-05**: scope approvato dal Director; modifiche a `PixiWorldMap` additive
  (props + pipeline parallela), non riscrittura dei visuali.
- **Invarianti**: i18n per ogni stringa della boot screen (`idleVillage` ns);
  config-first per budget e timing (Zod); primitivi `HudPlaque`/skin per la veil
  (mai CSS ad hoc); JSDoc su ogni nuova funzione; telemetry sulle fasi di boot;
  stato boot = locale/Context (presentazione), non Zustand.

## Non-goals (fase 3 del mandato, dopo il gate)

Settings screen a tab, musica/ambience, save slots/Load, minimap, Esc/pausa,
FTUE/onboarding, soak test di memoria. Si decidono DOPO i numeri.

---

## Fase A — Boot & preload

### T-A1 · Boot screen (veil) on-DNA su `/game`

Componente `GameBootScreen` (overlay z-index alto sopra la pagina, montato da
`GameFramePixiPage`): logo/titolo, barra di progresso **determinata**
(`loaded/total` reale, non spinner), sottotitolo di fase corrente. Primitivi
skin (`HudPlaque` o equivalente), niente CSS ad hoc; i18n; `prefers-reduced-motion`
→ reveal senza fade. La pagina gioco **resta montata e viva sotto la veil** —
è il punto: tutto gira e si scalda mentre il giocatore guarda il loading.
Copre `/game`, `/` e `/game-frame-pixi` (stessa pagina).

### T-A2 · Contratto di readiness su `PixiWorldMap`

Nuove props: `onBootProgress({phase, loaded, total})`, `onReady()`.
`onReady` scatta solo quando: manifest validato, **tutte** le texture risolte,
scena costruita, `refit` applicato, ≥2 frame renderizzati, warmup GPU fatto
(T-A5). Fasi enumerate: `manifest → textures → build → warmup → settled` —
è ciò che guida la progress bar di T-A1.

### T-A3 · Pipeline asset a tier paralleli

Enumerare **tutti** gli URL asset upfront da manifest + flag effetti (stessa
logica dei branch `fxOn`), poi `Assets.load` in batch paralleli con contatore
per il progresso (dedup gratis via cache `Assets`), infine costruire la scena.
Sostituisce il waterfall sequenziale: il tempo di boot crolla e il progresso
diventa misurabile. I bake main-thread (cloud shadows, seabed art, region
highlight) restano nella fase `build`, tracciati come sotto-step.

### T-A4 · Camera assestata prima del reveal

`refit()` appena il container `world` esiste (prima degli effetti), non solo in
coda; la veil copre comunque il resto. Nessun salto visibile mai: al reveal la
camera è già quella finale. (Non si tocca la matematica — T-01.)

### T-A5 · Warmup GPU + componenti

- **Texture**: dopo la build, forzare l'upload di tutte le texture
  (`renderer.prepare.upload(world)` o equivalente API Pixi v8 corrente —
  verificare firma esatta) così il primo pan non paga l'upload.
- **Medaglioni/pgCard**: decodificare gli `<img>` del roster durante il boot
  (`img.decode()`), montare una volta il layer del drag ghost (un render
  nascosto) così il primo drag vero non paga mount+decode.
- **Chunk/i18n**: prefetch dei lazy chunk raggiungibili dalla pagina e delle
  risorse i18n `idleVillage` mentre la veil è su.
- Criterio di accettazione: primo drag medaglione senza long-frame extra
  rispetto a un drag "a caldo" (misurato in T-B3).

### T-A6 · Telemetry + timing del boot

`performance.mark` per fase (`route-entry → manifest → textures → build →
warmup → ready`), `trackTelemetryEvent('game_boot_phase', {...})`, e
`window.__gameBoot` (DEV) con i millisecondi per fase — base dell'evidence log
e della metrica "first interactive".

---

## Fase B — Misurazione della responsività

### T-B1 · Perf probe su `/game` (dev instrument, non product UI)

`useGamePerfProbe` + `window.__gamePerf` (DEV): ring buffer di delta frame
(riusa la logica di `useFrameMetrics`), segmentato per gesto:
`beginProbe(name)/endProbe()` → `{p50, p95, worst, longFrames, frames}`.
Più `mark(name)`/`measure(a,b)` per latenze puntuali
(pointerdown→primo-feedback-visivo). Montabile/smontabile via pannello dev o
flag URL (`?perf=1`), zero costo quando spento.

### T-B2 · Audit del cold path del drag medaglione

Misurare con T-B1 *prima* di ottimizzare: pointerdown → overlay visibile →
drop commit. Dove sta il costo (mount overlay, decode immagini, re-render
consumers DndContext)? L'output è la tabella dei costi che decide se T-A5 basta
o servono fix mirati (es. `React.memo` su consumer, throttling collision
detection, `pointerWithin` vs altro algoritmo).

### T-B3 · Suite gesti scripted su `/game`

Generalizzare il pattern di `map-benchmark` in `GamePerfHarness` (pagina dev o
driver in-page): replay deterministico di — pan mappa, wheel zoom, drag
medaglione roster→slot POI (ibrido CDP + test hooks, precedente
`dragResident.ts`), apertura/chiusura pannelli HUD, apertura menu, apertura
quest detail. Ogni gesto → una riga di metriche. **Deve girare in finestra
visibile** (T-04).

### T-B4 · Budget config-first + spec Playwright

`src/balancing/config/idleVillage/gamePerfBudgets.ts` (Zod): soglie per
first-interactive, p95 per gesto, long-frames ammessi, latenza drag.
Spec `tests/e2e/gamePerf.spec.ts` sul dev server live: esegue T-B3, legge
`__gamePerf`, scrive `test-results/game-perf-<data>.log`, fallisce se un budget
sfora. Budget iniziali **proposti** (da ratificare, vedi Open): first
interactive ≤ 4 s sulla macchina dev; p95 ≤ 33 ms su pan/zoom/drag/pannelli;
long-frames (>50 ms) = 0 durante i gesti; pointerdown→overlay drag ≤ 100 ms.

### T-B5 · Report & gate Director

Tabella numeri vs budget nel log evidence + sintesi in sessione. Il Director
decide: soddisfatti → si pianifica l'aggiunta di funzioni (settings, audio,
ecc. — la lista R-166); non soddisfatti → strategia alternativa (quality
preset, riduzione effetti, renderer budget).

---

## Dipendenze tra task

```
T-A2 ─┬─ T-A3 (pipeline parallela produce loaded/total)
      └─ T-A4, T-A5 (fasi/warmup dentro il contratto readiness)
T-A1 ──── consuma T-A2 (progress + ready)
T-A6 ──── osserva le fasi di T-A2/A3
T-B1 ──┬─ T-B2, T-B3
T-B4 ──── consuma T-B3 (driver + budgets)
T-B5 ──── ultimo: report + gate
```

Ordine esecutivo proposto: **T-A2+T-A3 → T-A1 → T-A4 → T-A5 → T-A6 →
T-B1 → T-B2 → T-B3 → T-B4 → T-B5**.

## Rischi

| Rischio | Mitigazione |
|---|---|
| Parallel load satura la connessione e rallenta il primo tier | Tier critico (base layers + HUD) prima, atmosfera dopo ma sempre sotto veil |
| `renderer.prepare.upload` non copre sprite nascosti/masks | Verificare con `onStats` + long-frame al primo pan; fallback: render di un frame a zoom min prima del reveal |
| Perf spec flaky in headless (rAF throttled) | Esecuzione headed su dev server (T-04); la spec dichiara `headed` o marca `fixme` in CI |
| Warmup medaglione non copre il vero costo del drag | T-B2 misura prima di dichiarare vittoria — niente claim senza numeri |

## Decisioni ratificate (Director, 2026-10-12)

1. **Title screen** = veil con **reveal automatico** al 100% (niente bottone
   "premi per entrare" in v1).
2. **Budget ratificato**: p95 ≤ 33 ms per gesto, long-frames (>50 ms) = 0,
   first interactive ≤ 4 s (macchina dev), drag pointerdown→overlay ≤ 100 ms.
3. **Perf spec anche in CI/headless**: la spec deve poter girare in headless —
   risultati marcati con ambiente (`headed`|`headless`) nel log; se headless si
   dimostra flaky il verdetto resta dell'esecuzione visibile (T-04) e la spec
   va in quarantena, non eliminata.
4. La veil copre `/game`, `/` e `/game-frame-pixi` (stessa pagina).

## Safeguard & chiusura

- `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`,
  `npm run kanban:lint` dopo ogni task.
- Evidence log `test-results/game-perf-<data>.log` (T-B4) + boot timings (T-A6).
- Verifica a occhio del Director su boot e drag in browser reale (T-04).
- Aggiornare `plans/INDEX.md`, `RICHIESTE.md` (R-166) a ogni avanzamento.

---

## Stato implementazione (2026-10-12, sessione esecutiva)

### Fase A — boot/preload: FATTA

- `PixiWorldMap`: props `onBootProgress`/`onReady`, prefetch a tier paralleli
  (manifest+base → atmosfera → canopy/regioni), `fetchJson` condiviso,
  milestone `buildStep`, `renderer.prepare.upload` prima di `onReady`,
  `performance.mark` per fase.
- `GameBootScreen` (nuovo): veil brandizzata (WANDERLUST + progress reale)
  sopra la mappa montata; reveal automatico a `onReady`; fade via effect
  separato (bug fix: `leaving` nelle deps cancellava `exitTimer`).
- `game-frame-pixi.tsx`: wiring veil + `__gameBoot` + telemetry
  `game_boot_ready`; boot state in ref con flush a 100 ms (niente re-render
  ad ogni evento di progresso); fallback Suspense in `App.tsx` usa la stessa
  veil con fase indeterminata.
- **Fix extra T-A4**: `safeFit` era nelle deps dell'effetto mappa → ogni
  toggle pannello (roster/eventi) distruggeva e ricostruiva l'app Pixi.
  Ora solo `safeFitMarginKey` (margini camera) forza il rebuild; gli insets
  vivono in `safeFitRef` e un effect dedicato chiama `refit()` in place.
- i18n `gameFrame.boot` aggiunto a en/it-IT/pseudo.

### Fase B — misura: FATTA, budget trovato 1 colpevole

- `__gamePerf` probe + `runSuite()` (pan, zoom, menu-open, medal-drag-mount).
- `gamePerfBudgets.ts` (Zod) + `gamePerf.spec.ts` con evidence log.
- Prima misura preview/headed:
  `boot.interactiveMs=3340` (≤4000 ✓) · pan p95 17.6 ✓ · zoom 17.6 ✓ ·
  menu 17.4 ✓ · medal-drag-mount 17.7 ✓ · **real-medal-drag: 1 long frame
  ~117 ms** ✗ — commit React sincrono a `onDragStart`/`onDragEnd`
  (`draggingResidentId` è state pagina → re-render di anchors+roster+HUD).
- **Fix T-B4**: `startTransition` su `onDragStart`, `onDragEnd` (verdict
  catturato — lo scope è sincrono), `onDragCancel`. Il render diventa
  interrompibile e si spezza su più frame invece di un blocco unico.

### Nota per la fase C

`session`/`expeditions` sono nelle deps del memo `anchors` → il memo non
cacha mai tra render. Se il transition-fix non bastasse, la mossa strutturale
è memo dei nodi anchor (`MapQuestPoi`) o spostare `draggingResidentId` in
uno store consumato solo da overlay/poiView.

---

## Follow-up Director 2026-10-12 — logo, teal, pannelli chiusi, hide-HUD

Richiesta verbatim: *"abbiamo un logo vero, usa direttamente quello. il colore
di sfondo è bello, ma proviamo cn il colore teal che usiamo nella HUD. quando
si apre la scherma della mappa nn deve avere aperte le schermate che c'erano
aperte al salvataggio. Se è la prima volta nessuna scheramta aperta. Vorrei
anche un pulsante x fare sparire l'HUD (tipo che quelle alte salgono
lentamente fino a sparrie, quelle sotto scendono fino a sparire)"*.

Implementato (stessa sessione, fasi A+B già verdi):

- **Logo authored**: `wanderlust-logo.png` (crop alpha della placca
  `marketing/steam/assets/library-logo.png`, 1100×274) importato da
  `src/assets/ui/idleVillage/` e renderizzato nella veil al posto del titolo
  testuale; larghezza config-first (`bootVeil.logoWidthPx`), alt i18n
  `gameFrame.boot.logoAlt`.
- **Sfondo teal**: `bootVeil.colors` → la lacchetta sea-teal della HUD
  (`#1d4a4d` glow / `#0f2627` deep = `--hud-lacquer-tint` /
  `--skin-hud-lacquer-deep` del preset lacquer_atlas).
- **Pannelli sempre chiusi all'apertura**: `defaultVisible` → `false` per
  roster/events nel registry; `useHudPanels` non persiste più
  (`hud_panels_v1` rimosso — la scelta è *sempre* entry pulita, non solo la
  prima volta). Shortcut e toggle in-sessione invariati.
- **Hide-HUD**: `HudHideToggle` (occhio, `data-hud-controls`) nel cluster
  bottom-right — unico cromo che resta quando il resto scorre via; shortcut
  `h` (stesse guard dei tasti pannelli); `slideChrome` spinge i cluster top
  verso l'alto e quelli bottom verso il basso
  (`translateY(±(100%+offscreenPx))` + fade + `visibility` post-transizione);
  durata `hudHide.slideMs`, istantanea sotto reduced-motion; stato
  session-only, `data-hud-hidden` sulla root, telemetry `game_hud_toggle`.
- **Spec aggiornate**: le tre spec `/game` che trascinano dal roster
  (`gamePerf`, `gameQuestExpedition`, `gameQuestLifecycle`) aprono il roster
  con `r` in `beforeEach`, da utente reale.
