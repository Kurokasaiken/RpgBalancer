# RT-POI-D-001 - POI Detail Runtime Alignment

```text
AGENT
Idle Village Runtime Alignment Specialist - POI Detail

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Allineare PoiDetailSkinWrapper e activityCapsuleDetail skins con il POI Detail trusted contract, verificando che l'integrazione con POI standard funzioni correttamente.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx (ALIGN)
- [esistente] src/ui/idleVillage/skins/activityCapsuleDetail/ (VERIFY)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: Dedicated POI Detail page (CREATE) per verification

DATO DI ORIGINE
- Trusted Doc: POI Detail Contract
- Piano: Runtime Component Alignment Plan - Task RT-POI-D-001
- Dual-layer time architecture: usare gameplay layer time per UI interactions
- RT-POI-S-001 verification: POI standard già allineato e verificato

DIPENDENZE
- RT-POI-S-001 deve essere completato (POI standard verification)
- RT-TIME-001 deve essere completato (TimeEngine allineato)
- DOC-TIME-REV-001 deve essere completato (dual-layer architecture)

OPERAZIONI DA ESEGUIRE
1. **Align PoiDetailSkinWrapper**: Allineare PoiDetailSkinWrapper.tsx con trusted contract:
   - Verificare che API del wrapper corrisponda al trusted contract
   - Assicurarsi che enhanced information display segua le specifications
   - Validare che l'integrazione con POI standard funzioni correttamente
   - Verificare che il wrapper non sia un componente autonomo ma un wrapper

2. **Verify ActivityCapsuleDetail Skins**: Verificare activityCapsuleDetail/ directory:
   - Assicurarsi che le skin detail seguano le trusted specifications
   - Validare che Style Lab tokens siano usati correttamente
   - Verificare che pillar variants (Wilderness/Empire) siano supportati
   - Assicurarsi che le skin detail siano complementari a standard POI

3. **Verify Integration**: Verificare integrazione con POI standard:
   - Testare che PoiDetailSkinWrapper integri correttamente con ActivityCapsule
   - Assicurarsi che lo stato sia condiviso correttamente tra standard e detail
   - Validare che le transizioni tra capsule e detail siano fluide
   - Verificare che non ci siano conflitti di stato o styling

4. **Create Verification Harness**: Creare dedicated POI Detail page:
   - Creare pagina dedicata per POI Detail verification
   - Assicurarsi che la pagina serva come verification harness
   - Testare tutti gli aspetti del trusted contract
   - Dimostrare integrazione con POI standard

5. **Verify Time Layer Usage**: Assicurarsi che POI Detail usi correttamente i time layer:
   - Gameplay layer time per UI interactions e animations
   - Nessun impatto su simulation layer
   - Speed multiplier rispettato per display animations
   - Day/night integration se applicabile

OPERAZIONI VIETATE
- Vietato modificare detail wrapper core (solo align)
- Vietato aggiungere nuove features non nel trusted
- Vietato modificare POI standard component
- Vietato creare local timers o duplicare time logic
- Vietato modificare /minimal-gameplay (solo dedicated POI Detail page)
- Vietato creare componenti autonomi (solo wrapper e integration)

ASSUNZIONI
- TimeEngine dual-layer architecture è chiara da DOC-TIME-REV-001
- RT-POI-S-001 ha verificato che POI standard è compliant
- PoiDetailSkinWrapper esiste e funziona, solo allineamento necessario
- ActivityCapsuleDetail skins esistono, solo verification richiesta

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx`
- `npm run lint -- src/ui/idleVillage/skins/activityCapsuleDetail/`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se PoiDetailSkinWrapper non corrisponde al trusted contract

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-poi-d-001-alignment-<YYYY-MM-DD>.log`
3. Report finale con: detail wrapper allineato, skin detail verificate, integration verificata

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Alignment only: non modificare i contratti, solo verificare compliance
- Time layer awareness: usare gameplay layer per UI, non simulation layer
- Config-first: assicurarsi che ogni valore di dominio venga da configurazione
- Integration focus: detail wrapper deve integrare, non sostituire standard POI

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-poi-d-001-alignment-<YYYY-MM-DD>.log
```

## Key Points
- Focus on POI Detail alignment with trusted contract
- Build on RT-POI-S-001 verification foundation
- Create dedicated POI Detail page as verification harness
- Respect dual-layer time architecture
- No scope bleed into final assembly
- Integration focus, not standalone component creation
