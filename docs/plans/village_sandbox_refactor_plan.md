# Village Sandbox Refactor & Playwright Stabilization Plan

**Status:** Draft – awaiting approval  
**Owner:** Cascade (Village Sandbox pod)  
**Scope:** Rifattorizzare progressivamente tutti i componenti/servizi di Village Sandbox seguendo il workflow “tests-first → lint guardrails → state split” e consolidare una suite Playwright che validi il comportamento visibile (HUD, drag/drop, timer, Theater, ecc.).

---

## 1. Principi obbligatori

1. **Tests-first:** ogni intervento parte da scenari Playwright/RTL che descrivono il comportamento visibile (drag resident → carta aggiorna, timer → HUD, ecc.). Non si modifica il codice senza test che falliscono per il motivo giusto.
2. **Lint guardrails:** qualsiasi odore individuato (stato inutilizzato, inline fetch, commenti zombie) genera nuova regola ESLint o warning in CI.
3. **State split & hooks:** prima di aggiungere funzionalità si eliminano duplicazioni, si spostano utility in hook, si riduce lo state del componente principale. Obiettivo: componenti < 300 righe e responsabilità singola.
4. **Playwright standard:** locator semantici, contexts isolati, `page.route` per mock, web-first assertions, trace/screenshot abilitati per diagnosi e regressioni visive.

---

## 2. Sequenza componenti

### Wave 0 – Abilitatori
1. **Test harness**  
   - Creare fixture Playwright con login/seed deterministico (`tests/fixtures/villageSandbox.ts`).  
   - Implementare helper per `page.route` + generatore di stato sandbox (mock engine).
2. **Guidelines & lint**  
   - Aggiornare ESLint config con regole su `no-commented-code`, `react-hooks/exhaustive-deps`, `playwright/no-manual-assert`.  
   - Template `tests/ui/villageSandbox/*.spec.ts` con trace + screenshot default.

### Wave 1 – Core scheduling & slots
1. `useResidentSlotController.ts`  
   - Test: assegnamento, infinite slot, bloom states.  
   - Refactor: estrarre validatori, aggiungere JSDoc, rimuovere stato duplicato.
2. `ResidentSlotRack.tsx`  
   - Test: overflow scroll, drag/drop placeholder, hint text.  
   - Refactor: separare board/detail variant, usare props strettamente tipizzate.
3. `ActivitySlot.tsx` & `ActivityCardDetail.tsx`  
   - Test: timer/halo, risk stripe, drop states.  
   - Refactor: spostare fetch icon config, usare hooks per countdown.

### Wave 2 – Shell & roster
1. `VillageSandbox.tsx`  
   - Test: load sandbox → map rende cluster, play/pause controlli.  
   - Refactor: estrarre scheduler hook, sostituire inline state con store.
2. `ResidentRoster.tsx` + `ResidentRosterDnd.tsx`  
   - Test: drag token, filtri (Hero/Injured), tooltip fatigue.  
   - Refactor: ridurre duplicazioni con `useResidentSlotController`, applicare memoization.
3. `IdleVillagePage.tsx` (legacy)  
   - Banner `@deprecated`, wrapper read-only; tutti i nuovi test/comandi puntano a `VillageSandbox`.

### Wave 3 – Map & Theater
1. `LocationCard.tsx` / `MapMarker.tsx`  
   - Test: bloom reveal, quest offer badge, drop feedback.  
   - Refactor: spostare calcolo coordinate in helper condiviso.
2. `TheaterView.tsx`  
   - Test: open theater → mostra medaglioni, assign/dismiss resident.  
   - Refactor: utilizzare `ResidentSlotRack`, rimuovere stato interno duplicato.
3. `QuestChronicleSandbox.tsx` (se usato)  
   - Test: sequenza Verb/Activity card, risk stripes, controlli debug.  
   - Refactor: farlo leggere dal nuovo scheduler/summary pipeline.

### Wave 4 – HUD & ancillary components
1. `ActiveActivityHUD.tsx`  
   - Test: mostra job/quest completati, CTA collect, indicatori risk.  
   - Refactor: convertire in pure component + summary selettori.
2. `IdleVillageActivitiesTab.tsx` / `mapLayoutUtils.ts`  
   - Test: editing mappa produce preview corretta.  
   - Refactor: modulare gli helper (transform <-> percent conversion).
3. Market/Passive tab componenti (se influenzano sandbox)  
   - Allineare a hooks e store unificati.

### Wave 5 – Cleanup finale
1. `verbSummaries.ts` e pipeline summary  
   - Test: snapshots JSON + Playwright scenario (n map slot).  
   - Refactor: unificare ActivityCard/VerbCard nomenclature.
2. Lint + CI enforce  
   - Attivare regole introdotte come errori (non warning) una volta ripulito.
3. Documentazione  
   - Aggiornare README, `idle_village_plan.md`, `MASTER_PLAN.md` con stato completamento wave.

---

## 3. Playwright Test Matrix

| Scenario | Browser | Dimensioni | Output richiesto |
| --- | --- | --- | --- |
| Drag resident → Job completato | Chromium, WebKit | 1440x900 | Trace + screenshot finale HUD |
| Bloom Theater + assegnamento | Chromium | 1280x720 | GIF/trace + `toHaveScreenshot` Theater |
| Quest offer → Accept | Chromium | 1920x1080 | Snapshot map cluster + log Playwright |
| HUD Active → Collect reward | Chromium | 1440x900 | Video (opzionale) + screenshot |
| Config tab → Map preview update | Chromium | 1280x720 | Visual diff (image snapshot) |

Ogni test va eseguito in context isolato, con mock API (`page.route`) per deterministic state e `--trace on` per CI.

---

## 4. Deliverables per Wave

1. **Tests:** suite Playwright + eventuali component test RTL con coverage screenshot.
2. **Code:** refactor del componente + hook helper + lint rule documentata.
3. **Docs:** sezione `village_sandbox_refactor_plan.md` aggiornata con stato (✅/⚠️/⛔).
4. **Evidence:** screenshot/gif/trace allegati alla PR o alla cartella `docs/ui_regressions/`.

---

## 5. Exit Criteria

- Tutti i componenti della lista hanno test Playwright dedicati che provano il comportamento visibile.
- Nessun file supera le 300 righe senza commento `// @legacy`.
- Lint/CI blocca codice con commenti zombie, fetch inline o manual assertions Playwright.
- `IdleVillagePage.tsx` marcata `@deprecated` e non più target dei test.
- Documentazione (README, DEVELOPMENT_GUIDELINES, idle_village_plan) aggiornata con workflow e stato.

---

## 6. Open Questions / Risks

1. **Engine determinismo:** se il TimeEngine vero introduce rumore, serve mock/stub per test UI.
2. **Performance Playwright:** eseguire screenshot/trace per molti scenari può rallentare CI → valutare parallelismo/sharding.
3. **Legacy Cypress:** decidere se migrare test esistenti o mantenerli solo per regressioni storiche.
