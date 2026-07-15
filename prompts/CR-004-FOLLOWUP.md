# CR-004-FOLLOWUP - Re-adopt Canonical Village Resident Store in /minimal-gameplay

**Status**: Non assegnato
**Dependency**: CR-004 (context - marked complete but implementation reverted)
**Blocks**: CR-005

## AGENT
Idle Village Runtime Specialist - Minimal Gameplay Adoption (Follow-up)

## ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

## OBIETTIVO
Re-implementare l'adozione del Village Resident Store canonico in MinimalGameplayPage. CR-004 era stato marcato come completato ma l'implementazione è stata revertata o mai applicata. La pagina corrente usa ancora useMinimalGameplayWithIdleVillageConfig() invece di useVillageResidents().

## REQUISITI CHIAVE
1. **Store Integration**: Sostituire `useMinimalGameplayWithIdleVillageConfig()` con `useVillageResidents()` hook
2. **Consistency Check**: Assicurare che l'implementazione specchi l'adozione in /test (CR-003)
3. **Remove Page-Level Conversion**: Eliminare qualsiasi Character → Resident conversion nella pagina
4. **Preserve Gameplay**: Mantenere tutte le funzionalità gameplay esistenti (resource warnings, worker panel, activities)
5. **Type Alignment**: Assicurare compatibilità tipi con componenti esistenti (WorkerPanel, ActivityCapsule)

## FILE DA MODIFICARE
- `src/ui/idleVillage/MinimalGameplayPage.tsx` (principal)
- Rimuovere import di `useMinimalGameplayWithIdleVillageConfig` da `@/store/useMinimalGameplay`
- Aggiungere import di `useVillageResidents` dal Village Resident Store canonico
- Aggiornare `WorkerPanel` props per usare resident data dal canonical store

## VINCOLI
- Zero breaking changes per UI esistente
- No fallback logic nella pagina
- Single source of truth: solo Village Resident Store
- Coerenza con implementazione /test (CR-003)
- Mantenere resource warnings e activity rendering

## CONTESTO CR-004
CR-004 era stato marcato "Completato" il 2026-04-24 con evidence log, ma l'implementazione corrente mostra:
- Linea 8: `import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay'`
- Linea 18: `const gameplayState = useMinimalGameplayWithIdleVillageConfig()`
- Questo è il non-canonical store, non il Village Resident Store

## RIFERIMENTO IMPLEMENTAZIONE /TEST
Consultare `src/ui/idleVillage/TestRosterPage.tsx` per vedere come CR-003 ha adottato il canonical store:
- Deve usare `useVillageResidents()` hook
- Deve consumare resident data dal Village Resident Store
- Nessuna conversione Character → Resident a livello pagina

## SAFEGUARDS
- Lint: `src/ui/idleVillage/MinimalGameplayPage.tsx`
- Test: RTL test per store integration
- Build:check
- Kanban:lint
- Evidence: `test-results/cr-004-followup-minimal-gameplay-adoption-<data>.log`

## KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/cr-004-followup-minimal-gameplay-adoption-<data>.log`
3. Report finale con: store adottato, page-level conversion rimossa, coerenza con /test verificata

## ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.
