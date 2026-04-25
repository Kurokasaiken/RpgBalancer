# RT-ROSTER-001 - Roster/Drag Runtime Alignment

```text
AGENT
Idle Village Runtime Alignment Specialist - Roster/Drag

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare il sistema drag & drop e validazione roster con i trusted contracts, verificando che il flusso di assignment funzioni correttamente con TimeEngine state.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/TestRosterPage.tsx (ALIGN)
- [esistente] src/ui/idleVillage/components/DragContext.tsx (VERIFY)
- [esistente] src/engine/game/idleVillage/statMatching.ts (ALIGN)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: /test per verifica drag & drop integration

DATO DI ORIGINE
- Trusted Doc: TimeEngine Contract (implicit) + ActivityCapsule Contract
- Piano: Runtime Component Alignment Plan - Task RT-ROSTER-001
- Dual-layer time architecture: usare gameplay layer time per UI interactions

DIPENDENZE
- RT-TIME-001 deve essere completato
- DOC-TIME-REV-001 deve essere completato (dual-layer architecture)

OPERAZIONI DA ESEGUIRE
1. **Verify Drag Context**: Verificare che DragContext.tsx rispetti i trusted contracts:
   - Validazione del flusso di assignment
   - Integrazione con TimeEngine state
   - Feedback visivo allineato con i contratti

2. **Align TestRosterPage**: Allineare TestRosterPage.tsx per servire come verification harness:
   - Assicurarsi che funzioni come drag & drop test harness
   - Verificare che esponga correttamente lo stato TimeEngine
   - Validare che i visual feedback systems funzionino

3. **Verify Stat Matching**: Allineare statMatching.ts con trusted requirements:
   - Validazione dei requisiti stat come specificato
   - Assignment API che rispetta TimeEngine state
   - Nessuna modifica diretta del TimeEngine state

4. **Test Drag Integration**: Verificare il flusso completo su /test:
   - Drag validation flow corrisponde ai trusted requirements
   - Stat requirement validation funziona come specificato
   - Assignment API rispetta TimeEngine state
   - Visual feedback system allineato con contracts

5. **Verify Time Layer Usage**: Assicurarsi che il drag system usi correttamente i time layer:
   - Gameplay layer time per UI interactions
   - Nessun impatto su simulation layer
   - Speed multiplier rispettato dove appropriato

OPERAZIONI VIETATE
- Vietato modificare drag system core (solo align)
- Vietato aggiungere nuovi drag behaviors non in trusted
- Vietato modificare TimeEngine state direttamente
- Vietato creare local timers o duplicare time logic
- Vietato modificare /minimal-gameplay (solo /test per verification)

ASSUNZIONI
- TimeEngine dual-layer architecture è chiara da DOC-TIME-REV-001
- TestRosterPage esiste e serve come drag harness
- Drag system core è funzionante, solo allineamento necessario

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx`
- `npm run lint -- src/ui/idleVillage/components/DragContext.tsx`
- `npm run lint -- src/engine/game/idleVillage/statMatching.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se drag system non corrisponde ai trusted contracts

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-roster-001-alignment-<YYYY-MM-DD>.log`
3. Report finale con: drag system allineato, verification harness funzionante, time layer usage corretto

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Alignment only: non modificare i contratti, solo verificare compliance
- Time layer awareness: usare gameplay layer per UI, non simulation layer
- Config-first: assicurarsi che ogni valore di dominio venga da configurazione

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-roster-001-alignment-<YYYY-MM-DD>.log
```

## Key Points
- Focus on drag & drop alignment with trusted contracts
- Use /test as verification harness (not /minimal-gameplay)
- Respect dual-layer time architecture
- No scope bleed into final assembly
- No local timer or duplicate time logic
