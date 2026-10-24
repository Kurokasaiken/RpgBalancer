---
id: PLAN-083
title: "PLAN-083: Mobile fit della superficie /game — playtest da telefono (R-274)"
created: 2026-10-23
status: in corso — battezzato dal Director 2026-10-23 («procedi»). T-001..T-005 implementati + spec mobileFit **9/9 verde** (Chromium Pixel 7 390×844, build playwright). Aperti: T-006 tap-to-place (path primario dnd — non ancora implementato), tap-to-reveal tooltip, T-007 chiusura/eye-check Director su device reale.
debate_artifact: mind-weaver/.mw/runs/20261023-mobile-fit-plan083/artifact-r007.md
debate_hash: 65709766f0008e62f3554fc563779c5ad771aabdaefdd860564d0d65c0be981c
---

# PLAN-083: Mobile fit della superficie /game (R-274)

**Origine:** R-274 — *"attualmente per poter testare le cose da cell, ma anche
sapere app da store m interessa"*. Questo piano copre **solo la prima traccia**:
rendere `/game` usabile e testabile su un viewport mobile portrait
(~390×844, touch). Store/packaging nativo (Tauri mobile, TWA, account) è un
piano successivo e non viene aperto qui.

## Evidenza (probe headless 390×844, 2026-10-23)

Artifact: `test-results/mobile-probe-2026-10-23/` (screenshot 01–11 + probe.mjs).

**Funziona già:** canvas Pixi montato a pieno viewport, nav risponde al tap,
vista villaggio apre, marker quest si rivelano, HUD-hide funziona, documento
senza overflow orizzontale (`scrollWidth === 390`), `TouchSensor` dnd-kit già
registrato (`dragSensors.ts`), PWA+manifest+SW già configurati.

**Break osservati:**

