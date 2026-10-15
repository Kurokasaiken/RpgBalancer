---
title: "PLAN-035 — Vista Villaggio (Village view mode) e Menu Edifici su /game"
status: completed
completed: 2026-10-15
owner: Mind Weaver
created: 2026-10-15
source_request: R-194 (desiderata v30 FROZEN)
debate: mw-web-debate 20261015-2012-r194-village-buildings-plan → CONVERGED su artifact-r005.md (sha256 2ab68d636b0124eb15c6c21ec7f33994ee4ff358017f8c1085765c99d94b133f); chatgpt ACCEPT (3 OBJECT risolti), deepseek ACCEPT, gemini ACCEPT, grok provider_dead, claude mai in elettorato (composer failure)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md
  - RICHIESTE.md (esito R-194)
  - CURRENT_STATE.md
  - src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md
---

# PLAN-035 — Vista Villaggio (`Village` view mode) e Menu Edifici su `/game`

Fonte canonica del dibattito: `.mw/runs/` → run `20261015-2012-r194-village-buildings-plan`
(repo mind-weaver: `.mw/runs/20261015-2012-r194-village-buildings-plan/artifact-r005.md`).
Questo documento è il piano operativo; l'artifact r005 è la spec tecnica converged.

## 1. Goal & Scope

