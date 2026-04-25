# DOC-TIME-REV-001 - TimeEngine Trusted Contract Revision (Dual-Layer Architecture)

```text
AGENT
Idle Village Documentation Specialist - Time Contract Revision

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Rivedere time_engine_trusted.md per riflettere l'architettura a doppio strato invece del contratto a singolo strato attuale, basandosi sull'analisi RT-TIME-002.

PROMPT READINESS
FILE TARGET
- [esistente] src/docs/docs/idle_village/trusted/time_engine_trusted.md (REVISE)

STYLE LAB PRESET
- N/A (task documentazione)

TEST ROUTE QA
- N/A (task documentazione)

DATO DI ORIGINE
- RT-TIME-002 Analysis: Dual-layer time system identified
- Current doc: Single-layer contract (incomplete/misaligned)
- Runtime reality: Simulation layer + Gameplay layer separation

DIPENDENZE
- RT-TIME-002 deve essere completato (analisi dual-layer disponibile)

OPERAZIONI DA ESEGUIRE
1. **Analyze RT-TIME-002 Findings**: Studiare i risultati dell'analisi dual-layer:
   - Simulation layer: VillageState.currentTime, 1:1, deterministic
   - Gameplay/store layer: currentTick, speedMultiplier, UI/player pacing
   - Mapping e conversioni tra layer

2. **Revise Contract Structure**: Ristrutturare time_engine_trusted.md:
   - Aggiungere sezione "Dual-Layer Time Architecture"
   - Separare chiaramente simulation vs gameplay layer
   - Definire dove speedMultiplier è permesso/vietato
   - Spiegare come day/night si relaziona ai layer

3. **Update Source of Truth**: Ridefinire le fonti di verità:
   - Simulation layer: VillageState.currentTime (canonical simulation time)
   - Gameplay layer: useMinimalGameplay state.currentTick (canonical gameplay time)
   - UI layer: speed-multiplied display time (presentation only)

4. **Clarify Speed Multiplier Rules**: Definire esplicitamente:
   - Forbidden in simulation layer (TimeEngine.advanceTime() sempre 1:1)
   - Allowed in gameplay layer (store tick advancement)
   - Applied only in UI layer (display pacing)
   - No impact on deterministic simulation results

5. **Document Day/Night Integration**: Spiegare come day/night funziona:
   - Calcolato da simulation layer currentTime
   - Esposto tramite gameplay layer state
   - Visualizzato in UI layer con appropriate animazioni
   - Mantenuto deterministic across tutti i layer

6. **Update Canonical Invariants**: Aggiornare gli invarianti per riflettere dual-layer:
   - Mantenere invariants simulation layer (1:1 advancement, determinism)
   - Aggiungere invariants gameplay layer (speedMultiplier, player pacing)
   - Definire invariants UI layer (display consistency, responsiveness)

7. **Verify Contract Alignment**: Assicurarsi che il revised contract:
   - Rifletta accuratamente l'implementazione runtime attuale
   - Definisca chiaramente le responsabilità di ogni layer
   - Guidi correttamente futuri sviluppi runtime
   - Mantenga la coerenza con altri trusted docs

OPERAZIONI VIETATE
- Vietato modificare l'implementazione runtime (solo documentazione)
- Vietato introdurre nuovi concetti non supportati da RT-TIME-002
- Vietato creare contratti più restrittivi dell'implementazione attuale
- Vietato rimuovere invariants importanti del simulation layer

ASSUNZIONI
- RT-TIME-002 ha identificato correttamente il sistema dual-layer
- L'implementazione runtime attuale è corretta e non richiede modifiche
- Il trusted doc attuale è incompleto/misaligned, non l'implementazione
- Il sistema dual-layer è intenzionale e ben progettato

REGRESSION SAFEGUARDS
- `npm run lint -- src/docs/docs/idle_village/trusted/time_engine_trusted.md`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se RT-TIME-002 findings non sono chiari

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/doc-time-rev-001-contract-revision-<YYYY-MM-DD>.log`
3. Report finale con: dual-layer architecture documentata, contract allineato, invariants aggiornati

NOTE
- RT-TIME-002 ha provato che il trusted contract è incompleto, non che il runtime è sbagliato
- Focus su documentazione accurata dell'architettura esistente
- Il revised contract deve guidare correttamente i futuri runtime alignment task
- Mantenere coerenza con la filosofia config-first e determinism del simulation layer

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/doc-time-rev-001-contract-revision-<YYYY-MM-DD>.log
```

## Required Outcomes

### 1. Simulation Time Layer
```
- Source: VillageState.currentTime
- Advancement: 1:1 deterministic ticks
- Speed Multiplier: FORBIDDEN
- Purpose: Canonical simulation state, deterministic results
- Invariants: Monotonicity, atomicity, no compression/dilation
```

### 2. Gameplay/Store Time Layer  
```
- Source: useMinimalGameplay state.currentTick
- Advancement: Integer ticks with speedMultiplier support
- Speed Multiplier: ALLOWED (for player pacing)
- Purpose: Player-facing game state, pause/resume, speed control
- Invariants: Tick integrity, speed consistency, persistence
```

### 3. UI-Facing Time Semantics
```
- Source: Derived from gameplay layer
- Display: speed-multiplied time for user experience
- Purpose: Visual presentation, animations, timers
- Invariants: Display consistency, responsive updates
```

### 4. Speed Multiplier Rules
```
- Simulation Layer: FORBIDDEN (must remain 1:1)
- Gameplay Layer: ALLOWED (tick advancement pacing)
- UI Layer: APPLIED (display timing only)
- No impact on: deterministic simulation results
```

### 5. Day/Night Layer Relations
```
- Calculation: Based on simulation layer currentTime
- State Exposure: Through gameplay layer state
- Visual Display: In UI layer with appropriate styling
- Determinism: Maintained across all layers
```

### 6. Canonical Sources of Truth
```
- Simulation Truth: VillageState.currentTime
- Gameplay Truth: useMinimalGameplay state.currentTick
- UI Truth: Derived from gameplay layer for display
- Contract Truth: Revised time_engine_trusted.md
```

## Important Notes

- **Do not treat RT-TIME-002 as final proof** that runtime needs no work
- **Treat RT-TIME-002 as proof** that trusted contract is incomplete/misaligned
- **Focus on documentation accuracy**, not runtime changes
- **Maintain simulation layer determinism** as core invariant
- **Enable proper guidance** for future runtime alignment tasks

## After Completion

Return with recommendation on whether Wave 2 runtime tasks can be safely unblocked based on the revised contract clarity.
