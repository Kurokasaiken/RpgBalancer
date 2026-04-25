# RT-INT-TIME-DAYN-001 - Time + Day/Night Integration Page Assembly

```text
AGENT
Idle Village Runtime Integration Specialist - Time + Day/Night

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare pagina di integrazione che dimostra l'interazione tra TimeEngine (dual-layer) e sistema day/night, servendo come verification harness per l'integrazione temporale.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/pages/TimeDaynightIntegrationPage.tsx (CREATE)

STYLE LAB PRESET
- N/A (task integrazione)

TEST ROUTE QA
- Obbligatorio: /time-daynight-integration (CREATE) per verification

DATO DI ORIGINE
- RT-TIME-001 verification results
- RT-DAYN-001 audit results
- DOC-TIME-REV-001 dual-layer architecture
- Integration assembly plan

DIPENDENZE
- RT-TIME-001 deve essere completato
- RT-DAYN-001 deve essere completato
- DOC-TIME-REV-001 deve essere completato

OPERAZIONI DA ESEGUIRE
1. **Create Integration Page**: Creare TimeDaynightIntegrationPage.tsx che:
   - Monta useMinimalGameplay store con time state
   - Monta DayNightPOI component (day/night visualization)
   - Mostra dual-layer time architecture in action
   - Dimostra time advancement e day/night cycles
   - Usa Style Lab tokens per theming

2. **Implement Time Layer Demonstration**: Abilitare UI che:
   - Mostra simulation layer time (currentTime 1:1)
   - Mostra gameplay layer time (currentTick con speedMultiplier)
   - Dimostra day/night calculation da simulation time
   - Permette di modificare speedMultiplier per testing
   - Mostra separazione netta tra layers

3. **Day/Night Integration Verification**: Assicurarsi che:
   - Day/night state sia derivato correttamente da simulation time
   - Visual changes rispettino day/night cycle
   - Speed multiplier non affetti day/night calculation
   - UI updates siano consistenti con gameplay layer

4. **Create Verification Route**: Implementare /time-daynight-integration che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari temporali
   - Fornisce UI per testare time advancement
   - Include telemetry per tracking time events

OPERAZIONI VIETATE
- Vietato creare nuovi componenti time (solo integration)
- Vietato modificare TimeEngine o time contracts
- Vietato aggiungere nuova logica di dominio temporale
- Vietato modificare /minimal-gameplay
- Vietato rompere dual-layer architecture

ASSUNZIONI
- RT-TIME-001 ha verificato TimeEngine compliance
- RT-DAYN-001 ha verificato day/night compliance
- DOC-TIME-REV-001 ha documentato dual-layer architecture
- Time layer separation è chiara e implementata

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/TimeDaynightIntegrationPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; basarsi su componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-int-time-dayn-001-<YYYY-MM-DD>.log`
3. Report finale con: integration page creata, time+day/night interaction verificata, dual-layer architecture dimostrata

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Use existing time components: useMinimalGameplay, DayNightPOI
- Dual-layer awareness: dimostrare separazione netta tra simulation e gameplay layers
- Verification focus: pagina serve come harness, non come feature finale

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-int-time-dayn-001-<YYYY-MM-DD>.log
```

## Key Points
- Create integration page demonstrating dual-layer time architecture
- Show simulation vs gameplay layer separation
- Demonstrate day/night calculation from simulation time
- Use existing time components only, no new time logic
- Serve as verification harness for time+day/night integration
- Wait for RT-POI-D-001 review before launch
