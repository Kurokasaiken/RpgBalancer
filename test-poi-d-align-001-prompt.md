# TEST-POI-D-ALIGN-001 - POI Detail Test Suite Alignment

```text
AGENT
Idle Village Test Alignment Specialist - POI Detail

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare la POI detail test suite con il trusted contract e il runtime path attuale, risolvendo i problemi di setup/harness senza modificare il comportamento runtime.

PROMPT READINESS
FILE TARGET
- [esistente] tests/**/poi/**/* (ALIGN)
- [esistente] tests/**/detail/**/* (ALIGN)

STYLE LAB PRESET
- N/A (task test alignment)

TEST ROUTE QA
- N/A (task test alignment)

DATO DI ORIGINE
- RT-POI-D-001 verification results
- POI Detail trusted contract
- Current failing test results
- `/poi-detail-verification` harness behavior

DIPENDENZE
- RT-POI-D-001 deve essere completato

OPERAZIONI DA ESEGUIRE
1. **Analyze Test Failures**: Analizzare i test attualmente fallenti:
   - Identificare le cause root dei fallimenti
   - Distinguere tra setup debt e real contract violations
   - Documentare i problemi di configurazione

2. **Align Test Setup**: Allineare setup dei test con trusted contract:
   - Verificare che i mock rispettino le API reali
   - Assicurarsi che i test data siano consistenti
   - Allineare i test expectations con il runtime behavior

3. **Fix Harness Configuration**: Risolvere problemi di harness:
   - Verificare che i test harness usino componenti reali
   - Assicurarsi che le configurazioni di test siano corrette
   - Allineare i test con `/poi-detail-verification` behavior

4. **Update Test Assertions**: Aggiornare le assertions:
   - Allineare le expectations con il trusted contract
   - Rimuovere assertions che non corrispondono al runtime
   - Aggiungere test per coprire i casi reali

5. **Verify Test Coverage**: Assicurarsi che:
   - Tutti gli aspetti del trusted contract siano testati
   - I test siano stabili e riproducibili
   - Non ci siano test fragili o dipendenti da setup

OPERAZIONI VIETATE
- Vietato modificare il comportamento runtime (solo test alignment)
- Vietato aggiungere nuovi requisiti non nel trusted contract
- Vietato modificare componenti POI reali
- Vietato introdurre nuovi test senza valore aggiunto

ASSUNZIONI
- RT-POI-D-001 ha verificato che il runtime è compliant
- I fallimenti dei test sono dovuti a setup/harness debt
- Il trusted contract riflette accuratamente il runtime behavior

REGRESSION SAFEGUARDS
- `npm run lint -- tests/**/poi/**/* tests/**/detail/**/*`
- `npm run test -- tests/**/poi/**/* tests/**/detail/**/*`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; basarsi su RT-POI-D-001 evidence

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/test-poi-d-align-001-<YYYY-MM-DD>.log`
3. Report finale con: test suite allineata, setup debt risolto, test stabili

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Test alignment only: non modificare runtime behavior
- Focus on setup: risolvere problemi di configurazione e harness
- Stability first: assicurarsi che i test siano stabili e riproducibili

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/test-poi-d-align-001-<YYYY-MM-DD>.log
```

## Key Points
- Align POI detail test suite with trusted contract
- Fix setup/harness debt without runtime changes
- Use `/poi-detail-verification` as reference
- Ensure test stability and reproducibility
