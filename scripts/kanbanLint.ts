/**
 * DEPRECATO (R-208, 2026-10-16): la kanban board e la pipeline di dispatch
 * sono in pausa. Questo entry-point resta come shim di compatibilità e
 * delega a `closureLint` (solo gate di chiusura su RICHIESTE.md /
 * agent_assignments.md). Nuovi riferimenti devono usare `npm run
 * closure:lint`.
 */
import './closureLint';
