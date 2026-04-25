# INT-DRAG-POI-ASSIGNMENT-001 - Drag + POI Assignment Integration

```text
AGENT
Idle Village Integration Specialist - Drag + POI Assignment

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare integrazione tra sistema drag & drop e POI assignment, permettendo di assegnare residenti alle POI capsule con validazione delle stat requirements e feedback visivo.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/pages/DragPoiAssignmentPage.tsx (CREATE)
- [esistente] src/ui/idleVillage/components/PoiAssignmentValidator.ts (CREATE)
- [esistente] src/ui/idleVillage/hooks/usePoiAssignment.ts (CREATE)

STYLE LAB PRESET
- N/A (task integrazione)

TEST ROUTE QA
- Obbligatorio: /drag-poi-assignment (CREATE) per verification

DATO DI ORIGINE
- RT-ROSTER-001 verification results
- RT-POI-S-001 verification results  
- RT-POI-D-001 verification results (APPROVED WITH SETUP DEBT)
- Integration assembly plan

DIPENDENZE
- RT-ROSTER-001 deve essere completato
- RT-POI-S-001 deve essere completato
- RT-POI-D-001 deve essere completato

OPERAZIONI DA ESEGUIRE
1. **Create PoiAssignmentValidator**: Creare validatore per assignment:
   - Verificare stat requirements per POI assignment
   - Validare che resident abbia stats sufficienti
   - Fornire feedback su assignment validity
   - Gestire casi edge (empty stats, missing requirements)

2. **Create usePoiAssignment Hook**: Implementare hook per assignment logic:
   - Gestire stato di assignment (pending, success, failed)
   - Integrare con useMinimalGameplay store
   - Fornire funzioni per assign e unassign residenti
   - Gestire telemetry per assignment tracking

3. **Create Integration Page**: Creare DragPoiAssignmentPage.tsx che:
   - Monta VillageRosterSection (roster drag system)
   - Monta ActivityCapsule examples con assignment slots
   - Monta PoiDetailSkinWrapper con assignment UI
   - Implementa drag & drop assignment con validation
   - Usa Style Lab tokens per theming

4. **Implement Drag Assignment**: Abilitare drag & drop che:
   - Permette di trascinare residenti su POI capsule
   - Mostra visual feedback per assignment validity
   - Usa DragContext e DragOverlay canonici
   - Fornisce confirm/cancel per assignment

5. **Assignment Verification**: Assicurarsi che:
   - Stat validation funzioni correttamente
   - Time layer usage sia consistente (gameplay layer)
   - Style Lab tokens siano applicati correttamente
   - Non ci siano conflitti di stato o styling

6. **Create Verification Route**: Implementare /drag-poi-assignment che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari di assignment
   - Fornisce UI per testare drag & drop assignment
   - Include telemetry per tracking assignment events

OPERAZIONI VIETATE
- Vietato creare nuovi componenti POI (solo integration)
- Vietato modificare POI contracts o drag contracts
- Vietato aggiungere nuova logica di dominio per validation
- Vietato modificare /minimal-gameplay
- Vietato creare logiche di assignment complesse

ASSUNZIONI
- RT-ROSTER-001 ha verificato drag system compliance
- RT-POI-S-001 ha verificato POI standard compliance
- RT-POI-D-001 ha verificato POI detail compliance
- Componenti canonici sono disponibili e funzionanti
- Stat requirements sono definiti nei POI contracts

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/DragPoiAssignmentPage.tsx`
- `npm run lint -- src/ui/idleVillage/components/PoiAssignmentValidator.ts`
- `npm run lint -- src/ui/idleVillage/hooks/usePoiAssignment.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; basarsi su componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/int-drag-poi-assignment-001-<YYYY-MM-DD>.log`
3. Report finale con: integration page creata, drag+POI assignment verificata, validation funzionante

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Use existing canonical components: VillageRosterSection, ActivityCapsule, PoiDetailSkinWrapper
- Config-first: usare configurazioni esistenti per stat requirements
- Verification focus: pagina serve come harness, non come feature finale
- Assignment validation: usare logica esistente, non crearne nuova

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/int-drag-poi-assignment-001-<YYYY-MM-DD>.log
```

## Key Points
- Create drag + POI assignment integration
- Implement stat validation for resident assignment
- Use existing canonical components only
- Create verification harness for assignment testing
- Build on RT-POI-D-001 results despite setup debt
