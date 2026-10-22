---
name: mw-planner
description: >
  Workflow di pianificazione Mind Weaver scopato al progetto RPG. Usa
  quando si pianifica un task dentro RPG: verifica desiderata FROZEN,
  MASTER_PLAN scope e recurring-traps delle superfici toccate, poi
  produce un plan con contratto. Per pianificazione generica fuori da
  RPG usa `planner`.
---

# mw-planner

Use when there is enough clarity to commit to a concrete plan.

## When to use

- The Director says "pianifica", "scrivi una spec", "come implementiamo", or "trasforma in piano"
- After exploration produced a direction

## Pre-flight

1. Read `.mw/desiderata.md` (latest FROZEN) and `RICHIESTE.md`.
2. Read `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, and `context/INDEX.md` for relevant constraints.
3. If the request materially changes the FROZEN desiderata, stop and ask.
4. Check `src/docs/docs/MASTER_PLAN.md` for scope alignment.
5. Check `context/recurring-traps.md` for traps on the surfaces the plan will touch; a plan must not re-propose a fix already documented as failed or a pattern already promoted to a trap.

## Planning rules

- Every step must require a state the previous step guarantees.
- The last task of the plan must produce a verifiable, measurable result (test passing, build green, evidence log).
- Do not introduce components or features not explicitly requested (YAGNI).
- Mark open architectural decisions as open; do not decide them silently.
- A plan that includes runtime verification, screenshots, playtests, or captures must state that the run is headless/background; a visible window is a manual Director step, never an agent action (`.windsurf/rules/16-no-foreground-windows.md`).
- Ogni piano dichiara il suo **contratto di chiusura**: le obbligazioni verificabili che l'esecuzione trasforma in `.mw/runs/<task>/verification.json` → `verify:bundle` → `bundle.json`, citato dalla voce `fatta` in `RICHIESTE.md` (workflow single-agent R-208: niente kanban, niente dispatch).
- **Obbligazione regression-test (R-247):** ogni task che muta il comportamento del codice (bugfix o feature) porta nel contratto di chiusura un'obbligazione blocking `type: state` il cui `command` esegue un test di regressione permanente (`npm run test -- <file>` o spec e2e) scritto/aggiornato per fallire senza la modifica — così la richiesta resta garantita anche dopo la chiusura del task. Sulle superfici contrattate vale la sezione Living contracts (`sync:bug` + `redfirst` + `// INV:`). Se un test automatico permanente non è davvero praticabile, il plan dichiara l'eccezione con motivazione e un'obbligazione `human-eye` compensativa — l'assenza silenziosa è un difetto del plan.
- **Shift-left sul contratto:** per i file/superfici che il piano tocca, il contratto eredita meccanicamente gli `expected_checks` di superficie da `.mw/surface-map.json` e le trappole taggate in `context/recurring-traps.md` come acceptance criteria — la BV non riscopre a chiusura ciò che il piano già sapeva (v32 pt.8).
- **Contenuto del contesto — regola del giudizio vs lookup.** Un riferimento va nel plan quando è *frutto di un giudizio* (questo file, questo pattern, questa trappola, questa decisione) — sempre, anche se lo stesso agente eseguirà nella stessa conversazione: le conversazioni muoiono (compaction, crash) e il plan è l'unico artifact che sopravvive. Non va nel plan ciò che è *riscopribile con un lookup* (ricerca di file, convenzioni ovvie) — quello l'esecutore lo ritrova da sé. Context pack dettagliati per esecutori esterni si generano a dispatch-time dal manifest/codice, non a mano nel documento.
- Reference and update the relevant plan files in `src/docs/docs/plans/`.
- Quando il plan è battezzato (o entra `in corso`): `npm run plan:stamp -- open PLAN-NNN` — apre il ledger di misura per-plan (R-208: dimostrare ≥30min risparmiati).

## Living contracts (PLAN-054)

- Un task che tocca `scope_files` di un componente `/game`, un file di test
  con blocchi `// INV:<id>` o la loro import-closure attiva il pass
  per-componente del sync gate: il plan deve classificare l'intento
  (`Auto-Neutral` solo per emit-identici, `Mode A` bugfix con red-first,
  `Mode B-add` nuove invarianti, `Mode B-amend` modifica/rimozione con
  `redfirst:retire` + `R-NNN` a BASE, `Mode C` copertura già piena) e
  portare le obbligazioni corrispondenti nel contratto di chiusura.
- I bug dichiarati dal Director entrano come task con obbligazione
  `npm run sync:bug -- --component <id> --source-ref <R-NNN>` +
  `redfirst:record` + tag `// INV:` nel test di regressione — nessun fix
  su superficie contrattata senza la regola di contratto che la copre.
