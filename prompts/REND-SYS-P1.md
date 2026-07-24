AGENT
REND-SYS-P1 — Rendering System: Foundation Schemas + Material/Frame/Recipe Libraries

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` prima di iniziare.
Questa e' la fase P1 del master task `REND-SYS-001`.

OBIETTIVO
Definire gli schemi e le librerie base per il rendering system a layer stile Blizzard.

FILE CHIAVE
- `src/ui/idleVillage/rendering/schemas.ts` (nuovo)
- `src/ui/idleVillage/rendering/materialLibrary.ts` (nuovo)
- `src/ui/idleVillage/rendering/frameLibrary.ts` (nuovo)
- `src/ui/idleVillage/rendering/layerRecipes.ts` (nuovo)
- `tests/unit/idleVillage/rendering/schemas.test.ts` (nuovo)
- `src/docs/docs/plans/rendering_system_implementation_plan.md` (aggiorna changelog P1)

INVARIANTI
- Config-first: ogni definizione e' in Zod schema; nessun valore visivo hardcoded.
- Backward compatibility con le variabili CSS esistenti.
- No file `.css` standalone; tutti gli output da `skinConfigRegistry` tokens o CSS generato.
- i18n namespace `idleVillage` per label.
- JSDoc per ogni tipo/funzione.

OPERAZIONI DA ESEGUIRE
1. Creare `schemas.ts` con tipi: `Material`, `Frame`, `LayerRecipe`, `RenderNode`, `RenderTree`.
2. Creare `materialLibrary.ts` con materiali base (bronze, stone, parchment, obsidian) come config.
3. Creare `frameLibrary.ts` con frame variants (panel, card, socket) come config.
4. Creare `layerRecipes.ts` con combinazioni material+frame (almeno 3 recipe campione).
5. Scrivere test che validano schemi e sample recipes.
6. Aggiornare `rendering_system_implementation_plan.md` changelog P1.

OPERAZIONI VIETATE
- Creare componenti React in questa fase (deve essere REND-SYS-P2).
- Scrivere file CSS standalone.
- Hardcodare colori/font/spaziature in TSX/TS.

ASSUNZIONI
- `skinConfigRegistry.ts` e `gilded-observatory.css` esistono e forniscono token base.
- `art_direction_plan.md` verra' aggiornato in parallelo (ART-DIR-UPDATE-001).

SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/rendering tests/unit/idleVillage/rendering/schemas.test.ts`
- `npm run test -- tests/unit/idleVillage/rendering/schemas.test.ts`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/rend-sys-p1-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `REND-SYS-P1` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: REND-SYS-P1 – Completato (Evidence: test-results/rend-sys-p1-2026-07-23.log)`
