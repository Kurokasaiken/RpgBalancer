# PLAN-059: Rework metrics + task:close — misurare la sorpresa, non la lunghezza

**Status:** `baptized` — battezzato 2026-10-19 (Director: «procedi»)
**Richiesta:** R-230
**Relazioni:** figlio di PLAN-048 (forensics) + PLAN-051 (verify-slim);
nessun gate-file toccato (planForensics è superficie `workflow-forensics`;
`taskClose.ts` nuovo file → mapping:propose a chiusura).

## 1. Diagnosi

- `docs 41%` nel churn impl è dominato da contabilità di stato: ogni
  chiusura richiede edit manuali a RICHIESTE, plans/INDEX,
  SESSION_HANDOFF, context/INDEX (~4-6 edit/task).
- La correlazione richness→velocità (ρ=-0.76) è confusa da scope: plan
  ricchi = scope grandi. La domanda utile è "quali feature del plan
  predicono impl liscia" — misurabile via rework, non lunghezza.

## Stato avanzamento (2026-10-19)

- **T-001 landed**: `planForensics` estrae `planFeatures` (path nominati su
  tutti i top-dir + file di stato root, obbligazioni, traps) e `ReworkStats`
  (`out_of_plan_split` bookkeeping vs scope, `post_bundle_commits`,
  `bundle_retries` da git history del bundle). Sezione report
  "Plan features → smoothness". ρ(files_named vs −oop scope) = **0.06, n=16**
  → nominare più file nel plan NON riduce il churn fuori-plan. Direzionale.
- **T-002 landed**: `scripts/taskClose.ts` + `npm run task:close -- <R|PLAN>` —
  fail-closed su bundle PASS assente (verificato: R-230 senza bundle → exit 1,
  zero scritture). Scrive RICHIESTE/plans-INDEX/SESSION_HANDOFF, chiama
  `plan:stamp close`, stampa bozza context/INDEX.
- Test: 31/31 (forensics 23 + taskClose 8). `build:check` PASS.
- `closure:lint` FAIL su file di sessione parallela (T-13):
  `contractsCheck.ts` post-approval + 2 script playtest non mappati —
  nessuno mio. In attesa che l'altra sessione risolva.
- Nota: `PLAN-052` era collisione (quest-scene-depth-staging, sessione
  parallela) → rinominato PLAN-059.

## 2. Task

- **T-001** `planForensics`: per entity con plan, feature — n° path
  `src/` nominati, presenza sezione obbligazioni, citazione traps;
  rework — share di churn su file NON nominati nel plan (scope
  discovery), n° commit attribuiti dopo il primo bundle, retry
  bundle da git history (`git log` sul path del bundle, verdict
  BLOCKED prima di PASS). Report: sezione "Plan features → smoothness"
  che sostituisce la tabella richness→speed.
- **T-002** `scripts/taskClose.ts` + `npm run task:close -- <ID>`:
  trova il bundle PASS dell'entità, scrive `fatta`+chiusura in
  RICHIESTE, aggiorna colonna stato in plans/INDEX, prepende riga a
  SESSION_HANDOFF, invoca `plan:stamp close`, stampa bozza entry
  context/INDEX. Fail-closed: niente bundle PASS → niente scrittura.
- **T-003** test unitari (funzioni pure su fixture tmp) + dogfood:
  `task:close R-230` chiude questa stessa richiesta.

## 3. Contratto di verifica

- **OB-1** state blocking: `npx vitest run tests/unit/scripts/` (file
  nuovi verdi).
- **OB-2** state blocking: `npm run build:check`.
- **OB-3** state blocking: churn-out-of-plan e bundle-retries calcolati
  su fixture sintetiche.
- **OB-4** state blocking: task:close su repo sintetico scrive i 3
  file correttamente; senza bundle PASS rifiuta.
- **SAFE** state blocking: `npm run closure:lint` verde (a meno di
  drift parallelo T-13 dichiarato).
