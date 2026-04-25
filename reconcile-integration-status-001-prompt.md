# RECONCILE-INTEGRATION-STATUS-001 - Integration Status Reconciliation

```text
AGENT
Idle Village Reconciliation Specialist - Integration Status Normalization

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Consolidare e normalizzare lo stato effettivo di completamento delle integrazioni, promuovere i componenti pronti allo status "trusted", e registrare esplicitamente il debito residuo per preparare il final assembly.

TRUSTED DOCS INVOLVED
- POI Standard Contract: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` (status: trusted)
- POI Detail Contract: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md` (status: candidate)
- Time Engine Contract: `src/docs/docs/idle_village/trusted/time_engine_trusted.md` (status: candidate)
- Day/Night Contract: `src/docs/docs/idle_village/trusted/daynight_trusted.md` (status: trusted)
- Roster/Drag Contract: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` (status: candidate)

INTEGRATION OUTPUTS COMPLETATI DA VERIFICARE
- INT-POI-STANDARD-DETAIL-001: Completato 2026-04-25 (evidence: test-results/int-poi-standard-detail-001-2026-04-25.log)
- INT-TIME-DAYNIGHT-001: Completato 2026-04-25 (evidence: test-results/int-time-daynight-001-2026-04-25.log)
- INT-DRAG-POI-ASSIGNMENT-001: Completato 2026-04-25 (evidence: test-results/int-drag-poi-assignment-001-2026-04-25.log)

OPERAZIONI DA ESEGUIRE
1. **Verify Integration Completion**: Verificare lo stato effettivo delle integrazioni:
   - Verificare evidence logs per ogni integration task
   - Confermare che tutti gli integration harness funzionino
   - Validare che non ci siano debiti nascosti

2. **Promote Ready Components**: Promuovere componenti effettivamente pronti:
   - Valutare POI Detail per promozione a "trusted" (test alignment completed)
   - Valutare Time Engine per promozione a "trusted" (runtime verified)
   - Valutare Roster/Drag per promozione a "trusted" (integration working)
   - Aggiornare trusted docs con status "trusted" dove appropriato

3. **Update COMPONENT_MASTER_INDEX**: Normalizzare status vocabulary:
   - Aggiornare tabella status per riflettere stato reale
   - Assicurarsi che tutti i "candidate" promossi siano "trusted"
   - Documentare data di promozione e motivazione

4. **Record Remaining Debt**: Registrare debito residuo esplicitamente:
   - Identificare qualsiasi debito tecnico rimanente
   - Documentare problemi aperti se presenti
   - Creare lista di debiti da risolvere prima di RT-FINAL-001

5. **Confirm Final Assembly Readiness**: Confermare prontezza per final assembly:
   - Verificare che tutti i componenti necessari siano "trusted"
   - Confermare che tutte le integrazioni siano stabili
   - Validare che non ci siano blocker per RT-FINAL-001

VIETATI
- Vietato modificare componenti runtime (solo status normalization)
- Vietato creare nuove integrazioni o componenti
- Vietato modificare trusted contracts content
- Vietato espandere scope oltre reconciliation

ASSUNZIONI
- Integration tasks sono effettivamente completati
- Componenti con integrazioni funzionanti sono candidati per "trusted"
- Evidence logs contengono informazioni accurate sul completion state
- Final assembly richiede tutti i componenti in status "trusted"

ACCEPTANCE CRITERIA
- Tutti i componenti pronti promossi a "trusted"
- COMPONENT_MASTER_INDEX aggiornato con status corretti
- Debito residuo registrato esplicitamente
- Final assembly readiness confermata
- Kanban aggiornato con stato reconciliation

REGRESSION SAFEGUARDS
- `npm run lint -- src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; basata su verification dello stato esistente

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/reconcile-integration-status-001-<YYYY-MM-DD>.log`
3. Report finale con: componenti promossi, status normalizzati, debito residuo registrati

NOTE
- Reconciliation only: normalizzare stato esistente, non creare nuovo lavoro
- Promuovere solo componenti effettivamente pronti basati su evidence
- Documentare esplicitamente qualsiasi debito residuo
- Preparare terreno pulito per RT-FINAL-001

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/reconcile-integration-status-001-<YYYY-MM-DD>.log
```

## Key Points
- Reconcile actual completion state of integration tasks
- Promote ready components to "trusted" status
- Normalize trusted status vocabulary across all areas
- Record remaining debt explicitly
- Prepare clean foundation for final assembly
