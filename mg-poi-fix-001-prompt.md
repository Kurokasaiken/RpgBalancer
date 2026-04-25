| MG-POI-FIX-001 - Fix Wood POI assignment runtime path | Non assegnato | - | - | Wood POI drop shows UI feedback but doesn't start real activity pipeline or appear in Active Activities |
```text
AGENT
Idle Village POI Integration Specialist - Runtime Assignment

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Rendere il primo Wood POI effettivamente assegnare residenti e avviare la pipeline di attività reale al runtime.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/components/WoodPOI.tsx
- [esistente] src/ui/idleVillage/components/WoodPOIDetail.tsx
- [esistente] src/ui/idleVillage/components/ResidentSlotRack.tsx
- [esistente] src/ui/idleVillage/hooks/useResidentDropValidation.ts
- [esistente] src/store/useMinimalGameplay.ts

STYLE LAB PRESET
- Preset: Minimal Frontier (src/ui/styleLab/presets/minimalFrontier.ts)
- Overrides/Tokens: POI state colors, assignment feedback tokens

TEST ROUTE QA
- N/A (task su /minimal-gameplay, non /test)

DATO DI ORIGINE
- Documento: User request "Fix Wood POI assignment runtime path" - drag UI says "drop to assign" but assignment doesn't become visibly clear, activity never appears in Active Activities

DIPENDENZE
- IV-WOOD-POI-001 (Wood POI base implementation) - deve essere completato per avere componenti base

OPERAZIONI DA ESEGUIRE
1. **Tracciamento Chain Runtime**: Mappare la catena completa:
   - Sorgente drag (resident card)
   - POI drop handling
   - Forwarding into slot interno
   - Slot assignment logic
   - Validator result processing
   - startActivity call
   - Active Activities update

2. **Fix Assignment Visibilità**: Rendere assignment visibilmente chiaro:
   - Assigned resident/occupied state comprensibile
   - Stato POI sincronizzato con slot interno

3. **Validare Direct POI Drop**: Assicurare che drop diretto su POI funzioni:
   - Forwarding corretto into slot interno
   - Validator result processed
   - Activity start triggered

4. **Validare Direct Slot Drop**: Assicurare che drop diretto su slot funzioni:
   - Assignment diretto senza forwarding
   - Stessa pipeline di validazione

5. **Integrare Activity Pipeline**: Collegare con:
   - useMinimalGameplayStore per stato attività
   - startActivity call per avviare lavoro
   - Active Activities HUD per monitoraggio

6. **Lock Resident While Running**: Implementare locking:
   - Resident non rimovibile durante activity
   - Completed state reachable
   - Collect su POI completato funziona

7. **Test Runtime Verification**: Verificare manualmente:
   - Drop su POI e su slot separatamente
   - Activity appare in Active Activities
   - Progress visible durante running
   - Collect funziona su completion

OPERAZIONI VIETATE
- Vietato ridisegnare DnD system
- Vietato introdurre placeholder assignment UI fake
- Vietato lavorare su time acceleration in questo task
- Vietato creare path di assignment parallelo

ASSUNZIONI
- Sistema validator/slot esistente è riutilizzabile
- Activity engine (useMinimalGameplayStore) supporta start/stop/collect
- Config system (minimalConfig.ts) ha definizione wood-gathering

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx src/ui/idleVillage/components src/ui/idleVillage/hooks src/store/useMinimalGameplay.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media; apri blocker solo se activity engine non supporta start/stop come previsto

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/mg-poi-fix-001-<YYYY-MM-DD>.log`
3. Report con: failure point esatto, files touched, fix applicato, come assignment è rappresentato, verifica runtime per POI drop e slot drop

NOTE
- Riutilizzare sistemi esistenti (validator, activity engine)
- Focus su correctness del chain assignment
- Verificare sia POI drop che slot drop separatamente

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/mg-poi-fix-001-<YYYY-MM-DD>.log
```
