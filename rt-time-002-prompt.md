# RT-TIME-002 - Runtime Behavior Verification and Time Contract Mismatch Resolution

```text
AGENT
Idle Village Runtime Alignment Specialist - Time Contract Analysis

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Verificare il comportamento runtime effettivo del tempo e risolvere il mismatch tra trusted contract (tick-based, speed-multiplied) e implementazione corrente (VillageState.currentTime 1:1).

PROMPT READINESS
FILE TARGET
- [esistente] src/engine/game/idleVillage/TimeEngine.ts (ANALYZE)
- [esistente] src/store/useMinimalGameplay.ts (ANALYZE)
- [esistente] src/docs/docs/idle_village/trusted/time_engine_trusted.md (COMPARE)

STYLE LAB PRESET
- N/A (task analysis)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica runtime time behavior
- Opzionale: /test per verifica time integration

DATO DI ORIGINE
- Trusted Doc: src/docs/docs/idle_village/trusted/time_engine_trusted.md
- Issue: RT-TIME-001 passed structure verification but failed runtime behavior verification
- Piano: Runtime Component Alignment Plan - Critical Mismatch Resolution

DIPENDENZE
- RT-TIME-001 deve essere completato (ma i risultati sono insufficienti)

OPERAZIONI DA ESEGUIRE
1. **Trace Exact Runtime Time Path**: Mappare il flusso di tempo effettivo da engine a UI:
   - TimeEngine.advanceTime() -> VillageState.currentTime
   - useMinimalGameplay state.currentTick (primary source of truth)
   - speedMultiplier integration in store
   - UI time display and progression

2. **Identify Canonical Time Truth**: Determinare dove vive veramente il tempo canonico:
   - Engine: VillageState.currentTime (1:1 advancement)
   - Store: state.currentTick (integer ticks, primary source)
   - UI: speedMultiplier * tick advancement
   - Mapping: currentTime <-> currentTick conversion

3. **Contract Mismatch Analysis**: Analizzare esattamente dove è il mismatch:
   - Trusted doc expectation: tick-based, speed-multiplied, centralized
   - Runtime reality: VillageState.currentTime 1:1 advancement
   - Store layer: currentTick as primary, speedMultiplier applied
   - Missing: verified runtime speed multiplier behavior

4. **Determine Contract-Reality Alignment**: Valutare se:
   - Runtime is wrong, trusted doc is right
   - Trusted doc is wrong, runtime is right  
   - Both incomplete and need layered contract

5. **Verify Speed Multiplier Behavior**: Testare se speedMultiplier funziona runtime:
   - Check store speedMultiplier usage
   - Verify UI time progression respects multiplier
   - Test pause/resume with speed changes
   - Confirm tick advancement vs display time

6. **Analyze Time Layer Separation**: Valutare se esistono layer separati:
   - Engine time: VillageState.currentTime (simulation time)
   - Store time: currentTick (gameplay time)  
   - UI time: speed-multiplied display time
   - Contract needs: explicit layer definitions

OPERAZIONI VIETATE
- Vietato modificare l'implementazione senza analisi completa
- Vietato assumere che il trusted doc sia corretto senza verifica
- Vietato modificare TimeEngine core logic finché il mismatch non è risolto
- Vietato creare nuove API time senza chiarire il contratto

ASSUNZIONI
- RT-TIME-001 ha verificato la struttura ma non il comportamento runtime
- Esiste un mismatch tra trusted contract e implementazione attuale
- Il tempo ha multiple layer (engine, store, UI) che potrebbero essere conflitti

REGRESSION SAFEGUARDS
- `npm run lint -- src/engine/game/idleVillage/TimeEngine.ts`
- `npm run lint -- src/store/useMinimalGameplay.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se il runtime time path non è analizzabile

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-time-002-contract-analysis-<YYYY-MM-DD>.log`
3. Report finale con: runtime time path mappato, mismatch identificato, decision presa

NOTE
- Focus su runtime behavior verification, non solo code structure
- Determinare la fonte di verità canonica per il tempo
- Risolvere il mismatch fondamentale prima di procedere con altri task
- La decisione guiderà tutti i successivi runtime alignment task

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-time-002-contract-analysis-<YYYY-MM-DD>.log
```

## Required Output Structure

### A. Exact Runtime Time Path
```
Engine Layer: TimeEngine.advanceTime() -> VillageState.currentTime (+1 per tick)
Store Layer: useMinimalGameplay state.currentTick (primary source of truth)
UI Layer: speedMultiplier * currentTick -> display time
Mapping: currentTime <-> currentTick conversions
```

### B. Contract Mismatch Analysis  
```
Trusted Doc: "tick-based, speed-multiplied, centralized time"
Runtime: "VillageState.currentTime 1:1 advancement"
Store: "currentTick primary, speedMultiplier applied"
Missing: Verified speed multiplier behavior in UI
```

### C. Decision (One of)
- **Runtime is wrong**: VillageState.currentTime should respect speedMultiplier
- **Trusted doc is wrong**: Current 1:1 advancement is correct, doc needs update  
- **Layered contract needed**: Engine time vs gameplay time vs UI time are separate

### D. Next Action
- **If runtime wrong**: Modify TimeEngine to use speed-multiplied advancement
- **If doc wrong**: Update trusted doc to reflect current 1:1 reality
- **If layered needed**: Create explicit time layer definitions in contract

## Critical Context

RT-TIME-001 passed code structure verification but failed to verify actual runtime behavior. The trusted contract expects tick-based, speed-multiplied time, but the current implementation appears to use VillageState.currentTime with 1:1 advancement and no verified speed multiplier behavior.

This task must resolve the fundamental time contract before any other runtime alignment tasks can proceed safely.
