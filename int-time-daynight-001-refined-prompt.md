# INT-TIME-DAYNIGHT-001 - Time + Day/Night Integration

```text
AGENT
Idle Village Integration Specialist - Time + Day/Night

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare i componenti time e day/night già verificati, dimostrando l'architettura dual-layer e l'interazione tra TimeEngine e sistema day/night senza creare nuove astrazioni non necessarie.

TRUSTED DOCS INVOLVED
- Time Engine Contract: `src/docs/docs/idle_village/trusted/time_engine_trusted.md` (status: candidate)
- Day/Night Contract: `src/docs/docs/idle_village/trusted/daynight_trusted.md` (status: audited/compliant)
- Dual-Layer Architecture: `src/docs/docs/idle_village/trusted/time_engine_trusted.md` (DOC-TIME-REV-001)

COMPONENTI VALIDATI DA INTEGRARE
- TimeEngine (verificato da RT-TIME-001)
- Day/Night system (verificato da RT-DAYN-001)
- useMinimalGameplay store con time state
- DayNightPOI component (se esistente)
- Style Lab tokens per day/night theming

HARNESS ROUTE
- Obbligatorio: `/time-daynight-integration` (CREATE) per verification

OPERAZIONI DA ESEGUIRE
1. **Create Integration Page**: Creare pagina che monta i componenti esistenti:
   - Monta useMinimalGameplay store con time state
   - Monta DayNightPOI o componenti day/night esistenti
   - Mostra dual-layer time architecture in action
   - Usa Style Lab tokens esistenti per theming

2. **Verify Dual-Layer Architecture**: Testare separazione layer:
   - Verificare che simulation layer time (currentTime 1:1) funzioni
   - Verificare che gameplay layer time (currentTick con speedMultiplier) funzioni
   - Assicurarsi che day/night sia derivato da simulation time
   - Validare che speed multiplier non affetti day/night calculation

3. **Document Time Layer Behavior**: Registrare come funzionano:
   - Separazione netta tra simulation e gameplay layers
   - Day/night calculation da simulation time
   - Speed multiplier effects su gameplay layer
   - Time advancement e visual updates

4. **Create Verification Harness**: Implementare route che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari temporali
   - Fornisce UI per testare time advancement
   - Include telemetry per tracking time events

VIETATI
- Vietato creare nuovi hook/components senza bloccante reale
- Vietato modificare TimeEngine o time contracts
- Vietato aggiungere nuove astrazioni temporali
- Vietato modificare /minimal-gameplay
- Vietato rompere dual-layer architecture

ASSUNZIONI
- RT-TIME-001 ha verificato TimeEngine compliance
- RT-DAYN-001 ha verificato day/night compliance
- DOC-TIME-REV-001 ha documentato dual-layer architecture
- Componenti esistenti possono essere integrati direttamente
- Nuovi helper solo se strettamente necessari e giustificati da bloccanti

ACCEPTANCE CRITERIA
- Integration page mostra dual-layer architecture funzionante
- Simulation layer e gameplay layer separati correttamente
- Day/night state derivato correttamente da simulation time
- Speed multiplier non affetta day/night calculation
- Harness route funziona come verification page
- Telemetry events emessi correttamente

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/TimeDaynightIntegrationPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; usare componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/int-time-daynight-001-<YYYY-MM-DD>.log`
3. Report finale con: integration verificata, dual-layer architecture dimostrata, time behavior documentato

NOTE
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Prefer existing canonical components e trusted contracts
- New helpers solo se bloccanti reali lo richiedono
- Verification focus: pagina serve come harness, non come feature finale
- Maintain dual-layer architecture integrity

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/int-time-daynight-001-<YYYY-MM-DD>.log
```

## Key Points
- Integrate existing verified time and day/night components
- Demonstrate dual-layer architecture separation
- No new hooks/components unless blockers found
- Use existing TimeEngine and day/night systems
- Create verification harness for testing
