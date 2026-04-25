# INT-DRAG-POI-ASSIGNMENT-001 - Drag + POI Assignment Integration

```text
AGENT
Idle Village Integration Specialist - Drag + POI Assignment

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare i sistemi drag & drop e POI già verificati, dimostrando l'assegnazione di residenti alle POI capsule con validazione esistente e feedback visivo senza creare nuove astrazioni non necessarie.

TRUSTED DOCS INVOLVED
- Roster/Drag Contract: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` (status: candidate)
- POI Standard Contract: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` (status: trusted)
- POI Detail Contract: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`

COMPONENTI VALIDATI DA INTEGRARE
- VillageRosterSection (verificato da RT-ROSTER-001)
- DragContext e DragOverlay (verificati da RT-ROSTER-001)
- ActivityCapsule (verificato da RT-POI-S-001)
- PoiDetailSkinWrapper (verificato da RT-POI-D-001)
- Stat validation system esistente
- Style Lab tokens per visual feedback

HARNESS ROUTE
- Obbligatorio: `/drag-poi-assignment` (CREATE) per verification

OPERAZIONI DA ESEGUIRE
1. **Create Integration Page**: Creare pagina che monta i componenti esistenti:
   - Monta VillageRosterSection (roster drag system)
   - Monta ActivityCapsule examples con slot assignment
   - Monta PoiDetailSkinWrapper con assignment UI
   - Usa DragContext e DragOverlay esistenti
   - Usa Style Lab tokens esistenti per theming

2. **Verify Drag Assignment**: Testare assegnazione esistente:
   - Verificare che drag & drop su POI capsule funzioni
   - Testare stat validation esistente per assignment
   - Validare visual feedback per assignment validity
   - Assicurarsi che DragContext e DragOverlay funzionino correttamente

3. **Document Assignment Flow**: Registrare come funziona:
   - Drag & drop da roster a POI capsule
   - Stat validation per resident assignment
   - Visual feedback per valid/invalid assignments
   - Time layer usage consistency

4. **Create Verification Harness**: Implementare route che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari di assignment
   - Fornisce UI per testare drag & drop assignment
   - Include telemetry per tracking assignment events

VIETATI
- Vietato creare nuovi hook/components senza bloccante reale
- Vietato modificare POI contracts o drag contracts
- Vietato aggiungere nuove logiche di validazione
- Vietato modificare /minimal-gameplay
- Vietato creare logiche di assignment complesse

ASSUNZIONI
- RT-ROSTER-001 ha verificato drag system compliance
- RT-POI-S-001 ha verificato POI standard compliance
- RT-POI-D-001 ha verificato POI detail compliance
- Componenti esistenti possono essere integrati direttamente
- Stat validation system esistente può essere usato
- Nuovi helper solo se strettamente necessari e giustificati da bloccanti

ACCEPTANCE CRITERIA
- Integration page mostra drag & drop assignment funzionante
- Resident assignment a POI capsule funziona correttamente
- Stat validation esistente funziona come previsto
- Visual feedback appropriato per assignment validity
- Harness route funziona come verification page
- Telemetry events emessi correttamente

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/DragPoiAssignmentPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; usare componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/int-drag-poi-assignment-001-<YYYY-MM-DD>.log`
3. Report finale con: integration verificata, drag+POI assignment funzionante, validation esistente utilizzata

NOTE
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Prefer existing canonical components e trusted contracts
- New helpers solo se bloccanti reali lo richiedono
- Verification focus: pagina serve come harness, non come feature finale
- Use existing stat validation, non create new logic

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/int-drag-poi-assignment-001-<YYYY-MM-DD>.log
```

## Key Points
- Integrate existing verified drag and POI components
- Use existing stat validation system
- No new hooks/components unless blockers found
- Focus on real drag & drop assignment interaction
- Create verification harness for testing
