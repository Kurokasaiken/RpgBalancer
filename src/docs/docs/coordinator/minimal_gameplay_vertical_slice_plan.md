---
title: Minimal Gameplay Vertical Slice Delivery Plan
author: Cascade
date: 2026-02-10
description: Roadmap coordinatore per completare la Minimal Gameplay Page con componenti reali, test e milestone incrementali.
---

## Contesto

- **Obiettivo**: consegnare una vertical slice Idle Village pienamente funzionante (1 residente reale, 3 slot, HUD/log, drag & drop, game over) pronta per Playwright/E2E.
- **Principi guida**: config-first, componenti esistenti, thin vertical slices con valore immediato, nessun mock esteso.
- **Dipendenze chiave**: `minimalGameplayConfig`, `useMinimalGameplay`, store Zustand, `useResidentDropValidation`, Style Lab tokens, Guardian safeguards.
- **Roadmap bridge**: il piano “Minimal Gameplay → Vertical Slice” (`/.windsurf/plans/minimal-to-vertical-slice-roadmap-2d36d2.md`) definisce gli stage MG-Finalize → VS-Freeze. Tutti i prompt coordinati devono indicare lo stage corrente, il preset Style Lab usato, e allegare evidence (`lint/test/build/kanban` + Playwright/visual quando richiesto) prima di avanzare allo stage successivo.

### Stage MG→VS (Sintesi)

