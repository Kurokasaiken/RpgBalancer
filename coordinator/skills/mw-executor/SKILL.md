---
name: mw-executor
description: >
  Workflow di esecuzione Mind Weaver scopato al progetto RPG. Usa per
  implementare task definiti dentro RPG: pre-flight
  AGENTS/RICHIESTE/desiderata, recurring-traps, mw-regression su codice
  esistente, agent-execution-mandate sulle superfici di gioco. Per task
  generici fuori da RPG usa `executor`.
---

# mw-executor

Use for single, well-defined implementation tasks.

## Pre-flight

1. Read `AGENTS.md`, `RICHIESTE.md`, and `.mw/desiderata.md`.
2. If the task is unclear or conditional (`dovrei`, `vorrei`, `potremmo`), stop and return to `mw-explorer`.
3. Load `mw-regression` before touching existing code.
4. For RPG-specific surface work (idle village, UI, gameplay, balancing), also load `agent-execution-mandate` and `idle-village-task`.
5. Check `context/recurring-traps.md`: if the task touches a tagged surface (map/HUD layout, SVG progress arcs, `data-hud-controls` scope, mockups, visual claims, "improve/rewrite" of a FROZEN-covered component), read the matching trap entries before editing.
6. If the task is a bugfix, regression, or failure investigation, load `.agents/skills/bugfix/SKILL.md` and run the bugfix workflow (investigate → explore → plan → implement → test → learn) before coding.

## Rules

- Read the files you are about to edit. Never edit blind.
- No stubs, TODOs without implementation, debug `console.log`, or commented-out code.
- Resolve the cause, not the symptom.
- If scope grows during execution, stop and report instead of silently expanding.
- Never open a window/app/browser in the foreground automatically — all automated browser/test runs are headless or background; a visible window requires explicit Director opt-in in-session (`.windsurf/rules/16-no-foreground-windows.md`).
- Run the relevant safeguards (`npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run closure:lint`) before declaring done.
- A chiusura: `verify:bundle` sul manifest del task e voce `RICHIESTE.md` a `fatta` con `bundle:` — niente righe kanban né dispatch (in pausa, R-208). Se il manifest dichiara `decision_report: true`, la run dir deve contenere `decision-report.json` con i campi `resolved`/`open`/`escalated` come array (schema-check meccanico; contenuto advisory — il giudizio LLM va lì, mai in `verifier.json`).

## Living contracts (PLAN-054, gate `contracts:check` su `BASE..WT`)

- Ogni componente `/game` ha un contratto `.mw/contracts/components/<id>.md`;
  i test che ne provano le invarianti portano tag `// INV:<componente>.INV-<n>`.
- **Diff di soli test non è neutrale**: indebolire/rimuovere un'asserzione di
  un blocco INV, mutare un dataset `test.each`, uno snapshot keyed o un
  helper della sua import-closure → `Mode B-amend` — serve
  `npm run redfirst:retire -- --test <file> --invariant <id> --reason "R-NNN: …"`
  con `R-NNN` già presente a BASE (un riferimento creato nello stesso diff
  non è citabile). Cap amend/retire per task: oltre il cap serve approvazione
  Director.
- **Bug dichiarato dal Director** → `npm run sync:bug -- --component <id>
  --source-ref <R-NNN> --desc "..."` crea/aggiorna l'invariant
  `source: director-bug` + record journal; poi run rossa
  (`redfirst:record`) + tag `// INV:<id>` nel test di regressione (Mode A).
- **Nuovo comportamento** → nuovo `INV` dichiarato nel contratto + tag nel
  test (Mode B-add). **Auto-Neutral** solo se l'emit JS è byte-identico
  (strip tipi/commenti): rinomina di variabili, refactor non banali,
  asset non-JS → mai Auto-Neutral.
- Dopo ogni modifica a contratti: `npm run contracts:index-sync` e
  `npm run contracts:check` verde prima della chiusura.

## Intent ledger (PLAN-045, regime intent)

Se il manifest del task dichiara `intent_gate: true`:

- **SESSION-GUARD**: il ledger `.mw/runs/<task>/intent.md` è **append-only**
  — mai editare/cancellare righe esistenti (mutazione → rosso a
  `closure:lint`); ogni stato nuovo si appende (`mw-intent-ledger.py
  append`, supersessioni come righe restated).
- **Seed**: a inizio task, `python scripts/mw-intent-ledger.py seed`
  dalle `plan_disposition` pre-battesimo; l'executor non può scostarsene
  senza una riga `misclassified` contestabile.
- **Append**: `clarify` solo additivo (`--refines <item_id>`, mai
  `superseded_by`); supersessione solo via `director_answer`
  `amend-desiderata` (`--kind integral|partial`, `partial` richiede
  `--residual`); epoch N+1 solo con `rebaptism_answer` Director.
- **Transizioni di classe**: libere solo `technical→intent-check` e
  `technical→human-eye` (testo estetico); ogni altra via `amend-desiderata`.
- **Chiusura**: `intent.json` nella run dir con status
  `PASS|WAIVED|SKIPPED_TRIVIAL`; item `pending`/`awaiting` → non
  chiudibile; `director_answer` citati devono avere firma HMAC +
  journal provenance (comando `npm run director:answer:typed`,
  TTY reale).
- Quando un plan passa a `completed`: `npm run plan:stamp -- close PLAN-NNN` — chiude il ledger per-plan; `npm run plan:stamp -- report` aggrega i tempi per misurare il risparmio R-208.
- Update the relevant plan, `RICHIESTE.md` item, or evidence log before closing.

## Post-execution learning

- If the task required a non-obvious workaround, an unexpected failure, a bugfix, or produced a reusable pattern, invoke `.agents/skills/learn/SKILL.md` after the safeguards pass.
- When triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for routine or uneventful executions.

Always begin your response with `executor:` followed by a blank line.
