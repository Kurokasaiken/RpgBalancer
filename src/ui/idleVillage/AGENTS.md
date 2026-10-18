# Idle Village (/game) — istruzioni agente

> **Questo file è un pointer, non una fonte.** Workflow, invarianti e
> procedure vivono in un posto solo. Non copiare qui workflow o checklist di
> processo: `npm run agents:lint` (PLAN-044 T-001) blocca i file agente
> annidati che reintroducono workflow derivati.

## Fonte unica (in quest'ordine)

1. `AGENTS.md` alla root del repo — ciclo operativo, pre-flight, skill.
2. `.windsurf/rules/00-project-invariants.md` — baseline non negoziabile.
3. `context/recurring-traps.md` — indice per superficie: per `/game` leggi
   T-01, T-02, T-03, T-04, T-07 prima di toccare codice.

## Skill di superficie

Ogni modifica sotto `src/ui/idleVillage/**` passa da `mw-executor` →
`agent-execution-mandate` + `idle-village-task`.

## Puntatori specifici

- **Roster trusted components**: `src/docs/docs/idle_village/roster_trusted_components.md` — importa sempre da `src/ui/idleVillage/roster/index.ts`.
- **Config gameplay/UI**: `src/balancing/config/idleVillage/**` (config-first).
- **Persistenza**: `PersistenceService` (`@/shared/persistence/PersistenceService`).

## Safeguard prima di "done"

```bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run closure:lint
```