| Stage | Focus | Deliverable | Test richiesti |
| --- | --- | --- | --- |
| MG-Finalize | Chiudere loop minimale | Upgrade visibile, minaccia notturna, feedback cursore/log cromatico, modal Game Over polish | `npm run test:unit -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx`, `npm run test:integration -- tests/integration/idleVillage/minimalGameplayFlow.test.tsx`, evidence log |
| VS-Core Loop | Consolidare loop sopravvivenza | Telemetria loop, mercato, upgrade, minaccia, fail state completi | Integration test + manual smoke (15') |
| VS-Juice | Effetti visivi/narrativi | Hover drag, tooltip narrativi, log colorato, feedback tattile | `npm run test:visual -- tests/visual/idleVillage/minimal-gameplay.spec.ts` + telemetry assertions |
| VS-Structure | Stabilità tecnica | Autosave soak, hotkeys, Storage Test Framework | StorageTest suite + stress logs |
| VS-Freeze | Blocco verticale slice | Playwright deterministico, flag `MINIMAL_UI_FROZEN`, evidence finale | `npm run test:e2e -- tests/e2e/idleVillage/minimalGameplay.spec.ts`, `test-results/minimal-vertical-slice-freeze-<date>.log` |

## Sequenza Milestone

| ID | Milestone | Deliverable | Safeguard/Test | Stato raggiunto | Nuova capacità |
| --- | --- | --- | --- | --- | --- |
| MG-01 | Hook & HUD reale | `MinimalGameplayPage` agganciata a `useMinimalGameplay`, HUD da config, flag wireframe solo fallback | `lint src/ui/idleVillage/MinimalGameplayPage.tsx`, `test:unit MinimalGameplayPage`, `build:check`, `kanban:lint` | Planned | HUD mostra dati veri e persistence stabile |
| MG-02 | Clock & Loop Controls | Widget Day/Phase/Speed + CTA pause/resume/reset | RTL clock snapshot, mini Playwright pause/resume (facoltativo) | Planned | Controlli sul tempo funzionanti |
| MG-03 | Roster & Resource Warnings | WorkerCard/Roster reale + badge warning food/fatigue | RTL roster render, `minimalGameplayFlow` integration | Planned | Roster reale visibile con stati |
| MG-04 | Actions & Quest Hooks | CTA compra food/quest demo con azioni reali + error states | Unit dispatch tests, integration quest/buy | Planned | Azioni gameplay reali (spendi oro, avvia quest) |
| MG-05 | Event Log + Telemetry | EventLogPanel reale (`logDisplayLimit`), telemetry `minimal_gameplay_*` | RTL log rendering, telemetry mocks | Planned | Log leggibile e tracciato |
| MG-06 | Drag & Drop Slots | ActivitySlot + `dnd-kit` + DropFeedback per Gold/Quest/Market | `npm run minimal:dnd-check`, RTL validators, manual drag QA | Planned | Drag dei residenti sugli slot |
| MG-07 | Visual Feedback & Style Lab | Token Gilded Observatory, animazioni drop, audio/haptic centralizzati | Visual regression baseline, telemetry feedback | Planned | UI coerente con feedback |
| MG-08 | Game Over & Modal | Pannello game over + reset CTA, warning persistenti | RTL/Playwright scenario “food=0” | Planned | Gestione game over completa |
| MG-09 | E2E Vertical Slice Freeze | Flag `MINIMAL_UI_FROZEN`, Playwright spec completa + evidence | `test:e2e minimalGameplay`, `build:check`, `kanban:lint` | Planned | Vertical slice certificata, pronta deploy |

## Dettaglio Operazioni per Milestone

### MG-01 – Hook & HUD Reale
- Rimuovere stato mock e usare `const { state, actions, isLoading, error } = useMinimalGameplay()`.
- HUD: day/gold/food/fatigue con labels da `MINIMAL_GAMEPLAY_CONFIG.ui.hudFields`.
- Loading/error panel già presenti → collegarli allo store.
- Risultato: base page riflette stato reale, pronta per componenti successivi.
- **Componenti da riusare:** `MinimalWireframePage.tsx` → evolvere in `MinimalGameplayPage`, `useMinimalGameplayStore`, `EventLogPanel` per log area.
- **Estensioni config:** aggiungere sezione `ui` (`hudFields`, `tokens`, `logDisplayLimit`) in `minimalConfig.ts`; nessun valore hardcoded nella UI.
- **Gap tecnici:** assicurarsi che `GameState.residents` copi `name`/`level` dal config; aggiornare `buildInitialState` e `GameState` interface.
- **Safeguards minimi:** `npm run lint -- src/ui/idleVillage/MinimalWireframePage.tsx src/balancing/config/idleVillage`; `npm run test:unit -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx`; `npm run build:check`; `npm run kanban:lint`.

### MG-02 – Clock & Loop Controls
- Componentizzare clock (Day, Phase, Speed) usando config `loop` (tick, warmup, max speed).
- Bottoni pausa/resume/reset richiamano `actions.pauseGame/resumeGame/resetGame`.
- Telemetry: `minimal_gameplay_tick`, `minimal_gameplay_pause_toggle`.
- **Componenti da riusare/creare:** nuovo `ClockWidget` modulare sotto `src/ui/idleVillage/components/minimal/ClockWidget.tsx`; sfruttare già esistenti azioni Zustand.
- **Config:** estendere `minimalConfig.ts` con `loop.tickIntervalMs`, `loop.warmupTicks`, `loop.maxSpeed` e memorizzare `tickSpeed` nello store.
- **Best practice React 19:** nessun `useState` per il loop → usare `startAutoSave`/`setInterval` nel service layer; componenti sottoscrivono solo le slice Zustand necessarie.
- **Telemetry:** aggiungere hook dedicato (`useMinimalGameplayTelemetry`) per emettere `minimal_gameplay_tick` e `minimal_gameplay_pause_toggle` con payload (day, speed, resident count).

### MG-03 – Roster & Resource Warnings
- Montare `RosterList`/`WorkerCard` esistenti; dati da `state.residents`.
- Badge warning per food/fatigue secondo `ui.tokens.dangerHex` e `state.warningLevel`.
- Layout pulito stile Style Lab (grid responsiva, tipografia configurata).
- **Componenti:** riutilizzare `WorkerPanel.tsx` (include `DraggableWorkerCard`) e `WorkerCard.tsx`; evitare nuovi layout.
- **Allineamento tipi:** aggiornare `GameState.residents` + mapper nello store per includere `name`, `level`, `stats`; definire `MinimalResident` adapter per WorkerPanel.
- **Warnings:** calcolare `warningLevel` da config (`ui.thresholds.fatigueDangerPercent`, `ui.thresholds.foodDangerPercent`) e passarlo come prop.
- **Tests:** RTL snapshot per Roster + warning badge; Playwright locator `getByRole('region', { name: /crew/i })` per verificare fatigue states.

### MG-04 – Actions & Quest Hooks
- CTA “Compra Food” → `actions.buyFood(config.globalRules.baseFoodPriceInGold)` con quantità configurabile.
- CTA “Quest demo” → `actions.startQuest('quest_forest_hunt_minimal', ['resident-1'])` o wrapper.
- Gestire error states (insufficient gold) con copy da config/telemetry.
- **Componenti:** toolbar azioni nella pagina principale, con pulsanti stylati Gilded Observatory.
- **Config:** aggiungere `ui.actionPanel` con etichette/tooltip + `errorMessages` (es. `insufficientGold`, `residentBusy`).
- **Store:** assicurarsi che `buyFood` resetti `error` on success e che `startActivity` propaghi reason (da `canStartActivity`).
- **Telemetry:** eventi `minimal_gameplay_buy_food` (amount, cost) e `minimal_gameplay_start_activity` (activityId, residentId, validationReason se fallisce).

### MG-05 – Event Log + Telemetry
- EventLogPanel mostra ultime `logDisplayLimit` entries da `state.eventLog` (ordinamento decrescente).
- Telemetry `minimal_gameplay_event_logged` + `minimal_gameplay_log_viewed`.
- Layout leggibile (timestamp, icone location/residente) per debugging rapido.
- **Store changes:** aggiungere `eventLog` array e `addEvent` action; `calculateTick` deve restituire eventi strutturati (severity, badge) oltre a string.
- **UI:** `EventLogPanel` già supporta `entries`, `maxVisible`; passare `state.eventLog.slice(-logDisplayLimit)`.
- **Telemetry:** al push di eventi chiamare `trackTelemetryEvent('minimal_gameplay_event_logged', payload)`; quando l’utente apre il pannello log, emettere `minimal_gameplay_log_viewed`.
- **Tests:** RTL per assicurarsi che nuovi eventi scrollino automaticamente; jest mock su telemetry per verificare payload.

### MG-06 – Drag & Drop Slots
- Importare `ActivitySlot`, `useResidentDropValidation`, `DropFeedbackUI`, `dnd-kit` sensori.
- Tre slot: Gold Mine, Quest Board, Market (da `MINIMAL_GAMEPLAY_CONFIG.locations`).
- Success feedback → schedule activity, failure → motivazione (fatigue, risorse) dal validator.
- **Architettura:** wrappare la pagina in `DndContext` (`@dnd-kit/core`), definire `DragOverlay` per `WorkerCard` se necessario.
- **Validation:** usare `useResidentDropValidation` + `useDropFeedback`; passare `validationResult`/`showDropFeedback` in `ActivitySlot` per UI coerente.
- **Config mapping:** creare helper che legge `activities` dal config e costruisce slot metadata (icon, label, duration) per la UI.
- **Testing:** script `npm run minimal:dnd-check`, RTL per `validateDrop` e test manuali (log EXACT reason display per drop fallito).

#### MG-06 Test Matrix & Automation

| Scope | Scenario | Copertura |
| --- | --- | --- |
| Unit – `useResidentDropValidation` | 1. Job slot accetta worker disponibile con stat corretta  2. Quest slot rifiuta se resident fatigued  3. Market slot rifiuta se gold insufficiente  4. Slot bloccato (`maxSlots` pieno) | `tests/unit/idleVillage/useResidentDropValidation.job.test.ts` |
| Unit – `useDropFeedback` | 1. Emissione `valid` con bloom verde  2. `invalid` con tooltip motivo  3. `warning` quando crew quasi piena  4. `blocked` per slot locked | `tests/unit/idleVillage/useDropFeedback.test.tsx` (estendere casi) |
| Unit – `ActivitySlot` compact | 1. Render halo progress  2. Bloom highlight su `dropState='valid'`  3. Rimozione highlight dopo drop/cancel | `tests/unit/idleVillage/ActivitySlot.test.tsx` |
| Integration – MinimalGameplayPage | 1. Drag da WorkerPanel→Gold Mine: `startActivity` chiamato e worker marcato working  2. Drag verso slot invalid: feedback copia config + worker torna idle  3. Drag su Market con gold zero: feedback `insufficient_gold` e telemetria  4. Completion auto-uscita slot (quest completata libera slot) | `tests/integration/idleVillage/minimalGameplayFlow.test.tsx` |
| Integration – ResidentSlotController | 1. Infinite placeholder duplicato  2. `assign`/`clear` propagano a scheduler  3. Stat mismatch produce `dropState='invalid'` | `tests/unit/idleVillage/ResidentSlotController.test.ts` |
| Playwright – Minimal Vertical Slice | 1. Drag Aurora → Gold Mine: bloom verde + log reward  2. Drag worker stanco → Quest Board: bloom rosso + tooltip fatigue  3. Drag mentre slot pieno: worker rimbalza, placeholder non sostituito  4. Attività completata libera slot e rimuove highlight  5. Market drop senza gold mostra stato blocked | `tests/e2e/idleVillage/minimalGameplay.drag.spec.ts` |
| Visual Regression | Snapshot con bloom valid/invalid e highlight hovers | `tests/visual/idleVillage/minimal-gameplay.spec.ts` |

**Automation Notes:**
1. Aggiungere comando `npm run minimal:dnd-check` che esegue tutte le suite unit/integration sopra + lint dei file DnD.
2. Playwright usa `dragResidentCard(page, workerName, slotTestId)` aggiornato con web-first assertions e tracce.
3. Ogni scenario deve loggare telemetria `drop_feedback_*` con payload assertato nei test.
4. Evidenza salvata in `test-results/minimal-dnd-matrix-<date>.log` con lint/test/build/kanban output.

### MG-07 – Visual Feedback & Style Lab
- Applicare tokens `ui.tokens` (accentHex, dangerHex, cardRadius) alla pagina.
- Animazioni drop/pulsanti: utilizzare config `dropFeedbackConfig` per stati valid/warning/blocked.
- Audio/haptic via servizi esistenti, flaggati in config.
- **Scope operativo per agenti:**
  - HUD risorse con ticker animato (odometer) e tooltip “Production/Costs” driven da config.
  - DropFeedbackOverlay obbligatorio sul vertical slice: bloom inline, tooltip invocati da `useDropFeedback`, telemetria `drop_feedback_*` e scenario visual regression per valid/invalid.
  - Glow/particles sugli slot tramite config `minimalFeedbackConfig.slotGlow`, GPU-friendly, documentato nel prompt.
  - Modal Game Over supervisionata in MG-08, ma MG-07 prepara i token e i test visual per glow + ticker.
- **Tema:** assicurarsi che il root abbia classi `observatory-page observatory-shell`, usare CSS variables (`--obsidian-900`, `--ivory-200`).
- **Animazioni:** sfruttare `DropFeedbackOverlay` (già definita) con `requestAnimationFrame`-friendly properties (`transform`, `opacity`).
- **Feedback layer:** ad ogni azione importante (drop success/fail, quest start) riprodurre SFX da library condivisa + `navigator.vibrate?.(50)` su mobile.
- **Visual regression:** aggiungere scenario `tests/visual/idleVillage/minimal-gameplay.spec.ts` una volta freeze flag attivo, includendo HUD animato + glow slot.

### MG-08 – Game Over & Modal
- When `state.gameOver.isOver` true, mostrare pannello dedicato con ragione (`food_depleted`, `all_injured`).
- CTA “Try again” → `actions.resetGame` + telemetry `minimal_gameplay_restart`.
- Mostrare statistiche finali (giorni sopravvissuti, oro accumulato) prese da store.
- **UI:** creare `GameOverModal` modulare (aria-modal, focus trap) che legge `gameOver()` e `state` per summary.
- **Config:** definire `gameOver.messages` + `statsLayout` (quali KPI mostrare) in `minimalConfig.ts` per copy consistent.
- **Persistence:** al reset, salvare snapshot nel PersistenceService (per analisi run fallite) prima di re-inizializzare.
- **Tests:** RTL scenario `food=0` per verificare modal + Playwright script “food depletion” (MG-08 deliverable).

### MG-09 – E2E Vertical Slice Freeze
- Impostare `MINIMAL_UI_FROZEN=true` per indicare UI stabile.
- Scrivere spec Playwright `tests/e2e/idleVillage/minimalGameplay.spec.ts` (drag → wait → reward → log → game over → reset).
- Aggiornare doc/kanban + evidence `test-results/np-min-010e-routing-tests-<data>.log`.
- **Flagging:** esporre `process.env.MINIMAL_UI_FROZEN` tramite Vite define; quando true, bloccare cambi UI salvo bugfix.
- **E2E pipeline:** usare Playwright con locators semantici, `page.route` per determinismo, `await expect(...).toBeVisible()`; salvare trace + screenshot baseline.
- **Evidence:** log dedicato `test-results/minimal-vertical-slice-freeze-<date>.log` contenente output lint/test/build/kanban.
- **Post-freeze:** documentare nel plan cosa è “bloccato” (componenti allowed = WorkerCard/ActivitySlot ecc.) e creare checklist regressioni.

## Suite di Test per Coordinatore

| Scope | Comando | Note |
| --- | --- | --- |
| Lint | `npm run lint -- src/ui/idleVillage tests` | Per ogni milestone che tocca UI/test |
| Unit | `npm run test:unit -- tests/unit/idleVillage/MinimalGameplayPage.test.tsx` + file specifici | Aggiornare coverage quando aggiungiamo componenti |
| Integration | `npm run test:unit -- tests/integration/idleVillage/minimalGameplayFlow.test.tsx` | Verifica loop completo e persistence |
| DnD Check | `npm run minimal:dnd-check` (o script equivalente) | Da MG-06 in poi |
| E2E | `npm run test:e2e -- tests/e2e/idleVillage/minimalGameplay.spec.ts` | Solo quando `MINIMAL_UI_FROZEN=true` |
| Visual | `npm run test:visual -- tests/visual/idleVillage/minimal-gameplay.spec.ts` | Da MG-07 in poi |
| Build | `npm run build:check` | Sempre |
| Kanban Lint | `npm run kanban:lint` | Sempre |

## Comunicazione “Cosa puoi fare”
- Ogni milestone completata deve concludersi con una nota al coordinatore del tipo: “Con MG-0X puoi ora <azione>”.
- Esempi:
  - MG-02: “Con questa modifica puoi fermare e riprendere il ciclo giorno/notte.”
  - MG-06: “Ora puoi trascinare Aurora sugli slot e vedere job/quest partire.”
  - MG-09: “Vertical slice pronta: puoi completare il loop dal browser con test automatici.”

## Note aggiuntive
- UI deve restare pulita e leggibile: evitare rumor visivi, usare palette configurata, log facilmente consultabile.
- Nessun mock nuovo: usare componenti e hook esistenti (Roster, ActivitySlot, DropFeedback, Telemetry).
- Documentare eventuali regressioni o blocchi sul Kanban e linkare evidence log pertinente.
- In caso di regressioni nei componenti riutilizzati, aprire prompt dedicati ma non interrompere il rollout salvo bug critici.

---
Ultimo aggiornamento: 2026-02-10 – pronta per ingestion da parte del Coordinator e creazione task.
