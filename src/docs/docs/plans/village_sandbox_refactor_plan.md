# Village Sandbox Refactor & Playwright Stabilization Plan (WS6)

**Status:** In progress — WS6.3 Cross-Device Interaction & Layout  
**Owner:** Cascade (Village Sandbox pod)  
**Ultimo aggiornamento:** 2026-01-04

> Tutta la cronologia estesa (Wave 0+, log Playwright, milestone concluse) è stata spostata in [village_sandbox_refactor_archive.md](./village_sandbox_refactor_archive.md). Questo file rimane snello e descrive esclusivamente lo stato corrente e i TODO attivi.

## Scope & missione WS6.3

- Garantire un'unica UX config-first tra desktop (drag completo) e mobile (tap-first) senza reset automatici quando cambia device.
- Rifinire WorkerPickerSheet/bottom sheet mobile con CTA ≥ 44 px, focus trap completo e diagnostica integrata.
- Consolidare layout stacked (`VillageSandboxColumns`) e HUD ridotti per schermi <1024 px.
- Chiudere la suite QA cross-device mantenendo i preset Punch Club deterministici.

## Quick links

- [Archive storico](./village_sandbox_refactor_archive.md)
- [Idle Village Cross-Device & Mobile Vision](../strategy/idle_village_vision.md)
- [Punch Club Vision & KPI](../strategy/idle_village_punch_club_vision.md)
- [Prompt Library](../prompts/prompt_library.md)
- [Playwright Guide](../tests/PLAYWRIGHT_GUIDE.md)

## WS6.3 objectives

1. `useSandboxInteractionMode` come unico adapter per drag/tap con test dedicati.
2. Layout board↔stacked controllato da `sandboxLayout` e varianti config-first dei componenti principali.
3. WorkerPickerSheet accessibile e tematizzato (focus trap, CTA 48 px, prefers-reduced-motion, diagnostica).
4. QA suite cross-device (Playwright `touch-mode`, `preserve-state`, `worker-picker`).

## KPI guardrail

| KPI | Target | Fonte |
| --- | --- | --- |
| Tap per assignment | ≤ 3 (slot → chip → conferma) | Playwright `touch-mode` + telemetria `assignment_interaction` |
| Latency assignment | < 450 ms dal tap alla conferma | Telemetria picker (`assignment_latency_ms`) + trace Playwright |
| Picker close rate | ≥ 98 % entro 1 s | `workerPickerSheet` telemetry buffer |
| Cycle Punch Club | < 90 s Gym→Rest→Bout | `cycleProgress` + manual QA |
| Delta risorse per ciclo | ≥ +10 gold / ≥ +2 food | Telemetria `resource_change` |

## Checklist corrente

| Item | Stato | Note |
| --- | --- | --- |
| F0 Interaction hook (`useSandboxInteractionMode`) | ✅ | Hook + test cablati in `VillageSandbox` |
| F1 Layout prop & stacked mode |   - Day/Night ActivityCapsule con controlli ciclo | `VillageSandboxColumns`, `ActivityArea` usano prop `layout`. **QA completata**: RTL smoke tests (12/12 passed) verificano render mini-cards, drop states, e accessibility (IV-WS2-activityarea-tests). |
| WS2-Worker Tooltips | ✅ | WorkerTooltip + useWorkerTooltipData implementati con risk assessment, bio cards, retro styling e full accessibility (IV-WS2-worker-tooltips). Pronto per integrazione con WorkerCard/ActivityArea. |
| F2 WorkerPickerSheet baseline | ✅ | Picker mobile chiude su assign/close, inline chips desktop invariati |
| F4 WorkerPickerSheet UX polish | ✅ | Focus trap, theme tokens, animazioni, diagnostics buffer |
| F5 Layout stacked hardening | ✅ | `sandboxLayout` centralizzato, soppressione/swap shell durante picker |
| F6 WorkerPickerSheet diagnostics panel | ✅ | KPI rolling + sparklines desktop-only |
| F7 Punch Club Risk HUD revamp | ✅ | Stripe gialla/rossa proporzionale + prefers-reduced-motion |
| PC-M1 Mobile landing + redirect | ✅ | Completato (redirect + opt-out + analytics) |
| PC-M2 Distribuzione mobile & Telemetria export | 📌 | Milestone strategica per playtest PWA/Testflight-like + export telemetria JSON; PC-M2B SW offline-first completato, PC-M2A manifest + PC-M2C guida + PC-M2D CLI da implementare |

## TODO attivi

- [x] Strumentare `assignment_interaction` per confrontare tap vs drag KPI mobile/desktop e integrare nel buffer telemetry.
- [x] Aggiornare Playwright suite con spec `punch-club-landing.spec.ts` (MobileChrome + Desktop) una volta finalizzata la landing.
- [x] Validare layout stacked su <768 px con QA manuale + screenshot (VillageSandboxColumns).
-- [x] Pulire warning residui `useTheaterController`/`useMapContext` segnalati da ESLint.

## QA & telemetry expectations

- `npm run dev` deve essere privo di warning console su `/map` e `/punch-club` (diagnostica solo via `createSandboxDiagnostics`).
- `npm run lint -- src/ui/idleVillage` come smoke test obbligatorio prima di ogni merge WS6.
- Playwright deve utilizzare fixture `tests/fixtures/villageSandbox.ts`, locator semantici e trace sempre attivi.
- Tutte le nuove metriche devono passare da `window.__sandboxTelemetry` o moduli analytics dedicati.

## Prossimi checkpoint

| Data target | Deliverable | Owner |
| --- | --- | --- |
| 2026-01-15 | Telemetria `assignment_interaction` + dashboard KPI | Cascade |
| 2026-01-28 | **PC-M2** – Manifest + service worker + guida playtester (vedi [Punch Club Vision §3-§5](../strategy/idle_village_punch_club_vision.md)) | Platform × Strategy |
| 2026-02-02 | Manifest/PWA polish + state preservation (WS6.3 F2) | Platform |
| 2026-02-15 | QA suite cross-device pienamente verde | QA Guild |

## Processo di aggiornamento

1. Ogni modifica tecnica/QA deve aggiornare questa pagina entro la stessa sessione (o linkare la sezione nell'archive se diventa storico).
2. Prompt per gli agent devono seguire il template standard riportato nel Prompt Library, citando sempre questo plan e l'archive quando rilevante.
3. I log dettagliati (run Playwright, diagnosi lunghe) finiscono nell'archive; qui rimangono solo outcome e TODO.
4. Ogni nuovo prompt deve essere aggiunto alla [Kanban Prompt Tracker](../coordinator/agent_assignments.md) con stato "Non assegnato"; aggiornare lo stato quando assegnato/iniziato/completato.

## Documentazione correlata

- [village_sandbox_refactor_archive.md](./village_sandbox_refactor_archive.md)
- [Idle Village Cross-Device & Mobile Vision](../strategy/idle_village_vision.md)
- [Punch Club Vision](../strategy/idle_village_punch_club_vision.md)
- [Punch Club realistic mini-plan](./punch_club_realistic.md)
- [Idle Village workstreams](./idle_village_workstreams.md)
- [Playwright guide](../tests/PLAYWRIGHT_GUIDE.md)
