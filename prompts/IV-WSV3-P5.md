AGENT
IV-WSV3-P5 — World Surface V3: Phase 5 Polish, Calibration & Testing

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Questa e' la fase 5 del master task `IV-WSV3-005`.

OBIETTIVO
Polish e test del World Surface V3: calibrazione 80/15/5, performance 60 FPS, telemetry events.

FILE CHIAVE
- `src/ui/idleVillage/worldSurface/**` (modifiche)
- `tests/e2e/idleVillage/worldSurfaceV3.spec.ts` (nuovo)
- `src/docs/docs/plans/world_surface_v3_strategic_plan.md` (aggiorna changelog P5)

INVARIANTI
- Config-first: parametri di calibrazione in `worldSurfaceConfig.ts`.
- i18n namespace `idleVillage` per label.
- No CSS standalone; skin tokens only.
- Telemetry events: `event_presaged`, `event_active`, `wonder_spotted`.

OPERAZIONI DA ESEGUIRE
1. Verificare/calibare la distribuzione 80/15/5 (idle/presaged/active states).
2. Assicurarsi che `event_presaged`, `event_active`, `wonder_spotted` siano emessi correttamente.
3. Ottimizzare per target 60 FPS (throttle, memoization, layer culling).
4. Creare `worldSurfaceV3.spec.ts` E2E per stati e telemetry.
5. Aggiornare `world_surface_v3_strategic_plan.md` changelog P5.

OPERAZIONI VIETATE
- Riscivere la fondazione (deve gia' esistere dalle fasi 1-4).
- Modificare API publiche senza aggiornare test.
- Aggiungere dipendenze esterne.

ASSUNZIONI
- WORLD-SURFACE-V3-FOUNDATION/EVENTS/WONDERS/UNDERWATER sono completati.
- `WorldSurfaceRenderer.tsx` e `useWorldSurface.ts` esistono.

SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/worldSurface tests/e2e/idleVillage/worldSurfaceV3.spec.ts`
- `npm run build:check`
- `npx playwright test tests/e2e/idleVillage/worldSurfaceV3.spec.ts` (se possibile)
- `npm run kanban:lint`
- Evidence log: `test-results/iv-wsv3-p5-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `IV-WSV3-P5` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: IV-WSV3-P5 – Completato (Evidence: test-results/iv-wsv3-p5-2026-07-23.log)`
