# RT-INT-DRAG-POI-001 - Drag + POI Integration Page Assembly

```text
AGENT
Idle Village Runtime Integration Specialist - Drag + POI

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare pagina di integrazione che dimostra l'interazione tra sistema drag & drop e componenti POI, servendo come verification harness per l'integrazione.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/pages/DragPoiIntegrationPage.tsx (CREATE)

STYLE LAB PRESET
- N/A (task integrazione)

TEST ROUTE QA
- Obbligatorio: /drag-poi-integration (CREATE) per verification

DATO DI ORIGINE
- RT-ROSTER-001 verification results
- RT-POI-S-001 verification results
- Integration assembly plan

DIPENDENZE
- RT-ROSTER-001 deve essere completato
- RT-POI-S-001 deve essere completato
- RT-POI-D-001 deve essere completato (reviewed)

OPERAZIONI DA ESEGUIRE
1. **Create Integration Page**: Creare DragPoiIntegrationPage.tsx che:
   - Monta VillageRosterSection (roster drag system)
   - Monta ActivityCapsule examples (POI standard)
   - Monta PoiDetailSkinWrapper examples (POI detail)
   - Dimostra drag & drop su POI components
   - Usa Style Lab tokens per theming

2. **Implement Drag to POI**: Abilitare drag & drop che:
   - Permette di trascinare residenti su POI capsules
   - Rispetta stat validation requirements
   - Fornisce visual feedback per drag operations
   - Usa DragContext e DragOverlay canonici

3. **Integration Verification**: Assicurarsi che:
   - Roster system integri correttamente con POI components
   - Time layer usage sia consistente (gameplay layer)
   - Style Lab tokens siano applicati correttamente
   - Non ci siano conflitti di stato o styling

4. **Create Verification Route**: Implementare /drag-poi-integration che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari di interazione
   - Fornisce UI per testare drag & drop su POI
   - Include telemetry per tracking interactions

OPERAZIONI VIETATE
- Vietato creare nuovi componenti (solo integration)
- Vietato modificare POI contracts o drag contracts
- Vietato aggiungere nuova logica di dominio
- Vietato modificare /minimal-gameplay
- Vietato creare logiche di validazione nuove

ASSUNZIONI
- RT-ROSTER-001 ha verificato drag system compliance
- RT-POI-S-001 ha verificato POI standard compliance
- RT-POI-D-001 ha verificato POI detail compliance
- Componenti canonici sono disponibili e funzionanti

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/DragPoiIntegrationPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; basarsi su componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-int-drag-poi-001-<YYYY-MM-DD>.log`
3. Report finale con: integration page creata, drag+POI interaction verificata, harness funzionante

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Use existing canonical components: VillageRosterSection, ActivityCapsule, PoiDetailSkinWrapper
- Config-first: usare configurazioni esistenti, non hardcodare valori
- Verification focus: pagina serve come harness, non come feature finale

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-int-drag-poi-001-<YYYY-MM-DD>.log
```

## Key Points
- Create integration page assembling existing drag and POI components
- Enable drag & drop from roster to POI capsules
- Use canonical components only, no new component creation
- Serve as verification harness for drag+POI integration
- Wait for RT-POI-D-001 review before launch
