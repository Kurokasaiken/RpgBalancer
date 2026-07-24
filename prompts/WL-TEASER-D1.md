AGENT
WL-TEASER-D1 — Wanderlust Triumph Steam Concept Slice: Scaffolding

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` prima di iniziare.
Questa e' la fase D1 del master task `WL-TEASER-001`.

OBIETTIVO
Creare lo scaffolding della pagina teaser, il controller e la config per una sequenza deterministica di 55s.

FILE CHIAVE
- `src/pages/teaser-showcase.tsx` (nuovo)
- `src/ui/teaser/TeaserShowcase.tsx` (nuovo)
- `src/ui/teaser/TeaserSceneController.ts` (nuovo)
- `src/balancing/config/teaser/TeaserConfig.ts` (nuovo)
- `src/App.tsx` (modifica: registra route)
- `src/docs/docs/plans/wanderlust_triumph_steam_concept_slice_plan.md` (aggiorna changelog D1)

INVARIANTI
- @trailer-only exemption: NO PersistenceService, NO real engine, mocked data only.
- Config-first: timing, frame order, auto-play in `TeaserConfig.ts` Zod schema.
- 55s deterministic sequence, no random physics.
- Reuse existing components with mocked props only.
- No CSS standalone; skin tokens from Gilded Observatory.
- JSDoc per ogni funzione/componente.

OPERAZIONI DA ESEGUIRE
1. Creare `TeaserConfig.ts` con Zod schema per scene, timing, transitions, mocked data.
2. Creare `TeaserSceneController.ts` con stato interno e metodi `play/pause/reset/goto(scene)`.
3. Creare `TeaserShowcase.tsx` componente wrapper e `src/pages/teaser-showcase.tsx` thin wrapper.
4. Registrare route `/teaser-showcase` in `App.tsx`.
5. Aggiornare `wanderlust_triumph_steam_concept_slice_plan.md` changelog D1.

OPERAZIONI VIETATE
- Usare `PersistenceService` o localStorage.
- Collegare a engine/gameplay reali.
- Hardcodare timing in componenti (tutto in config).

ASSUNZIONI
- `App.tsx` e `src/pages/*` seguono pattern esistenti.
- `src/ui/idleVillage/TestHub.tsx` puo' essere aggiornato in D5 per link.

SAFEGUARDS
- `npm run lint -- src/pages/teaser-showcase.tsx src/ui/teaser/TeaserShowcase.tsx src/ui/teaser/TeaserSceneController.ts src/balancing/config/teaser/TeaserConfig.ts src/App.tsx`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/wl-teaser-d1-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `WL-TEASER-D1` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: WL-TEASER-D1 – Completato (Evidence: test-results/wl-teaser-d1-2026-07-23.log)`
