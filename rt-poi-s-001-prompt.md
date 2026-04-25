# RT-POI-S-001 - POI Standard Runtime Alignment

```text
AGENT
Idle Village Runtime Alignment Specialist - POI Standard

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare ActivityCapsule component con il POI Standard trusted contract, verificando che skin configuration, progress tracking, e collect functionality funzionino come specificato.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/ActivityCapsule.tsx (ALIGN)
- [esistente] src/ui/idleVillage/skins/activityCapsuleSkinConfig.ts (ALIGN)
- [esistente] src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts (VERIFY)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: Dedicated POI page (CREATE) per verification

DATO DI ORIGINE
- Trusted Doc: POI Standard Contract
- Piano: Runtime Component Alignment Plan - Task RT-POI-S-001
- Dual-layer time architecture: usare gameplay layer time per UI timers

DIPENDENZE
- RT-TIME-001 deve essere completato
- DOC-TIME-REV-001 deve essere completato (dual-layer architecture)

OPERAZIONI DA ESEGUIRE
1. **Align ActivityCapsule**: Allineare ActivityCapsule.tsx con trusted contract:
   - Verificare che props interface corrisponda al trusted contract
   - Assicurarsi che progress tracking funzioni come documentato
   - Validare che collect functionality corrisponda alla contract definition
   - Verificare che il componente non appaia come pseudo-detail sulla main page

2. **Verify Skin Configuration**: Verificare activityCapsuleSkinConfig.ts:
   - Assicurarsi che skin configuration API segua le trusted specifications
   - Validare che Style Lab tokens siano usati correttamente
   - Verificare che pillar variants (Wilderness/Empire) siano supportati

3. **Verify POI Amber Skin**: Verificare poiAmberSkinConfig.ts:
   - Assicurarsi che POI skin visualization funzioni come specificato
   - Validare che SVG-based visualizations siano configurate correttamente
   - Verificare che amber skin sia default per POI visualization

4. **Create Verification Harness**: Creare dedicated POI page:
   - Creare pagina dedicata per ActivityCapsule verification
   - Assicurarsi che la pagina serva come verification harness
   - Testare tutti gli aspetti del trusted contract

5. **Verify Time Layer Usage**: Assicurarsi che ActivityCapsule usi correttamente i time layer:
   - Gameplay layer time per UI timers e progress
   - Nessun impatto su simulation layer
   - Speed multiplier rispettato per display animations

OPERAZIONI VIETATE
- Vietato modificare ActivityCapsule core behavior (solo align)
- Vietato aggiungere nuove props non nel trusted doc
- Vietato modificare skin system core
- Vietato creare local timers o duplicare time logic
- Vietato modificare /minimal-gameplay (solo dedicated POI page)
- Vietato fare apparire ActivityCapsule come detail view su main page

ASSUNZIONI
- TimeEngine dual-layer architecture è chiara da DOC-TIME-REV-001
- ActivityCapsule esiste e funziona, solo allineamento necessario
- Skin system esiste, solo verification richiesta

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/components/ActivityCapsule.tsx`
- `npm run lint -- src/ui/idleVillage/skins/activityCapsuleSkinConfig.ts`
- `npm run lint -- src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se ActivityCapsule non corrisponde al trusted contract

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-poi-s-001-alignment-<YYYY-MM-DD>.log`
3. Report finale con: ActivityCapsule allineato, skin config verificata, verification harness funzionante

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Alignment only: non modificare i contratti, solo verificare compliance
- Time layer awareness: usare gameplay layer per UI, non simulation layer
- Config-first: assicurarsi che ogni valore di dominio venga da configurazione
- Visual hierarchy: capsule deve leggere come capsule, non come detail view

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-poi-s-001-alignment-<YYYY-MM-DD>.log
```

## Key Points
- Focus on ActivityCapsule alignment with POI Standard contract
- Create dedicated POI page as verification harness
- Respect dual-layer time architecture
- No scope bleed into final assembly
- No local timer or duplicate time logic
- Maintain visual hierarchy (capsule vs detail)
