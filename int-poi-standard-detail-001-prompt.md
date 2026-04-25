# INT-POI-STANDARD-DETAIL-001 - POI Standard + Detail Integration

```text
AGENT
Idle Village Integration Specialist - POI Standard + Detail

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Creare integrazione completa tra POI standard e POI detail components, dimostrando transizioni fluide, stato condiviso e interaction patterns per il vertical slice.

PROMPT READINESS
FILE TARGET
- [nuovo] src/ui/idleVillage/pages/PoiStandardDetailIntegrationPage.tsx (CREATE)
- [esistente] src/ui/idleVillage/hooks/usePoiDetailState.ts (CREATE)
- [esistente] src/ui/idleVillage/components/PoiDetailTransition.tsx (CREATE)

STYLE LAB PRESET
- N/A (task integrazione)

TEST ROUTE QA
- Obbligatorio: /poi-standard-detail-integration (CREATE) per verification

DATO DI ORIGINE
- RT-POI-S-001 verification results
- RT-POI-D-001 verification results (APPROVED WITH SETUP DEBT)
- Integration assembly plan

DIPENDENZE
- RT-POI-S-001 deve essere completato
- RT-POI-D-001 deve essere completato

OPERAZIONI DA ESEGUIRE
1. **Create usePoiDetailState Hook**: Implementare hook per stato condiviso:
   - Gestire stato tra standard e detail views
   - Integrare con useMinimalGameplay store
   - Fornire funzioni per expand/collapse detail
   - Gestire pillar variants (Wilderness/Empire)
   - Fornire telemetry per state tracking

2. **Create PoiDetailTransition Component**: Creare componente per transizioni:
   - Implementare animazioni fluide tra standard e detail
   - Gestire visual feedback per expand/collapse
   - Usare Style Lab tokens per transizioni
   - Fornire loading states e error handling

3. **Create Integration Page**: Creare PoiStandardDetailIntegrationPage.tsx che:
   - Monta ActivityCapsule examples (POI standard)
   - Monta PoiDetailSkinWrapper examples (POI detail)
   - Mostra transizioni tra standard e detail views
   - Dimostra stato condiviso tra components
   - Usa usePoiDetailState per state management
   - Usa Style Lab tokens per theming

4. **Implement POI Interaction**: Abilitare UI che:
   - Permette di espandere ActivityCapsule in detail view
   - Mostra come PoiDetailSkinWrapper integra con ActivityCapsule
   - Dimostra stato condiviso (progress, slots, collect)
   - Fornisce navigation tra standard e detail views
   - Mostra pillar variants (Wilderness/Empire)

5. **Integration Verification**: Assicurarsi che:
   - POI standard integri correttamente con POI detail
   - Stato sia condiviso correttamente tra components
   - Style Lab tokens siano applicati consistentemente
   - Non ci siano conflitti di stato o styling
   - Time layer usage sia consistente

6. **Create Verification Route**: Implementare /poi-standard-detail-integration che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari POI (standard + detail)
   - Fornisce UI per testare interazioni POI
   - Include telemetry per tracking POI interactions
   - Dimostra tutti i pillar variants

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
- `npm run lint -- src/ui/idleVillage/pages/PoiStandardDetailIntegrationPage.tsx`
- `npm run lint -- src/ui/idleVillage/hooks/usePoiDetailState.ts`
- `npm run lint -- src/ui/idleVillage/components/PoiDetailTransition.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; basarsi su componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/int-poi-standard-detail-001-<YYYY-MM-DD>.log`
3. Report finale con: integration page creata, POI standard+detail interaction verificata, state sharing funzionante

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Use existing POI components: ActivityCapsule, PoiDetailSkinWrapper
- State sharing focus: dimostrare integrazione stato tra standard e detail
- Verification focus: pagina serve come harness, non come feature finale
- Build on RT-POI-D-001 results despite setup debt

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/int-poi-standard-detail-001-<YYYY-MM-DD>.log
```

## Key Points
- Create POI standard + detail integration with state sharing
- Implement smooth transitions between standard and detail views
- Use existing POI components only, no new POI logic
- Create verification harness for complete POI interaction
- Build on RT-POI-D-001 results despite setup debt
