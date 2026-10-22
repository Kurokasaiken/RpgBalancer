# PLAN-070: ripulitura file morti corrotti (debito rilevato 2026-10-20)

**Status:** `draft` — da battezzare (disposizione distruttiva: cancellazione di file tracciati).
**Origine:** scansione `tsc -p tsconfig.app.json` durante B4-map — 12 file non compilano per corruzione a livello sorgente (`\n` letterali al posto dei newline, template literal malformati). Fuori dal grafo di build vite (mai importati a runtime), quindi `build:check` resta verde — ma inquinano il typecheck e i tool di scansione.
**Pattern di corruzione:** identico ovunque — escape `\n` diventati `n` letterali + newline; probabilmente un vecchio script batch su file poi abbandonati.

## Inventario (tutti `clean` in git, 0 riferimenti runtime)

| File | Refs | Nota |
|---|---|---|
| `src/analytics/guardian/GuardianDryRunAnalyzer.ts` | 0 | template literal malformati |
| `src/analytics/idleVillageMapAssetTelemetry.ts` | 0 | `n` letterali |
| `src/ui/balancing/components/ArchetypeComparisonMatrix.tsx` | 0 | JSX corrotto |
| `src/ui/idleVillage/components/PgCardTS002.tsx` | 0 | |
| `src/ui/idleVillage/components/QuestDecisionHeatmap.tsx` | 0 | |
| `src/ui/idleVillage/config/mapPerformanceProfilerConfig.ts` | 0 | |
| `src/ui/idleVillage/hooks/useDragDropTelemetry.ts` | 0 | |
| `src/ui/idleVillage/hooks/useSandboxDragController.ts` | 1* | *type-only `DropState` da file morti |
| `src/ui/idleVillage/isolation/ExtractionIso.tsx` | 0 | |
| `src/ui/idleVillage/roster/roster.ts` | 0 | |
| `src/ui/idleVillage/services/multiVillageSchedulerMonitor.ts` | 0 | |
| `src/ui/idleVillage/utils/mapPerformanceProfilerEngine.ts` | 0 | |

## Task proposti

- **T-001** Per ogni file: `git log` ultimo commit + verifica che il contenuto a HEAD sia anch'esso corrotto (la corruzione è nel blob, non nel worktree).
- **T-002** Disposizione per file: `delete` se confermato morto; `repair` solo se un piano futuro lo rivuole (altrimenti delete + recupero da git history se serve).
- **T-003** Esecuzione delezioni + `tsc -p tsconfig.app.json` deve tornare a 0 errori (oggi il typecheck repo-wide è inutilizzabile come gate).
- **T-004** Se `useSandboxDragController` viene cancellato: ripulire anche i type-import morti in `MapPage.tsx`/`CardDetail.tsx` (o cancellare i file se a loro volta morti — verificare).

## Nota

Rende `tsc` riutilizzabile come gate repo-wide (oggi produce sempre errori e va filtrato). Nessuna fretta: i file non toccano runtime né bundle.
