# Bug: POI Quest Detail / Roster / Time — UI regressioni (2026-08-15)

**Stato:** segnalato  
**Sorgente:** osservazione runtime di Fausto  
**Pagina:** `/poi-quest-detail-roster-time-clock`  
**Test di riferimento:** `tests/e2e/idleVillage/poiQuestRegressions.spec.ts`

## Sintesi

La pagina POI Quest presenta sei regressioni UI/gioco. Cinque sono marcate `test.fixme` in Playwright; una (ERR-029, pausa) è marcata `test.fail` perché il fallimento è osservabile e deterministico.

## Registro

| ID | Problema | Comportamento atteso | Comportamento osservato | File da toccare |
|---|---|---|---|---|
| ERR-028 | Magnetic snap | Quando si trascina un pg verso il QuestPOI, il drop deve ancorarsi al centro del POI | Il pg cade nella posizione del puntatore, senza attrazione al centro | `PoiDetailQuestRosterTimeClockIntegrationPage.tsx`, `dragResident.ts`, componenti POI |
| ERR-029 | Pausa al chiudi detail | Chiudere il POI detail deve ripristinare lo stato di pausa precedente | Il tempo riparte automaticamente anche se prima era in pausa | `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` (handler di chiusura) |
| ERR-030 | Token invisibile sul detail | Trascinando un pgDraggableToken sul POI detail, il token deve restare visibile | Il token diventa invisibile / scompare dietro il pannello | z-index / `DragOverlay` / `FloatingPanel` |
| ERR-031 | Overflow slot rack | Quando tutti gli slot sono occupati e ne appare uno extra, il contenitore deve mostrare una barra di scorrimento orizzontale senza allargare il detail | Il POI detail si allarga, gli elementi si sovrappongono | `ResidentSlotRack`, `activity-capsule-detail-skin-aware`, CSS overflow |
| ERR-032 | Start quest bloccato | Con tutti i pg correttamente assegnati, il pulsante Start deve essere abilitato e avviare la quest | Il pulsante Start non avvia la quest nonostante gli slot siano pieni | `handleEmbark`, `preview.canEmbark`, `startDisabled` |
| ERR-033 | Day/Night square alpha | Il tone con i ring non deve mostrare un quadrato alfa attorno | Quando l'halo si colora, si vede un quadrato attorno al tone | `DayNightPoiSkin.tsx`, `daynight_trusted.md` |

## Documentazione aggiornata

- `src/docs/docs/idle_village/poi_quest_detail_roster_time_clock_error_registry.md` — righe ERR-028..033
- `src/docs/docs/idle_village/day_night_poi_spec.md` — sezione "Regressione nota — quadrato alfa attorno ai ring"

## Istruzioni per il prossimo agente

1. Eseguire il nuovo file `poiQuestRegressions.spec.ts` (Desktop Chrome): la colonna "fixme" sarà skipped, il test `test.fail` (ERR-029) sarà un *expected failure*.
2. Risolvere un bug alla volta e trasformare `test.fixme` / `test.fail` in `test` o rimuovere `test.fail`.
3. Dopo ogni fix, aggiornare lo stato nel registro errori e produrre evidenza in `test-results/`.
4. Non modificare i test per farli passare se il contratto non è corretto: se un'asserzione è sbagliata, aggiornare prima il registro/spec.

## Safeguards di riferimento

- `npm run build:check`
- `npm run kanban:lint`
- `npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts --project="Desktop Chrome" --reporter=list`
