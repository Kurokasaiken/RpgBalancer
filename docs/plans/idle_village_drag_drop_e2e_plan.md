# Village Sandbox Drag & Drop E2E Plan

## 1. Obiettivi

- Verificare in modo deterministico il flusso "trascina residente → valida slot → schedula attività → avanza tempo → ricevi reward" nella superficie **Village Sandbox** (Idle Village legacy page solo per reference).
- Garantire che la Playwright suite intercetti regression come: residenti bloccati, attività mai completate, ricompense non accreditate, stato del residente non ripristinato.
- Esportare controlli di debug sufficienti per permettere test end-to-end senza hack o dipendenze da UI specifica.

## 2. Failure mode osservate

1. **Bootstrap sporco** – Appena caricata la pagina, il founder può risultare già assegnato da job auto-repeat, impedendo i test.
2. **Selezione attività non deterministica** – Il codice sceglie la prima activity associata allo slot, anche se il residente non soddisfa i requisiti, portando a fallimenti silenziosi.
3. **Mancanza di diagnostica nei test** – I test non ricevono motivazioni sui fallimenti di `assign`, rendendo difficile capire se il problema è di stato, configurazione o validazione.

## 3. Strategia di test

| Step | Azione | Controllo | Atteso |
| --- | --- | --- | --- |
| 1 | Apri VillageSandbox | `page.waitForFunction(() => window.__idleVillageControls?.getState())` | Stato caricato |
| 2 | Sanifica config per job target | Patch `job_city_rats.metadata` e disabilita continuous job | Attività deterministica |
| 3 | Reset stato | `controls.reset()` | Founder disponibile |
| 4 | Assegna residente | `controls.assign(slot, residentId)` | Restituisce `true` |
| 5 | Avanza tempo | `controls.advance(delta)` ripetuto fino a completamento | Job completato |
| 6 | Interroga stato finale | `controls.getState()` | Resident status `available`, risorse incrementate |

## 4. Checklist di implementazione

1. **Debug Controls**
   - Esporre `reset()` (o equivalente) per ripulire lo stato del villaggio prima dei test (sia per `IdleVillageMapPage` legacy che per `VillageSandbox`).
   - Valutare un helper opzionale che restituisca `reason` sui fallimenti di assegnazione per futura diagnostica.
2. **VillageSandbox & IdleVillageMapPage (legacy)**
   - Aggiornare `assignResidentToSlot` per iterare tutte le attività compatibili e fermarsi alla prima validazione OK, riusando ActivitySlot controller.
   - Conservare l'ultimo messaggio di errore per feedback all’utente/test.
3. **Playwright suite**
   - Raggruppare le prove in `test.describe('Idle Village drag & drop', ...)` con `beforeEach` che ripulisce stato e patcha config.
   - Reintrodurre il test principale "assignment yields rewards and frees resident".
4. **Verifica**
   - `npm run test:e2e -- --project='Desktop Chrome' --grep='Idle Village: assignment yields rewards and frees resident'`
   - Se positivo, eseguire l'intera suite Idle Village (opzionale) per assicurare regressioni assenti.

## 5. Note future

- Aggiungere test per slot lock/fatigue, injured recovery e reward multipli.
- Esporre controlli per leggere `assignmentFeedback` direttamente (utile nei test UI puri).
