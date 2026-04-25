# FINAL-DOCUMENTATION-RECONCILIATION-001 - Final Documentation/Status Reconciliation

```text
AGENT
Idle Village Documentation Reconciliation Specialist - Final Status Update

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Assicurare che lo stato finale accettato della vertical slice `/minimal-gameplay` sia riflesso esattamente nel sistema di documentazione, includendo COMPONENT_MASTER_INDEX, trusted docs, e evidence/status records.

TRUSTED DOCS INVOLVED
- POI Standard Contract: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` (status: trusted)
- POI Detail Contract: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md` (status: trusted)
- Time Engine Contract: `src/docs/docs/idle_village/trusted/time_engine_trusted.md` (status: trusted)
- Day/Night Contract: `src/docs/docs/idle_village/trusted/daynight_trusted.md` (status: trusted)
- Roster/Drag Contract: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` (status: trusted)

ACCEPTED BASELINE EVIDENCE
- Final Acceptance Review: `test-results/final-acceptance-review-2026-04-25.log` (ACCEPTED)
- RT-FINAL-001 Evidence: `test-results/rt-final-001-2026-04-25.log` (completed)
- Reconciliation Evidence: `test-results/reconcile-integration-status-001-2026-04-25.log` (completed)
- Integration Evidence: All INT-* task logs (completed)

OPERAZIONI DA ESEGUIRE
1. **Verify COMPONENT_MASTER_INDEX Current State**: Verificare stato attuale:
   - Verificare che tutti i componenti siano "trusted"
   - Verificare che le date di certificazione siano corrette
   - Verificare che le note riflettano lo stato finale accettato
   - Aggiornare se necessario per riflettere esattamente lo stato accettato

2. **Verify Trusted Docs Status**: Verificare documenti trusted:
   - Assicurarsi che tutti i trusted docs esistano
   - Verificare che i contenuti siano allineati con lo stato accettato
   - Aggiornare se necessario per riflettere il baseline finale

3. **Update Evidence Records**: Aggiornare record evidence:
   - Verificare che tutti i log evidence siano presenti e corretti
   - Assicurarsi che lo stato "ACCEPTED" sia registrato correttamente
   - Collegare tutti i evidence logs al baseline accettato

4. **Create Final Status Summary**: Creare riepilogo stato finale:
   - Documentare esattamente cosa è stato accettato
   - Collegare tutti i evidence logs
   - Definire il baseline accettato per riferimento futuro

5. **Prepare for Freeze**: Preparare per freeze:
   - Assicurarsi che tutta la documentazione sia pronta per il freeze
   - Verificare che non ci siano discrepanze tra stato accettato e documentazione
   - Creare elenco di tutto ciò che viene congelato

VIETATI
- Vietato modificare componenti runtime (solo documentazione)
- Vietato modificare trusted contract content
- Vietato introdurre nuovi stati o classificazioni
- Vietato modificare evidence logs esistenti

ASSUNZIONI
- Vertical slice `/minimal-gameplay` è stata accettata
- Tutti i componenti sono in status "trusted"
- Tutti i pattern di integrazione sono verificati
- Nessun debito bloccante rimanente

ACCEPTANCE CRITERIA
- COMPONENT_MASTER_INDEX riflette esattamente lo stato accettato
- Tutti i trusted docs sono allineati con il baseline
- Tutti gli evidence records sono corretti e collegati
- Status summary completo creato
- Documentazione pronta per freeze

REGRESSION SAFEGUARDS
- `npm run lint -- src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; basata su verifica documentazione esistente

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/final-documentation-reconciliation-001-<YYYY-MM-DD>.log`
3. Report finale con: stato documentazione allineato, baseline registrato, freeze pronto

NOTE
- Documentation reconciliation only: allineare stato esistente, non creare nuovo contenuto
- Focus su accuratezza dello stato accettato nella documentazione
- Preparare terreno pulito per freeze del baseline accettato

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/final-documentation-reconciliation-001-<YYYY-MM-DD>.log
```

## Key Points
- Final documentation reconciliation only
- Ensure accepted state reflected exactly in docs
- Prepare for freeze of accepted baseline
- No runtime modifications
