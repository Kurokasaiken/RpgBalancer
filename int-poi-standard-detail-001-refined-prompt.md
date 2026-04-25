# INT-POI-STANDARD-DETAIL-001 - POI Standard + Detail Integration

```text
AGENT
Idle Village Integration Specialist - POI Standard + Detail

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Integrare i componenti POI standard e detail già verificati, dimostrando l'interazione reale tra ActivityCapsule e PoiDetailSkinWrapper senza creare nuove astrazioni non necessarie.

TRUSTED DOCS INVOLVED
- POI Standard Contract: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` (status: trusted)
- POI Detail Contract: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md`

COMPONENTI VALIDATI DA INTEGRARE
- ActivityCapsule (verificato da RT-POI-S-001)
- PoiDetailSkinWrapper (verificato da RT-POI-D-001)
- Style Lab tokens e pillar variants (Wilderness/Empire)
- Configurazioni skin esistenti (activityCapsuleSkinConfig, poiAmberSkinConfig)

HARNESS ROUTE
- Obbligatorio: `/poi-standard-detail-integration` (CREATE) per verification

OPERAZIONI DA ESEGUIRE
1. **Create Integration Page**: Creare pagina che monta i componenti esistenti:
   - Monta ActivityCapsule con diverse configurazioni
   - Monta PoiDetailSkinWrapper con le stesse configurazioni
   - Dimostra interazione tra standard e detail views
   - Usa Style Lab tokens esistenti per theming

2. **Verify Existing Integration**: Testare integrazione corrente:
   - Verificare che PoiDetailSkinWrapper integri correttamente con ActivityCapsule
   - Testare che stato sia condiviso correttamente tra components
   - Validare che Style Lab tokens siano applicati consistentemente
   - Assicurarsi che non ci siano conflitti di stato o styling

3. **Document Interaction Patterns**: Registrare come funzionano:
   - Transizioni tra standard e detail views
   - Stato condiviso (progress, slots, collect)
   - Pillar variants behavior
   - Time layer usage consistency

4. **Create Verification Harness**: Implementare route che:
   - Serve come integration verification harness
   - Mostra tutti gli scenari POI (standard + detail)
   - Fornisce UI per testare interazioni esistenti
   - Include telemetry per tracking POI interactions

VIETATI
- Vietato creare nuovi hook/components senza bloccante reale
- Vietato modificare POI contracts o componenti esistenti
- Vietato aggiungere nuove astrazioni speculative
- Vietato modificare /minimal-gameplay
- Vietato broad redesign o final-page assembly

ASSUNZIONI
- RT-POI-S-001 ha verificato ActivityCapsule compliance
- RT-POI-D-001 ha verificato PoiDetailSkinWrapper compliance
- Componenti esistenti possono essere integrati direttamente
- Nuovi helper solo se strettamente necessari e giustificati da bloccanti

ACCEPTANCE CRITERIA
- Integration page mostra ActivityCapsule e PoiDetailSkinWrapper interagendo
- Stato condiviso funziona correttamente tra standard e detail
- Style Lab tokens applicati consistentemente
- Nessun conflitto di stato o styling
- Harness route funziona come verification page
- Telemetry events emessi correttamente

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/PoiStandardDetailIntegrationPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; usare componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/int-poi-standard-detail-001-<YYYY-MM-DD>.log`
3. Report finale con: integration verificata, componenti esistenti funzionanti, interaction patterns documentati

NOTE
- Integration only: assemblare componenti esistenti, non crearne nuovi
- Prefer existing canonical components e trusted contracts
- New helpers solo se bloccanti reali lo richiedono
- Verification focus: pagina serve come harness, non come feature finale

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/int-poi-standard-detail-001-<YYYY-MM-DD>.log
```

## Key Points
- Integrate existing verified components only
- No new hooks/components unless blockers found
- Focus on real interaction between ActivityCapsule and PoiDetailSkinWrapper
- Use existing Style Lab tokens and configurations
- Create verification harness for testing
