AGENT
IV-PROG-P1 — Idle Village Progression System: XP Progression Formula + Level Table

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Questo e' la fase P1 del master task `IV-PROG-MASTER-001`. Implementa un sistema config-first per la progressione XP/livello.

OBIETTIVO
Creare `progressionConfig.ts` (schema Zod + parametri) e `XpProgressionEngine.ts` (calcolo XP per livello, XP totale, livello da XP) con test e aggiornare il piano.

FILE CHIAVE
- `src/balancing/config/idleVillage/progressionConfig.ts` (nuovo)
- `src/engine/game/idleVillage/XpProgressionEngine.ts` (nuovo)
- `tests/unit/idleVillage/XpProgressionEngine.test.ts` (nuovo)
- `src/docs/docs/plans/idle_village_progression_system_plan.md` (aggiorna changelog P1)

INVARIANTI
- Config-first: tutti i parametri (baseXp, growthFactor, maxLevel) in Zod schema; nessun numero magico.
- `PersistenceService` per eventuale persistenza dello stato residente (solo se creato in questa fase).
- i18n namespace `idleVillage` per qualsiasi stringa user-facing.
- No CSS standalone; tutti i token da skin/Style Lab.
- JSDoc per ogni funzione/interfaccia nuova.
- Allineamento GM-MP: se ci sono moltiplicatori, rappresentali come `GameplayModifier` con `sourceConfigId`.

OPERAZIONI DA ESEGUIRE
1. Creare `progressionConfig.ts` con:
   - `LevelProgressionConfigSchema` (Zod): baseXp, growthFactor, maxLevel, optional floorFn.
   - `DEFAULT_PROGRESSION_CONFIG` con valori di default.
   - Export `LevelProgressionConfig`, `defaultProgressionConfig`.
2. Creare `XpProgressionEngine.ts` con funzioni pure:
   - `xpForLevel(level, config) -> number`
   - `totalXpForLevel(level, config) -> number`
   - `levelFromTotalXp(totalXp, config) -> { level, xpIntoLevel, xpForNext }`
3. Creare `XpProgressionEngine.test.ts` con test deterministici sui calcoli e edge case (level 1, maxLevel, xp zero).
4. Aggiornare `idle_village_progression_system_plan.md` changelog P1 con data e file creati.

OPERAZIONI VIETATE
- Hardcodare formule in componenti React.
- Modificare logica esistente di `defaultConfig.ts` oltre all'import del nuovo config.
- Aggiungere dipendenze esterne.
- Lasciare TODO senza implementazione circostante.

ASSUNZIONI
- `src/balancing/config/idleVillage/defaultConfig.ts` puo' importare `progressionConfig.ts`.
- `gameplayModifierEngine.ts` esiste (GM-ENG completato) per eventuale integrazione futura.

SAFEGUARDS
- `npm run lint -- src/balancing/config/idleVillage/progressionConfig.ts src/engine/game/idleVillage/XpProgressionEngine.ts tests/unit/idleVillage/XpProgressionEngine.test.ts`
- `npm run test -- tests/unit/idleVillage/XpProgressionEngine.test.ts`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/iv-prog-p1-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `IV-PROG-P1` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso` con data e nome agente.
- Al completamento: `KANBAN STATUS: IV-PROG-P1 – Completato (Evidence: test-results/iv-prog-p1-2026-07-23.log)`