| # | Break | Evidenza |
|---|---|---|
| B1 | Top HUD clip: resource strip tagliata a destra (WC illeggibile) | shot 04/10 |
| B2 | Bottom nav 452px > 390px: TAVERN irraggiungibile | misura DOM + shot |
| B3 | Vista villaggio: pin+legend accavallati in striscia ~150px | shot 10 |
| B4 | Mappa letterbox: mondo 3:2 in fascia, POI minuscoli, **zoom solo `wheel`** (nessun pinch) | `PixiWorldMap.tsx` `el.addEventListener('wheel')` |
| B5 | Hint keyboard-only («← → buildings · Enter details · Esc map») senza equivalente touch | shot 10 |
| B6 | 9/13 target interattivi <44px (bottoni d'angolo 40×40) | misura DOM |
| B7 | `QuestRunWindow` placca 820px e pannelli flottanti > viewport | `questWindow.widthPx` config |

## Direzione e invarianti

- **Variante adattiva, non redesign:** breakpoint `mobilePortrait` =
  **`viewportW < 768px`** (campo di `mobileFitConfig`). Sotto il breakpoint
  si attivano le varianti chrome/sheet/zoom effettive. **Dead zone
  768–1023**: layout desktop verbatim, solo asserzione no-crash — niente
  sheet mode. **≥1024: emit-identical strutturale** (matrice contrattuale
  1280/1440/1920/3440 — CTR-game-005 resta il riferimento).
- **Config-first:** tutta la policy mobile vive in **un unico**
  `mobileFitConfig` Zod: `breakpoint`, bound pinch (`mobileMaxZoomFactor`,
  `mobileZoomRangeFloor`), `navPrimaryIds`, timeout gesti,
  `minTargetPx:44`, `mapFocal`, `dprCap`. Invariante cross-field
  `.refine()`: `mobileMaxZoomFactor ≥ mobileZoomRangeFloor`, entrambi
  finiti >0, con unit test di rejection. Il valore del floor è ruling
  Director registrato in evidence T-007 (valore + device di tuning).
- **Nessuna nuova primitiva** senza audit di riuso: sheet = riuso del
  componente pannello esistente via props; reuse audit obbligatorio in
  T-005 e T-003 (formatter i18n **esistente**).
- **i18n:** hint touch, aria-label nav e numeri abbreviati via chiavi /
  formatter i18n esistenti.

## Contratto camera/zoom (cuore del dibattito)

- **`safeFit` portrait** = cover sull'asse corto, centrato sul focale
  authored `mapFocal` (config). **Guardia T-01**: safeFit tocca solo
  camera/transform — spec con diff-assert che world bounds/margini/mask
  config sono invariati desktop-vs-mobile.
- **Bound zoom effettivi — SOLO sotto il breakpoint** (viewport <768):
  `effectiveMinZoom = max(coverScale, wheelMinBound)` (copertura =
  invariante primario, nessun letterbox nemmeno se
  `coverScale > wheelMaxBound`);
  `effectiveMaxZoom = max(wheelMaxBound, effectiveMinZoom ×
  mobileMaxZoomFactor)` (range pinch non-vuoto garantito sul device
  primario). **≥768: coppia wheel verbatim** — emit-identical per
  costruzione, non per coincidenza numerica.
- Caso `effectiveMin === effectiveMax` = **fallback aspect atipici**: il
  recognizer pinch ignora i delta zoom (no-op) ma il pan resta attivo.
- **Pan clamp** derivato dalla scala effettiva corrente + protected edge
  authored: spec assertion — dopo pan massimale in ogni direzione a min e
  max zoom effettivo la viewport non mostra area fuori dalla mappa dipinta.
- **Pinch = DOM Pointer Events** sul wrapper canvas (decisione ratificata
  dal dibattito: federated events Pixi non ha arbitraggio multi-puntatore
  pulito): tracking pointer id, `setPointerCapture`, `pointercancel` →
  restore transform pre-gesto, transizione pan→pinch senza salto, gated
  `pointerType==='touch'`, riuso dell'entrypoint zoom wheel.
- **`dprCap`** applicato al renderer su `pointer:coarse` (default 2).

## Trappole di superficie (da `context/recurring-traps.md`)

- **T-01** (map fit / floorZoom / safeFit): vedi contratto camera sopra —
  diff-assert su world config + pan clamp su protected edge.
- **T-03** (`data-hud-controls` scope, dropdown/popover): i controlli HUD
  su mobile ereditano lo scope del root componente.
- **T-04**: i claim «si legge/si usa su telefono» si chiudono con
  screenshot + eye-check Director su device reale.
- **T-13**: sessioni parallele attive sul worktree — gate/probe da
  sospettare come collisione.
- **T-21**: controlli nativi dentro pill `data-hud-controls` (hit-area).

## Tasks

| Task | Contenuto | Depends |
|---|---|---|
| T-001 | **Contratto mobile**: `mobileFitConfig` Zod (vedi sopra, cross-field refine + rejection test); progetto Playwright mobile 390×844 con split **`mobileSmoke`** (comportamentale, mai un generico "loads") / **`desktopEmitIdentical`** (geometria DOM ≥1024); spec `mobileFit.spec.ts` red-first sui break noti + tap-reachability di ogni azione hotkey + pan-clamp + pinch-floor; `dev:lan` script; amend `game_map_fit_contract.md` con viewport portrait (R-274 a BASE) | — |
| T-002 | **Portrait fit + pinch**: `safeFit` cover/`mapFocal`; bound effettivi solo <768 (formula §camera); pan clamp su protected edge; listener DOM Pointer Events (capture, pointercancel→restore, pan→pinch no-jump, zoom no-op se min=max); riuso entrypoint wheel; `dprCap` su coarse; diff-assert config mondo | T-001 |
| T-003 | **Chrome compatto <768px**: nav = primarie **icona 44×44** (`navPrimaryIds` config, budget schema `N×44+N×8+44 ≤ 390−inset`) + «Altro» chip 44×44→sheet (riuso T-005); spec: ogni target ≥44×44, visibile, non sovrapposto, con `env()` inset, label più lunga in Altro; top HUD compressione (icona+numero abbreviato via formatter i18n esistente, secondari in overflow); `env()` safe-area + `100dvh`(fallback `100vh`) + `viewport-fit=cover` asserito | T-001, T-005 |
| T-004 | **Villaggio + hint**: tabella hotkey→UI completa (artefatto); hint keyboard-only nascosti su `pointer:coarse` e rimappati su azioni touch; **reflow pin overlay (B3) rinviato a v1.1** — dichiarato, non nascosto; eye-check OB-5 verifica che il cover framing non lo peggiori | T-001 |
| T-005 | **Panel mode**: `panelMode: floating|sheet` in config; sheet = full-bleed quest / bottom-sheet liste-dettaglio; uno alla volta (esclusività solo-mobile nel panel manager); **persistenza disaccoppiata** — mobile non legge/scrive posizioni drag desktop (schema version bump, boot mobile non riapre pannelli desktop), condiviso solo open/closed, test round-trip desktop↔mobile byte-identico; drag handle nascosti; close ≥44px + backdrop tap; **NO swipe-down**; reuse audit | T-001 |
| T-006 | **Gesture arbitration**: tabella priorità gesti `tap > pinch > drag > long-press` come artefatto obbligatorio; `touch-action` scopato (`none` su canvas+sorgenti drag, `pan-y` altrove); `overscroll-behavior`; **tap-to-select + tap-to-place = path primario** per assegnazione medaglioni touch (drag nativo = enhancement post device-check); tap-to-reveal tooltip (long-press declassato a v1.1) | T-002, T-005 |
| T-007 | **Chiusura**: evidence pack (lista §chiusura), INDEX/RICHIESTE, `plan:stamp` | T-006 |

## Visual fork gate (v35)

- **VF-1 — nav <768px**: risolto dal dibattito — la variante scroll è
  eliminata a priori (viola l'invariante 44px a 390px); la scelta
  strutturale è icon-chips + «Altro» sheet. Resta il **ruling Director sul
  rendering** (look icone, voci primarie in `navPrimaryIds`) via eye-check
  OB-5, non un fork pre-esecuzione.
- **VF-2 — pannelli**: risolto dal dibattito — bottom sheet liste/dettaglio,
  full-bleed ricomposto quest, niente swipe-down. Ruling Director sul
  rendering in OB-5.
- **T-002, T-004, T-006**: `visual-fork: skipped` — input/fit, reflow
  contenuto, comportamentale.

## Living contracts (PLAN-054)

- Superfici: `game-map-pixi`, `game-hud`, `game-tests`.
- **Mode B-add**: nuove invarianti mobile (`mobileSmoke`, viewport
  portrait in matrice, zoom effettivi) — `// INV:` tag con `R-274`.
- **Auto-Neutral → emit-identical ≥768 strutturale**: i bound effettivi e
  la sheet mode sono gated sotto il breakpoint; se un task muta output
  desktop → Mode B-amend dichiarato con `R-NNN` autorizzante.
- `game_map_fit_contract.md` riceve amend portrait citato `R-274`.

## Contratto di chiusura (obbligazioni)

| ID | Tipo | Contenuto |
|---|---|---|
| OB-1 | `state` (blocking, R-247) | `mobileFit.spec.ts` progetto mobile verde — B1/B2/B4/B7 + tap-reachability hotkey + pinch/pan/pointercancel + pan-clamp + nav-budget |
| OB-2 | `state` (blocking) | `desktopEmitIdentical`: snapshot geometria HUD/nav a 1280/1440 invariati + spec viewport esistenti verdi |
| OB-3 | `state` (blocking) | `npm run lint -- src/ui/idleVillage src/pages` + `npm run build:check` |
| OB-4 | `state` (blocking) | unit test nuovi (fit portrait, zoom effettivi matrice 360/390/430/768/1024, `mobileFitConfig` schema+rejection, round-trip persistenza) verdi |
| OB-5 | `human-eye` | Director eye-check: screenshot side-by-side + **device reale** (checklist: pinch, tap-to-place, sheet open/close, safe-area, pull-to-refresh best-effort, pin villaggio non peggiorato) + eye-check desktop |
| OB-6 | `state` | `npm run closure:lint` |

## Evidence pack (T-007)

Report Playwright `mobileSmoke`; screenshot 390×844 per superficie; tabella
hotkey→UI; test round-trip persistenza byte-identico; snapshot geometria
desktop; eye-check Director mobile E desktop; checklist device reale;
**valore `mobileZoomRangeFloor` + device di tuning registrati** (ruling
Director — invariante falsificabile); audit reuse formatter i18n T-003.

## Artefatto: tabella priorità gesti (T-006, contratto dibattito)

| Priorità | Gesto | Target | Timeout/soglia | Conflitto → regola |
|---|---|---|---|---|
| 1 | **tap** | nav chip, bottoni, pin, sheet rows, menu item | `tapMaxMs:300`, `tapMaxMovePx:10` | vince sempre: nessun hold attivo sotto tapMaxMs |
| 2 | **pinch** | canvas mappa (2 dita) | `pinchStartDeltaPx:12` | il 2° dito congela il pan → baseline pinch; `pointercancel` → restore pre-gesto |
| 3 | **pan/drag mappa** | canvas mappa (1 dito) | `panSlopPx:8` | dopo pinch→1 dito: rebind alla posizione corrente, nessun salto |
| 4 | **drag dnd-kit** | medaglioni roster → slot | `holdToDragMs:180` o `minDragDistance:5` | su touch è ENHANCEMENT — il path primario è tap-to-place (T-006); su drag source `touch-action:none` |
| 5 | **long-press** | tooltip pin (v1.1) | `longPressMs:550` | declassato: v1 usa tap-to-reveal; mai sullo stesso target del drag |
| — | **scroll pagina** | ovunque su `/game` | — | soppresso: `touch-action:none` canvas, `overscroll-behavior:none` shell, `pan-y` dentro gli sheet |

## Artefatto: tabella hotkey → UI (T-004, contratto dibattito)

| Hotkey | Azione | Equivalente touch a 390px | Stato |
|---|---|---|---|
| `h` | hide/show HUD | perla `data-hud-hide-toggle` (bottom-right) | ✅ tap |
| `r` | Settlement Registry (villaggio) | chip Registro nel drawer villaggio | ✅ tap |
| `F10` | Director panel | dev-only, fuori scope mobile | n/a |
| `Esc` | chiudi pannello/sheet/menu | backdrop tap + close ≥44px (sheet) / X pannello | ✅ tap |
| `← →` | scorri edifici villaggio | pan/swipe sulla scena villaggio | ✅ tap+pan |
| `Enter` | dettaglio edificio | tap sul pin edificio | ✅ tap |
| `Alt` (hold) | glass-globe tilt mappa | nessun equivalente — fuori scope v1 | ➖ v1.1 |
| `+/-` wheel | zoom mappa | pinch a 2 dita | ✅ gesture |
| `1-9` panel shortcuts | toggle pannelli HUD | trigger `[data-hud-panels-trigger]` + sheet | ✅ tap |

## Dibattito multi-AI — esito

Run: `mind-weaver/.mw/runs/20261023-mobile-fit-plan083/` · 7 round ·
**CONVERGED** su artifact-r007 (`sha256:6570…981c`).

- **chatgpt**: ACCEPT (r007) — 4 obiezioni di precisione, tutte amended
  (minZoom contract, coverage-vs-bounds, desktop-domain, nav arithmetic,
  schema cross-field).
- **deepseek**: ACCEPT (r006, r007 strict refinement) — obiezioni
  strutturali round-1 tutte amended; dissenso registrato sul pinch-cut
  (respinto dalla maggioranza); 3 note non-bloccanti in T-007 evidence.
- **claude**: conditional ACCEPT soddisfatto verbatim (turn_resolution
  seq79 — composer failure su T-016/T-017; la sua condizione «with 1 and 2
  added, I ACCEPT» è presente in r006/r007).
- **grok**: rimosso `provider_dead` (estrazione fallita ×4).
- **gemini**: escluso (3 failures clarification/send).

## Non-goals dichiarati (v1.1 / follow-up)

Reflow pin villaggio (B3), sweep 44px non-essenziale, long-press tooltip,
swipe-dismiss sheet, landscape phone, tablet (768–1023 = solo no-crash),
quality profile GPU completo, packaging store (Tauri/TWA — piano separato).

## Rischi accettati / aperti

- **Aperto — desiderata:** direzione FROZEN (v2, Pillar 1) ancorata a
  «Tauri desktop su WebView». Il piano è *fit/testabilità*, non cambio di
  target — se il Director lo legge come direzione nuova, serve desiderata
  dedicata prima del battesimo.
- Boot dev ~30s: spec mobile a boot singolo (page reuse) o fixture — mai
  N boot per N test.
- Drag&drop touch verificato solo in teoria: il path primario è
  tap-to-place; il drag nativo è enhancement post device-check.
- `overscroll-behavior`/pull-to-refresh best-effort su iOS Safari.

## Avanzamento implementazione (2026-10-24)

- **T-001..T-005 fatti.** Spec `tests/mobileFit.spec.ts` progetto `Mobile Fit`
  (Chromium Pixel 7, 390×844, `hasTouch`) — **9/9 PASS**: no overflow, nav
  ≥44px non sovrapposta + «Altro», HUD senza clip, zoom ≥ cover + focale
  centrato, pan clamp su quad mare, range pinch ≥ floor, hint tastiera
  soppressi su coarse, pannelli ≤ viewport, desktop emit-identical a 1280.
- **T-006 parziale.** Canvas `touch-action:none` + `overscroll-behavior` +
  tabelle gesti/hotkey nel piano ✅. **Tap-to-assign: GIÀ ESISTENTE su
  `/game`** (verificato in codice): `PgCard.onSelect` → `onResidentSelect`
  → `useQuestPoiSession`/`useQuestExpeditionSession.handleResidentSelect`
  assegnano il residente al primo slot compatibile del dettaglio quest
  aperto, con flight animation. Limite dichiarato del path: funziona solo a
  quest-detail aperto + slot compatibile (nessun picker a più slot); gli
  slot villaggio edificio sono fuori scope (`VillageSlotOverlay` visual-
  only, `WorkerPickerSheet`/`useSandboxInteractionMode` restano sandbox/
  legacy). Tap-to-reveal tooltip villaggio → v1.1.
- **T-007 aperto** — evidence pack, `closure:lint`, eye-check Director su
  device reale (OB-5).
- Note: unit `mobileFitConfig` 14/14 PASS; `tsc` clean; WebKit non installato
  → progetto su Chromium; `__worldCamBounds` seam pubblica i bound effettivi.
