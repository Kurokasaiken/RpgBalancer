---
title: "PLAN-036 — Quest Planner redesign su /game: 2 lastre (planner + forecast sidecar), bisaccia 3 slot + picker esterno, cinema 21:9, stat chiave"
status: completed
owner: Mind Weaver
created: 2026-10-15
source_request: R-195 (desiderata v23/v24/v27 FROZEN)
debate: mw-web-debate 20261015-1957-r195-quest-planner-redesign → CONVERGED su artifact-r008.md (sha256 ffc9dd08e15e74cd1748cac39764865418ee8613099fccb84838e9c30026f821); gemini ACCEPT, deepseek ACCEPT; chatgpt rimosso provider_dead (4 echo byte-identici) dopo 6 obiezioni sostanziali tutte disposizionate amended; claude mai in elettorato (composer failure)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md
  - RICHIESTE.md (esito R-195)
  - CURRENT_STATE.md
  - src/docs/docs/testing/quest_full_flow_walkthrough.md
---

# PLAN-036 — Quest Planner redesign su `/game` (R-195)

Fonte canonica del dibattito: run `20261015-1957-r195-quest-planner-redesign`
(repo mind-weaver: `.mw/runs/20261015-1957-r195-quest-planner-redesign/artifact-r008.md`).
Questo documento è il piano operativo; l'artifact r008 è la spec tecnica converged
(12 obiezioni WITNESS-01..12 chiuse in 8 revisioni).

## 1. Goal & Scope

1. **Layout agile a due lastre + CTA sempre visibile:** `QuestExpeditionDetail` smette di
   essere una colonna unica lunga e diventa un'assemblea di due `HudPlaque` in un wrapper
   condiviso `data-hud-panel` + `data-hud-controls=""` (trascinata e clampata come un
   pezzo unico): **lastra sinistra** (planner ~460px: header → sottotitolo+chip → banner
   cinema 21:9 → `ResidentSlotRack` → bisaccia → footer CTA «Invia spedizione» ancorato
   fuori scroll) e **lastra destra** (forecast sidecar ~340px: Stat Chiave
   Primarie/Secondarie → aggregato → BY MEMBER → WHY → Intel).
2. **Bisaccia 3 slot + picker esterno:** nel planner solo `QUEST_STASH.bagSlots` (3) slot
   (`bag-slot-0..2`) + 1 pulsante `quest-bag-picker-toggle` che apre una lastra `HudPlaque`
   esterna `quest-bag-external-picker` alimentata da `VILLAGE_STASH_CONFIG.items`,
   tessere **solo-icona** (`picker-item-<id>` esclusivo) con tooltip nome/descrizione/
   effetto/stock. `loadout-item-<id>` resta solo sul bottone interno degli slot pieni.
3. **Immagine cinematografica** `aspectRatio: 2.76` subito sotto il sottotitolo:
   `offer.coverArt` authored (`totem-goblin.jpg`, `quest-robine/rovine-hero.jpg` — nome
   storico della directory verificato su disco, nessuna rinomina) con fallback
   `NODE_ART[scenario.startNode]?.src`.
4. **Stat chiave nel sidecar:** nuovo campo root `scenario.keyStats: { primary, secondary }`
   (hashed, NON in `PRESENTATION_KEYS`; refine `primary ∩ secondary = ∅` +
   `primary ⊆ primaryStats`). `primaryStats` resta input di simulazione frozen intoccato.
   Goblin `{primary:['str'], secondary:['perc']}` → **Primaria Forza, Secondaria
   Percezione**; Rovine `{primary:['str'], secondary:['perc','con','agi']}` per spec §0.
   Fallback deterministico `deriveKeyStats` per scenari senza `keyStats`.
5. **Validazione end-to-end** del flusso POI → planner → lancio → `QuestRunWindow` →
   settlement, preservando le suite E2E reali esistenti (R-183).

## 2. Contratti chiave (da artifact-r008)

- **Selector contract:** `bag-slot-<i>` (frame esterno), `loadout-item-<id>` (bottone
  interno dello slot pieno — max 1 nodo per id in tutto il DOM), `picker-item-<id>`
  (solo tessere picker), `quest-bag-picker-toggle`, `quest-bag-external-picker`,
  `quest-expedition-send`, `quest-expedition-cinema`, `quest-expedition-forecast-column`,
  `forecast-key-stats`, `forecast-primary-stats`, `forecast-secondary-stats`,
  `loadout-coverage`.
- **Drag/resize (WITNESS-07a):** `useHudPanelDrag` misura `getBoundingClientRect()` a ogni
  `pointerdown` (post-wrap garantito); l'hook espone `resetPosition`; il wrapper ha un
  listener `resize` (rAF) che re-clampa/resetta l'offset se l'assemblea renderizzata
  uscisse dal viewport; `maxWidth: calc(100vw-24px)`; `flexWrap: 'wrap'` sotto 840px.
