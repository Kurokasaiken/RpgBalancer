AGENT
IV-TF-001 — Idle Village Tick & Fatigue: Fatigue Config Schema + Recovery Rates

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Questa e' la fase 001 del master task `IV-TF-MASTER-001`.

OBIETTIVO
Definire lo schema Zod per il sistema fatica/recupero e integrarlo in `defaultConfig.ts`.

FILE CHIAVE
- `src/balancing/config/idleVillage/fatigueConfig.ts` (nuovo)
- `src/balancing/config/idleVillage/defaultConfig.ts` (modifica: importa fatigueConfig)
- `src/docs/docs/plans/idle_village_tick_fatigue_plan.md` (aggiorna changelog)

INVARIANTI
- Config-first: tutti i tassi (fatiguePerTick, recoveryPerTickRest, recoveryPerTickSleep, maxFatigue, exhaustionThreshold) in Zod schema.
- `PersistenceService` per lo stato fatica residente (verra' usato in IV-TF-003).
- i18n namespace `idleVillage` per stringhe user-facing.
- No CSS standalone; skin tokens only.
- JSDoc per ogni tipo/funzione.

OPERAZIONI DA ESEGUIRE
1. Creare `fatigueConfig.ts` con:
   - `FatigueConfigSchema` (Zod): tickRate, fatiguePerTick, recoveryRates (rest/sleep/sick), thresholds, maxFatigue, exhaustionThreshold.
   - `DEFAULT_FATIGUE_CONFIG` e export tipati.
2. Integrare la configurazione in `defaultConfig.ts` come sezione `fatigue`.
3. Aggiornare `idle_village_tick_fatigue_plan.md` changelog con i file e i parametri.

OPERAZIONI VIETATE
- Implementare logica di applicazione fatica in questa fase (deve essere IV-TF-002).
- Hardcodare valori al di fuori del config.
- Modificare `TickEngine.ts` o `useResidentStore.ts` in questa fase.

ASSUNZIONI
- `defaultConfig.ts` usa struttura gerarchica; `fatigue` e' una nuova sezione.
- GM-ENG e' disponibile per eventuali modifier legati alla fatica (futuro).

SAFEGUARDS
- `npm run lint -- src/balancing/config/idleVillage/fatigueConfig.ts src/balancing/config/idleVillage/defaultConfig.ts`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/iv-tf-001-2026-07-23.log`

NOTE
- Quando prendi questo prompt, imposta la riga `IV-TF-001` in `src/docs/docs/coordinator/agent_assignments.md` su `In corso`.
- Al completamento: `KANBAN STATUS: IV-TF-001 – Completato (Evidence: test-results/iv-tf-001-2026-07-23.log)`