**Goal:**
1. Ripulire `src/assets/mood/villaggio.png` (`3168×1344`, 21:9) dal watermark Gemini in basso a destra senza croppare l'inquadratura.
2. Implementare su `/game` la **Vista Villaggio** (`VillageScreenView`, Direzione C) a tutta area dentro `GameFrame` — sotto le lastre HUD fisse — attivabile sia cliccando la **regione `village`** sulla mappa Pixi sia il pulsante **`Village`** nel nav plinth; ritorno a `Map` via nav plinth o `Escape`. `PixiWorldMap` resta montata sotto (zero teardown WebGL).
3. **11 edifici** icon-first sul dipinto (Taglialegna, Cava/Miniera, Fattoria/Orto, Magazzino, Locanda, Fucina, Emporio, Infermeria, Palizzata, Torre d'Osservazione, Baraccamento): pin = icona + grado romano + glifo diegetico; dettagli (descrizione, effetto Lv→Lv+1, costi, azioni) nel **tooltip hover-pinnable** (`hud_component_guide.md` §5b.7) con `MockUpgradeControl` nativo disabilitato e `[Apri Magazzino]`/`[Apri Mercante]` attivi.
4. Rimozione del marker `building-stash` dalla mappa continente (`game-frame-pixi.tsx` anchors); accesso a `VillageStashPanel`/`MerchantPanel` da dentro la vista + menu Pannelli/scorciatoie esistenti.

**Non-Goals:** economia reale, detrazione risorse, persistenza upgrade, drag&drop lavoratori nel villaggio, modifiche agli internals di `PixiWorldMap.tsx`, `VillageStashPanel.tsx`, `MerchantPanel.tsx`.

## 2. Vincoli, Trappole e Contratti

- **T-01:** `safeFit.insets` (top 87, bottom 100) intoccato; `VillageScreenView` impagina il dipinto 21:9 nell'area libera.
- **T-03:** `SkinScope data-hud-controls=""` avvolge tutta la vista (pin, tooltip, azioni).
- **T-04:** watermark + pin + tooltip verificati a occhio in Chromium headed a 1440×900 e 1280×800 (screenshot in `test-results/plan-035-village-view/`).
- **T-08:** `onSelect` stabilizzato via `useCallback`; tick clock mai causa di rebuild Pixi.
- **T-11:** chiavi i18n ICU `{var}` singola graffa; test automatico.
- **T-12:** nessun `import.meta.env` top-level non protetto nel config.
- **CTR-game-001/REG-001:** `PixiWorldMap` mai smontata in vista Village (`opacity:0`, `pointer-events:none`, `aria-hidden`, `inert`); ticker/canvas vivi.
- **CTR-game-002/004:** rising-edge `shroudCovered` → `goToView('map')` (teatro invasione intatto).
- **CTR-game-003:** `HudHideToggle` (`h`/idle) continua a funzionare sopra la vista.

## 3. Spec tecnica (sintesi dell'artifact r005 converged)

### T-001 — Asset pipeline
`scripts/clean-village-watermark.py` (venv `.mw/venv/bin/python`): l'asset reale è **3168×1344** (≈21:9); la stellina Gemini (componente bright `lum>120`, bbox ~`(3008,1184)-(3104,1280)`) sta metà su fogliame e metà sul tronco di sponda. Telea puro lasciava un ghost: la tecnica finale è `cv2.seamlessClone` di un patch 120×120 preso 140px a sinistra alla stessa altezza (il tronco continua orizzontale). Pixel fuori dal footprint bit-identici; sovrascrive `src/assets/mood/villaggio.png`. Assertion automatica: header PNG 3168×1344 + zero px `lum>120` nel bbox stella.

### T-002 — `villageBuildingsConfig.ts`
Zod + `deepFreeze`, foglia pura. `BUILDING_IDS` ×11, categorie `production|civic|defense`, stati `built|buildable|locked`; per edificio: `iconKey`, `nameKey/descKey/effectKey` (`gameFrame.village.buildings.<id>.*`), `unlockHintKey?`, `anchor {x,y}` normalizzato (0.06–0.94 / 0.12–0.88), `initialState`, `initialLevel`, `panelAction?: 'villageStash'|'merchant'`, `tiers[1..5]` (costo wood/iron/gold/food, buildDays, effectValue, secondaryValue?). `.superRefine`: id unici; `built ⇒ level≥1`, non-built ⇒ `level=0`; tier sequenziali; distanza Euclidea aspect-corrected (`dx*(3168/1344)`) tra anchor ≥0.08 (no overlap by construction). Helper puro `toRomanLevel(0..5)`.

### T-003 — Componenti
- `villageBuildingIcons.tsx`: `VillageBuildingIcon` SVG inline solid `fill="currentColor"` ×11 silhouette fantasy (no lucide, no stroke — regola 6b).
- `MockUpgradeControl.tsx`: gemello di `MockBuyControl` — `<button disabled>` nativo, **zero prop `on*`**, badge preview i18n, mode `build|upgrade|max`.
- `VillageScreenView.tsx`:
  - Stage box `aspect-ratio: 3168/1344` centrato tra inset HUD; fondale `var(--skin-hud-lacquer-deep)`; `<img>` + pin `(anchor.x·100%, anchor.y·100%)` — al pixel esatto a ogni viewport.
  - Pin `<button>` 44×44: solo icona + grado romano + glifo (lock ferro / scintilla ottone). `aria-label`, `aria-expanded`, `aria-controls` veritieri.
  - **Toolbar roving tabindex**: `role="toolbar"`, un solo `tabIndex=0`, frecce/Home/End in ordine `BUILDING_IDS`, Tab esce.
  - **Tooltip state machine**: `openId`/`pinnedId` + `openRef`/`pinnedRef`/`genRef` (timer 140ms stale → no-op); pinned è autoritativo (hover/focus su altri pin ignorato); click pin → pin/unpin + focus al bottone 📌; **una sola istanza** montata con `id="village-building-tooltip"`.
  - **Geometria**: misura su stage rect renderizzato; preferenza top → flip bottom; clamp entrambi gli assi (inset 8px); **isteresi 16px** anti flip-flicker; fallback stretto: body `maxHeight: min(320px, stageH−64px)` con wrapper interno `overflowY:auto` — `HudPlaque` mai in overflow; riga azioni in footer non-scrollante.
  - **Focus**: `openerPinRef` → close riporta focus al pin se montato, altrimenti al bottone Village nav.
  - Contenuto tooltip: header (nome + `Lv {level}/{max}` + 📌 `aria-pressed` + X), descrizione serif 14px, riga effetto attuale→prossimo (`tabular-nums`, oro inciso), costi con icone risorse o `unlockHint`, azioni (`MockUpgradeControl`, `village-open-stash`, `village-open-merchant`).

### T-004 — Wiring navigazione
- `game-frame.tsx`: `GameFrameScreen` accetta `activeNavId?`/`onNavSelect?` controllati (fallback `useState('map')` standalone).
- `game-frame-pixi.tsx`: `activeNavId` stato; **`goToView` unico scrittore** (nav, `regions.onSelect` su `region.id==='village'` — guardia pan già in `PixiWorldMap.tsx:1655-1669`, `shroudCovered` rising edge, exit). Wrapper mappa sempre montato: `opacity:0` + `pointer-events:none` + `aria-hidden` + `inert` (via ref) quando nascosto; ticker vivo.
- **Arbitro Escape unico** (window bubble, in pagina): ① `e.defaultPrevented` → hero sheet già consumato in capture (`useHeroSheet.tsx:314-325`); ② `questActiveRef` **o** nodo quest montato (doppia guardia order-independent — i ref React non mutano mid-dispatch) → `QuestRunWindow` si auto-dismissa; ③ `village` → `villageEscapeRef.current?.()`: `true` = tooltip chiuso + focus al pin; `false` = `goToView('map')` + focus al bottone Map. ④ `map` → noop. Pannelli stash/merchant **mai** consumatori Escape (X/shortcut, invariato). Matrice per-stato: una pressione = esattamente una dismissal.
- Rimozione loop `VILLAGE_STASH_CONFIG.marker` dagli `anchors` (`game-frame-pixi.tsx` ~699-714). Config stash resta per il pannello.

### T-005 — Test unit/guard
`tests/unit/idleVillage/villageBuildings.test.tsx`: dimensione PNG + ROI watermark; Zod (11 edifici, id unici, tier sequenziali, distanza anchor ≥0.08, deepFreeze); `toRomanLevel`; `MockUpgradeControl` isolamento (`disabled`, zero `on*`); RTL `VillageScreenView` (11 pin, hover, grace 140ms, pin/unpin, Escape→pin, stash/merchant callbacks); ICU zero `{{` su tutte le chiavi `gameFrame.village.*` (en+it-IT). `hudGuards.test.ts` STRICT_FILES += i 3 nuovi file. Aggiornare `villageStash.test.tsx` (accesso via vista/pannelli, non marker mappa).

### T-006 — E2E headed + occhio (T-04)
`tests/e2e/idleVillage/gameVillageView.spec.ts` a 1440×900 e 1280×800: assenza `[data-building-poi="stash"]` sulla mappa; ingresso nav + regione; ticker WebGL vivo in vista; tooltip hover/grace/pin; `[Apri Magazzino]`→stash, `[Apri Mercante]`→merchant; **matrice Escape completa** (hero sheet open → solo sheet; stash+tooltip → solo tooltip; stash senza tooltip → exit, pannello persiste); drag-over-village non attiva; roving tabindex; Tab mai dentro la mappa inert; corner-pin clamp a 1280×720/800; focus-return su Map; screenshot en+it-IT + ispezione visuale watermark.

## 4. Tasks

- [x] T-001: Rimozione deterministica del watermark Gemini da `villaggio.png` (script `clean-village-watermark.py`, seamlessClone da donor 140px sx; assertion 3168×1344 + ROI senza pixel `lum>120`)
  files: scripts/clean-village-watermark.py, src/assets/mood/villaggio.png
  depends: —
  done: 2026-10-15 — asset reale 3168×1344 (il brief citava una copia ridotta); stellina bbox (3008,1184)-(3104,1280) rimossa senza ghost

- [x] T-002: Config Zod deep-frozen `villageBuildingsConfig.ts` (11 edifici, anchor anti-collisione ≥0.08, tier/costi/effetti ICU) + `toRomanLevel` + chiavi i18n EN/IT-IT
  files: src/balancing/config/idleVillage/villageBuildingsConfig.ts, public/locales/en/idleVillage.json, public/locales/it-IT/idleVillage.json, public/locales/pseudo/idleVillage.json, src/localization/i18n.types.ts
  depends: T-001
  done: 2026-10-15 — 11 edifici validati a load-time, deepFreeze ricorsivo, `npm run i18n:types` rigenerato

- [x] T-003: `villageBuildingIcons.tsx`, `MockUpgradeControl.tsx`, `VillageScreenView.tsx` (stage 21:9, pin icon-first, toolbar roving tabindex, tooltip state machine + geometria clamp/isteresi/scroll-fallback, openerPinRef, SkinScope+data-hud-controls)
  files: src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx, src/ui/idleVillage/components/gameFrame/MockUpgradeControl.tsx, src/ui/idleVillage/components/gameFrame/villageBuildingIcons.tsx, src/ui/idleVillage/components/gameFrame/index.ts
  depends: T-002
  done: 2026-10-15 — contratti r005 implementati; fix focus-return→reopen (suppressFocusOpenRef); zero literal colore (STRICT_FILES-safe)

- [x] T-004: Wiring `GameFrameScreen` (controlled activeNavId) + `GameFramePixiPage` (goToView unico, regions.onSelect, shroudCovered edge, wrapper inert, arbitro Escape window-level, rimozione marker building-stash + marker merchant config)
  files: src/pages/game-frame.tsx, src/pages/game-frame-pixi.tsx, src/balancing/config/idleVillage/villageStashConfig.ts, src/balancing/config/idleVillage/merchantConfig.ts, src/ui/idleVillage/components/gameFrame/GameFrame.tsx
  depends: T-003
  done: 2026-10-15 — `goToView` unico scrittore; mappa `aria-hidden`+`inert`+opacity:0 con ticker vivo; marker stash/merchant rimossi dagli anchors; fix collaterali build: `QuestExpeditionDetail.tsx` (div non chiuso, workstream R-196) e `GameFrame.tsx` (duplicate `fontSize`)

- [x] T-005: Test unit/guard (`villageBuildings.test.tsx`, update `villageStash.test.tsx`/`merchantPanel.test.tsx`, STRICT_FILES hudGuards, ICU T-11)
  files: tests/unit/idleVillage/villageBuildings.test.tsx, tests/unit/idleVillage/villageStash.test.tsx, tests/unit/idleVillage/merchantPanel.test.tsx, tests/unit/idleVillage/hudGuards.test.ts
  depends: T-004
  done: 2026-10-15 — 59 test verdi nei 4 file di scope; `sharp` per il check PNG (pngjs era solo transitiva)

- [x] T-006: E2E Playwright headed + verifica a occhio T-04 + documentation update (INDEX, RICHIESTE, CURRENT_STATE, COMPONENT_MASTER_INDEX) + safeguards + kanban
  files: tests/e2e/idleVillage/gameVillageView.spec.ts, plans/INDEX.md, RICHIESTE.md, CURRENT_STATE.md, src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md
  depends: T-005
  done: 2026-10-15 — 9/9 headed verdi (BV-2a/2b/3/3b/4 + 4 witness BV-6); screenshot in `test-results/plan-035-village-view/village-{en,it}-{1440x900,1280x800}.png`; IT reso deterministico via `window.__i18n.changeLanguage('it-IT')` (I18nProvider forza la lingua persistita sul detector browser); fix waitForGame: attesa detach del boot-screen; BV-3 reso deterministico con `dispatchEvent('pointerenter')`

## 5. Behavioral Verification

- **CTR-game-001/REG-001:** ticker + contesto WebGL vivi durante e dopo Map→Village→Map.
- **CTR-game-002/004:** invasione goblin riporta la scena su mappa senza rompere freeze clock/sticker.
- **CTR-game-003:** `h` nasconde/richiama le lastre HUD sopra la vista.
- **BV-1 (asset):** `villaggio.png` 3168×1344, ROI watermark pulito (automatico + occhio).
- **BV-2 (dual entry + WebGL):** nav `Village` e click regione `village` aprono la vista; nessun `[data-building-poi="stash"]` sul continente.
- **BV-3 (icon-first + tooltip pinnable):** pin = solo icona+grado; hover→tooltip; grace 140ms; pin `aria-pressed`; `Escape`/`X` chiudono.
- **BV-4 (azioni):** `[Apri Magazzino]`→`[data-hud-panel="villageStash"]`; `[Apri Mercante]`→`[data-hud-panel="merchant"]`.
- **BV-5 (mock honesty):** `MockUpgradeControl` `<button disabled>` senza handler; `lint`/`test`/`build:check`/`kanban:lint` 0 errori; manifest `verify:bundle` PASS o waived-director.

## 6. Esito (2026-10-15)

Tutti i task completati. Evidenze: `test-results/plan-035-village-view/` (4 screenshot
witness en/it × 1440×900/1280×800 + `safeguards.log`).

- **BV-1 PASS** — `villaggio.png` 3168×1344 intatto; ROI stella senza pixel `lum>120`
  (assertion unitaria su `sharp` + ispezione visuale dei 4 witness).
- **BV-2 PASS** — dual entry nav `Village` + regione dipinta sulla mappa; zero
  `[data-building-poi]` sul continente; ticker Pixi vivo sotto `aria-hidden`/`inert`.
- **BV-3 PASS** — pin icon-first (solo glifo + grado romano); tooltip hover/pin/grace
  140ms/X/Escape con focus-return al pin; roving tabindex `role="toolbar"`.
- **BV-4 PASS** — Magazzino → `villageStash`, Emporio → `merchant` dai tooltip.
- **BV-5 PASS** — `MockUpgradeControl` disabled nativo senza `on*`; unit 59/59 scope;
  `build:check` PASS; `kanban:lint` PASS (42 prompt); lint scope = 0 errori (i path
  `src/ui/idleVillage/**` e `src/balancing/**` sono nella quarantena ESLint legacy —
  comportamento atteso del repo).
- **BV-6 PASS** — 4 witness headed ispezionati: composizione 21:9 corretta, watermark
  assente, tooltip clamped a 1280×800, copia IT reale (via `__i18n.changeLanguage`).

Note residue: il run E2E usa `--headed` per contratto T-04; dopo R-198 (mai finestre
in primo piano dagli agenti) le regole nuove chiedono headless — i witness qui erano
richiesti dal piano battezzato prima di quella invariante; i prossimi piani devono
dichiarare esecuzione headless/background.