- **Regime altezza (WITNESS-12):** `QUEST_PLANNER_INFO.minZeroScrollViewportHeightPx = 720`
  (Zod). ≥720px → zero overflow interno obbligatorio; <720px → scroll interno sanzionato,
  CTA e clamp comunque assertati.
- **Stash unificato (WITNESS-04):** `VILLAGE_STASH_CONFIG.items` = sorgente unica dei 6
  consumabili (`forza`, `percezione`, `fumogeno`, `corda`, `cura`, `pozione`,
  `sum(qty)=7 ≤ 12`), tutti con `engineFlag` valido in `defaultQuestItems` e icona
  statica `VillageStashItemIcon`; il picker deriva da lì (niente inventario parallelo).
- **Picker lifecycle:** `aria-expanded`/`aria-controls`, Escape → chiude solo il picker +
  `stopPropagation` + focus a toggle, click-outside chiude, chiusura planner chiude
  picker, tooltip Radix/HUD dentro `data-hud-controls` (T-03).
- **Version bump atteso:** `keyStats` hashed → una tantum il `computeScenarioVersion`
  cambia; verificato che nessun artefatto committato pinna il digest (oracle contiene
  solo `authored` + `traces`). Da annotare in `CURRENT_STATE.md` (nota deepseek T-022).
- **Coverage key-stat:** `isKeyStatCovered(stat, partyMembers, selectedItemIds)` —
  `loadoutCoverage` degli engineFlag equipaggiati OR `member.stats[s] >=
  QUEST_PLANNER_INFO.keyStatCoverageThreshold` (default 55, config).
- **i18n:** chiavi `questExpedition.keyStats.*`, `statName.*`, `bag.*` in `en`, `it-IT`,
  `pseudo` — ICU `{var}` (T-11).

## 3. Tasks

- [x] **T-001 — Schema (`keyStats` root + `offer.coverArt`) e unificazione stash villaggio.** ✅ 2026-10-15
  - `questScenario.schema.ts`: `keyStats` root (`.strict().optional()`, i due superRefine,
    NON in `PRESENTATION_KEYS`), `offer.coverArt` (in `PRESENTATION_KEYS`), tipo +
    `_NodeParity` in `questScenario.ts`.
  - `goblin.ts`: `keyStats {primary:['str'], secondary:['perc']}`, `coverArt
    '/assets/scene-library/totem-goblin.jpg'`. `rovine.ts`: `{primary:['str'],
    secondary:['perc','con','agi']}`, `coverArt '/assets/quest-robine/rovine-hero.jpg'`.
  - `villageStashConfig.ts`: allineare le 6 righe ai consumabili canonici con
    `engineFlag`; `useQuestExpeditionSession.tsx` passa gli item villaggio al planner;
    test `villageStash.test.tsx` (parity engineFlag/icona) + `questScenarioConfig.test.ts`.
  - Acceptance: `npm run test -- tests/unit/idleVillage/questScenarioConfig.test.ts
    tests/unit/idleVillage/villageStash.test.tsx` verdi; oracle parity intatta.
- [x] **T-002 — Icone statiche, rack bisaccia 3 slot + picker esterno con tooltip.** ✅ 2026-10-15 (glifi incisi già presenti: axe/crosshair/wind/cable/heart/droplets — nessun lavoro icone)
    `depends: T-001`
  - Icone SVG incise dedicate per i 6 consumabili in `engravedIcons.tsx` (nessun doppio
    fallback) mappate da `VillageStashItemIcon`.
  - `bag-slot-0..2` + `quest-bag-picker-toggle` + `quest-bag-external-picker` (render
    condizionato, `picker-item-<id>` solo sulle tessere, `loadout-item-<id>` solo sullo
    slot pieno) + lifecycle Escape/click-outside/focus-return dentro `data-hud-controls`.
- [x] **T-003 — Layout due lastre di `QuestExpeditionDetail`.** `depends: T-001, T-002` ✅ 2026-10-15
  - Wrapper `data-hud-panel`/`data-hud-controls`, banner 21:9 sotto sottotitolo
    (`quest-expedition-cinema`), footer CTA ancorato (`quest-expedition-send`), sidecar
    destro con `forecast-key-stats` (Primary/Secondary da `scenario.keyStats` o
    `deriveKeyStats`) + aggregato + BY MEMBER + WHY + Intel.
  - `useHudPanelDrag` espone `resetPosition`; wrapper `resize`-listener re-clamp.
  - i18n `en`/`it-IT`/`pseudo`; `questPlannerInfo.ts` (`minZeroScrollViewportHeightPx`,
    `keyStatCoverageThreshold`).
