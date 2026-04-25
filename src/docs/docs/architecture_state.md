# 🗺️ Project Architecture State Index

> Context Router — ogni sessione AI parte da qui e poi apre solo i file necessari.

## 1. Core Systems

- **Tick Runner (Game Loop):** `src/engine/game/idleVillage/IdleVillageEngine.ts` + `TimeEngine.ts`. Logica pura, nessun side-effect UI.
- **Schedulers & Drivers:** `src/ui/idleVillage/hooks/useActivityScheduler.ts`, `map/ticker/useIdleVillageTicker.ts` legano UI ↔ eventi.
- **Data & Config:** `src/balancing/config/idleVillage/*` (JSON/TS). Ogni stat/peso deve vivere qui, mai inline.
- **Plans & Master Docs:** `src/docs/docs/plans/idle_village_plan.md`, `.../overlay_mode_plan.md`, `.../PROFIT_LEVERS_IDLE_VILLAGE.md`.

## 2. Module Status & Entry Points

- **Quest / Combat Resolver:** `IdleVillageEngine + QuestResolver` (Phase 12, high-risk). Observer/event log unico.
- **Village Management:** `useActivityScheduler`, `IdleVillageMapPage` (legacy) → in refactor verso ActivityCard system.
- **Economy & Resources:** `TimeEngine` resources pipeline + telemetry hooks. Must stay pure.
- **UI / Presentation:** `src/ui/idleVillage/*` ascolta solo eventi/driver; proibito invocare engine direttamente.
- **Telemetry & Analytics:** `src/analytics/*` + `scripts/analytics/` per export/stress test.

## 3. Current North Star

- **Goal:** Chiudere Phase 12 consolidando Tick Runner condiviso + UI decoupling/Event Buffer.
- **Guardrail:** Nessun feature merge se la UI tocca engine senza passare dai driver (Ticker/Scheduler).
- **Active Sprint:** Refactor ActivityCard + Drop Feedback → gating per Overlay Mode / Desktop Companion.

## 4. How to Extend

- **Nuovo sistema?** prima aggiungi tipi/config in `src/balancing/config`, poi aggiorna piani docs, infine implementa moduli puri sotto `src/engine` e solo dopo UI listener.
- **Tests obbligatori:** Vitest per engine (`src/engine/**/__tests__`) + playwright per UI se tocca interazioni.
- **Telemetry Hooks:** ogni nuovo loop deve emettere eventi in `SchedulerTelemetryEvent` per audit future.
