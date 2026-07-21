AGENT
Gameplay Engine Specialist – Modifier Evaluation

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare engine per evaluation e stacking di gameplay modifiers con deterministic order e telemetry integration.

PROMPT READINESS
FILE TARGET
- [esistente] src/balancing/config/idleVillage/gameplayModifierRegistry.ts (da GM-REG)
- [nuovo] src/balancing/modifiers/gameplayModifierEngine.ts
- [nuovo] src/balancing/modifiers/modifierStack.ts
- [nuovo] tests/unit/balancing/gameplayModifierEngine.test.ts
- [esistente] src/analytics/telemetryProvider.ts

STYLE LAB PRESET
- N/A (task backend/engine)

TEST ROUTE QA
- N/A (nessuna superficie /test coinvolta)

DATO DI ORIGINE
- Documento: strategy_tasks.md GM-ENG – Gameplay Modifier Engine Implementation

DIPENDENZE
- GM-REG completato (registry schema disponibile)

OPERAZIONI DA ESEGUIRE
1. **Engine Core**: Implementare gameplayModifierEngine.ts con evaluation order deterministic, stacking logic, conflict resolution
2. **Modifier Stack**: Creare modifierStack.ts con active modifiers management, duration tracking, expiration handling
3. **Evaluation Pipeline**: Implementare applyModifiers(baseValue, context) con proper order, scope filtering, condition checking
4. **Telemetry Integration**: Collegare con telemetryProvider.ts per eventi modifier_applied/removed/stack_changed
5. **Performance**: Ottimizzare per frequent evaluation calls (<1ms per evaluation), caching dove appropriato
6. **Testing**: Unit tests per evaluation order, stacking, conflicts, performance, telemetry events

OPERAZIONI VIETATE
- Vietato creare UI components (solo engine logic)
- Vietato hardcodare evaluation order fuori da config
- Vietato skip telemetry per modifier operations

ASSUNZIONI
- Registry disponibile da GM-REG con tutti i modifier definitions
- Telemetry system può essere esteso con nuovi eventi
- Performance requirements: <1ms per evaluation call

REGRESSION SAFEGUARDS
- `npm run lint -- src/balancing/modifiers`
- `npm run test -- tests/unit/balancing/gameplayModifierEngine.test.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se performance requirements non raggiungibili

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/gm-eng-modifier-engine-<YYYY-MM-DD>.log`
3. Report finale con: evaluation order verified, stacking working, performance benchmarks met

NOTE
- Citare nei log: `PROJECT_PHILOSOPHY.md`, modifier system docs, performance requirements
- Deterministic: evaluation order deve essere predictable e testabile
- Telemetry-first: tutte le modifier operations devono essere tracciate

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

CONFIG STRUCTURE
- engineConfig: { evaluationOrder: ["scope", "priority", "duration"], maxStackDepth: 50, enableTelemetry: true }
- stackConfig: { cleanupInterval: 1000, maxDuration: 3600000, conflictResolution: "override" }
Export: `EngineConfigSchema`, `defaultEngineConfig`, `EngineConfig`

EVIDENCE LOG
- test-results/gm-eng-modifier-engine-<YYYY-MM-DD>.log