- [x] **T-004 — Validazione E2E POI→quest risolta + visual witness (T-04).** `depends: T-003` ✅ 2026-10-15
  - Esito: fullflow 2/2, expedition 14/14, planner-layout 7/7, lifecycle 13/13 su build fresca.
  - Bug reale trovato e fixato: `onDragStart` di pagina schedulava il routing dei token-slot dentro
    `startTransition` → la transition restava affamata durante i pointermove continui e il bloom
    `data-drop-state` valid/invalid (R-183) non si dipingeva mai mid-drag. Ora i token-drag escono
    dalla transition (routing sincrono alle sessioni expedition); i roster-card restano dentro
    (PLAN-031 T-B4 intatto). Commit funzionale anche prima: `handleDragEnd` legge `event.active.data`.
  - Helper `dragResidentPointer`: gate hit-target press/release (boot-veil `game-boot-screen` può
    coprire il primo press a 1600×1000) + dwell finale a `to` (Chrome coalesce i pointermove finali:
    senza dwell `event.over` resta stantio a metà percorso).
  - Aggiornare `gameQuestExpedition.spec.ts` / `gameQuestFullFlow.spec.ts` al contratto
    picker esterno; assert BV-1..BV-5; viewport `1280×720`, `1280×800`, `1440×900`,
    `1920×1080` + caso resize `800×600` (regime B) + drag-to-edge; zero console/pageerror.
  - Safeguard: `lint`, `test -- <scope>`, `build:check`, `kanban:lint`, suite E2E headed;
    evidence `test-results/plan036-r195-<date>.log` + screenshot.
- [x] **T-005 — Documentation & Knowledge Update.** `depends: T-004` ✅ 2026-10-15
  - `plans/INDEX.md`, `RICHIESTE.md` (R-195), `CURRENT_STATE.md` (incl. nota version bump
    `keyStats` e `minZeroScrollViewportHeightPx` — note non-bloccanti deepseek T-022),
    `quest_full_flow_walkthrough.md`.

## 4. Behavioral Verification (BV)

- **BV-1 (regimi espliciti, WITNESS-07b/12):** `vh >= 720` (`1280×720`, `1280×800`,
  `1440×900`, `1920×1080`): `sendBtn.bottom <= vh-12` AND `scrollHeight <= clientHeight+1`
  AND drag clamp del `pairBox`. `vh < 720` (resize `800×600`): scroll interno permesso;
  CTA visibile + assembly nel viewport dopo re-clamp. Mappa/camera immobili (T-01).
- **BV-2 (cinema 21:9):** `quest-expedition-cinema` sotto il sottotitolo, sopra
  `ResidentSlotRack`, ratio ~2.76, `naturalWidth > 0`.
- **BV-3 (bisaccia+picker, WITNESS-06b):** 3 `bag-slot`, 1 toggle → picker esterno con 6
  item villaggio solo-icona `picker-item-<id>`; tooltip nome/descrizione/effetto/stock;
  Escape chiude solo il picker + focus al toggle; con item equipaggiato e picker aperto
  `loadout-item-<id>` count === 1; 3 selezioni riempiono i 3 slot.
- **BV-4 (sidecar + stat chiave, entrambi gli scenari):** `forecast-column` a destra
  (`forecastBox.left >= mainBox.right` a ≥840px); Goblin → Primaria Forza / Secondaria
  Percezione; Rovine → Primaria Forza / Secondarie Percezione+Costituzione+Destrezza;
  poi aggregato/BY MEMBER/WHY/Intel.
- **BV-5 (loop completo):** click POI → party drag + swap → picker → invio →
  `QuestRunWindow` fasi → epilogo → settlement (oro/XP/ferite), 0 errori console/pageerror.

## 5. Note di rischio

- Cambiare `primaryStats` (valori) è **vietato**: input di simulazione (`questRun.ts:1465`,
  `questSimulation.ts:798`) + frozen in `ScenarioInstance` + oracle `toStrictEqual`.
- Sovrapposizione col Roster a 1280px è ammessa (guida HUD regola 7: pannelli flottanti
  spostabili/chiudibili).
- E2E legacy che semina storage direttamente (`gameQuestExpedition.spec.ts` ~490): non
  copiare quel pattern nel codice prodotto; valutare correzione nel task T-004.

## 6. Chiusura (2026-10-15)

- **Stato: `completed`** — T-001..T-005 tutti verdi, BV-1..BV-5 verificati su build fresca.
- **Safeguards:** `lint -- <scope>` 0 errori (warning restricted-imports pre-esistenti su
  `game-frame-pixi.tsx`); unit vitest 57/57; `build:check` ✅
  (`test-results/build-check-2026-10-15.log`); `kanban:lint` ✅.
- **E2E:** `gameQuestFullFlow` 2/2, `gameQuestExpedition` 14/14, `gameQuestPlannerLayout`
  7/7 (BV-1/BV-4 matrix + zero console/pageerror), `gameQuestLifecycle` 13/13.
  `poiQuestRegressions.spec.ts` (3 fail) pre-esistente: selector morti su superficie
  legacy `/poi-quest-detail-roster-time-clock` — non toccata da questo piano.
- **Bug reale fixato:** starvation del bloom swap in `startTransition` (vedi T-004).
- **Fix helper E2E:** gate hit-target vs boot-veil + dwell finale sullo slot (T-004).
- **Evidence:** `test-results/r195-quest-planner-redesign-2026-10-15.log`; manifest
  `.mw/runs/plan036-quest-planner-2026-10-15/verification.json` (OB-1..OB-7).
