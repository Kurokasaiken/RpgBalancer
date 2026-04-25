# RT-FINAL-001 - Minimal Gameplay Page Assembly

```text
AGENT
Idle Village Runtime Integration Specialist - Final Assembly

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Assemblare tutti i componenti allineati in MinimalGameplayPage per dimostrare il vertical slice completo dell'Idle Village, usando solo componenti e pattern di integrazione già validati.

TRUSTED DOCS INVOLVED
- POI Standard Contract: `src/docs/docs/idle_village/trusted/poi_standard_trusted.md` (status: trusted)
- POI Detail Contract: `src/docs/docs/idle_village/trusted/poi_detail_trusted.md` (status: trusted)
- Time Engine Contract: `src/docs/docs/idle_village/trusted/time_engine_trusted.md` (status: trusted)
- Day/Night Contract: `src/docs/docs/idle_village/trusted/daynight_trusted.md` (status: trusted)
- Roster/Drag Contract: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md` (status: trusted)

COMPONENTI VALIDATI DA INTEGRARE
- ActivityCapsule (trusted, RT-POI-S-001 verified)
- PoiDetailSkinWrapper (trusted, TEST-POI-D-ALIGN-001 aligned)
- TimeEngine (trusted, INT-TIME-DAYNIGHT-001 verified)
- DayNightPOI (trusted, RT-DAYN-001 verified)
- VillageRosterSection (trusted, INT-DRAG-POI-ASSIGNMENT-001 verified)
- DragContext e DragOverlay (trusted, RT-ROSTER-001 verified)

INTEGRATION PATTERN DA USARE
- INT-POI-STANDARD-DETAIL-001 pattern per POI integration
- INT-TIME-DAYNIGHT-001 pattern per time/day/night integration
- INT-DRAG-POI-ASSIGNMENT-001 pattern per drag assignment

OPERAZIONI DA ESEGUIRE
1. **Final Assembly Only**: Assemblare in MinimalGameplayPage:
   - Montare ActivityCapsule con PoiDetailSkinWrapper (pattern INT-POI-STANDARD-DETAIL-001)
   - Montare TimeEngine con DayNightPOI (pattern INT-TIME-DAYNIGHT-001)
   - Montare VillageRosterSection con drag assignment (pattern INT-DRAG-POI-ASSIGNMENT-001)
   - Usare solo componenti e pattern già validati

2. **End-to-End Verification**: Verificare integrazione completa:
   - Testare tutti i pattern di integrazione funzionano insieme
   - Validare che non ci siano conflitti tra componenti
   - Assicurarsi che tutti gli harness di verifica siano accessibili
   - Confermare che tutte le interazioni funzionino come previsto

3. **Performance Validation**: Validare performance:
   - Verificare che l'assembly completo funziona senza problemi
   - Testare che tutti i componenti interagiscano efficientemente
   - Assicurarsi che non ci siano memory leak o performance issue

4. **Documentation**: Documentare stato finale:
   - Registrare tutti i componenti integrati
   - Documentare tutti i pattern di integrazione utilizzati
   - Confermare che tutti i trusted contract siano rispettati

VIETATI
- Vietato creare nuovi componenti o hook
- Vietato modificare trusted contracts
- Vietato introdurre nuove astrazioni speculative
- Vietato modificare componenti esistenti (solo assembly)
- Vietato creare nuovi pattern di integrazione

ASSUNZIONI
- Tutti i componenti sono in status "trusted"
- Tutti i pattern di integrazione sono verificati
- Tutti gli harness di verifica funzionano
- MinimalGameplayPage esiste già e può essere estesa

ACCEPTANCE CRITERIA
- MinimalGameplayPage mostra tutti i componenti integrati
- Tutti i pattern di integrazione funzionano insieme
- Nessun conflitto tra componenti
- Performance accettabile per l'assembly completo
- Tutti i trusted contract rispettati

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; basata su assembly di componenti verificati

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-final-001-<YYYY-MM-DD>.log`
3. Report finale con: assembly completato, integrazione verificata, performance validata

NOTE
- Final assembly only: assemblare componenti esistenti, non crearne nuovi
- Use already validated components and integration patterns
- No redesign, no speculative abstractions
- Blocker-first se un mismatch è trovato durante l'assembly

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-final-001-<YYYY-MM-DD>.log
```

## Key Points
- Final assembly only using trusted components
- Use already validated integration patterns
- No redesign or new abstractions
- Blocker-first approach if mismatches found
- End-to-end verification of complete vertical slice
