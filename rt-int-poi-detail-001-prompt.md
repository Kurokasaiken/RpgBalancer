# RT-INT-POI-DETAIL-001 - POI Standard + Detail Integration Page Assembly

```text
AGENT
Idle Village Runtime Integration Specialist - POI Standard + Detail

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare pagina di integrazione che dimostra l'interazione tra POI standard e POI detail components, servendo come verification harness per l'integrazione completa POI.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/pages/PoiDetailIntegrationPage.tsx (CREATE)

STYLE LAB PRESET
- N/A (task integrazione)

TEST ROUTE QA
- Obbligatorio: /poi-detail-integration (CREATE) per verification

DATO DI ORIGINE
- RT-POI-S-001 verification results
- RT-POI-D-001 verification results (reviewed)
- Integration assembly plan

DIPENDENZE
- RT-POI-S-001 deve essere completato
- RT-POI-D-001 deve essere completato (reviewed)

OPERAZIONI DA ESEGUIRE
1. **Create Integration Page**: Creare PoiDetailIntegrationPage.tsx che:
   - Monta ActivityCapsule examples (POI standard)
   - Monta PoiDetailSkinWrapper examples (POI detail)
   - Dimostra transizione tra standard e detail views
   - Mostra stato condiviso tra components
   - Usa Style Lab tokens per theming

2. **Implement POI Interaction**: Abilitare UI che:
   - Permette di espandere ActivityCapsule in detail view
   - Mostra come PoiDetailSkinWrapper integra con ActivityCapsule
   - Dimostra stato condiviso (progress, slots, collect)
   - Fornisce navigation tra standard e detail views
   - Mostra pillar variants (Wilderness/Empire)

3. **Integration Verification**: Assicurarsi che:
   - POI standard integri correttamente con POI detail
   - Stato sia condiviso correttamente tra components
   - Style Lab tokens siano applicati consistentemente
   - Non ci siano conflitti di stato o styling
   - Time layer usage sia consistente

4. **Create Verification Route**: Implementare /poi-detail-integration che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari POI (standard + detail)
   - Fornisce UI per testare interazioni POI
   - Include telemetry per tracking POI interactions

OPERAZIONI VIETATE
- Vietato creare nuovi componenti POI (solo integration)
- Vietato modificare POI contracts
- Vietato aggiungere nuova logica di dominio POI
- Vietato modificare /minimal-gameplay
- Vietato creare logiche di transizione nuove

ASSUNZIONI
- RT-POI-S-001 ha verificato POI standard compliance
- RT-POI-D-001 ha verificato POI detail compliance
- Componenti POI canonici sono disponibili e funzionanti
- PoiDetailSkinWrapper integra correttamente con ActivityCapsule

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/PoiDetailIntegrationPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; basarsi su componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-int-poi-detail-001-<YYYY-MM-DD>.log`
3. Report finale con: integration page creata, POI standard+detail interaction verificata, harness funzionante

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Use existing POI components: ActivityCapsule, PoiDetailSkinWrapper
- State sharing focus: dimostrare integrazione stato tra standard e detail
- Verification focus: pagina serve come harness, non come feature finale

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-int-poi-detail-001-<YYYY-MM-DD>.log
```

## Key Points
- Create integration page assembling POI standard and detail components
- Demonstrate state sharing between ActivityCapsule and PoiDetailSkinWrapper
- Show transitions between standard and detail views
- Use existing POI components only, no new POI logic
- Serve as verification harness for POI complete integration
- Wait for RT-POI-D-001 review before launch
