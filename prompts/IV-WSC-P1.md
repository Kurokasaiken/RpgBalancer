AGENT
IV-WSC-P1 — Component-Based World Surface: Schemas + Query Engine

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Questa e' la fase P1 del master task `IV-WSC-001`.

OBIETTIVO
Creare i tipi e il motore di query a componenti per la nuova world surface, con test deterministici.

FILE CHIAVE
- `src/engine/world/model/WorldComponent.ts` (nuovo)
- `src/engine/world/model/WorldGroup.ts` (nuovo)
- `src/engine/world/model/WorldQuery.ts` (nuovo)
- `src/engine/world/systems/WorldComponentQueryEngine.ts` (nuovo)
- `tests/unit/idleVillage/WorldComponentQueryEngine.test.ts` (nuovo)
- `src/docs/docs/plans/component_based_world_surface_plan.md` (aggiorna changelog P1)

INVARIANTI
- Config-first: ogni component type/tag e' definito in config Zod, nessuna stringa hardcoded.
- `PresentationOutput` rimane JSON-serializable.
- Nessuna mutazione di `WorldState` dal renderer/runtime.
- i18n namespace `idleVillage` per label user-facing.
- No CSS standalone; skin tokens only.
- JSDoc per ogni tipo/funzione.

OPERAZIONI DA ESEGUIRE
1. Definire `WorldComponent` (id, type, tags, data, position, bounds, visibility).
2. Definire `WorldGroup` (id, components[], query cache, transform).
3. Definire `WorldQuery` API (byType, byTag, byBounds, byPredicate) e return types.
4. Implementare `WorldComponentQueryEngine` con query deterministiche e cache invalidation.
5. Creare test unitari per query byType, byTag, byBounds, combinazioni e cache.
6. Aggiornare `component_based_world_surface_plan.md` changelog P1.

OPERAZIONI VIETATE
- Mutare `WorldState` dal query engine.
- Scrivere renderer in questa fase (deve essere IV-WSC-P3).
- Aggiungere dipendenze Pixi/WebGL in questa fase.

ASSUNZIONI
- `worldSurfaceConfig.ts` esiste e puo' ospitare i nuovi type definitions.
- WORLD-PRESENTATION-RUNTIME-FOUNDATION e' completato.

SAFEGUARDS
- `npm run lint -- src/engine/world/model src/engine/world/systems/WorldComponentQueryEngine.ts tests/unit/idleVillage/WorldComponentQueryEngine.test.ts`
- `npm run test -- tests/unit/idleVillage/WorldComponentQueryEngine.test.ts`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/iv-wsc-p1-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `IV-WSC-P1` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: IV-WSC-P1 – Completato (Evidence: test-results/iv-wsc-p1-2026-07-23.log)`
