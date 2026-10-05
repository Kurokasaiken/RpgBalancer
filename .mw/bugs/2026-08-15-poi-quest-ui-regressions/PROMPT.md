# Prompt per agente bugfix — POI Quest Detail/Roster/Time UI regressions

**Data:** 2026-08-15  
**Sorgente:** osservazioni runtime del Director  
**Pagina target:** `http://localhost:5173/poi-quest-detail-roster-time-clock`  
**Spec di riferimento:** `tests/e2e/idleVillage/poiQuestRegressions.spec.ts`  
**Bug report:** `.mw/bugs/2026-08-15-poi-quest-ui-regressions/bug.md`

## Pre-flight (obbligatorio)

1. Leggi `AGENTS.md`, `RICHIESTE.md`, `.mw/desiderata.md`, `context/DECISION_LOG.md` e `context/INDEX.md`.
2. Invoca `mw-executor`, `mw-regression`, `idle-village-task`, `agent-execution-mandate`.
3. Se un'operazione tocca un componente trusted/frozen, aggiorna anche il corrispondente `*_trusted.md` e `COMPONENT_MASTER_INDEX.md`.
4. Non toccare `CANON.md` o le regole globali senza approvazione esplicita.

## Scope

Risolvere le 6 regressioni catturate in `tests/e2e/idleVillage/poiQuestRegressions.spec.ts` e documentate nel registro errori (`poi_quest_detail_roster_time_clock_error_registry.md`, ERR-028..033) e nelle spec pertinenti.

## Regole operative

- Risolvi **un bug alla volta**.
- Per ogni bug, prima esegui il test corrispondente per confermare il fallimento, poi investiga la causa, implementa il fix, e infine rimuovi `test.fixme` / `test.fail` lasciando un `test` normale.
- Se un'asserzione del test si rivela sbagliata (non rappresenta il contratto desiderato), **non cambiare il test per farlo passare**: aggiorna prima il registro errori e la spec di competenza, poi adatta il test con la nuova asserzione.
- Dopo ogni fix esegui:
  ```bash
  npm run build:check
  npm run kanban:lint
  npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts --project="Desktop Chrome" --reporter=list
  ```
- Produci un evidence log in `test-results/<bug-id>-<YYYY-MM-DD>.log` per ogni fix.

## Bug da correggere

### ERR-028 — Magnetic snap
**Problema:** il residente draggato verso il QuestPOI non viene attratto al centro del POI.  
**Contratto atteso:** il drop ancori il residente al centro del POI (`data-quest-id`), non alla posizione del puntatore.  
**File da ispezionare:**
- `src/ui/idleVillage/pages/PoiDetailQuestRosterTimeClockIntegrationPage.tsx`
- `src/ui/idleVillage/components/QuestPOI.tsx` / marker
- `tests/utils/dragResident.ts`
- `useResidentDropValidation` e sensori dnd-kit

**Test:** `should magnetically snap a resident to the Quest POI center on drop`

### ERR-029 — Pausa al chiudi detail
**Problema:** chiudere il POI detail fa ripartire il tempo anche se il gioco era già in pausa.  
**Contratto atteso:** lo stato di pausa in vigore prima dell'apertura del detail viene ripristinato alla chiusura.  
**File da ispezionare:**
- `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` (handler apertura/chiusura, `handlePoiClick`, `onClose`)
- logica `pauseGame('user')` / `resumeGame('user')`

**Test:** `should preserve the pre-open pause state when the POI detail is closed` (attualmente `test.fail`)

### ERR-030 — Drag preview invisibile sul POI detail
**Problema:** trascinando un `pgDraggableToken` sopra il POI detail, il token diventa invisibile.  
**Contratto atteso:** il drag overlay / preview resta visibile e sopra il pannello.  
**File da ispezionare:**
- `FloatingPanel` / `activity-capsule-detail-skin-aware` (z-index, pointer-events, overflow)
- dnd-kit `DragOverlay` configurazione
- `resident-roster-panel` e `poi-detail-wrapper-test`

**Test:** `should keep the resident drag preview visible when hovering the POI detail`

### ERR-031 — Slot rack overflow
**Problema:** quando tutti gli slot sono occupati e ne appare uno extra, il detail si allarga invece di scorrere orizzontalmente.  
**Contratto atteso:** la riga slot si espande con `overflow-x: auto`, la larghezza del detail non cambia, nessun sovrapporsi.  
**File da ispezionare:**
- `ResidentSlotRack` e relativi stili
- `activity-capsule-detail-skin-aware` layout
- `resident-slot-rack-root` CSS (`overflow-x`, `flex-wrap`/`flex-nowrap`)

**Test:** `should add a scrollable slot row instead of expanding the POI detail`

### ERR-032 — Quest non parte
**Problema:** la quest non si avvia nonostante tutti gli slot obbligatori siano pieni.  
**Contratto atteso:** con tutti i pg corretti assegnati e il tempo in play, `Start` è abilitato e avvia la quest.  
**File da ispezionare:**
- `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` (`handleEmbark`, `preview.canEmbark`, `startDisabled`)
- `useMinimalGameplay` / `useQuestEngine`
- gating `isPaused`, `isQuestRunning`, `isCheckAwaiting`

**Test:** `should start the quest after manually filling all required slots`

### ERR-033 — Day/Night square alpha
**Problema:** il tone con i ring mostra un quadrato attorno in alfa che diventa più visibile quando l'halo si colora.  
**Contratto atteso:** nessun rettangolo/quadrato di colore pieno o alpha attorno ai ring.  
**File da ispezionare:**
- `src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx`
- `daynight_trusted.md`
- CSS `background-color`, `box-shadow`, `filter`, `mask`, `clip-path`

**Test:** `should render day/night ring tone without visible alpha square artifact`

## Documentazione da aggiornare

- `src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_error_registry.md` — marca ogni ERR come `chiuso` con evidenza
- `src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_page_workflow.md` — aggiorna la sezione `Regressioni note` rimuovendo la voce fixata o spostandola in "Risolto"
- Aggiorna le spec coinvolte (`poi_detail_interaction_spec.md`, `roster_slot_rack_interaction_spec.md`, `poi_quest_interaction_spec.md`, `time_engine_quest_interaction_spec.md`, `floating_panel_spec.md`, `day_night_poi_spec.md`) rimuovendo o aggiornando le `Regressione nota` corrispondenti

## Consegna finale

- Tutti i 6 test devono passare come `test` normali (niente `test.fixme` / `test.fail` residui).
- `npm run build:check` passa.
- `npm run kanban:lint` passa.
- `npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts --project="Desktop Chrome" --reporter=list` passa.
- Se emerge un pattern riutilizzabile, invoca `learn` e crea `.mw/runs/<timestamp>/pattern-candidate.md`.

KANBAN STATUS: da aggiornare con il prompt id appropriato al completamento (Evidence: `test-results/<bug-id>-<YYYY-MM-DD>.log`).