- Se un task prevede di mutare il comportamento coperto da un `INV`
  esistente, il piano lo dichiara esplicitamente (Mode B-amend) con il
  `R-NNN` che lo autorizza — l'amend silenzioso è fail-closed nel gate.

## Check pre-battesimo (PLAN-045 T-006, P8)

Prima di proporre il battesimo di un plan che copre desiderata slice:

1. **Item list**: `python scripts/mw-desiderata-slice.py` → slice marcata
   `X-Desiderata-Slice: vNN + sha256` e item `vNN.item-N` (universo chiuso).
2. **`plan_disposition` per ogni item** — `task|gate` con `obligation_ref`
   ∈ plan + `acceptance_criterion` osservabile; `open` con criterio
   testuale e obbligazione dichiarata assente; `human-eye` con motivazione
   estetica; `not-applicable` con `scope_motivation` citata +
   `scope_surfaces` ⊆ id di `.mw/surface-map.json` (**votato dal pannello**,
   maggioranza stretta — non deciso dal planner).
3. **Gate meccanico**: `python scripts/mw-plan-disposition.py --plan <f>
   --items <lista> --records <json>` → `baptizable: false` → il plan NON è
   battezzabile (gap senza risposta Director: `revise-plan` |
   `waive-plan-gap` → `open` `plan_waived` | `amend-desiderata`;
   infrastrutturale → solo `retry-panel`, mai `waive-infra`
   pre-battesimo). `REVISION_LOOP_CAP = 3` revisioni.
4. **Seed ledger**: a battesimo avvenuto, `python
   scripts/mw-intent-ledger.py seed --task <id> --run <run>
   --dispositions .mw/plan-dispositions/<plan>.jsonl --plan-hash
   <semantico> --params-hash <h> --map-hash <h>` → epoch-1 di
   `.mw/runs/<task>/intent.md`.

Dettaglio: `plans/PLAN-045-intent-gate.md` §P8.

## Visual fork gate (v35 FROZEN — PLAN-047)

Il planner non genera opzioni visive di routine e non sceglie mai una
rappresentazione al posto del Director.

- **Marker obbligatorio**: un plan visivo (task con `files_touched` che
  intersecano `src/ui/**`, `src/skins/**`, config token/skin) deve citare, per
  ogni decisione estetica, la baseline di una visual-fork card (path + sha256)
  oppure `visual-fork: skipped — <motivo> — <puntatore>` (puntatore come da
  mw-explorer). L'assenza silenziosa è un difetto del plan.
- **`INTENT_GATE_VISUAL_FORK`**: se durante la decomposizione emerge un bivio
  visivo non anticipato → (1) STOP, niente task esecutivi che presuppongano una
  delle forme; (2) emissione del blocco gate con card generata qui se manca
  (artefatto di gate, non implementazione); (3) ruling Director → il planner
  riprende **lo stesso draft** e finalizza sulla sola opzione scelta citando
  baseline (bump di revisione se esiste già un contratto); (4) `REJECT_ALL` →
  il task torna a `mw-explorer` col feedback, nessun piano prodotto, codice di
  produzione intatto. Bound: 2 `reject_all` → vincoli scritti dal Director o
  reframing (un A' composito rigettato conta come voto).
- **Check pre-battesimo**: prima di presentare un plan visivo verificare
  (a) grep del marker `visual-fork:` su ogni decisione estetica coperta dai
  task; (b) ogni task visivo cita l'id dell'opzione selezionata e non porta
  elementi assenti dalla baseline. (Il check meccanico permanente su diff
  reale + copertura è in `closure:lint`, PLAN-047 T-006.)
- Nei `verification.json` dei task visivi: obbligazioni same-viewport
  **pre-registrate** (regione/proprietà, condizione, tolleranza, esito
  PASS/FAIL/NOT_COMPARABLE — NOT_COMPARABLE non è PASS) + obbligazione
  `human-eye` con artefatto side-by-side baseline vs implementazione. Le
  viewport coperte = quelle registrate nella card.

Dettaglio completo: `plans/PLAN-047-visual-fork-gate.md`; template card:
`.mw/templates/visual-fork/visual-fork-card.md`.

## Post-plan learning

- If the plan exposes a hidden constraint, a workaround, an unexpected failure, or a reusable pattern, invoke `.agents/skills/learn/SKILL.md` after the plan is battezzato or rejected.
- When triggered, create `.mw/runs/<timestamp>/pattern-candidate.md` from the run artifacts.
- If the same pattern appears in 2+ distinct contexts, add it to `PROPOSALS.md`; only the Director may promote it to `CANON.md`.
- Do not run `learn` for routine or uneventful plans.

Always begin your response with `planner:` followed by a blank line.
