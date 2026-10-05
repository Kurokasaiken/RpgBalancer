---
title: Piano ridotto — POI Quest UI regressions ERR-028 e ERR-030
status: active
created: 2026-08-15
desiderata: v4 (pannelli flottanti)
bug: .mw/bugs/2026-08-15-poi-quest-ui-regressions
---

## Goal

Chiudere ERR-028 e ERR-030 in `tests/e2e/idleVillage/poiQuestRegressions.spec.ts`, passando tutti i 6 test senza `test.fixme` / `test.fail`, e far passare `npm run build:check` e `npm run kanban:lint`.

## In scope

- Aggiungere test hooks in `__idleVillageTestHooks` per pilotare drag/assign/detail in E2E.
- Modificare `tests/utils/dragResident.ts` per usare CDP + hook.
- Correggere `ResidentSlotRack` per mostrare la medaglia sul primo slot assegnato.
- Aggiornare `poiQuestRegressions.spec.ts`.
- Eseguire safeguard.

## NOT in scope

- Nuovi componenti (provider, feature flag, snapshot tests).
- Modifiche al contratto di `ResidentSlotRack` oltre al check slot 0.
- Touchare logica di quest, reward, time engine.

## Task

| # | File | Azione | Accettazione |
|---|------|--------|--------------|
| T1 | `PoiDetailQuestRosterTimeClockIntegrationPage.tsx` | Esporre in `__idleVillageTestHooks`: `setDraggingResidentId`, `assignResident`, `openPoiDetail`, `getSlotAssignments` | Hook raggiungibili da `page.evaluate` |
| T2 | `tests/utils/dragResident.ts` | Usare CDP per mouse, poi chiamare `assignResident` / `setDraggingResidentId` | Helper compila e funziona |
| T3 | `ResidentSlotRack.tsx` | Mostrare medaglia se lo slot id finisce con `slot0` o `-0` | Selettore `slot-medal-*` visibile per slot 0 |
| T4 | `poiQuestRegressions.spec.ts` | Aprire detail via hook; usare `dragResidentCard`/`dragResidentPointer` | Test ERR-028 e ERR-030 passano |
| T5 | — | `npx playwright test tests/e2e/idleVillage/poiQuestRegressions.spec.ts --project="Desktop Chrome"` | 6/6 pass |
| T6 | — | `npm run build:check` e `npm run kanban:lint` | Entrambi pass |
| T7 | `poi_quest_detail_roster_time_clock_error_registry.md` | Marcare ERR-028 e ERR-030 chiusi | Stato aggiornato |

## Rischi

- Toccare `ResidentSlotRack` può influenzare altri test. Mitigazione: restringere il check solo a slot 0, non alterare il resto del rendering.
- I test hook potrebbero rimanere nel build di produzione. Mitigazione: sono già `__idleVillageTestHooks`, pattern esistente.

## Acceptance finale

- [ ] 6/6 test passano
- [ ] `build:check` verde
- [ ] `kanban:lint` verde
- [ ] Registro errori aggiornato
