---
id: PLAN-081
title: "PLAN-081: Gate scopati allo scope del piano — drift estraneo non blocca (R-273)"
created: 2026-10-23
status: baptized — Director 2026-10-23 («proecdi» + ruling: advisory ok, convenzione dibattito primaria su mind-weaver e ereditata su RPG)
---

# PLAN-081: Gate scopati allo scope del piano (R-273)

**Origine:** ruling Director 2026-10-23 — *"snellire dove abbiamo problemi"*.
Misura formale deposta (PLAN-051 T-007); questo piano toglie l'attrito
*osservato*: i gate globali valutano l'intero worktree e il drift di
sessioni parallele blocca piani puliti.

**Episodi osservati (failure-driven, non ipotetici):**

- PLAN-078 — bundle PASS sulle obbligazioni, verdict BLOCKED solo per
  rumore contracts-gate da sessione parallela in-flight.
- R-271 — `verify:bundle` BLOCKED solo per gates globali pre-rossi:
  red-first locks su file altrui, mass-fail `executedCount(BASE)
  unknown`, B-amend su import-closure condivise con file R-270.
- Trappola T-13: stato condiviso del worktree rompe le prove, non il
  codice — il meccanismo deve distinguere "mio diff" da "diff altrui".

**Fuori scope (già risolto):** batching dei gate umani = PLAN-068
(round unico + review page, G-12 accodato correttamente). Nessun lavoro.

**visual-fork:** skipped — tooling di gate, zero superfici visive
(files_touched: `scripts/verification/**`, `tests/unit/verification/**`,
`plans/`, `RICHIESTE.md`, più un file in mind-weaver).

## Modello

I gate globali oggi leggono `git diff HEAD` (tracked + untracked) — il
diff di **tutto** il worktree. Il fix è di scope, non di logica: il piano
dichiara i propri file e il gate blocca solo su quelli; il resto del diff
è `foreign_scope` — riportato, mai bloccante.

- Il manifest `verification.json` guadagna un campo opzionale
  `scope_files: string[]` (globs o path, stessa convenzione dei
  `components` dei contratti). Se assente → comportamento attuale
  (retrocompat, fail-nothing).
- `checkContractsGate` accetta già `opts.changedFiles` — il produttore
  del bundle passa `changed ∩ scope`; i file fuori scope finiscono in
  `report.foreign_scope` (lista visibile nel bundle.json, advisory).
- Stesso principio per le sorgenti del rumore osservato: red-first locks
  e living-sync valutati sullo scope del piano, non sul worktree intero —
  file altrui non producono `unknown`/`B-amend` spurii.
- **Limite dichiarato (anti-smuggling):** un file cambiato ma non
  dichiarato nello scope del piano non è più bloccante — appare però in
  `foreign_scope` dentro il bundle, quindi resta visibile alla review del
  Director. Illo scope è dichiarato a battesimo; discrepanze ampie sono
  un segnale, non un bypass silenzioso. Se il pattern abusa, si indurisce
  in seguito (trigger failure-driven).

## Tasks

| Task | Contenuto | Depends |
|---|---|---|
| T-001 | `scope_files` opzionale nel manifest schema + wiring: `produceBundle` interseca il diff con lo scope, `report.foreign_scope` advisory; stesso scoping per red-first locks e living-sync evaluation. Test di regressione permanente `tests/unit/verification/` (diff con file estraneo → niente blocco; file in scope → gate normale; manifest senza scope → comportamento invariato) — **done**: `applyScopeFiles` + scoping su contracts/red-first/intent/tiering + delega head-gate via `CONTRACTS_CHANGED_FILES`; 8 test (6 scope + 2 schema) | — |
| T-002 | Convenzione trigger dibattito, **primaria su mind-weaver** (`/Users/faustoboni/progetti_personali/mind-weaver/.agents/skills/mw-web-debate/SKILL.md`, "Quando invocare"): dibattito multi-AI per governance/canon o richiesta Director; piani ordinari → percorsi leggeri. **Ereditata su RPG**: riferimento nel punto in cui RPG decide se dibattere un piano (mw-planner o convenzione piani) — **done**: nota in MW `mw-web-debate` + sezione "Dibattito multi-AI sul piano" in `coordinator/skills/mw-planner/SKILL.md` | — |
| T-003 | Bookkeeping: `plans/INDEX.md` (riga PLAN-081 + nota PLAN-078/R-271 sbloccati dal fix), `context/` se emerge fatto duraturo, `plan:stamp open/close` | T-001 |

## Contratto di chiusura (obbligazioni)

| ID | Tipo | Contenuto |
|---|---|---|
| OB-1 | `state` (blocking, R-247) | `npm run test -- tests/unit/verification/` verde sul nuovo test di scope: foreign-file non blocca, in-scope gates normalmente, no-scope retrocompat |
| OB-2 | `state` (blocking) | `npm run lint -- scripts/verification tests/unit/verification` + `npm run build:check` verdi |
| OB-3 | `state` (blocking) | `npm run contracts:check` (o equivalente gate run) su un worktree con file estranei simulati → report con `foreign_scope` popolato e nessun errore di blocco su quei file |
| OB-4 | `state` | `npm run closure:lint` verde |

**Nota trust-set (PLAN-051 regime):** T-001 tocca file nel set protetto
(`contractsCheck.ts`/`manifestSchema.ts`/`produceBundle.ts`) → a fine
lavoro `trusted:check` mostrerà drift; richiede azione Director
`npm run trusted:seal` + `npm run approve -- --kind=trust-set` (è il
meccanismo che lavora come previsto, non un attrito).

## Rischi accettati

- `foreign_scope` advisory = fiducia nella review Director; documentato
  sopra, indurimento solo su abuso osservato.
- Scope dichiarato troppo largo → il filtro serve a poco; mitigato dalla
  visibilità della discrepanza nel bundle.
- `scope_files` opzionale per retrocompat: i piani nuovi lo dichiarano,
  quelli vecchi restano full-tree (comportamento attuale, nessuna
  regressione).

## Residuo onesto (scoperto nel dogfood 2026-10-23)

Lo scoping copre il rumore **diff-driven** (unmapped file, red-first
locks su test altrui, living-sync classification su closure condivise —
gli episodi PLAN-078/R-271). Resta scoperta una **seconda classe** di
rumore: i check *globali* non diff-scoped (`checkLivingContracts`
ratchet su partizione STRICT_FILES, copertura `// INV:` nei test,
divergenza contratto↔inventory, invCounts) leggono lo stato dell'intero
worktree — e una sessione parallela WIP può lasciarlo momentaneamente
rosso (osservato live: ~90 errori globali mentre PLAN-082 in flight).
Non è fixabile per scope: il worktree è condiviso e lo stato è reale.
Mitigazioni possibili ma NON fatte qui (decisione Director se servono):
checkpoint-committed contracts, o eseguire il ratchet solo a merge-time.

Prova storica a favore del meccanismo: `.mw/coverage-exceptions.jsonl`
conta ~20 righe `"sessione parallela in corso — fuori scope PLAN-XXX"` —
il filtro di scope automatizza esattamente il workaround manuale che le
sessioni già scrivevano a mano.
