# Technical Direction

## Guiding Principles

- **Reuse, don’t rebuild**: Keep the existing React + TypeScript + Vite stack. Any new UI should integrate with current routing, state, and build pipelines.
- **Config-first everything**: All stats, archetype weights, spell behaviors, and UI enumerations must flow from shared configs (`src/balancing/config/*`, `src/docs/docs/plans/*`) rather than inline constants.
- **Weight-Based Creator Pattern**: New entities (spells, mana types, palace rooms) must be expressible as `{value, weight}` ticks and pass through the balancing pipeline.
- **PersistenceService only**: Every save/load goes through `src/shared/persistence/PersistenceService.ts` async APIs; localStorage/sessionStorage access is forbidden elsewhere.
- **Testing before intuition**: Add or extend Vitest suites (stress testing, marginal utility, persistence) for any balancing or simulation change.
- **Observability**: Reuse telemetry hooks (time tracking, stress dashboards) so we can benchmark incremental loops vs duels.

## Compatibility Mandates

1. **UI Theme**: Default styling = Style Laboratory tokens and components. Use `StyleLabSurface`, `StyleLabStack`, and `useMinimalStyleLabTokens` for all new UI. Legacy Gilded Observatory classes have been archived in `_OLD_DEPRECATED/styles/`. When Wanderlust UI kits are ready, update this doc with migration steps.
2. **Componentization**: Shared pieces live under `src/ui/balancing/` or `src/ui/common/`. No “one-off” monoliths; prefer composition-driven layouts.
3. **Hooks & Stores**:
   - Balancer config flows through `useBalancerConfig`.
   - Stress testing uses `useStressTesting()` (Phase 10.5).
   - Future palace management should mirror this pattern, exposing pure hooks backed by config modules.
4. **Data formats**:
   - Archetype definitions stored as JSON under `data/archetypes/` or generated from config.
   - Spell diaries/logs mirror `data/runs/` schema for analytics reuse.
5. **JSDoc**: Every exported function/interface documented (new org-wide rule).

## Required Modules

| Area | Existing Assets | Required Actions |
| --- | --- | --- |
| Balancing & Config | `src/balancing/config/*`, `src/balancing/GlobalStateHelper.ts` | Extend to include spell-creature attributes, palace rooms, transcendence paths; keep schema Zod-backed. |
| Persistence | `src/shared/persistence/PersistenceService.ts` | Ensure new saves (spell habitats, demonic pacts) go through `saveData`/`loadData` with error handling + retries. |
| Simulations | `src/balancing/1v1/*`, `src/balancing/__tests__` | Introduce Mental Palace simulations as additional suites; feed results into stress dashboards. |
| UI Modules | `src/ui/balancing/*`, `src/ui/village/*` | Spin up `src/ui/archmage/*` using existing layout primitives, keep components thin. |
| Analytics | `src/analytics/punchClub.ts`, dashboards under `docs/analytics/` | Add Archmage runs as new data channels without breaking PunchClub telemetry. |

## Delivery Checklist

- [ ] Any new config or schema change accompanied by tests + docs entry.
- [ ] UI PRs include reference to which Style Laboratory tokens are used.
- [ ] Persistence pathways include success/error toasts (via `src/ui/balancing/Toast.tsx`).
- [ ] When deprecating a module, add it to `DocumentationAudit.md` with the target archive folder.
