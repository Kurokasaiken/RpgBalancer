AGENT: harness
OBIETTIVO: Create a tiny test utility in the workspace and verify build:check passes.
FILE TARGET: scripts/tmp/harness-dispatch-test.ts
DIPENDENZE: -
INVARIANTI (NON DEROGABILI): rispetta `.windsurf/rules/` — nessuna stringa hardcoded, persistenza solo via `@/shared/persistence/PersistenceService`, config-first + Zod.
OPERAZIONI DA ESEGUIRE:
  1. Read the workspace to confirm `scripts/tmp/harness-dispatch-test.ts` does not exist.
  2. Create `scripts/tmp/harness-dispatch-test.ts` with a JSDoc comment and a single exported function `greet(name: string): string`.
  3. Run `npm run build:check` and verify it passes.
  4. Call `task_complete` with a short summary.
OPERAZIONI VIETATE:
  - Non toccare file al di fuori di `scripts/tmp/`.
  - Non committare.
  - Non modificare sorgenti di produzione.
ASSUNZIONI:
  - Esegui direttamente senza chiedere conferma.
  - Se un passo fallisce, fermati e segnala.
SAFEGUARD MANDATORY STEPS:
  - npm run build:check
OUTPUT ATTESI:
  - File `scripts/tmp/harness-dispatch-test.ts` creato.
  - `npm run build:check` passa.
NOTE:
  - Questo è un test di dispatch reale con worktree isolato.
